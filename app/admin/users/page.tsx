"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Key, MoreHorizontal, Search, Shield, UserPlus } from "lucide-react"

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import {
  fetchUsers,
  deleteUserAsync,
  updateUserAsync,
  resetPassword,
  type User,
  type UserRole,
} from "@/lib/redux/slices/usersSlice"
import { fetchApplications } from "@/lib/redux/slices/applicationsSlice"
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

// Helper for badge color
const getRoleBadgeClass = (role: UserRole) => {
  switch (role) {
    case "Admin": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    case "Manager": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "User": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "ReadOnly": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

export default function UsersPage() {
  const dispatch = useAppDispatch()
  const { users, loading } = useAppSelector((state) => state.users)
  const { applications } = useAppSelector((state) => state.applications)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    dispatch(fetchUsers())
    dispatch(fetchApplications())
  }, [dispatch])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)  
      const matchesStatus =
      statusFilter === "all" || (user.status?.toLowerCase() === statusFilter.toLowerCase());    
    const matchesRole = roleFilter === "all" || user.roles.includes(roleFilter as UserRole)
    return matchesSearch && matchesStatus && matchesRole
  })

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      dispatch(deleteUserAsync(id))
    }
  }

  const handleToggleUserStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active"
    dispatch(updateUserAsync({ id, updates: { status: newStatus as any } }))
  }

  const handleUnlockUser = (id: string) => {
    dispatch(updateUserAsync({ id, updates: { status: "Active" } }))
  }

  const handleResetPassword = () => {
    if (selectedUser) {
      dispatch(resetPassword(selectedUser.id))
      setIsResetPasswordDialogOpen(false)
      setNewPassword("")
      alert("Password has been reset. In production, an email would be sent.")
    }
  }

  const getUserApplications = (user: User) => {
    return applications.filter((app) => user.applications.includes(app.id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-2">Manage local users in your authentication system</p>
        </div>
        <Link href="/admin/users/create">
          <Button className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all local users in your system</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-[150px]">
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter} className="w-full sm:w-[150px]">
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="ReadOnly">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
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
                  {loading === "pending" ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`/placeholder.svg?text=${user.name[0]}`} />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={user.status === "Active" ? "bg-green-500" : "bg-gray-400"}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.roles.map((r) => (
                            <Badge key={r} className={getRoleBadgeClass(r)}>{r}</Badge>
                          ))}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {getUserApplications(user).map((app) => (
                            <Badge key={app.id} variant="outline">{app.name}</Badge>
                          ))}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.id}`}>View</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSelectedUser(user) || setIsResetPasswordDialogOpen(true)}>
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, user.status)}>
                                {user.status === "Active" ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              {user.status === "Locked" && (
                                <DropdownMenuItem onClick={() => handleUnlockUser(user.id)}>
                                  Unlock User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset the password for {selectedUser?.name}. This will generate a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Email</Label>
            <Input disabled value={selectedUser?.email || ""} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
