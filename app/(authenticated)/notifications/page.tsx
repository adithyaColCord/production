import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NotificationsList } from "@/components/notifications/notifications-list"

export default async function NotificationsPage() {
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
    },
  })

  if (!user) {
    return null
  }

  // Get notifications
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Button variant="outline">Mark All as Read</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationsList notifications={notifications} />
        </CardContent>
      </Card>
    </div>
  )
}

