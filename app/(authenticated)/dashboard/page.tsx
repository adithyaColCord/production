import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { BookOpen, Clock, Star, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

async function getStudentDashboardData(userId: string) {
  const enrolledCourses = await prisma.studentCourse.count({
    where: { studentId: userId },
  })

  const clubs = await prisma.clubMember.count({
    where: { studentId: userId },
  })

  const studyHours = await prisma.studySession.aggregate({
    where: {
      studentId: userId,
      endTime: { not: null },
    },
    _sum: { duration: true },
  })

  const achievements = await prisma.studentAchievement.count({
    where: { studentId: userId },
  })

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
  })

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
  })

  return {
    enrolledCourses,
    clubs,
    studyHours: studyHours._sum.duration || 0,
    achievements,
    recentGrades,
    upcomingDeadlines,
  }
}

async function getTeacherDashboardData(userId: string) {
  const teachingCourses = await prisma.teacherCourse.count({
    where: { teacherId: userId },
  })

  // Fix distinct count query
  const totalStudents = (await prisma.studentCourse.findMany({
    where: {
      course: {
        teachers: {
          some: { teacherId: userId },
        },
      },
    },
    distinct: ["studentId"],
    select: { studentId: true },
  })).length

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
  })

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
  })

  return {
    teachingCourses,
    totalStudents,
    upcomingClasses,
    pendingAssignments,
  }
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
  })

  return { children }
}

export default async function DashboardPage() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return <div>Not authenticated</div>
    }

    let userDetails = null
    try {
      const availableModels = Object.keys(prisma).filter((key) => 
        typeof prisma[key as keyof typeof prisma] === 'object' && 
        prisma[key as keyof typeof prisma] !== null &&
        typeof (prisma[key as keyof typeof prisma] as any).findUnique === 'function'
      )
      
      console.log("Available Prisma models:", availableModels)
      
      if (prisma.user && typeof prisma.user.findUnique === 'function') {
        userDetails = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
          },
        })
      } else {
        console.warn("No valid user model found in Prisma client")
        console.warn("Please check your schema.prisma file for the correct model name")
      }
    } catch (prismaError) {
      console.error("Prisma query error:", prismaError)
    }

    if (!userDetails) {
      return <div>User details unavailable</div>
    }

    let dashboardData: any = {}

    if (userDetails.role === "student") {
      dashboardData = await getStudentDashboardData(userDetails.id)
    } else if (userDetails.role === "teacher") {
      dashboardData = await getTeacherDashboardData(userDetails.id)
    } else if (userDetails.role === "parent") {
      dashboardData = await getParentDashboardData(userDetails.id)
    }

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p>Welcome, {user.email}</p>

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
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    return <div>Error loading dashboard. Please try refreshing.</div>
  }
}

function StudentDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.enrolledCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.clubs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.studyHours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.achievements}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Academic Performance</CardTitle>
            <CardDescription>Your recent grades and performance</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Academic performance chart would go here */}
            <div className="h-[300px] w-full rounded-md bg-muted/30"></div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Study Patterns</CardTitle>
            <CardDescription>Your study time distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Study patterns chart would go here */}
            <div className="h-[300px] w-full rounded-md bg-muted/30"></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div>Last Month</div>
                <div>75% Resources Used</div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 w-[75%] rounded-full bg-primary"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div>This Month</div>
                <div>85% Resources Used</div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 w-[85%] rounded-full bg-primary"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.upcomingDeadlines.map((deadline: any) => (
                <div key={deadline.id} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{deadline.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(deadline.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TeacherDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teaching Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.teachingCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.upcomingClasses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
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
                    {new Date(`1970-01-01T${session.startTime}`).toLocaleTimeString([], {
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
  )
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
                <p className="text-2xl font-bold">{relation.student.studentCourses.length}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Average Grade</h3>
                <p className="text-2xl font-bold">
                  {relation.student.studentExams.length > 0
                    ? (
                        relation.student.studentExams.reduce((sum: number, exam: any) => sum + (exam.grade || 0), 0) /
                        relation.student.studentExams.length
                      ).toFixed(1)
                    : "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Attendance Rate</h3>
                <p className="text-2xl font-bold">
                  {relation.student.attendanceRecords.length > 0
                    ? `${(
                        (relation.student.attendanceRecords.filter((record: any) => record.status === "present")
                          .length /
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
                  <div key={exam.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{exam.exam.title}</p>
                      <p className="text-sm text-muted-foreground">{exam.exam.course.name}</p>
                    </div>
                    <div className="text-lg font-bold">{exam.grade !== null ? exam.grade : "Not graded"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-medium">Courses</h3>
              <div className="space-y-2">
                {relation.student.studentCourses.slice(0, 3).map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-center gap-3 rounded-md border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{enrollment.course.name}</p>
                      <p className="text-sm text-muted-foreground">{enrollment.course.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
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
  )
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
  )
}

