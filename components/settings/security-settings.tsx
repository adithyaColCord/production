"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabaseClient } from "@/lib/supabase/client"

interface SecuritySettingsProps {
  userId: string
  email: string
}

export function SecuritySettings({ userId, email }: SecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please make sure your new password and confirmation match.",
      })
      return
    }

    setIsChangingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newEmail) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter a new email address.",
      })
      return
    }

    setIsChangingEmail(true)

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Email Update Initiated",
        description:
          "A confirmation email has been sent to your new email address. Please check your inbox and follow the instructions to complete the change.",
      })

      setNewEmail("")

      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update email. Please try again.",
      })
    } finally {
      setIsChangingEmail(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Change Password</h3>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={isChangingPassword}>
            {isChangingPassword ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium">Change Email</h3>
        <form onSubmit={handleChangeEmail} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentEmail">Current Email</Label>
            <Input id="currentEmail" value={email} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newEmail">New Email</Label>
            <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          </div>

          <Button type="submit" disabled={isChangingEmail}>
            {isChangingEmail ? "Updating..." : "Update Email"}
          </Button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Enhance your account security by enabling two-factor authentication.
        </p>
        <Button className="mt-4" variant="outline">
          Set Up Two-Factor Authentication
        </Button>
      </div>
    </div>
  )
}

