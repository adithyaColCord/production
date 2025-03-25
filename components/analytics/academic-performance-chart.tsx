"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface AcademicPerformanceChartProps {
  data: {
    name: string
    course: string
    grade: number
    date: string
  }[]
}

export function AcademicPerformanceChart({ data }: AcademicPerformanceChartProps) {
  // Group data by course
  const courseMap = new Map<string, any[]>()

  data.forEach((item) => {
    if (!courseMap.has(item.course)) {
      courseMap.set(item.course, [])
    }
    courseMap.get(item.course)?.push(item)
  })

  // Create a config object for each course
  const config: Record<string, { label: string; color: string }> = {}
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

  Array.from(courseMap.keys()).forEach((course, index) => {
    config[course] = {
      label: course,
      color: `hsl(${colors[index % colors.length]})`,
    }
  })

  // Prepare data for the chart
  const chartData = data.reduce((acc, item) => {
    const existingItem = acc.find((i) => i.name === item.name)

    if (existingItem) {
      existingItem[item.course] = item.grade
    } else {
      const newItem: any = { name: item.name, date: item.date }
      newItem[item.course] = item.grade
      acc.push(newItem)
    }

    return acc
  }, [] as any[])

  return (
    <ChartContainer config={config}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />

          {Array.from(courseMap.keys()).map((course, index) => (
            <Line
              key={course}
              type="monotone"
              dataKey={course}
              stroke={`var(--color-${course.replace(/\s+/g, "-").toLowerCase()})`}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

