"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, Key, Plus, Search, X } from "lucide-react"

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchUsers, assignApplicationToUser, removeApplicationFromUser } from "@/lib/redux/slices/usersSlice"
import {
  fetchApplications,
  assignUserToApplication,
  removeUserFromApplication,
} from "@/lib/redux/slices/applicationsSlice"
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

export default function UserApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useAppDispatch()

  const userId = params.id as string
  const { users, loading: usersLoading } = useAppSelector((state) => state.users)
  const { applications, loading: appsLoading } = useAppSelector((state) => state.applications)

  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [availableApplications, setAvailableApplications] = useState<typeof applications>([])

  const user = users.find((u) => u.id === userId)

  useEffect(() => {
    dispatch(fetchUsers())
    dispatch(fetchApplications())
  }, [dispatch])

  useEffect(() => {
    if (user && applications.length > 0) {
      setAvailableApplications(applications.filter((app) => !user.applications.includes(app.id)))
    }
  }, [user, applications])

  const userApplications = applications.filter((app) => user?.applications.includes(app.id))

  const filteredUserApplications = userApplications.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredAvailableApplications = availableApplications.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleRemoveApplication = (applicationId: string) => {
    if (window.confirm("Are you sure you want to remove this application from the user?")) {
      dispatch(removeApplicationFromUser({ userId, applicationId }))
      dispatch(removeUserFromApplication({ applicationId, userId }))
    }
  }

  const handleAddApplication = (applicationId: string) => {
    dispatch(assignApplicationToUser({ userId, applicationId }))
    dispatch(assignUserToApplication({ applicationId, userId }))
    setIsAddDialogOpen(false)
  }

  if (usersLoading === "pending" || !user) {
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
                <Button>
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
                              <TableCell>{app.type}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => handleAddApplication(app.id)}>
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
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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
                  {appsLoading === "pending" ? (
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
                    filteredUserApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="font-medium">{app.name}</div>
                          <div className="text-sm text-muted-foreground">{app.description}</div>
                        </TableCell>
                        <TableCell>{app.type}</TableCell>
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
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveApplication(app.id)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Key className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No applications assigned to this user</p>
                          <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
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
