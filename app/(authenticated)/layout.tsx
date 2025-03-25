import type React from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { SidebarNav } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabaseClient()

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
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      avatarUrl: true,
      notifications: {
        where: { isRead: false },
        select: { id: true },
      },
    },
  })

  if (!user) {
    redirect("/")
  }

  const notificationCount = user.notifications.length

  return (
    <div className="flex min-h-screen flex-col">
      <SidebarNav user={user} />
      <div className="flex flex-1 flex-col">
        <Header user={user} notificationCount={notificationCount} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

