import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Check if the user is accessing their own preferences
    if (session.user.id !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // In a real application, you would fetch the actual preferences from a database
    // For now, we'll return default preferences
    const preferences = {
      assignments: true,
      exams: true,
      grades: true,
      announcements: true,
      attendance: true,
      messages: true,
      email: true,
      push: true,
    }

    return NextResponse.json({ preferences })
  } catch (error: any) {
    console.error("Error fetching notification preferences:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Check if the user is updating their own preferences
    if (session.user.id !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { preferences } = await request.json()

    // In a real application, you would update the preferences in a database
    // For now, we'll just return success

    return NextResponse.json({ success: true, preferences })
  } catch (error: any) {
    console.error("Error updating notification preferences:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

