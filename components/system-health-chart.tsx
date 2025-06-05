"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "@/components/theme-provider"

type ChartData = {
  name: string // e.g., "00:00"
  count: number // New data structure for requests per minute
}

interface SystemHealthChartProps {
  data: ChartData[] // Now accepts data as a prop
}

export function SystemHealthChart({ data }: SystemHealthChartProps) {
  // Accept data prop
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data} // Use the passed data
          margin={{
            top: 5,
            right: 20,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
          <XAxis
            dataKey="name"
            tick={{ fill: isDark ? "#9ca3af" : "#6b7280" }}
            axisLine={{ stroke: isDark ? "#374151" : "#e5e7eb" }}
          />
          <YAxis
            tick={{ fill: isDark ? "#9ca3af" : "#6b7280" }}
            axisLine={{ stroke: isDark ? "#374151" : "#e5e7eb" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              borderColor: isDark ? "#374151" : "#e5e7eb",
              color: isDark ? "#f9fafb" : "#111827",
            }}
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />
          <Bar dataKey="count" fill="#4f46e5" name="Requests" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
