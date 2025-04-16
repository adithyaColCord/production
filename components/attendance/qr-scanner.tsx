"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, Camera, Loader2, RefreshCw, ZapOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface QRScannerProps {
  userId: string
}

export function QRScanner({ userId }: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanAttempts, setScanAttempts] = useState(0)
  const qrReaderRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((error) => console.error("Error stopping scanner:", error))
      }
    }
  }, [html5QrCode])

  // Reset error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Periodically reset scan attempts to avoid overwhelming the console
  useEffect(() => {
    if (scanAttempts > 0) {
      const timer = setTimeout(() => {
        setScanAttempts(0)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [scanAttempts])

  const startScanning = () => {
    setError(null)
    setLoading(true)
    setScanAttempts(0)

    // Make sure the element exists and is empty before creating a new scanner
    if (!qrReaderRef.current) {
      setError("QR reader element not found")
      setLoading(false)
      return
    }

    // Clean up any previous instances to avoid the removeChild error
    if (html5QrCode) {
      try {
        html5QrCode.clear()
      } catch (e) {
        console.error("Error clearing previous scanner:", e)
      }
    }

    // Create a new scanner instance
    try {
      const qrCodeScanner = new Html5Qrcode("qr-reader")
      setHtml5QrCode(qrCodeScanner)

      const qrCodeSuccessCallback = async (decodedText: string) => {
        // Stop scanning after successful scan
        try {
          await qrCodeScanner.stop()
        } catch (e) {
          console.error("Error stopping scanner after success:", e)
        }

        setScanning(false)

        try {
          // Parse the QR code data
          let qrData
          try {
            qrData = JSON.parse(decodedText)
          } catch (e) {
            // If not JSON, try using the raw text (might be just a session ID)
            qrData = { sessionId: decodedText }
          }

          if (!qrData.sessionId) {
            throw new Error("Invalid QR code format")
          }

          toast({
            title: "QR Code Detected",
            description: "Getting your location...",
          })

          // Get current location
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords

              // Submit attendance
              try {
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
                  title: "Success!",
                  description: "Your attendance has been successfully recorded.",
                })

                router.refresh()
              } catch (error: any) {
                toast({
                  variant: "destructive",
                  title: "Server Error",
                  description: error.message || "Failed to submit attendance",
                })
              }
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
              timeout: 10000,
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

      const qrCodeErrorCallback = (errorMessage: string) => {
        // Track scan attempts to show progress to user
        setScanAttempts((prev) => prev + 1)

        // Don't show common scanning errors to the user
        if (
          !errorMessage.includes("No MultiFormat Readers were able to detect") &&
          !errorMessage.includes("No barcode or QR code detected") &&
          !errorMessage.includes("InvalidStateError") &&
          !errorMessage.includes("BarcodeDetector")
        ) {
          console.error("QR Code scanning error:", errorMessage)
          setError("Scanner error. Please try again.")
        }
      }

      // Configure scanner with better settings
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        // Disable experimental features to avoid BarcodeDetector errors
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: false,
        },
      }

      qrCodeScanner
        .start({ facingMode: "environment" }, config, qrCodeSuccessCallback, qrCodeErrorCallback)
        .then(() => {
          setScanning(true)
          setLoading(false)
        })
        .catch((error) => {
          console.error("Error starting scanner:", error)
          setScanning(false)
          setLoading(false)
          setError("Unable to access camera. Please check permissions and try again.")
          toast({
            variant: "destructive",
            title: "Camera Error",
            description: "Unable to access camera. Please check permissions and try again.",
          })
        })
    } catch (e) {
      console.error("Error creating scanner:", e)
      setLoading(false)
      setError("Failed to initialize scanner. Please refresh and try again.")
    }
  }

  const stopScanning = async () => {
    if (html5QrCode && html5QrCode.isScanning) {
      try {
        await html5QrCode.stop()
      } catch (e) {
        console.error("Error stopping scanner:", e)
      }
      setScanning(false)
    }
  }

  const resetScanner = async () => {
    await stopScanning()

    // Clear the scanner completely
    if (html5QrCode) {
      try {
        html5QrCode.clear()
        setHtml5QrCode(null)
      } catch (e) {
        console.error("Error clearing scanner:", e)
      }
    }

    // Small delay before restarting
    setTimeout(() => {
      startScanning()
    }, 500)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>QR Code Scanner</span>
          {scanning && (
            <div className="flex items-center text-sm font-normal text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
              Scanning
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          ref={qrReaderRef}
          id="qr-reader"
          className={`w-full h-80 bg-muted/30 rounded-lg overflow-hidden relative ${scanning ? "border-2 border-primary" : ""}`}
        >
          {!scanning && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Camera className="h-12 w-12 mb-2" />
              <p>Camera preview will appear here</p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Initializing camera...</p>
            </div>
          )}

          {scanning && scanAttempts > 0 && (
            <div className="absolute bottom-4 left-4 right-4">
              <Progress value={Math.min(scanAttempts, 20) * 5} className="h-1" />
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {scanning && (
          <div className="text-center p-2 bg-muted/30 rounded-md">
            <p className="text-sm font-medium">Position the QR code within the scanner frame</p>
            <p className="text-xs text-muted-foreground mt-1">Make sure the code is well-lit and not blurry</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <div className="flex justify-center w-full gap-2">
          {!scanning ? (
            <Button onClick={startScanning} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accessing Camera
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scanning
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={resetScanner} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button variant="destructive" onClick={stopScanning} className="flex-1">
                <ZapOff className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </>
          )}
        </div>

        {!scanning && !loading && (
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md w-full">
            <p className="font-medium mb-1">Troubleshooting tips:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Ensure your QR code is clearly visible and not damaged</li>
              <li>Hold your device steady about 6-8 inches from the QR code</li>
              <li>Make sure there's good lighting on the QR code</li>
              <li>Clean your camera lens if it appears blurry</li>
              <li>Try different angles if the code isn't being detected</li>
            </ul>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
