"use client"

import Link from "next/link"
import { ArrowUpRight, Key, Shield, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecentActivityTable } from "@/components/recent-activity-table"
import { SystemHealthChart } from "@/components/system-health-chart"
import { useEffect, useState, useCallback } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"

type RequestsPerMinuteData = {
  minute: string
  count: number
}

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [totalApplications, setTotalApplications] = useState<number | null>(null)
  const [requestsPerMinute, setRequestsPerMinute] = useState<RequestsPerMinuteData[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const fetchDashboardStats = useCallback(async () => {
    setLoadingStats(true)
    setStatsError(null)
    try {
      const usersTotal: { total: number } = await fetchWithAuth("analytics/users/total")
      setTotalUsers(usersTotal.total)

      const appsTotal: { total: number } = await fetchWithAuth("analytics/applications/total")
      setTotalApplications(appsTotal.total)

      const requestsData: RequestsPerMinuteData[] = await fetchWithAuth("analytics/requests/per-minute?period=120")
      const formattedRequests = requestsData.map((item) => ({
        ...item,
        name: new Date(item.minute).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }))
      setRequestsPerMinute(formattedRequests)
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : "Failed to fetch dashboard stats")
      console.error("Error fetching dashboard stats:", err)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your authentication system</p>
      </div>

      {statsError && (
        <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">Error: {statsError}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{totalUsers !== null ? totalUsers.toLocaleString() : "N/A"}</div>
            )}
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,429</div>
            <p className="text-xs text-muted-foreground">+5% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {totalApplications !== null ? totalApplications.toLocaleString() : "N/A"}
              </div>
            )}
            <p className="text-xs text-muted-foreground">+2 new this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Authentication Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2%</div>
            <p className="text-xs text-muted-foreground">+0.5% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Authentication requests and system performance</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : requestsPerMinute.length > 0 ? (
              <SystemHealthChart data={requestsPerMinute} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No system health data available.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/admin/users/create">
              <Button variant="outline" className="w-full justify-between">
                <span>Create User</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/applications/create">
              <Button variant="outline" className="w-full justify-between">
                <span>Register Application</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-between">
                <span>Manage Users</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/settings/security">
              <Button variant="outline" className="w-full justify-between">
                <span>Security Settings</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest authentication events and admin actions</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Tabs defaultValue="auth">
            <TabsList className="mx-4 sm:mx-0">
              <TabsTrigger value="auth">Authentication</TabsTrigger>
              <TabsTrigger value="admin">Admin Actions</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
            </TabsList>
            <TabsContent value="auth" className="mt-4">
              <div className="overflow-auto">
                <RecentActivityTable
                  data={[
                    {
                      id: "1",
                      event: "Login Success",
                      user: "john.doe@example.com",
                      application: "Customer Portal",
                      ip: "192.168.1.1",
                      time: "2023-05-09T14:30:00",
                    },
                    {
                      id: "2",
                      event: "Token Refresh",
                      user: "jane.smith@example.com",
                      application: "Admin Dashboard",
                      ip: "192.168.1.2",
                      time: "2023-05-09T14:25:00",
                    },
                    {
                      id: "3",
                      event: "Login Success",
                      user: "robert.johnson@example.com",
                      application: "Mobile App",
                      ip: "192.168.1.3",
                      time: "2023-05-09T14:20:00",
                    },
                    {
                      id: "4",
                      event: "Logout",
                      user: "emily.davis@example.com",
                      application: "Customer Portal",
                      ip: "192.168.1.4",
                      time: "2023-05-09T14:15:00",
                    },
                    {
                      id: "5",
                      event: "Password Changed",
                      user: "michael.wilson@example.com",
                      application: "Financial Dashboard",
                      ip: "192.168.1.5",
                      time: "2023-05-09T14:10:00",
                    },
                  ]}
                />
              </div>
            </TabsContent>
            <TabsContent value="admin" className="mt-4">
              <div className="overflow-auto">
                <RecentActivityTable
                  data={[
                    {
                      id: "1",
                      event: "User Created",
                      user: "admin@example.com",
                      application: "Admin Console",
                      ip: "192.168.1.1",
                      time: "2023-05-09T13:30:00",
                    },
                    {
                      id: "2",
                      event: "Role Modified",
                      user: "admin@example.com",
                      application: "Admin Console",
                      ip: "192.168.1.1",
                      time: "2023-05-09T13:25:00",
                    },
                    {
                      id: "3",
                      event: "Application Created",
                      user: "admin@example.com",
                      application: "Admin Console",
                      ip: "192.168.1.1",
                      time: "2023-05-09T12:20:00",
                    },
                  ]}
                />
              </div>
            </TabsContent>
            <TabsContent value="errors" className="mt-4">
              <div className="overflow-auto">
                <RecentActivityTable
                  data={[
                    {
                      id: "1",
                      event: "Login Failed",
                      user: "unknown@example.com",
                      application: "Customer Portal",
                      ip: "192.168.1.100",
                      time: "2023-05-09T11:30:00",
                    },
                    {
                      id: "2",
                      event: "Invalid Token",
                      user: "jane.smith@example.com",
                      application: "Mobile App",
                      ip: "192.168.1.2",
                      time: "2023-05-09T10:25:00",
                    },
                  ]}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
