"use client"

import { useEffect, useState, useCallback } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Users, Key, Activity, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/components/theme-provider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchWithAuth } from "@/lib/api"

type RequestsPerMinuteData = {
  minute: string
  count: number
}

type UsersByApplicationData = {
  id: string
  name: string
  totalUsers: number
}

export default function AnalyticsPage() {
  const { toast } = useToast()
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [totalApplications, setTotalApplications] = useState<number | null>(null)
  const [requestsPerMinute, setRequestsPerMinute] = useState<RequestsPerMinuteData[]>([])
  const [usersByApplication, setUsersByApplication] = useState<UsersByApplicationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch Total Users
      const usersTotal: { total: number } = await fetchWithAuth("analytics/users/total")
      setTotalUsers(usersTotal.total)

      // Fetch Total Applications
      const appsTotal: { total: number } = await fetchWithAuth("analytics/applications/total")
      setTotalApplications(appsTotal.total)

      // Fetch Requests Per Minute
      const requestsData: RequestsPerMinuteData[] = await fetchWithAuth("analytics/requests/per-minute?period=120")
      // Format minute string for better display on chart
      const formattedRequests = requestsData.map((item) => ({
        ...item,
        minute: new Date(item.minute).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }))
      setRequestsPerMinute(formattedRequests)

      // Fetch Users By Application
      const usersByApp: UsersByApplicationData[] = await fetchWithAuth("analytics/users/by-application")
      setUsersByApplication(usersByApp)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics data")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load analytics data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">Deep dive into your authentication system's performance</p>
      </div>

      {error && <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">Error: {error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{totalUsers !== null ? totalUsers.toLocaleString() : "N/A"}</div>
            )}
            <p className="text-xs text-muted-foreground">Overall registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {totalApplications !== null ? totalApplications.toLocaleString() : "N/A"}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Registered client applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Requests/Min</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {requestsPerMinute.length > 0
                  ? (requestsPerMinute.reduce((sum, item) => sum + item.count, 0) / requestsPerMinute.length).toFixed(1)
                  : "N/A"}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Average over last 2 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Application</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {usersByApplication.length > 0
                  ? usersByApplication.reduce((prev, current) =>
                      prev.totalUsers > current.totalUsers ? prev : current,
                    ).name
                  : "N/A"}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Application with most users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requests Per Minute</CardTitle>
            <CardDescription>Authentication requests over the last 120 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : requestsPerMinute.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={requestsPerMinute}
                    margin={{
                      top: 5,
                      right: 20,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                    <XAxis
                      dataKey="minute"
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No request data available.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users By Application</CardTitle>
            <CardDescription>Distribution of users across registered applications</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : usersByApplication.length > 0 ? (
              <div className="h-[300px] w-full flex flex-col md:flex-row items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usersByApplication}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalUsers"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {usersByApplication.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                        color: isDark ? "#f9fafb" : "#111827",
                      }}
                      formatter={(value, name, props) => [`${value} users`, props.payload.name]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full md:w-1/2 max-h-[200px] overflow-y-auto mt-4 md:mt-0 md:ml-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Application</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersByApplication.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>{app.name}</TableCell>
                          <TableCell className="text-right">{app.totalUsers}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No application user data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
