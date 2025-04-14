import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FurlongChatMessages } from "@/components/furlong/furlong-chat-messages"

export default async function FurlongChatPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
    },
  })

  if (!user || user.role !== "student") {
    redirect("/dashboard")
  }

  // Check if the chat exists and is active
  const chat = await prisma.furlongChat.findUnique({
    where: {
      id: params.id,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      furlongNote: {
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      members: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  if (!chat) {
    redirect("/furlong")
  }

  // Check if the user is a member of the chat
  const isMember = chat.members.some((member) => member.studentId === user.id)

  if (!isMember) {
    redirect("/furlong")
  }

  // Get the messages
  const messages = await prisma.furlongMessage.findMany({
    where: {
      chatId: params.id,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Furlong Chat</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            Chat with {chat.furlongNote.student.firstName} {chat.furlongNote.student.lastName}
          </CardTitle>
          <CardDescription>{chat.furlongNote.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-sm font-medium">Participants ({chat.members.length})</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {chat.members.map((member) => (
                <div key={member.id} className="rounded-full bg-muted px-3 py-1 text-xs">
                  {member.student.firstName} {member.student.lastName}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <FurlongChatMessages
              chatId={params.id}
              userId={user.id}
              initialMessages={messages}
              expiresAt={chat.expiresAt}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

