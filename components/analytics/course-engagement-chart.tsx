"use client"

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import type { UserRole } from "@prisma/client"

interface CourseEngagementChartProps {
  data: any[]
  userRole: UserRole
}

export function CourseEngagementChart({ data, userRole }: CourseEngagementChartProps) {
  // Transform data for radar chart
  const transformedData = data.map((course) => {
    if (userRole === "student") {
      return {
        subject: course.name,
        Assignments: Math.round(course.assignments),
        Attendance: Math.round(course.attendance),
        "Study Time": Math.min(100, Math.round(course.studyTime / 60)), // Convert minutes to hours, max 100%
      }
    } else {
      return {
        subject: course.name,
        "Assignment Completion": Math.round(course.assignments),
        "Attendance Rate": Math.round(course.attendance),
        "Student Count": Math.min(100, course.students * 5), // Scale for visualization
      }
    }
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={transformedData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={30} domain={[0, 100]} />

        {userRole === "student" ? (
          <>
            <Radar
              name="Assignments"
              dataKey="Assignments"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.6}
            />
            <Radar
              name="Attendance"
              dataKey="Attendance"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.6}
            />
            <Radar
              name="Study Time"
              dataKey="Study Time"
              stroke="hsl(var(--chart-3))"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.6}
            />
          </>
        ) : (
          <>
            <Radar
              name="Assignment Completion"
              dataKey="Assignment Completion"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.6}
            />
            <Radar
              name="Attendance Rate"
              dataKey="Attendance Rate"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.6}
            />
            <Radar
              name="Student Count"
              dataKey="Student Count"
              stroke="hsl(var(--chart-3))"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.6}
            />
          </>
        )}

        <Tooltip />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  )
}

