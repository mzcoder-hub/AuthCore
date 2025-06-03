"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Check, Plus, Trash2, User } from "lucide-react"
import { getToken } from "@/lib/authCore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

// Define types based on your API responses
type Role = {
  id: string
  name: string
  description: string
}

type UserRoleAssignment = {
  id: string // This is the assignment ID, not the role ID
  userId: string
  roleId: string
  assignedAt: string
  role: Role // Nested role object
}

type ApiUser = {
  id: string
  name: string
  email: string
  status: string
  roles: UserRoleAssignment[] // Array of role assignment objects
  applications: any[]
  lastLogin: string | null
  passwordLastChanged: string | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050"

export default function UserRolesPage() {
  const { id: userId } = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = useState<ApiUser | null>(null)
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAssigningRole, setIsAssigningRole] = useState(false)
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState<string>("") // roleId

  const fetchWithAuth = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const token = getToken()
      if (!token) {
        router.push(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`)
        throw new Error("No authentication token available. Redirecting to login.")
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return response.json()
    },
    [router],
  )

  const fetchUserDataAndRoles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch specific user data
      const userData: ApiUser = await fetchWithAuth(`/users/${userId}`)
      setUser(userData)

      // Fetch all available roles
      const rolesData: Role[] = await fetchWithAuth("/roles")
      setAllRoles(rolesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load user roles.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [fetchWithAuth, userId, toast])

  useEffect(() => {
    if (userId) {
      fetchUserDataAndRoles()
    }
  }, [userId, fetchUserDataAndRoles])

  const handleAssignRole = async () => {
    if (!selectedRoleToAssign || !userId) return

    setIsAssigningRole(true)
    try {
      await fetchWithAuth(`/users/${userId}/roles`, {
        method: "POST",
        body: JSON.stringify({ roleId: selectedRoleToAssign }),
      })
      toast({
        title: "Success",
        description: "Role assigned successfully.",
      })
      setSelectedRoleToAssign("") // Reset selection
      fetchUserDataAndRoles() // Refresh data
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to assign role.",
        variant: "destructive",
      })
    } finally {
      setIsAssigningRole(false)
    }
  }

  const handleRemoveRole = async (roleAssignment: { id: string, userId : string, roleId : string}) => {
    try {
      // Assuming the DELETE endpoint is /users/:userId/roles/:roleAssignment
      await fetchWithAuth(`/users/${roleAssignment.userId}/roles/${roleAssignment.roleId}`, {
        method: "DELETE",
      })
      toast({
        title: "Success",
        description: "Role removed successfully.",
      })
      fetchUserDataAndRoles() // Refresh data
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove role.",
        variant: "destructive",
      })
    }
  }
  console.log(user)
  const assignedRoleIds = user?.roles.map((assignment) => assignment.role.id) || []
  const unassignedRoles = allRoles.filter((role) => !assignedRoleIds.includes(role.id))

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">User Roles</h1>
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">Error: {error}</div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">User Roles</h1>
        <div className="rounded-md bg-yellow-100/15 p-3 text-sm text-yellow-800">User not found.</div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Roles</h1>
          <p className="text-muted-foreground mt-2">
            Manage roles for <span className="font-medium">{user.name}</span> ({user.email})
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <User className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Assigned Roles</CardTitle>
          <CardDescription>Roles currently assigned to this user.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.roles.length > 0 ? (
                  user.roles.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          {assignment.role.name}
                        </Badge>
                      </TableCell>
                      <TableCell>{assignment.role.description}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRole(assignment)}
                          aria-label={`Remove ${assignment.role.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Remove role</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      No roles assigned to this user.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Assign New Role</CardTitle>
          <CardDescription>Select a role to assign to this user.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full">
              <Label htmlFor="select-role" className="sr-only">
                Select Role
              </Label>
              <Select
                value={selectedRoleToAssign}
                onValueChange={setSelectedRoleToAssign}
                disabled={isAssigningRole || unassignedRoles.length === 0}
              >
                <SelectTrigger id="select-role" className="w-full">
                  <SelectValue
                    placeholder={
                      unassignedRoles.length > 0 ? "Select a role to assign" : "No roles available to assign"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {unassignedRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignRole} disabled={isAssigningRole || !selectedRoleToAssign}>
              <Plus className="mr-2 h-4 w-4" />
              {isAssigningRole ? "Assigning..." : "Assign Role"}
            </Button>
          </div>
          {unassignedRoles.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">All available roles are already assigned to this user.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
