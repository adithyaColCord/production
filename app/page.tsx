import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export default async function RootPage() {
  try {
    // Initialize the Supabase client
    const supabase = await createServerSupabaseClient()
    
    // Use safe destructuring to avoid the "cannot read properties of undefined" error
    const { data } = await supabase.auth.getSession()
    const session = data?.session

    if (session) {
      redirect("/dashboard")
    }

    // If no session, redirect to login
    redirect("/login")
  } catch (error) {
    console.error("Authentication error:", error)
    redirect("/login")
  }
}

