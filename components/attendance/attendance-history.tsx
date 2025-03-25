"use client"

import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import type { UserRole } from "@prisma/client"

interface AttendanceHistoryProps {
  records: any[]
  userRole: UserRole
}

export function AttendanceHistory({ records, userRole }: AttendanceHistoryProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500">Present</Badge>
      case "late":
        return <Badge className="bg-yellow-500">Late</Badge>
      case "absent":
        return <Badge className="bg-red-500">Absent</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {records.length === 0 ? (
        <p className="text-center text-muted-foreground">No attendance records found</p>
      ) : (
        records.map((record) => (
          <div key={record.id} className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-1">
              <div className="font-medium">{record.session.course.name}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(record.session.sessionDate), "PPP")} at{" "}
                {format(new Date(`1970-01-01T${record.session.startTime}`), "p")}
              </div>
            </div>
            {getStatusBadge(record.status)}
          </div>
        ))
      )}
    </div>
  )
}

