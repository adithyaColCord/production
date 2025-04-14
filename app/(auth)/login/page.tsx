import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { AuthForm } from "@/components/auth/auth-form"

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <AuthForm />
    </div>
  )
}