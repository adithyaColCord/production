"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  BarChart,
  BellRing,
  BookMarked,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { UserRole } from "@prisma/client"

interface SidebarNavProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: UserRole
    avatarUrl?: string | null
  }
}

export function SidebarNav({ user }: SidebarNavProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="flex flex-col gap-2 px-4 py-2">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold">ColCord</span>
            </Link>
            <SidebarTrigger className="ml-auto" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/courses")}>
                <Link href="/courses">
                  <BookOpen className="h-4 w-4" />
                  <span>Courses</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/chat")}>
                <Link href="/chat">
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/attendance")}>
                <Link href="/attendance">
                  <ClipboardList className="h-4 w-4" />
                  <span>Attendance</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/tasks")}>
                <Link href="/tasks">
                  <FileText className="h-4 w-4" />
                  <span>Tasks</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/notifications")}>
                <Link href="/notifications">
                  <BellRing className="h-4 w-4" />
                  <span>Notifications</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/analytics")}>
                <Link href="/analytics">
                  <BarChart className="h-4 w-4" />
                  <span>Analytics</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/study-assistant")}>
                <Link href="/study-assistant">
                  <BookMarked className="h-4 w-4" />
                  <span>Study Assistant</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/collaborative-docs")}>
                <Link href="/collaborative-docs">
                  <FileText className="h-4 w-4" />
                  <span>Collaborative Docs</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/study-rooms")}>
                <Link href="/study-rooms">
                  <Users className="h-4 w-4" />
                  <span>Study Rooms</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/plagiarism-checker")}>
                <Link href="/plagiarism-checker">
                  <Search className="h-4 w-4" />
                  <span>Plagiarism Checker</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/resource-library")}>
                <Link href="/resource-library">
                  <BookOpen className="h-4 w-4" />
                  <span>Resource Library</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/peer-tutoring")}>
                <Link href="/peer-tutoring">
                  <Users className="h-4 w-4" />
                  <span>Peer Tutoring</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {user.role === "admin" && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/admin")}>
                  <Link href="/admin">
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={user.avatarUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{`${user.firstName} ${user.lastName}`}</span>
              <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
            </div>
            <Button variant="ghost" size="icon" asChild className="ml-auto">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}

