import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    // Create the Supabase server client properly
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data } = await supabase.auth.getSession()
    const session = data?.session

    // Redirect to login if no session
    if (!session) {
      redirect("/login")
    }

    return <>{children}</>
  } catch (error) {
    console.error("Authentication error:", error)
    redirect("/login")
  }
}