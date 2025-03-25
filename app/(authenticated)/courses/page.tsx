import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function CoursesPage() {
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
    },
  })

  if (!user) {
    return null
  }

  // Get departments for filtering
  const departments = await prisma.department.findMany({
    orderBy: {
      name: "asc",
    },
  })

  // Get courses based on user role
  let courses = []

  if (user.role === "student") {
    // Get courses the student is enrolled in
    const enrollments = await prisma.studentCourse.findMany({
      where: {
        studentId: user.id,
      },
      include: {
        course: {
          include: {
            department: true,
            teachers: {
              include: {
                teacher: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    courses = enrollments.map((enrollment) => enrollment.course)
  } else if (user.role === "teacher") {
    // Get courses the teacher is teaching
    const teachings = await prisma.teacherCourse.findMany({
      where: {
        teacherId: user.id,
      },
      include: {
        course: {
          include: {
            department: true,
            students: {
              select: {
                _count: true,
              },
            },
          },
        },
      },
    })

    courses = teachings.map((teaching) => teaching.course)
  } else {
    // For admin and parents, get all courses
    courses = await prisma.course.findMany({
      include: {
        department: true,
        teachers: {
          include: {
            teacher: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        students: {
          select: {
            _count: true,
          },
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Courses</h1>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Courses</TabsTrigger>
          {departments.map((department) => (
            <TabsTrigger key={department.id} value={department.code}>
              {department.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} userRole={user.role} />
            ))}
          </div>
        </TabsContent>

        {departments.map((department) => (
          <TabsContent key={department.id} value={department.code} className="mt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses
                .filter((course) => course.department.code === department.code)
                .map((course) => (
                  <CourseCard key={course.id} course={course} userRole={user.role} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function CourseCard({ course, userRole }: { course: any; userRole: string }) {
  const getTeacherName = () => {
    if (course.teachers && course.teachers.length > 0) {
      const teacher = course.teachers[0].teacher
      return `${teacher.firstName} ${teacher.lastName}`
    }
    return "No instructor assigned"
  }

  const getStudentCount = () => {
    if (course.students) {
      return course.students.length
    }
    return 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{course.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{course.code}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{course.department.name}</span>
          </div>
          <p className="text-sm">
            {userRole === "teacher" ? `${getStudentCount()} Students` : `Instructor: ${getTeacherName()}`}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/courses/${course.id}`}>View Course</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

