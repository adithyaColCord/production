import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AcademicPerformanceChart } from "@/components/analytics/academic-performance-chart"
import { AttendanceChart } from "@/components/analytics/attendance-chart"
import { StudyTimeChart } from "@/components/analytics/study-time-chart"
import { CourseEngagementChart } from "@/components/analytics/course-engagement-chart"

export default async function AnalyticsPage() {
  const supabase = await reateServerSupabaseClient()

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

  // Get analytics data based on user role
  let academicData = []
  let attendanceData = []
  let studyTimeData = []
  const courseEngagementData = []

  if (user.role === "student") {
    // Get student's exam grades
    const exams = await prisma.studentExam.findMany({
      where: {
        studentId: user.id,
        grade: { not: null },
      },
      orderBy: {
        exam: {
          examDate: "asc",
        },
      },
      include: {
        exam: {
          include: {
            course: true,
          },
        },
      },
    })

    academicData = exams.map((exam) => ({
      name: exam.exam.title,
      course: exam.exam.course.name,
      grade: exam.grade,
      date: new Date(exam.exam.examDate).toLocaleDateString(),
    }))

    // Get student's attendance records
    const attendance = await prisma.attendanceRecord.findMany({
      where: {
        studentId: user.id,
      },
      include: {
        session: {
          include: {
            course: true,
          },
        },
      },
    })

    // Group by status
    const attendanceByStatus = attendance.reduce(
      (acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    attendanceData = [
      { name: "Present", value: attendanceByStatus["present"] || 0 },
      { name: "Late", value: attendanceByStatus["late"] || 0 },
      { name: "Absent", value: attendanceByStatus["absent"] || 0 },
    ]

    // Get student's study sessions
    const studySessions = await prisma.studySession.findMany({
      where: {
        studentId: user.id,
        duration: { not: null },
      },
      orderBy: {
        startTime: "asc",
      },
      include: {
        course: true,
      },
    })

    // Group by day of week
    const studyTimeByDay = studySessions.reduce(
      (acc, session) => {
        const day = new Date(session.startTime).toLocaleDateString("en-US", { weekday: "short" })
        acc[day] = (acc[day] || 0) + (session.duration || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    studyTimeData = daysOfWeek.map((day) => ({
      name: day,
      minutes: studyTimeByDay[day] || 0,
    }))

    // Get course engagement data
    const courseEngagement = await prisma.studentCourse.findMany({
      where: {
        studentId: user.id,
      },
      include: {
        course: true,
      },
    })

    // Calculate engagement metrics for each course
    for (const enrollment of courseEngagement) {
      const courseId = enrollment.courseId

      // Count assignments submitted
      const assignmentsSubmitted = await prisma.studentAssignment.count({
        where: {
          studentId: user.id,
          assignment: {
            courseId,
          },
          submittedAt: { not: null },
        },
      })

      // Count total assignments
      const totalAssignments = await prisma.assignment.count({
        where: {
          courseId,
        },
      })

      // Count attendance records
      const attendanceCount = await prisma.attendanceRecord.count({
        where: {
          studentId: user.id,
          session: {
            courseId,
          },
          status: "present",
        },
      })

      // Count total attendance sessions
      const totalSessions = await prisma.attendanceSession.count({
        where: {
          courseId,
        },
      })

      // Calculate study time for this course
      const studyTime = await prisma.studySession.aggregate({
        where: {
          studentId: user.id,
          courseId,
          duration: { not: null },
        },
        _sum: {
          duration: true,
        },
      })

      courseEngagementData.push({
        name: enrollment.course.name,
        assignments: totalAssignments > 0 ? (assignmentsSubmitted / totalAssignments) * 100 : 0,
        attendance: totalSessions > 0 ? (attendanceCount / totalSessions) * 100 : 0,
        studyTime: studyTime._sum.duration || 0,
      })
    }
  } else if (user.role === "teacher") {
    // Get courses taught by the teacher
    const courses = await prisma.teacherCourse.findMany({
      where: {
        teacherId: user.id,
      },
      include: {
        course: true,
      },
    })

    // Get average grades for each course
    for (const teaching of courses) {
      const courseId = teaching.courseId

      // Get all exams for this course
      const exams = await prisma.exam.findMany({
        where: {
          courseId,
        },
        include: {
          studentExams: {
            where: {
              grade: { not: null },
            },
          },
        },
      })

      // Calculate average grade for each exam
      const examAverages = exams.map((exam) => {
        const grades = exam.studentExams.map((se) => se.grade || 0)
        const average = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0

        return {
          name: exam.title,
          course: teaching.course.name,
          average,
          date: new Date(exam.examDate).toLocaleDateString(),
        }
      })

      academicData.push(...examAverages)
    }

    // Get attendance data for teacher's courses
    for (const teaching of courses) {
      const courseId = teaching.courseId

      // Get all attendance sessions for this course
      const sessions = await prisma.attendanceSession.findMany({
        where: {
          courseId,
          teacherId: user.id,
        },
        include: {
          records: true,
        },
      })

      // Count attendance by status
      let present = 0
      let late = 0
      let absent = 0

      sessions.forEach((session) => {
        session.records.forEach((record) => {
          if (record.status === "present") present++
          else if (record.status === "late") late++
          else if (record.status === "absent") absent++
        })
      })

      attendanceData.push(
        { name: "Present", value: present },
        { name: "Late", value: late },
        { name: "Absent", value: absent },
      )
    }

    // Get course engagement data
    for (const teaching of courses) {
      const courseId = teaching.courseId

      // Count total students
      const totalStudents = await prisma.studentCourse.count({
        where: {
          courseId,
        },
      })

      // Count assignments submitted
      const assignmentsSubmitted = await prisma.studentAssignment.count({
        where: {
          assignment: {
            courseId,
          },
          submittedAt: { not: null },
        },
      })

      // Count total assignments
      const totalAssignments = await prisma.assignment.count({
        where: {
          courseId,
        },
      })

      // Calculate submission rate
      const submissionRate =
        totalStudents * totalAssignments > 0 ? (assignmentsSubmitted / (totalStudents * totalAssignments)) * 100 : 0

      // Count attendance records
      const attendanceCount = await prisma.attendanceRecord.count({
        where: {
          session: {
            courseId,
          },
          status: "present",
        },
      })

      // Count total attendance sessions
      const totalSessions = await prisma.attendanceSession.count({
        where: {
          courseId,
        },
      })

      // Calculate attendance rate
      const attendanceRate =
        totalStudents * totalSessions > 0 ? (attendanceCount / (totalStudents * totalSessions)) * 100 : 0

      courseEngagementData.push({
        name: teaching.course.name,
        assignments: submissionRate,
        attendance: attendanceRate,
        students: totalStudents,
      })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      <Tabs defaultValue="academic">
        <TabsList className="mb-4">
          <TabsTrigger value="academic">Academic Performance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          {user.role === "student" && <TabsTrigger value="studyTime">Study Time</TabsTrigger>}
          <TabsTrigger value="engagement">Course Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Academic Performance</CardTitle>
              <CardDescription>
                {user.role === "student" ? "Your grades over time" : "Average class grades over time"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <AcademicPerformanceChart data={academicData} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>
                {user.role === "student" ? "Your attendance record" : "Class attendance statistics"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <AttendanceChart data={attendanceData} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === "student" && (
          <TabsContent value="studyTime" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Study Time Distribution</CardTitle>
                <CardDescription>Your study time by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <StudyTimeChart data={studyTimeData} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="engagement" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Course Engagement</CardTitle>
              <CardDescription>
                {user.role === "student" ? "Your engagement metrics by course" : "Student engagement metrics by course"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <CourseEngagementChart data={courseEngagementData} userRole={user.role} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

