import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { SidebarNav } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AdminDashboard } from "@/components/dashboard/admin";

export default async function AdminDashboardPage() {
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

  const dashboardData = {
    totalStudents: await prisma.student.count(),
    totalCourses: await prisma.course.count(),
    totalTeachers: await prisma.teacher.count(),
  };

  return (
    <div className="flex h-screen">
      <SidebarNav user={userDetails} />
      <div className="flex-1 flex flex-col">
        <Header user={userDetails} />
        <main className="p-6 space-y-6">
          <Suspense fallback={<div>Loading...</div>}>
            <AdminDashboard data={dashboardData} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}