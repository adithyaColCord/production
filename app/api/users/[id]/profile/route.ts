import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Check if the user is updating their own profile
    if (session.user.id !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { firstName, lastName, avatarUrl } = await request.json()

    // Update the user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        avatarUrl,
      },
    })

    // Update Supabase user metadata
    await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

