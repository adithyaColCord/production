"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"

interface Message {
  id: string
  chatId: string
  studentId: string
  message: string
  createdAt: string
  student: {
    id: string
    firstName: string
    lastName: string
  }
}

interface FurlongChatMessagesProps {
  chatId: string
  userId: string
  initialMessages: Message[]
  expiresAt: string
}

export function FurlongChatMessages({ chatId, userId, initialMessages, expiresAt }: FurlongChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    scrollToBottom()

    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 5000)

    return () => clearInterval(interval)
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/furlong/chats/messages?chatId=${chatId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to fetch messages")
      }

      const { messages: newMessages } = await response.json()

      // Only update if there are new messages
      if (newMessages.length > messages.length) {
        setMessages(newMessages)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/furlong/chats/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          studentId: userId,
          message: input,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to send message")
      }

      setInput("")
      fetchMessages()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const isExpired = new Date(expiresAt) <= new Date()

  return (
    <div className="flex h-[500px] flex-col rounded-md border">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.studentId === userId ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex max-w-[80%] items-start gap-3 rounded-lg p-3 ${
                  message.studentId === userId ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {message.studentId !== userId && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(message.student.firstName, message.student.lastName)}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1">
                  {message.studentId !== userId && (
                    <p className="mb-1 text-xs font-medium">
                      {message.student.firstName} {message.student.lastName}
                    </p>
                  )}
                  <p className="text-sm">{message.message}</p>
                  <p className="mt-1 text-xs opacity-70">{format(new Date(message.createdAt), "p")}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder={isExpired ? "Chat has expired" : "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || isExpired}
          />
          <Button type="submit" size="icon" disabled={isLoading || isExpired}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

