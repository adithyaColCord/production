"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface QRScannerProps {
  userId: string
}

export function QRScanner({ userId }: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Cleanup function to stop scanning when component unmounts
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((error) => console.error("Error stopping scanner:", error))
      }
    }
  }, [html5QrCode])

  const startScanning = () => {
    const qrCodeScanner = new Html5Qrcode("qr-reader")
    setHtml5QrCode(qrCodeScanner)
    setScanning(true)

    const qrCodeSuccessCallback = async (decodedText: string) => {
      // Stop scanning after successful scan
      await qrCodeScanner.stop()
      setScanning(false)

      try {
        // Parse the QR code data
        const qrData = JSON.parse(decodedText)

        if (!qrData.sessionId) {
          throw new Error("Invalid QR code")
        }

        // Get current location
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords

            // Submit attendance
            const response = await fetch("/api/attendance/mark", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sessionId: qrData.sessionId,
                studentId: userId,
                latitude,
                longitude,
              }),
            })

            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.message || "Failed to mark attendance")
            }

            toast({
              title: "Attendance Marked",
              description: "Your attendance has been successfully recorded.",
            })

            router.refresh()
          },
          (error) => {
            toast({
              variant: "destructive",
              title: "Location Error",
              description: "Unable to get your location. Please enable location services and try again.",
            })
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          },
        )
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to process QR code",
        })
      }
    }

    const qrCodeErrorCallback = (error: any) => {
      console.error("QR Code scanning error:", error)
    }

    qrCodeScanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        qrCodeSuccessCallback,
        qrCodeErrorCallback,
      )
      .catch((error) => {
        console.error("Error starting scanner:", error)
        setScanning(false)
        toast({
          variant: "destructive",
          title: "Camera Error",
          description: "Unable to access camera. Please check permissions and try again.",
        })
      })
  }

  const stopScanning = async () => {
    if (html5QrCode && html5QrCode.isScanning) {
      await html5QrCode.stop()
      setScanning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div id="qr-reader" className="w-full h-64 bg-muted/50 rounded-md overflow-hidden"></div>
      <div className="flex justify-center">
        {!scanning ? (
          <Button onClick={startScanning}>Start Scanning</Button>
        ) : (
          <Button variant="destructive" onClick={stopScanning}>
            Stop Scanning
          </Button>
        )}
      </div>
    </div>
  )
}

