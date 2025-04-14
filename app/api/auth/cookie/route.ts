import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = await request.json();
  const { operation, name, value, options = {} } = data;

  try {
    switch (operation) {
      case "get": {
        const cookieStore = await cookies();
        const cookie = cookieStore.get(name);
        return NextResponse.json({ success: true, value: cookie?.value });
      }
      case "set": {
        const cookieStore = await cookies();
        cookieStore.set({ name, value, ...options });
        return NextResponse.json({ success: true });
      }
      case "remove": {
        const cookieStore = await cookies();
        cookieStore.set({ name, value: "", ...options, expires: new Date(0) });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ success: false, error: "Invalid operation" }, { status: 400 });
    }
  } catch (error) {
    console.error("Cookie operation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform cookie operation" },
      { status: 500 }
    );
  }
}