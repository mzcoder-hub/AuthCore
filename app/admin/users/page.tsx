"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Key, MoreHorizontal, Search, Shield, UserPlus } from "lucide-react"

import { getToken } from "@/lib/authCore"
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
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Types based on your API response
type ApiUser = {
  id: string
  name: string
  email: string
  status: "Active" | "Inactive" | "Locked" | "Pending"
  roles: string[]
  applications: Array<{
    id: string
    name: string
  }>
  lastLogin: string | null
  passwordLastChanged: string | null
}

type ApiResponse = {
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  items: ApiUser[]
}

// Helper function to get role badge color
const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case "Admin":
    case "SuperAdmin":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    case "Manager":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "User":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "ReadOnly":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

// API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050"

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")

    // New user creation modal state
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
    const [isCreatingUser, setIsCreatingUser] = useState(false)
    const [createUserForm, setCreateUserForm] = useState({
      name: "",
      email: "",
      password: "",
      status: "Active" as "Active" | "Inactive" | "Locked" | "Pending",
      source: "Local" as const,
    })
    const [createUserError, setCreateUserError] = useState<string | null>(null)


      // Edit user modal state
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [editUserForm, setEditUserForm] = useState({
    id: "",
    name: "",
    email: "",
    status: "Active" as "Active" | "Inactive" | "Locked" | "Pending",
  })
  const [editUserError, setEditUserError] = useState<string | null>(null)

  // Helper function for authenticated API requests
  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken()

    if (!token) {
      throw new Error("No authentication token available")
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
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: meta.page.toString(),
        limit: meta.limit.toString(),
        search: searchQuery,
        status: statusFilter === "all" ? "" : statusFilter,
        role: roleFilter === "all" ? "" : roleFilter,
      })

      const data: ApiResponse = await fetchWithAuth(`/users?${params}`)
      setUsers(data.items)
      setMeta(data.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users")
      console.error("Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [meta.page, searchQuery, statusFilter, roleFilter])

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await fetchWithAuth(`/users/${id}`, {
          method: "DELETE",
        })

        // Show success message
        alert("User deleted successfully")

        // Refresh users list
        fetchUsers()
      } catch (err) {
        console.error("Error deleting user:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to delete user"
        alert(`Error: ${errorMessage}`)
      }
    }
  }

  const handleToggleUserStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active"

    try {
      await fetchWithAuth(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })

      // Show success message
      alert(`User status updated to ${newStatus}`)

      // Refresh users list
      fetchUsers()
    } catch (err) {
      console.error("Error updating user status:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to update user status"
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleUnlockUser = async (id: string) => {
    try {
      await fetchWithAuth(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Active" }),
      })

      // Show success message
      alert("User unlocked successfully")

      // Refresh users list
      fetchUsers()
    } catch (err) {
      console.error("Error unlocking user:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to unlock user"
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleResetPassword = async () => {
    if (selectedUser) {
      try {
        // Validate password
        if (!newPassword) {
          alert("Please enter a new password")
          return
        }

        if (newPassword.length < 6) {
          alert("Password must be at least 6 characters long")
          return
        }

        // Use the same PATCH endpoint as update user
        await fetchWithAuth(`/users/${selectedUser.id}`, {
          method: "PATCH",
          body: JSON.stringify({ password: newPassword }),
        })

        // Close modal and reset form
        setIsResetPasswordDialogOpen(false)
        setNewPassword("")
        setSelectedUser(null)

        // Show success message
        alert("Password has been reset successfully.")

        // Optionally refresh users list to update passwordLastChanged field
        fetchUsers()
      } catch (err) {
        console.error("Error resetting password:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to reset password"
        alert(`Error: ${errorMessage}`)
      }
    }
  }

  
  const handleCreateUser = async () => {
    try {
      setIsCreatingUser(true)
      setCreateUserError(null)

      // Validate form
      if (!createUserForm.name || !createUserForm.email || !createUserForm.password) {
        setCreateUserError("Please fill in all required fields")
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(createUserForm.email)) {
        setCreateUserError("Please enter a valid email address")
        return
      }

      // Password validation
      if (createUserForm.password.length < 6) {
        setCreateUserError("Password must be at least 6 characters long")
        return
      }

      await fetchWithAuth("/users", {
        method: "POST",
        body: JSON.stringify(createUserForm),
      })

      // Reset form and close modal
      setCreateUserForm({
        name: "",
        email: "",
        password: "",
        status: "Active",
        source: "Local",
      })
      setIsCreateUserModalOpen(false)

      // Refresh users list
      fetchUsers()
    } catch (err) {
      setCreateUserError(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleEditUser = async () => {
    try {
      setIsUpdatingUser(true)
      setEditUserError(null)

      // Validate form
      if (!editUserForm.name || !editUserForm.email) {
        setEditUserError("Please fill in all required fields")
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editUserForm.email)) {
        setEditUserError("Please enter a valid email address")
        return
      }

      await fetchWithAuth(`/users/${editUserForm.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editUserForm.name,
          email: editUserForm.email,
          status: editUserForm.status,
        }),
      })

      // Reset form and close modal
      setEditUserForm({
        id: "",
        name: "",
        email: "",
        status: "Active",
      })
      setIsEditUserModalOpen(false)

      // Show success message
      alert("User updated successfully")

      // Refresh users list
      fetchUsers()
    } catch (err) {
      setEditUserError(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setIsUpdatingUser(false)
    }
  }

  const openEditUserModal = (user: ApiUser) => {
    setEditUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
    })
    setEditUserError(null)
    setIsEditUserModalOpen(true)
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setMeta((prev) => ({ ...prev, page: 1 })) // Reset to first page when searching
  }

  const handleFilterChange = (type: "status" | "role", value: string) => {
    if (type === "status") {
      setStatusFilter(value)
    } else {
      setRoleFilter(value)
    }
    setMeta((prev) => ({ ...prev, page: 1 })) // Reset to first page when filtering
  }

  const handlePageChange = (newPage: number) => {
    setMeta((prev) => ({ ...prev, page: newPage }))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-2">Manage local users in your authentication system</p>
        </div>
        <Button onClick={() => setIsCreateUserModalOpen(true)} className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all local users in your system ({meta.total} total users)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Locked">Locked</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">Error: {error}</div>
          )}

          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Applications</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${user.name.charAt(0)}`} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.status === "Active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                                : user.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                                  : user.status === "Locked"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }
                          >
                            {user.status === "Active" && <Check className="mr-1 h-3 w-3" />}
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <Badge
                                key={role}
                                variant="outline"
                                className={`${getRoleBadgeClass(role)} hover:${getRoleBadgeClass(role)}`}
                              >
                                {(role === "Admin" || role === "SuperAdmin") && <Shield className="mr-1 h-3 w-3" />}
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {user.applications.length > 0 ? (
                              user.applications.map((app) => (
                                <Badge
                                  key={app.id}
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                >
                                  <Key className="mr-1 h-3 w-3" />
                                  {app.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No applications</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Link href={`/admin/users/${user.id}`} className="flex w-full">
                                  View profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditUserModal(user)}>Edit user</DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsResetPasswordDialogOpen(true)
                                }}
                              >
                                Reset password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Link href={`/admin/users/${user.id}/applications`} className="flex w-full">
                                  Manage applications
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link href={`/admin/users/${user.id}/roles`} className="flex w-full">
                                  Manage Roles
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "Active" ? (
                                <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, user.status)}>
                                  Deactivate user
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, user.status)}>
                                  Activate user
                                </DropdownMenuItem>
                              )}
                              {user.status === "Locked" && (
                                <DropdownMenuItem onClick={() => handleUnlockUser(user.id)}>
                                  Unlock user
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete user
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {(meta.page - 1) * meta.limit + 1} to {Math.min(meta.page * meta.limit, meta.total)} of{" "}
                {meta.total} users
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      
      {/* Create User Modal */}
      <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to your authentication system. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {createUserError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{createUserError}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="create-name">Full Name *</Label>
              <Input
                id="create-name"
                placeholder="Enter full name"
                value={createUserForm.name}
                onChange={(e) => setCreateUserForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-email">Email Address *</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="user@example.com"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password">Password *</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Enter password (min 6 characters)"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-status">Status</Label>
              <Select
                value={createUserForm.status}
                onValueChange={(value: "Active" | "Inactive" | "Locked" | "Pending") =>
                  setCreateUserForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-source">Source</Label>
              <Select
                value={createUserForm.source}
                onValueChange={(value: "Local") => setCreateUserForm((prev) => ({ ...prev, source: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Local">Local</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateUserModalOpen(false)
                setCreateUserForm({
                  name: "",
                  email: "",
                  password: "",
                  status: "Active",
                  source: "Local",
                })
                setCreateUserError(null)
              }}
              disabled={isCreatingUser}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreatingUser}>
              {isCreatingUser ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information. All fields are required.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editUserError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{editUserError}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                placeholder="Enter full name"
                value={editUserForm.name}
                onChange={(e) => setEditUserForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="user@example.com"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editUserForm.status}
                onValueChange={(value: "Active" | "Inactive" | "Locked" | "Pending") =>
                  setEditUserForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditUserModalOpen(false)
                setEditUserForm({
                  id: "",
                  name: "",
                  email: "",
                  status: "Active",
                })
                setEditUserError(null)
              }}
              disabled={isUpdatingUser}
            >
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={isUpdatingUser}>
              {isUpdatingUser ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset the password for {selectedUser?.name}. Enter a new password below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input id="reset-email" value={selectedUser?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password *</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsResetPasswordDialogOpen(false)
                setNewPassword("")
                setSelectedUser(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={!newPassword || newPassword.length < 6}>
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
