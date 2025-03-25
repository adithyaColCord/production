"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Bell, BookOpen, ClipboardList, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

interface NotificationsListProps {
  notifications: Notification[]
}

export function NotificationsList({ notifications: initialNotifications }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const router = useRouter()
  const { toast } = useToast()

  const getIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <FileText className="h-5 w-5" />
      case "exam":
        return <ClipboardList className="h-5 w-5" />
      case "attendance":
        return <BookOpen className="h-5 w-5" />
      case "announcement":
        return <Bell className="h-5 w-5" />
      case "grade":
        return <FileText className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      })

      if (!response.ok) {
        throw new Error("Failed to mark notification as read")
      }

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification,
        ),
      )

      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notification as read",
      })
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
        <p className="text-center text-muted-foreground">You have no notifications</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start gap-4 rounded-lg border p-4 ${!notification.isRead ? "bg-muted/50" : ""}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{notification.title}</h3>
              <span className="text-xs text-muted-foreground">{format(new Date(notification.createdAt), "PPp")}</span>
            </div>
            <p className="text-sm text-muted-foreground">{notification.message}</p>
          </div>
          {!notification.isRead && (
            <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
              Mark as read
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

