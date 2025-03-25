"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface FurlongNoteFormProps {
  userId: string
}

const INTERESTS = [
  "Academic",
  "Arts",
  "Music",
  "Sports",
  "Technology",
  "Gaming",
  "Literature",
  "Science",
  "Mathematics",
  "Languages",
  "History",
  "Philosophy",
  "Social",
  "Volunteering",
  "Career",
]

export function FurlongNoteForm({ userId }: FurlongNoteFormProps) {
  const [message, setMessage] = useState("")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [radius, setRadius] = useState("500")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a message.",
      })
      return
    }

    if (selectedInterests.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one interest.",
      })
      return
    }

    setIsLoading(true)

    try {
      // Get current location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          // Calculate expiration time (2 hours from now)
          const expiresAt = new Date()
          expiresAt.setHours(expiresAt.getHours() + 2)

          // Create furlong note
          const response = await fetch("/api/furlong/notes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              studentId: userId,
              message,
              interests: selectedInterests,
              latitude,
              longitude,
              radius: Number.parseFloat(radius),
              expiresAt: expiresAt.toISOString(),
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || "Failed to create note")
          }

          toast({
            title: "Note Created",
            description: "Your note has been successfully created and is now visible to nearby students.",
          })

          setMessage("")
          setSelectedInterests([])
          setRadius("500")
          router.refresh()
        },
        (error) => {
          console.error("Error getting location:", error)
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Unable to get your location. Please enable location services and try again.",
          })
        },
      )
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create note",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest))
    } else {
      setSelectedInterests([...selectedInterests, interest])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          placeholder="Share what you're looking to connect about..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[100px]"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Interests</Label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <Button
              key={interest}
              type="button"
              variant={selectedInterests.includes(interest) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="radius">Radius (meters)</Label>
        <Select value={radius} onValueChange={setRadius}>
          <SelectTrigger>
            <SelectValue placeholder="Select radius" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="100">100 meters</SelectItem>
            <SelectItem value="250">250 meters</SelectItem>
            <SelectItem value="500">500 meters</SelectItem>
            <SelectItem value="1000">1 kilometer</SelectItem>
            <SelectItem value="2000">2 kilometers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Note"}
      </Button>
    </form>
  )
}

