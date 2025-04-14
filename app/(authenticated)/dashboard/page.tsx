import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login"); // Redirect to login if not authenticated
  }

  const userDetails = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!userDetails) {
    return redirect("/login"); // Redirect to login if user not found
  }

  // Redirect based on user role
  switch (userDetails.role) {
    case "student":
      return redirect("/dashboard/student");
    case "teacher":
      return redirect("/dashboard/teacher");
    case "parent":
      return redirect("/dashboard/parent");
    case "admin":
      return redirect("/dashboard/admin");
    default:
      return redirect("/login"); // Redirect to login for unknown roles
  }
}