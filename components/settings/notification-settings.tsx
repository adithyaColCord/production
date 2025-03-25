"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface NotificationSettingsProps {
  userId: string
}

interface NotificationPreferences {
  assignments: boolean
  exams: boolean
  grades: boolean
  announcements: boolean
  attendance: boolean
  messages: boolean
  email: boolean
  push: boolean
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    assignments: true,
    exams: true,
    grades: true,
    announcements: true,
    attendance: true,
    messages: true,
    email: true,
    push: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/notification-preferences`)

        if (response.ok) {
          const data = await response.json()
          setPreferences(data.preferences)
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchPreferences()
  }, [userId])

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/${userId}/notification-preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferences }),
      })

      if (!response.ok) {
        throw new Error("Failed to update notification preferences")
      }

      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been successfully updated.",
      })

      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update notification preferences. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <div>Loading preferences...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Notification Types</h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="assignments" className="flex-1">
            Assignment Notifications
          </Label>
          <Switch
            id="assignments"
            checked={preferences.assignments}
            onCheckedChange={() => handleToggle("assignments")}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="exams" className="flex-1">
            Exam Notifications
          </Label>
          <Switch id="exams" checked={preferences.exams} onCheckedChange={() => handleToggle("exams")} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="grades" className="flex-1">
            Grade Notifications
          </Label>
          <Switch id="grades" checked={preferences.grades} onCheckedChange={() => handleToggle("grades")} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="announcements" className="flex-1">
            Announcement Notifications
          </Label>
          <Switch
            id="announcements"
            checked={preferences.announcements}
            onCheckedChange={() => handleToggle("announcements")}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="attendance" className="flex-1">
            Attendance Notifications
          </Label>
          <Switch id="attendance" checked={preferences.attendance} onCheckedChange={() => handleToggle("attendance")} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="messages" className="flex-1">
            Message Notifications
          </Label>
          <Switch id="messages" checked={preferences.messages} onCheckedChange={() => handleToggle("messages")} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Notification Channels</h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="email" className="flex-1">
            Email Notifications
          </Label>
          <Switch id="email" checked={preferences.email} onCheckedChange={() => handleToggle("email")} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="push" className="flex-1">
            Push Notifications
          </Label>
          <Switch id="push" checked={preferences.push} onCheckedChange={() => handleToggle("push")} />
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Preferences"}
      </Button>
    </form>
  )
}

