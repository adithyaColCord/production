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

    const { chatId, studentId, message } = await request.json()

    if (!chatId || !studentId || !message) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Verify the user is a student
    const user = await prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true },
    })

    if (!user || user.role !== "student") {
      return NextResponse.json({ message: "Only students can send messages in furlong chats" }, { status: 403 })
    }

    // Check if the chat exists and is active
    const chat = await prisma.furlongChat.findUnique({
      where: {
        id: chatId,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        members: {
          where: {
            studentId,
          },
        },
      },
    })

    if (!chat) {
      return NextResponse.json({ message: "Chat not found or expired" }, { status: 404 })
    }

    // Check if the student is a member of the chat
    if (chat.members.length === 0) {
      return NextResponse.json({ message: "You are not a member of this chat" }, { status: 403 })
    }

    // Create the message
    const newMessage = await prisma.furlongMessage.create({
      data: {
        chatId,
        studentId,
        message,
      },
    })

    return NextResponse.json({ success: true, message: newMessage })
  } catch (error: any) {
    console.error("Error sending furlong message:", error)
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
    const chatId = url.searchParams.get("chatId")

    if (!chatId) {
      return NextResponse.json({ message: "Missing chat ID" }, { status: 400 })
    }

    // Check if the chat exists and is active
    const chat = await prisma.furlongChat.findUnique({
      where: {
        id: chatId,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        members: {
          where: {
            studentId: session.user.id,
          },
        },
      },
    })

    if (!chat) {
      return NextResponse.json({ message: "Chat not found or expired" }, { status: 404 })
    }

    // Check if the user is a member of the chat
    if (chat.members.length === 0) {
      return NextResponse.json({ message: "You are not a member of this chat" }, { status: 403 })
    }

    // Get the messages
    const messages = await prisma.furlongMessage.findMany({
      where: {
        chatId,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error("Error fetching furlong messages:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

