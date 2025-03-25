import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoodAssistant } from "@/components/study-assistant/mood-assistant"
import { Skeleton } from "@/components/ui/skeleton"

export default async function StudyAssistantPage() {
  const supabase = createServerSupabaseClient()

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
      firstName: true,
      role: true,
    },
  })

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Study Assistant</h1>

      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-lg" />}>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>AI Mood Assistant</CardTitle>
            <CardDescription>Chat with your AI assistant to refresh your mood and get motivated</CardDescription>
          </CardHeader>
          <CardContent>
            <MoodAssistant userId={user.id} userName={user.firstName} />
          </CardContent>
        </Card>
      </Suspense>
    </div>
  )
}

