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

    const { noteId, studentId } = await request.json()

    if (!noteId || !studentId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Verify the user is a student
    const user = await prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true },
    })

    if (!user || user.role !== "student") {
      return NextResponse.json({ message: "Only students can join furlong chats" }, { status: 403 })
    }

    // Check if the note exists and is active
    const note = await prisma.furlongNote.findUnique({
      where: {
        id: noteId,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        chats: true,
      },
    })

    if (!note) {
      return NextResponse.json({ message: "Note not found or expired" }, { status: 404 })
    }

    // Check if the student is already in a chat for this note
    const existingMembership = await prisma.furlongChatMember.findFirst({
      where: {
        studentId,
        chat: {
          furlongNoteId: noteId,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json({
        message: "Already joined",
        chatId: existingMembership.chatId,
      })
    }

    // Find or create a chat for this note
    let chat

    if (note.chats.length > 0) {
      // Use the existing chat
      chat = note.chats[0]
    } else {
      // Create a new chat
      const expiresAt = new Date(note.expiresAt)

      chat = await prisma.furlongChat.create({
        data: {
          furlongNoteId: noteId,
          expiresAt,
        },
      })

      // Add the note creator to the chat
      await prisma.furlongChatMember.create({
        data: {
          chatId: chat.id,
          studentId: note.studentId,
        },
      })
    }

    // Add the student to the chat
    await prisma.furlongChatMember.create({
      data: {
        chatId: chat.id,
        studentId,
      },
    })

    // Create a system message
    await prisma.furlongMessage.create({
      data: {
        chatId: chat.id,
        studentId,
        message: "has joined the chat.",
      },
    })

    return NextResponse.json({ success: true, chatId: chat.id })
  } catch (error: any) {
    console.error("Error joining furlong chat:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

