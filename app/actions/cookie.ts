'use server';

import { cookies } from 'next/headers';

export async function getCookie(name: string) {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

export async function setCookie(name: string, value: string, options = {}) {
  const cookieStore = await cookies();
  cookieStore.set({ name, value, ...options });
  return { success: true };
}

export async function deleteCookie(name: string, options = {}) {
  const cookieStore = await cookies();
  cookieStore.set({ name, value: '', ...options, expires: new Date(0) });
  return { success: true };
}
