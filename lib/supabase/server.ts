'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper to safely get cookie values
async function safeGetCookieValue(name: string) {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  } catch (error) {
    console.error(`Error getting cookie ${name}:`, error);
    return undefined;
  }
}

export async function createServerSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return safeGetCookieValue(name);
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