import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { sessionId, studentId, latitude, longitude } = await request.json()

    if (!sessionId || !studentId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Verify the student is enrolled in the course
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          include: {
            students: {
              where: { studentId },
            },
          },
        },
      },
    })

    if (!attendanceSession) {
      return NextResponse.json({ message: "Attendance session not found" }, { status: 404 })
    }

    if (attendanceSession.course.students.length === 0) {
      return NextResponse.json({ message: "Student not enrolled in this course" }, { status: 403 })
    }

    // Check if the student is within the required radius (20 meters)
    if (attendanceSession.latitude && attendanceSession.longitude && latitude && longitude) {
      const distance = calculateDistance(latitude, longitude, attendanceSession.latitude, attendanceSession.longitude)

      if (distance > 20) {
        return NextResponse.json({ message: "You are too far from the class location" }, { status: 403 })
      }
    }

    // Check if attendance record already exists
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
    })

    if (existingRecord) {
      return NextResponse.json({ message: "Attendance already marked" }, { status: 400 })
    }

    // Determine attendance status based on time
    const now = new Date()
    const sessionDate = new Date(attendanceSession.sessionDate)
    sessionDate.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let status = "present"

    // Check if the attendance is being marked on the correct day
    if (sessionDate.getTime() !== today.getTime()) {
      status = "absent"
    } else {
      // Parse session start time
      const [startHours, startMinutes] = attendanceSession.startTime.toString().split(":").map(Number)
      const sessionStartTime = new Date()
      sessionStartTime.setHours(startHours, startMinutes, 0, 0)

      // If more than 10 minutes late, mark as "late"
      if (now.getTime() - sessionStartTime.getTime() > 10 * 60 * 1000) {
        status = "late"
      }
    }

    // Create attendance record
    const attendanceRecord = await prisma.attendanceRecord.create({
      data: {
        sessionId,
        studentId,
        status,
        checkInTime: now,
        latitude,
        longitude,
      },
    })

    // Create notification for absent students
    if (status === "absent") {
      await prisma.notification.create({
        data: {
          userId: studentId,
          title: "Absence Recorded",
          message: `You were marked absent for ${attendanceSession.course.name} on ${new Date(attendanceSession.sessionDate).toLocaleDateString()}.`,
          type: "attendance",
          relatedId: attendanceSession.id,
        },
      })
    }

    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    console.error("Error marking attendance:", error)
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

