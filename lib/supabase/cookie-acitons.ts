'use server';

import { cookies } from "next/headers";

export async function getCookieValue(name: string) {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

export async function setCookieValue(name: string, value: string, options: any) {
  const cookieStore = await cookies();
  cookieStore.set({ name, value, ...options });
}

export async function removeCookieValue(name: string, options: any) {
  const cookieStore = await cookies();
  cookieStore.set({ name, value: "", expires: new Date(0), ...options });
}