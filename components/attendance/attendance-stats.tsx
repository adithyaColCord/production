"use client"

interface AttendanceStatsProps {
  stats: {
    present: number
    late: number
    absent: number
  }
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div className="space-y-2">
        <div className="text-3xl font-bold text-green-500">{Math.round(stats.present)}%</div>
        <div className="text-sm text-muted-foreground">Present</div>
      </div>
      <div className="space-y-2">
        <div className="text-3xl font-bold text-yellow-500">{Math.round(stats.late)}%</div>
        <div className="text-sm text-muted-foreground">Late</div>
      </div>
      <div className="space-y-2">
        <div className="text-3xl font-bold text-red-500">{Math.round(stats.absent)}%</div>
        <div className="text-sm text-muted-foreground">Absent</div>
      </div>
    </div>
  )
}

