// "use client"

// import { useState, useEffect, useRef } from "react"
// import { Loader } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { useToast } from "@/components/ui/use-toast"

// // Declare the google object on the window interface
// declare global {
//   interface Window {
//     google?: any
//     initMap?: () => void
//   }
// }

// interface Note {
//   id: string
//   studentId: string
//   latitude: number
//   longitude: number
//   radius: number
//   message: string
//   student: {
//     firstName: string
//     lastName: string
//   }
//   interests: string[]
// }

// interface FurlongMapProps {
//   notes: Note[]
//   userId: string
// }

// export function FurlongMap({ notes, userId }: FurlongMapProps) {
//   const [loading, setLoading] = useState(true)
//   const mapContainerRef = useRef<HTMLDivElement>(null)
//   const mapInstanceRef = useRef<any>(null)
//   const markersRef = useRef<any[]>([])
//   const circlesRef = useRef<any[]>([])
//   const mapInitializedRef = useRef(false)
//   const { toast } = useToast()

//   // Load Google Maps script
//   useEffect(() => {
//     console.log('Checking for script...');
//     const oldScript = document.querySelector('script[src*="maps.googleapis.com"]');
//     if (oldScript) oldScript.remove();
//     // if (document.querySelector('script[src*="maps.googleapis.com"]')) {
//     //   console.log('Script already loaded');
//     //   return;
//     // }
  
//     console.log('Loading script...');
//     const script = document.createElement("script")
//     script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry&callback=initMap`
//     script.async = true
//     script.defer = true
    
//     const initializeMap = () => {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const { latitude, longitude } = position.coords
//             const userLocation = { lat: latitude, lng: longitude }

//             // Create map instance
//             const mapOptions = {
//               center: userLocation,
//               zoom: 15,
//               styles: [], // Your map styles here
//             }

//             // Create a new map instance
//             const newMap = new window.google.maps.Map(mapContainerRef.current, mapOptions)
//             mapInstanceRef.current = newMap

//             // Add user marker
//             const userMarker = new window.google.maps.Marker({
//               position: userLocation,
//               map: newMap,
//               icon: {
//                 path: window.google.maps.SymbolPath.CIRCLE,
//                 scale: 10,
//                 fillColor: "#4285F4",
//                 fillOpacity: 1,
//                 strokeColor: "#FFFFFF",
//                 strokeWeight: 2,
//               },
//               title: "Your Location",
//             })

//             markersRef.current.push(userMarker)

//             // Add note markers
//             renderNoteMarkers(newMap, userLocation)

//             setLoading(false)
//           },
//           (error) => {
//             handleLocationError(error)
//           },
//           {
//             enableHighAccuracy: true,
//             timeout: 5000,
//             maximumAge: 0,
//           },
//         )
//       } else {
//         toast({
//           variant: "destructive",
//           title: "Geolocation Not Supported",
//           description: "Your browser doesn't support location services",
//         })
//         setLoading(false)
//       }
//     }

//     window.initMap = () => {
//       console.log("initMap callback executed");
//       mapInitializedRef.current = true;
//       initializeMap(); // ✅ move this here, to run after script + Google Maps is ready
//     };

//     script.onload = () => {
//       console.log('Google Maps script loaded successfully');
//     };
  
//     script.onerror = () => {
//       console.error('Failed to load Google Maps script');
//     };
  
//     // window.initMap = () => {
//     //   console.log('initMap callback executed');
//     //   mapInitializedRef.current = true
//     // }
  
//     document.head.appendChild(script)
//   }, [])
//   // Initialize map when script is loaded and container is ready
//   useEffect(() => {
//     // Wait for both the map container and Google Maps to be ready
//     if (!mapContainerRef.current || !window.google?.maps || !mapInitializedRef.current) {
//       return
//     }

//     // Get user location and initialize map
//     // const initializeMap = () => {
//     //   if (navigator.geolocation) {
//     //     navigator.geolocation.getCurrentPosition(
//     //       (position) => {
//     //         const { latitude, longitude } = position.coords
//     //         const userLocation = { lat: latitude, lng: longitude }

//     //         // Create map instance
//     //         const mapOptions = {
//     //           center: userLocation,
//     //           zoom: 15,
//     //           styles: [], // Your map styles here
//     //         }

//     //         // Create a new map instance
//     //         const newMap = new window.google.maps.Map(mapContainerRef.current, mapOptions)
//     //         mapInstanceRef.current = newMap

//     //         // Add user marker
//     //         const userMarker = new window.google.maps.Marker({
//     //           position: userLocation,
//     //           map: newMap,
//     //           icon: {
//     //             path: window.google.maps.SymbolPath.CIRCLE,
//     //             scale: 10,
//     //             fillColor: "#4285F4",
//     //             fillOpacity: 1,
//     //             strokeColor: "#FFFFFF",
//     //             strokeWeight: 2,
//     //           },
//     //           title: "Your Location",
//     //         })

//     //         markersRef.current.push(userMarker)

//     //         // Add note markers
//     //         renderNoteMarkers(newMap, userLocation)

//     //         setLoading(false)
//     //       },
//     //       (error) => {
//     //         handleLocationError(error)
//     //       },
//     //       {
//     //         enableHighAccuracy: true,
//     //         timeout: 5000,
//     //         maximumAge: 0,
//     //       },
//     //     )
//     //   } else {
//     //     toast({
//     //       variant: "destructive",
//     //       title: "Geolocation Not Supported",
//     //       description: "Your browser doesn't support location services",
//     //     })
//     //     setLoading(false)
//     //   }
//     // }

//     // initializeMap()

//     // Cleanup function
//     return () => {
//       // Clear all markers and circles
//       if (markersRef.current) {
//         markersRef.current.forEach((marker) => {
//           if (marker) marker.setMap(null)
//         })
//         markersRef.current = []
//       }

//       if (circlesRef.current) {
//         circlesRef.current.forEach((circle) => {
//           if (circle) circle.setMap(null)
//         })
//         circlesRef.current = []
//       }

//       // Don't destroy the map instance - let it be garbage collected
//       mapInstanceRef.current = null
//     }
//   }, [toast])

//   // Update markers when notes change
//   useEffect(() => {
//     if (mapInstanceRef.current && markersRef.current.length > 0) {
//       // Get the user marker (first marker)
//       const userMarker = markersRef.current[0]
//       const userLocation = userMarker.getPosition().toJSON()

//       // Clear all markers except user marker
//       for (let i = 1; i < markersRef.current.length; i++) {
//         if (markersRef.current[i]) {
//           markersRef.current[i].setMap(null)
//         }
//       }
//       markersRef.current = [userMarker]

//       // Clear all circles
//       circlesRef.current.forEach((circle) => {
//         if (circle) circle.setMap(null)
//       })
//       circlesRef.current = []

//       // Re-render note markers
//       renderNoteMarkers(mapInstanceRef.current, userLocation)
//     }
//   }, [notes])

//   // Handle location errors
//   const handleLocationError = (error: GeolocationPositionError) => {
//     setLoading(false)
//     let errorMessage = "Failed to get location"

//     switch (error.code) {
//       case error.PERMISSION_DENIED:
//         errorMessage = "Location permission denied. Please enable it in your browser settings."
//         break
//       case error.POSITION_UNAVAILABLE:
//         errorMessage = "Location information is unavailable."
//         break
//       case error.TIMEOUT:
//         errorMessage = "The request to get location timed out."
//         break
//       default:
//         errorMessage = "An unknown error occurred."
//     }

//     toast({
//       variant: "destructive",
//       title: "Location Error",
//       description: errorMessage,
//     })

//     // Fallback to default location
//     if (mapContainerRef.current && window.google?.maps && !mapInstanceRef.current) {
//       const defaultLocation = { lat: 0, lng: 0 }
//       const map = new window.google.maps.Map(mapContainerRef.current, {
//         center: defaultLocation,
//         zoom: 2,
//         styles: [], // Your map styles here
//       })
//       mapInstanceRef.current = map
//     }
//   }

//   // Render note markers
//   const renderNoteMarkers = (map: any, userLocation: { lat: number; lng: number }) => {
//     if (!map || !window.google?.maps) return

//     notes.forEach((note) => {
//       if (note.studentId === userId) return // Skip user's own notes

//       const notePosition = { lat: note.latitude, lng: note.longitude }

//       // Create marker
//       const marker = new window.google.maps.Marker({
//         position: notePosition,
//         map: map,
//         title: `${note.student.firstName} ${note.student.lastName}`,
//         icon: {
//           path: window.google.maps.SymbolPath.CIRCLE,
//           scale: 8,
//           fillColor: "#FF5722",
//           fillOpacity: 1,
//           strokeColor: "#FFFFFF",
//           strokeWeight: 2,
//         },
//       })

//       // Create circle
//       const circle = new window.google.maps.Circle({
//         strokeColor: "#FF5722",
//         strokeOpacity: 0.8,
//         strokeWeight: 1,
//         fillColor: "#FF5722",
//         fillOpacity: 0.1,
//         map: map,
//         center: notePosition,
//         radius: note.radius,
//       })

//       // Create info window
//       const infoContent = `
//         <div style="color: #000; padding: 5px;">
//           <p style="font-weight: bold; margin: 0;">${note.student.firstName} ${note.student.lastName}</p>
//           <p style="margin: 5px 0 0;">${note.message}</p>
//           <p style="margin: 5px 0 0; font-size: 12px;">Interests: ${note.interests.join(", ")}</p>
//         </div>
//       `

//       const infoWindow = new window.google.maps.InfoWindow({
//         content: infoContent,
//       })

//       // Add click listener
//       marker.addListener("click", () => {
//         infoWindow.open(map, marker)
//       })

//       // Store references
//       markersRef.current.push(marker)
//       circlesRef.current.push(circle)
//     })
//   }

//   // Refresh location
//   const refreshLocation = () => {
//     if (!window.google?.maps) {
//       toast({
//         variant: "destructive",
//         title: "Map Error",
//         description: "Google Maps is not loaded",
//       })
//       return
//     }

//     setLoading(true)

//     // Clear existing map elements
//     if (mapInstanceRef.current) {
//       // Clear all markers
//       markersRef.current.forEach((marker) => {
//         if (marker) marker.setMap(null)
//       })
//       markersRef.current = []

//       // Clear all circles
//       circlesRef.current.forEach((circle) => {
//         if (circle) circle.setMap(null)
//       })
//       circlesRef.current = []
//     }

//     // Get new location
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords
//           const userLocation = { lat: latitude, lng: longitude }

//           // Update map center
//           if (mapInstanceRef.current) {
//             mapInstanceRef.current.setCenter(userLocation)

//             // Add user marker
//             const userMarker = new window.google.maps.Marker({
//               position: userLocation,
//               map: mapInstanceRef.current,
//               icon: {
//                 path: window.google.maps.SymbolPath.CIRCLE,
//                 scale: 10,
//                 fillColor: "#4285F4",
//                 fillOpacity: 1,
//                 strokeColor: "#FFFFFF",
//                 strokeWeight: 2,
//               },
//               title: "Your Location",
//             })

//             markersRef.current.push(userMarker)

//             // Add note markers
//             renderNoteMarkers(mapInstanceRef.current, userLocation)
//           }

//           setLoading(false)
//         },
//         (error) => {
//           handleLocationError(error)
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 5000,
//           maximumAge: 0,
//         },
//       )
//     } else {
//       toast({
//         variant: "destructive",
//         title: "Geolocation Not Supported",
//         description: "Your browser doesn't support location services",
//       })
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="space-y-4">
//       <div ref={mapContainerRef} className="h-[300px] w-full rounded-md bg-muted/30" style={{ position: "relative", minHeight: "300px" }}>
//         {loading && (
//           <div
//             className="flex h-full w-full items-center justify-center"
//             style={{
//               position: "absolute",
//               top: 0,
//               left: 0,
//               backgroundColor: "rgba(255, 255, 255, 0.7)",
//               zIndex: 10,
//             }}
//           >
//             <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
//           </div>
//         )}
//       </div>
//       <Button onClick={refreshLocation} disabled={loading}>
//         {loading ? "Loading..." : "Refresh Location"}
//       </Button>
//     </div>
//   )
// }
"use client"

import { useEffect, useRef, useState } from "react"
import { Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

declare global {
  interface Window {
    google?: any
  }
}

interface Note {
  id: string
  studentId: string
  latitude: number
  longitude: number
  radius: number
  message: string
  student: {
    firstName: string
    lastName: string
  }
  interests: string[]
}

interface FurlongMapProps {
  notes: Note[]
  userId: string
}

export function FurlongMap({ notes, userId }: FurlongMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markers = useRef<any[]>([])
  const circles = useRef<any[]>([])
  const scriptLoaded = useRef(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Load Google Maps Script only once
  useEffect(() => {
    if (typeof window.google === "object" && typeof window.google.maps === "object") {
      scriptLoaded.current = true
      initMap()
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`
    script.async = true
    script.defer = true

    script.onload = () => {
      scriptLoaded.current = true
      initMap()
    }

    script.onerror = () => {
      toast({
        variant: "destructive",
        title: "Map Error",
        description: "Failed to load Google Maps",
      })
    }

    document.head.appendChild(script)
  }, [])

  // Initialize map after script is loaded
  const initMap = () => {
    if (!mapRef.current || !window.google?.maps) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }

        const map = new window.google.maps.Map(mapRef.current, {
          center: userLoc,
          zoom: 15,
        })

        mapInstance.current = map

        const userMarker = new window.google.maps.Marker({
          position: userLoc,
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
          title: "Your Location",
        })

        markers.current.push(userMarker)
        renderNotes(map, userLoc)
        setLoading(false)
      },
      (err) => {
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Could not access your location.",
        })
        setLoading(false)
      }
    )
  }

  // Render all notes except current user
  const renderNotes = (map: any, userLoc: any) => {
    clearMap()

    notes.forEach((note) => {
      if (note.studentId === userId) return

      const notePos = { lat: note.latitude, lng: note.longitude }

      const marker = new window.google.maps.Marker({
        position: notePos,
        map,
        title: `${note.student.firstName} ${note.student.lastName}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#FF5722",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      })

      const circle = new window.google.maps.Circle({
        map,
        center: notePos,
        radius: note.radius,
        fillColor: "#FF5722",
        fillOpacity: 0.1,
        strokeColor: "#FF5722",
        strokeOpacity: 0.8,
        strokeWeight: 1,
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <strong>${note.student.firstName} ${note.student.lastName}</strong><br/>
            ${note.message}<br/>
            <small>${note.interests.join(", ")}</small>
          </div>`,
      })

      marker.addListener("click", () => infoWindow.open(map, marker))

      markers.current.push(marker)
      circles.current.push(circle)
    })
  }

  const clearMap = () => {
    markers.current.forEach((m) => m.setMap(null))
    circles.current.forEach((c) => c.setMap(null))
    markers.current = []
    circles.current = []
  }

  useEffect(() => {
    if (mapInstance.current) {
      const userMarker = markers.current[0]
      const userLoc = userMarker?.getPosition()?.toJSON()
      if (userLoc) {
        renderNotes(mapInstance.current, userLoc)
      }
    }
  }, [notes])

  return (
    <div className="space-y-4">
      <div
        ref={mapRef}
        className="h-[300px] w-full rounded-md bg-muted/30"
        style={{ position: "relative", minHeight: "300px" }}
      >
        <div
  className="absolute top-0 left-0 h-full w-full flex items-center justify-center z-10"
  style={{
    backgroundColor: loading ? "rgba(255, 255, 255, 0.7)" : "transparent",
    pointerEvents: "none",
    transition: "background-color 0.3s ease-in-out",
  }}
>
  {loading && <Loader className="h-8 w-8 animate-spin text-muted-foreground" />}
</div>


      </div>
      <Button
  disabled={loading}
  onClick={() => {
    if (mapInstance.current && typeof navigator !== "undefined") {
      clearMap()
      navigator.geolocation.getCurrentPosition((pos) => {
        console.log("📍 Location:", pos.coords)

        const userLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }

        mapInstance.current.setCenter(userLoc)

        const userMarker = new window.google.maps.Marker({
          position: userLoc,
          map: mapInstance.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
          title: "Your Location",
        })

        markers.current.push(userMarker)
        renderNotes(mapInstance.current, userLoc)
      })
    }
  }}
>
  {loading ? "Loading..." : "Refresh Location"}
</Button>

    </div>
  )
}
