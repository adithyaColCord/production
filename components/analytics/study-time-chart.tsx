"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface StudyTimeChartProps {
  data: {
    name: string
    minutes: number
  }[]
}

export function StudyTimeChart({ data }: StudyTimeChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
        <Tooltip
          formatter={(value: number) => {
            const hours = Math.floor(value / 60)
            const minutes = value % 60
            return [`${hours}h ${minutes}m`, "Study Time"]
          }}
        />
        <Legend />
        <Bar dataKey="minutes" name="Study Time" fill="hsl(var(--chart-1))" />
      </BarChart>
    </ResponsiveContainer>
  )
}

