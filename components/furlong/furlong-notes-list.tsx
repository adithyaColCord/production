"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"

interface FurlongNotesListProps {
  notes: any[]
  userId: string
  userChats: any[]
}

export function FurlongNotesList({ notes, userId, userChats }: FurlongNotesListProps) {
  const [joiningChat, setJoiningChat] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleJoinChat = async (noteId: string) => {
    setJoiningChat(noteId)

    try {
      const response = await fetch("/api/furlong/chats/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId,
          studentId: userId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to join chat")
      }

      const { chatId } = await response.json()

      toast({
        title: "Chat Joined",
        description: "You have successfully joined the chat.",
      })

      router.push(`/furlong/chats/${chatId}`)
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to join chat",
      })
    } finally {
      setJoiningChat(null)
    }
  }

  const handleOpenChat = (chatId: string) => {
    router.push(`/furlong/chats/${chatId}`)
  }

  const isUserInChat = (note: any) => {
    return note.chats.some((chat: any) => chat.members.length > 0)
  }

  const getChatId = (note: any) => {
    const chat = note.chats.find((chat: any) => chat.members.length > 0)
    return chat ? chat.id : null
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const filteredNotes = notes.filter((note) => note.studentId !== userId)

  if (filteredNotes.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
        <p className="text-center text-muted-foreground">
          No nearby notes found. Try creating one to connect with others!
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredNotes.map((note) => (
        <Card key={note.id}>
          <CardHeader className="flex flex-row items-start gap-3">
            <Avatar>
              <AvatarFallback>{getInitials(note.student.firstName, note.student.lastName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-base">
                {note.student.firstName} {note.student.lastName}
              </CardTitle>
              <div className="flex flex-wrap gap-1">
                {note.interests.slice(0, 3).map((interest: string) => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {note.interests.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{note.interests.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{note.message}</p>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2">
            <p className="text-xs text-muted-foreground">Expires in {formatDistanceToNow(new Date(note.expiresAt))}</p>
            {isUserInChat(note) ? (
              <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenChat(getChatId(note))}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Open Chat
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => handleJoinChat(note.id)}
                disabled={joiningChat === note.id}
              >
                {joiningChat === note.id ? (
                  "Joining..."
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Join Chat
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

