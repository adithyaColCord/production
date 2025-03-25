"use client"

import { useState, useEffect, useRef } from "react"
import { Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface FurlongMapProps {
  notes: any[]
  userId: string
}

export function FurlongMap({ notes, userId }: FurlongMapProps) {
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // Load Google Maps API
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`
    script.async = true
    script.defer = true
    script.onload = initializeMap
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (googleMapRef.current && userLocation && notes.length > 0) {
      updateMarkers()
    }
  }, [notes, userLocation])

  const initializeMap = () => {
    getUserLocation()
  }

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          setLoading(false)

          if (mapRef.current && !googleMapRef.current) {
            const map = new (window as any).google.maps.Map(mapRef.current, {
              center: { lat: latitude, lng: longitude },
              zoom: 15,
              styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                {
                  featureType: "administrative.locality",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "poi",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "poi.park",
                  elementType: "geometry",
                  stylers: [{ color: "#263c3f" }],
                },
                {
                  featureType: "poi.park",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#6b9a76" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry",
                  stylers: [{ color: "#38414e" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#212a37" }],
                },
                {
                  featureType: "road",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#9ca5b3" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "geometry",
                  stylers: [{ color: "#746855" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#1f2835" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#f3d19c" }],
                },
                {
                  featureType: "transit",
                  elementType: "geometry",
                  stylers: [{ color: "#2f3948" }],
                },
                {
                  featureType: "transit.station",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#17263c" }],
                },
                {
                  featureType: "water",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#515c6d" }],
                },
                {
                  featureType: "water",
                  elementType: "labels.text.stroke",
                  stylers: [{ color: "#17263c" }],
                },
              ],
            })

            googleMapRef.current = map

            // Add user marker
            ;new (window as any).google.maps.Marker({
              position: { lat: latitude, lng: longitude },
              map,
              icon: {
                path: (window as any).google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
              },
              title: "Your Location",
            })

            updateMarkers()
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          setLoading(false)
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Unable to get your location. Please enable location services and try again.",
          })
        },
      )
    } else {
      setLoading(false)
      toast({
        variant: "destructive",
        title: "Location Not Supported",
        description: "Geolocation is not supported by your browser.",
      })
    }
  }

  const updateMarkers = () => {
    if (!googleMapRef.current || !userLocation) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    // Add markers for notes
    notes.forEach((note) => {
      if (note.studentId === userId) return // Skip user's own notes

      const marker = new (window as any).google.maps.Marker({
        position: { lat: note.latitude, lng: note.longitude },
        map: googleMapRef.current,
        title: `${note.student.firstName} ${note.student.lastName}`,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#FF5722",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      })

      // Add circle to represent radius
      ;new (window as any).google.maps.Circle({
        strokeColor: "#FF5722",
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillColor: "#FF5722",
        fillOpacity: 0.1,
        map: googleMapRef.current,
        center: { lat: note.latitude, lng: note.longitude },
        radius: note.radius,
      })

      // Add info window
      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="color: #000; padding: 5px;">
            <p style="font-weight: bold; margin: 0;">${note.student.firstName} ${note.student.lastName}</p>
            <p style="margin: 5px 0 0;">${note.message}</p>
            <p style="margin: 5px 0 0; font-size: 12px;">Interests: ${note.interests.join(", ")}</p>
          </div>
        `,
      })

      marker.addListener("click", () => {
        infoWindow.open(googleMapRef.current, marker)
      })

      markersRef.current.push(marker)
    })
  }

  const refreshLocation = () => {
    setLoading(true)
    getUserLocation()
  }

  return (
    <div className="space-y-4">
      <div ref={mapRef} className="h-[300px] w-full rounded-md bg-muted/30">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <Button onClick={refreshLocation} disabled={loading}>
        {loading ? "Loading..." : "Refresh Location"}
      </Button>
    </div>
  )
}

