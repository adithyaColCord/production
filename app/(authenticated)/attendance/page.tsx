import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QRScanner } from "@/components/attendance/qr-scanner"
import { AttendanceStats } from "@/components/attendance/attendance-stats"
import { AttendanceHistory } from "@/components/attendance/attendance-history"

export default async function AttendancePage() {
  const supabase = await createServerSupabaseClient()

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

  // Get attendance statistics
  const attendanceStats = await prisma.attendanceRecord.groupBy({
    by: ["status"],
    where: {
      studentId: user.role === "student" ? user.id : undefined,
      session: {
        teacherId: user.role === "teacher" ? user.id : undefined,
      },
    },
    _count: {
      status: true,
    },
  })

  const totalRecords = attendanceStats.reduce((sum, stat) => sum + stat._count.status, 0)

  const stats = {
    present:
      ((attendanceStats.find((stat) => stat.status === "present")?._count.status || 0) / (totalRecords || 1)) * 100,
    late: ((attendanceStats.find((stat) => stat.status === "late")?._count.status || 0) / (totalRecords || 1)) * 100,
    absent:
      ((attendanceStats.find((stat) => stat.status === "absent")?._count.status || 0) / (totalRecords || 1)) * 100,
  }

  // Get attendance history
  const attendanceHistory = await prisma.attendanceRecord.findMany({
    where: {
      studentId: user.role === "student" ? user.id : undefined,
      session: {
        teacherId: user.role === "teacher" ? user.id : undefined,
      },
    },
    orderBy: {
      session: {
        sessionDate: "desc",
      },
    },
    take: 10,
    include: {
      session: {
        include: {
          course: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {user.role === "student" && (
          <Card>
            <CardHeader>
              <CardTitle>QR Attendance</CardTitle>
              <CardDescription>Scan the QR code displayed in your class to mark your attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <QRScanner userId={user.id} />
            </CardContent>
          </Card>
        )}

        {user.role === "teacher" && (
          <Card>
            <CardHeader>
              <CardTitle>Generate QR Code</CardTitle>
              <CardDescription>Generate a QR code for your class session</CardDescription>
            </CardHeader>
            <CardContent>
              {/* QR Code generator component would go here */}
              <div className="h-[300px] w-full rounded-md bg-muted/30 flex items-center justify-center">
                QR Code Generator
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Attendance Statistics</CardTitle>
            <CardDescription>Your attendance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceStats stats={stats} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your recent attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceHistory records={attendanceHistory} userRole={user.role} />
        </CardContent>
      </Card>
    </div>
  )
}

