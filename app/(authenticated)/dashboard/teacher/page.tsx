import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { SidebarNav } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TeacherDashboard } from "@/components/dashboard/teacher";

export default async function TeacherDashboardPage() {
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

  const dashboardData = await prisma.teacherCourse.count({
    where: { teacherId: userDetails.id },
  });

  return (
    <div className="flex h-screen">
      <SidebarNav user={userDetails} />
      <div className="flex-1 flex flex-col">
        <Header user={userDetails} />
        <main className="p-6 space-y-6">
          <Suspense fallback={<div>Loading...</div>}>
            <TeacherDashboard data={dashboardData} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}