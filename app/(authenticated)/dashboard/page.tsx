// import { redirect } from "next/navigation";
// import { createServerSupabaseClient } from "@/lib/supabase/server";
// import { prisma } from "@/lib/db";

// export default async function DashboardPage() {
//   const supabase = await createServerSupabaseClient();
//   const { data: { user } } = await supabase.auth.getUser();

//   if (!user) {
//     return redirect("/login"); // Redirect to login if not authenticated
//   }

//   const userDetails = await prisma.user.findUnique({
//     where: { id: user.id },
//     select: { role: true },
//   });

//   if (!userDetails) {
//     return redirect("/login"); // Redirect to login if user not found
//   }

//   // Redirect based on user role
//   switch (userDetails.role) {
//     case "student":
//       return redirect("/dashboard/student");
//     case "teacher":
//       return redirect("/dashboard/teacher");
//     case "parent":
//       return redirect("/dashboard/parent");
//     case "admin":
//       return redirect("/dashboard/admin");
//     default:
//       return redirect("/login"); // Redirect to login for unknown roles
//   }
// }
import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { BookOpen, Clock, Star, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarNav } from "@/components/layout/sidebar";

async function getStudentDashboardData(userId: string) {
  const enrolledCourses = await prisma.studentCourse.count({
    where: { studentId: userId },
  });

  const clubs = await prisma.clubMember.count({
    where: { studentId: userId },
  });

  const studyHours = await prisma.studySession.aggregate({
    where: {
      studentId: userId,
      endTime: { not: null },
    },
    _sum: { duration: true },
  });

  const achievements = await prisma.studentAchievement.count({
    where: { studentId: userId },
  });

  const recentGrades = await prisma.studentExam.findMany({
    where: { studentId: userId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      exam: {
        include: {
          course: true,
        },
      },
    },
  });

  const upcomingDeadlines = await prisma.assignment.findMany({
    where: {
      course: {
        students: {
          some: { studentId: userId },
        },
      },
      dueDate: { gt: new Date() },
    },
    orderBy: { dueDate: "asc" },
    take: 3,
    include: {
      course: true,
    },
  });

  return {
    enrolledCourses,
    clubs,
    studyHours: studyHours._sum.duration || 0,
    achievements,
    recentGrades,
    upcomingDeadlines,
  };
}

async function getTeacherDashboardData(userId: string) {
  const teachingCourses = await prisma.teacherCourse.count({
    where: { teacherId: userId },
  });

  const totalStudents = (
    await prisma.studentCourse.findMany({
      where: {
        course: {
          teachers: {
            some: { teacherId: userId },
          },
        },
      },
      distinct: ["studentId"],
      select: { studentId: true },
    })
  ).length;

  const upcomingClasses = await prisma.attendanceSession.findMany({
    where: {
      teacherId: userId,
      sessionDate: { gte: new Date() },
    },
    orderBy: [{ sessionDate: "asc" }, { startTime: "asc" }],
    take: 3,
    include: {
      course: true,
    },
  });

  const pendingAssignments = await prisma.assignment.count({
    where: {
      course: {
        teachers: {
          some: { teacherId: userId },
        },
      },
      studentAssignments: {
        some: {
          submittedAt: { not: null },
          grade: null,
        },
      },
    },
  });

  return {
    teachingCourses,
    totalStudents,
    upcomingClasses,
    pendingAssignments,
  };
}

async function getParentDashboardData(userId: string) {
  const children = await prisma.parentStudent.findMany({
    where: { parentId: userId },
    include: {
      student: {
        include: {
          studentCourses: {
            include: {
              course: true,
            },
          },
          studentExams: {
            orderBy: { updatedAt: "desc" },
            take: 5,
            include: {
              exam: {
                include: {
                  course: true,
                },
              },
            },
          },
          attendanceRecords: {
            where: {
              session: {
                sessionDate: {
                  gte: new Date(new Date().setDate(new Date().getDate() - 30)),
                },
              },
            },
            include: {
              session: {
                include: {
                  course: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return { children };
}

export default async function DashboardPage() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return <div>Not authenticated</div>;
    }

    console.log("Supabase user ID:", user.id);

    // Attempt to find or create user in database
    let userDetails = null;
    try {
      // Try to find the user first
      userDetails = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          role: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      // If user doesn't exist in the database but is authenticated with Supabase,
      // create a new user record automatically
      if (!userDetails) {
        console.log("Creating new user record for:", user.email);

        // Extract user metadata from Supabase if available
        const firstName =
          user.user_metadata?.first_name ||
          user.user_metadata?.firstName ||
          "New";
        const lastName =
          user.user_metadata?.last_name ||
          user.user_metadata?.lastName ||
          "User";
        const role = user.user_metadata?.role || "student";

        // Create a new user record
        userDetails = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email || "",
            password: "", // Leave empty as auth is handled by Supabase
            firstName,
            lastName,
            role: role as "student" | "teacher" | "parent" | "admin",
          },
          select: {
            id: true,
            role: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        });

        console.log("User created successfully:", userDetails);
      }
    } catch (prismaError) {
      console.error("Prisma operation error:", prismaError);
    }

    if (!userDetails) {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">User Creation Failed</h1>
          <p className="mb-4">
            We couldn't create your user record in the database. Please contact
            support.
          </p>
          <p>Error details: Unable to sync Supabase user with database</p>
          <p>Supabase ID: {user.id}</p>
          <p>Email: {user.email}</p>
        </div>
      );
    }

    let dashboardData: any = {};

    if (userDetails.role === "student") {
      dashboardData = await getStudentDashboardData(userDetails.id);
      dashboardData.user = {
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
      };
    } else if (userDetails.role === "teacher") {
      dashboardData = await getTeacherDashboardData(userDetails.id);
    } else if (userDetails.role === "parent") {
      dashboardData = await getParentDashboardData(userDetails.id);
    }

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Your Dashboard</h2>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p>Welcome, {userDetails.firstName}</p>

        {userDetails.role === "student" && (
          <Suspense fallback={<DashboardSkeleton />}>
            <StudentDashboard data={dashboardData} />
          </Suspense>
        )}

        {userDetails.role === "teacher" && (
          <Suspense fallback={<DashboardSkeleton />}>
            <TeacherDashboard data={dashboardData} />
          </Suspense>
        )}

        {userDetails.role === "parent" && (
          <Suspense fallback={<DashboardSkeleton />}>
            <ParentDashboard data={dashboardData} />
          </Suspense>
        )}

        {userDetails.role === "admin" && (
          <Suspense fallback={<DashboardSkeleton />}>
            <AdminDashboard />
          </Suspense>
        )}
      </div>
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return <div>Error loading dashboard. Please try refreshing.</div>;
  }
}

function StudentDashboard({ data }: { data: any }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <SidebarNav user={data.user} />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="space-y-8 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-md hover:shadow-lg transition duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  Enrolled Courses
                </CardTitle>
                <BookOpen className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent className="py-4">
                <div className="text-3xl font-bold text-primary tracking-wider">
                  {data.enrolledCourses}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  Study Groups
                </CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent className="py-4">
                <div className="text-3xl font-bold text-primary tracking-wider">
                  {data.clubs}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  Study Hours
                </CardTitle>
                <Clock className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent className="py-4">
                <div className="text-3xl font-bold text-primary tracking-wider">
                  {data.studyHours}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  Achievements
                </CardTitle>
                <Star className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent className="py-4">
                <div className="text-3xl font-bold text-primary tracking-wider">
                  {data.achievements}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="col-span-1 shadow-md hover:shadow-lg transition duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Academic Performance
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Your recent grades and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <div className="h-[350px] w-full rounded-md bg-muted/30 flex items-center justify-center text-muted-foreground italic">
                  <span>Chart Placeholder</span>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-1 shadow-md hover:shadow-lg transition duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Study Patterns
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Your study time distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <div className="h-[350px] w-full rounded-md bg-muted/30 flex items-center justify-center text-muted-foreground italic">
                  <span>Chart Placeholder</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="col-span-1 shadow-md hover:shadow-lg transition duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Resource Utilization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 py-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <div>Last Month</div>
                    <div className="font-semibold">75% Resources Used</div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted">
                    <div className="h-3 w-[75%] rounded-full bg-primary"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <div>This Month</div>
                    <div className="font-semibold">85% Resources Used</div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted">
                    <div className="h-3 w-[85%] rounded-full bg-primary"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-1 shadow-md hover:shadow-lg transition duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 py-4">
                <div className="space-y-4">
                  {data.upcomingDeadlines?.map(
                    (deadline: {
                      id: string;
                      title: string;
                      dueDate: string;
                    }) => (
                      <div
                        key={deadline.id}
                        className="flex items-center gap-5"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-md font-semibold">
                            {deadline.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(deadline.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Teaching Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.teachingCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Classes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.upcomingClasses.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Assignments
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingAssignments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Student Performance</CardTitle>
            <CardDescription>Average grades by course</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Student performance chart would go here */}
            <div className="h-[300px] w-full rounded-md bg-muted/30"></div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Student attendance rates</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Attendance chart would go here */}
            <div className="h-[300px] w-full rounded-md bg-muted/30"></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.upcomingClasses.map((session: any) => (
              <div key={session.id} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{session.course.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.sessionDate).toLocaleDateString()} at{" "}
                    {new Date(
                      `1970-01-01T${session.startTime}`
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ParentDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Children</h2>

      {data.children.map((relation: any) => (
        <Card key={relation.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle>{`${relation.student.firstName} ${relation.student.lastName}`}</CardTitle>
            <CardDescription>Student Performance Overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Enrolled Courses</h3>
                <p className="text-2xl font-bold">
                  {relation.student.studentCourses.length}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Average Grade</h3>
                <p className="text-2xl font-bold">
                  {relation.student.studentExams.length > 0
                    ? (
                        relation.student.studentExams.reduce(
                          (sum: number, exam: any) => sum + (exam.grade || 0),
                          0
                        ) / relation.student.studentExams.length
                      ).toFixed(1)
                    : "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Attendance Rate</h3>
                <p className="text-2xl font-bold">
                  {relation.student.attendanceRecords.length > 0
                    ? `${(
                        (relation.student.attendanceRecords.filter(
                          (record: any) => record.status === "present"
                        ).length /
                          relation.student.attendanceRecords.length) *
                        100
                      ).toFixed(0)}%`
                    : "N/A"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-medium">Recent Grades</h3>
              <div className="space-y-2">
                {relation.student.studentExams.slice(0, 3).map((exam: any) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{exam.exam.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {exam.exam.course.name}
                      </p>
                    </div>
                    <div className="text-lg font-bold">
                      {exam.grade !== null ? exam.grade : "Not graded"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-medium">Courses</h3>
              <div className="space-y-2">
                {relation.student.studentCourses
                  .slice(0, 3)
                  .map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-3 rounded-md border p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{enrollment.course.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.course.code}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">86</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Teachers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>System Usage</CardTitle>
            <CardDescription>User activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            {/* System usage chart would go here */}
            <div className="h-[300px] w-full rounded-md bg-muted/30"></div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Resource Allocation</CardTitle>
            <CardDescription>Distribution by department</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Resource allocation chart would go here */}
            <div className="h-[300px] w-full rounded-md bg-muted/30"></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <Users className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
