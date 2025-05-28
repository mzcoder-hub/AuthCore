"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "@/components/theme-provider"

export function SystemHealthChart() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [data, setData] = useState([
    {
      name: "00:00",
      logins: 65,
      tokens: 78,
      errors: 3,
    },
    {
      name: "04:00",
      logins: 42,
      tokens: 55,
      errors: 1,
    },
    {
      name: "08:00",
      logins: 130,
      tokens: 142,
      errors: 5,
    },
    {
      name: "12:00",
      logins: 180,
      tokens: 195,
      errors: 8,
    },
    {
      name: "16:00",
      logins: 220,
      tokens: 235,
      errors: 12,
    },
    {
      name: "20:00",
      logins: 175,
      tokens: 190,
      errors: 7,
    },
  ])

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        const newData = [...prevData]
        const lastItem = newData[newData.length - 1]

        // Randomly adjust values
        const logins = Math.max(0, lastItem.logins + Math.floor(Math.random() * 20) - 10)
        const tokens = logins + Math.floor(Math.random() * 15)
        const errors = Math.max(0, Math.floor(Math.random() * 3))

        // Update the last item
        newData[newData.length - 1] = {
          ...lastItem,
          logins,
          tokens,
          errors,
        }

        return newData
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
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
          <Bar dataKey="logins" fill="#4f46e5" name="Logins" />
          <Bar dataKey="tokens" fill="#0ea5e9" name="Tokens Issued" />
          <Bar dataKey="errors" fill="#ef4444" name="Errors" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
