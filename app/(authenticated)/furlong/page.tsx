import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FurlongMap } from "@/components/furlong/furlong-map"
import { FurlongNoteForm } from "@/components/furlong/furlong-note-form"
import { FurlongNotesList } from "@/components/furlong/furlong-notes-list"

export default async function FurlongPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
    },
  })

  if (!user || user.role !== "student") {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>The Furlong feature is only available to students.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Get active furlong notes
  const activeNotes = await prisma.furlongNote.findMany({
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
              studentId: user.id,
            },
          },
        },
      },
    },
  })

  // Get user's active chats
  const activeChats = await prisma.furlongChatMember.findMany({
    where: {
      studentId: user.id,
      chat: {
        expiresAt: {
          gt: new Date(),
        },
      },
    },
    include: {
      chat: {
        include: {
          furlongNote: true,
          members: {
            include: {
              student: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Furlong</h1>
      <p className="text-muted-foreground">Connect with nearby students based on shared interests</p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create a Note</CardTitle>
            <CardDescription>Share your interests and connect with students nearby</CardDescription>
          </CardHeader>
          <CardContent>
            <FurlongNoteForm userId={user.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nearby Map</CardTitle>
            <CardDescription>View notes from students in your area</CardDescription>
          </CardHeader>
          <CardContent>
            <FurlongMap notes={activeNotes} userId={user.id} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nearby Notes</CardTitle>
          <CardDescription>Notes from students in your vicinity</CardDescription>
        </CardHeader>
        <CardContent>
          <FurlongNotesList notes={activeNotes} userId={user.id} userChats={activeChats} />
        </CardContent>
      </Card>
    </div>
  )
}

