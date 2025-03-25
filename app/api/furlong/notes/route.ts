import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { studentId, message, interests, latitude, longitude, radius, expiresAt } = await request.json()

    if (!studentId || !message || !interests || !latitude || !longitude || !radius || !expiresAt) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Verify the user is a student
    const user = await prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true },
    })

    if (!user || user.role !== "student") {
      return NextResponse.json({ message: "Only students can create furlong notes" }, { status: 403 })
    }

    // Create the furlong note
    const note = await prisma.furlongNote.create({
      data: {
        studentId,
        message,
        interests,
        latitude,
        longitude,
        radius,
        expiresAt: new Date(expiresAt),
      },
    })

    return NextResponse.json({ success: true, note })
  } catch (error: any) {
    console.error("Error creating furlong note:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const lat = Number.parseFloat(url.searchParams.get("lat") || "0")
    const lng = Number.parseFloat(url.searchParams.get("lng") || "0")

    if (!lat || !lng) {
      return NextResponse.json({ message: "Missing location parameters" }, { status: 400 })
    }

    // Get all active notes
    const notes = await prisma.furlongNote.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        chats: {
          include: {
            members: {
              where: {
                studentId: session.user.id,
              },
            },
          },
        },
      },
    })

    // Filter notes by distance
    const nearbyNotes = notes.filter((note) => {
      const distance = calculateDistance(lat, lng, note.latitude, note.longitude)
      return distance <= note.radius
    })

    return NextResponse.json({ notes: nearbyNotes })
  } catch (error: any) {
    console.error("Error fetching furlong notes:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

// Function to calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c

  return d // Distance in meters
}

