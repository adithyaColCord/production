import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export default async function RootPage() {
  try {
    // Initialize the Supabase client
    const supabase = await createServerSupabaseClient()
    
    // Use safe destructuring to avoid errors
    const { data } = await supabase.auth.getSession()
    
    // Redirect based on authentication status
    if (data?.session) {
      // User is logged in, redirect to dashboard
      redirect("/dashboard")
    } else {
      // User is not logged in, redirect to auth page
      redirect("/login")
    }
  } catch (error) {
    console.error("Authentication error:", error)
    // If there's an error, safely redirect to login
    redirect("/login")
  }
}

