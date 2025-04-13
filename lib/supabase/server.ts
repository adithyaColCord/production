import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Helper function to safely access cookie store
const getCookieStore = async () => {
  return await cookies()
}

export async function createServerSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await getCookieStore()
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: any) {
          const cookieStore = await getCookieStore()
          cookieStore.set({ name, value, ...options })
        },
        async remove(name: string, options: any) {
          const cookieStore = await getCookieStore()
          cookieStore.set({ name, value: "", expires: new Date(0), ...options })
        },
      },
    }
  )
}

