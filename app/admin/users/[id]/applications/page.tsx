"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, Key, Plus, Search, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getToken } from "@/lib/authCore"
import { toast } from "@/components/ui/use-toast"

// Define types based on your API response
type Application = {
  id: string
  name: string
  description?: string
  type?: string
  status?: "Active" | "Development" | "Inactive"
}

type UserApplication = {
  id: string
  name: string
}

type User = {
  id: string
  name: string
  email: string
  status: "Active" | "Inactive" | "Locked" | "Pending"
  roles: string[]
  applications: UserApplication[]
  lastLogin?: string | null
  passwordLastChanged?: string | null
}

type UsersResponse = {
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  items: User[]
}

type ApplicationsResponse = {
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  items: Application[]
}

export default function UserApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  // State
  const [user, setUser] = useState<User | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [availableApplications, setAvailableApplications] = useState<Application[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Fetch user and applications data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get the token
        const token = getToken()
        if (!token) {
          router.push(`/login?redirect_to=${encodeURIComponent(`/admin/users/${userId}/applications`)}`)
          return
        }

        // Fetch user data
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user: ${userResponse.statusText}`)
        }

        const userData: User = await userResponse.json()
        setUser(userData)

        // Fetch all applications
        const applicationsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications?limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!applicationsResponse.ok) {
          throw new Error(`Failed to fetch applications: ${applicationsResponse.statusText}`)
        }

        const applicationsData: ApplicationsResponse = await applicationsResponse.json()
        setApplications(applicationsData.items)

        // Filter available applications (those not already assigned to the user)
        const userAppIds = userData.applications.map((app) => app.id)
        const availableApps = applicationsData.items.filter((app) => !userAppIds.includes(app.id))
        setAvailableApplications(availableApps)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId, router])

  // Filter applications based on search query
  const filteredUserApplications =
    user?.applications.filter((app) => app.name.toLowerCase().includes(searchQuery.toLowerCase())) || []

  const filteredAvailableApplications = availableApplications.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Handle adding an application to the user
  const handleAddApplication = async (applicationId: string) => {
    setIsActionLoading(true)
    try {
      const token = getToken()
      if (!token) {
        router.push(`/login?redirect_to=${encodeURIComponent(`/admin/users/${userId}/applications`)}`)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add application: ${response.statusText}`)
      }

      // Find the application that was added
      const addedApp = applications.find((app) => app.id === applicationId)
      if (addedApp && user) {
        // Update the user's applications list
        setUser({
          ...user,
          applications: [...user.applications, { id: addedApp.id, name: addedApp.name }],
        })

        // Remove the application from available applications
        setAvailableApplications(availableApplications.filter((app) => app.id !== applicationId))
      }

      toast({
        title: "Success",
        description: "Application added successfully",
      })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding application:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add application",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  // Handle removing an application from the user
  const handleRemoveApplication = async (applicationId: string) => {
    if (!window.confirm("Are you sure you want to remove this application from the user?")) {
      return
    }

    setIsActionLoading(true)
    try {
      const token = getToken()
      if (!token) {
        router.push(`/login?redirect_to=${encodeURIComponent(`/admin/users/${userId}/applications`)}`)
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/applications/${applicationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to remove application: ${response.statusText}`)
      }

      if (user) {
        // Update the user's applications list
        const updatedApplications = user.applications.filter((app) => app.id !== applicationId)
        setUser({
          ...user,
          applications: updatedApplications,
        })

        // Add the application back to available applications
        const removedApp = applications.find((app) => app.id === applicationId)
        if (removedApp) {
          setAvailableApplications([...availableApplications, removedApp])
        }
      }

      toast({
        title: "Success",
        description: "Application removed successfully",
      })
    } catch (error) {
      console.error("Error removing application:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove application",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  // Loading state
  if (isLoading || !user) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get application details for a user application
  const getApplicationDetails = (userApp: UserApplication): Application => {
    const appDetails = applications.find((app) => app.id === userApp.id)
    return (
      appDetails || {
        id: userApp.id,
        name: userApp.name,
        type: "Unknown",
        status: "Active",
      }
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" className="w-fit" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Applications</h1>
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${user.name.charAt(0)}`} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-muted-foreground">
              Manage applications for <span className="font-medium text-foreground">{user.name}</span>
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Assigned Applications</CardTitle>
              <CardDescription>Applications this user has access to</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={isActionLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Application
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Application</DialogTitle>
                  <DialogDescription>Select an application to assign to {user.name}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search applications..."
                      className="pl-8 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto border rounded-md">
                    {filteredAvailableApplications.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAvailableApplications.map((app) => (
                            <TableRow key={app.id}>
                              <TableCell>
                                <div className="font-medium">{app.name}</div>
                                <div className="text-sm text-muted-foreground">{app.description}</div>
                              </TableCell>
                              <TableCell>{app.type || "N/A"}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddApplication(app.id)}
                                  disabled={isActionLoading}
                                >
                                  <Plus className="h-4 w-4" />
                                  <span className="sr-only">Add</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">No available applications found</div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isActionLoading}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isActionLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredUserApplications.length > 0 ? (
                    filteredUserApplications.map((userApp) => {
                      const app = getApplicationDetails(userApp)
                      return (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div className="font-medium">{app.name}</div>
                            <div className="text-sm text-muted-foreground">{app.description || "No description"}</div>
                          </TableCell>
                          <TableCell>{app.type || "N/A"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                app.status === "Active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : app.status === "Development"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                              }
                            >
                              {app.status === "Active" && <Check className="mr-1 h-3 w-3" />}
                              {app.status || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveApplication(app.id)}
                              disabled={isActionLoading}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Key className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No applications assigned to this user</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddDialogOpen(true)}
                            disabled={isActionLoading}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Application
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
