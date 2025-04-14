import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const notificationId = params.id

    // Find the notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    })

    if (!notification) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 })
    }

    // Check if the notification belongs to the user
    if (notification.userId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Mark the notification as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

