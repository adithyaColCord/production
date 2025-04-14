import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { SidebarNav } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ParentDashboard } from "@/components/dashboard/parent";

export default async function ParentDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const userDetails = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
    },
  });

  if (!userDetails) {
    return <div>User not found</div>;
  }

  const dashboardData = await prisma.parentStudent.findMany({
    where: { parentId: userDetails.id },
    include: {
      student: true,
    },
  });

  return (
    <div className="flex h-screen">
      <SidebarNav user={userDetails} />
      <div className="flex-1 flex flex-col">
        <Header user={userDetails} />
        <main className="p-6 space-y-6">
          <Suspense fallback={<div>Loading...</div>}>
            <ParentDashboard data={dashboardData} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}