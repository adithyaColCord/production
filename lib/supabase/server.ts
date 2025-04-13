'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper to safely parse cookie values
function safeGetCookieValue(cookieStore: ReturnType<typeof cookies>, name: string) {
  try {
    return cookieStore.get(name)?.value;
  } catch (error) {
    console.error(`Error getting cookie ${name}:`, error);
    return undefined;
  }
}

export async function createServerSupabaseClient() {
  // For Next.js app router - must wait for cookies()
  const cookieStore = await cookies().then(store => store);
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          // Use a safe method to get cookie values
          return safeGetCookieValue(cookieStore, name);
        },
        set(name, value, options) {
          // Log instead of trying to modify cookies
          console.log(`[Cookie set attempted]: ${name}`);
        },
        remove(name, options) {
          // Log instead of trying to modify cookies
          console.log(`[Cookie remove attempted]: ${name}`);
        }
      }
    }
  );
}

