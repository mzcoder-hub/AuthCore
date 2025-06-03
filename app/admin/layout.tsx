"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Bell, Key, LayoutDashboard, LogOut, Settings, Shield, User, Users } from "lucide-react"

import { ProtectedRoute } from "@/components/protected-route"
import { getToken, getUserFromToken, logout as authLogout } from "@/lib/authCore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { useEffect, useState } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = getToken()
    if (token) {
      const userData = getUserFromToken(token)
      setUser(userData)
    }
  }, [])

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const handleLogout = () => {
    authLogout()
    router.push("/login")
  }

  // Helper function to get the primary role name
  const getPrimaryRoleName = () => {
    if (!user?.roles?.length) return "User"

    // Get the first role and extract the role name
    const firstRole = user.roles[0]
    if (firstRole?.role?.name) {
      return firstRole.role.name
    }

    return "User"
  }

  // Helper function to get all role names
  const getAllRoleNames = () => {
    if (!user?.roles?.length) return []

    return user.roles.map((roleAssignment: any) => roleAssignment?.role?.name).filter(Boolean)
  }

  // Helper function to get user initials
  const getUserInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar>
            <SidebarHeader className="border-b">
              <div className="flex items-center gap-2 px-2 py-3">
                <Shield className="h-6 w-6" />
                <span className="font-semibold">AuthCore</span>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))] ${
                    isActive("/admin") && pathname === "/admin"
                      ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                      : ""
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/admin/users"
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))] ${
                    isActive("/admin/users")
                      ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                      : ""
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </Link>

                <Link
                  href="/admin/applications"
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))] ${
                    isActive("/admin/applications")
                      ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                      : ""
                  }`}
                >
                  <Key className="h-4 w-4" />
                  <span>Applications</span>
                </Link>

                <Link
                  href="/admin/analytics"
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))] ${
                    isActive("/admin/analytics")
                      ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                      : ""
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </Link>

                <Link
                  href="/admin/settings"
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))] ${
                    isActive("/admin/settings")
                      ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                      : ""
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="border-t">
              <div className="p-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${getUserInitials()}`} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-sm">
                        <span className="truncate max-w-[120px]">{user?.email || "User"}</span>
                        <span className="text-xs text-muted-foreground">
                          {getPrimaryRoleName()}
                          {getAllRoleNames().length > 1 && (
                            <span className="ml-1 text-xs opacity-70">+{getAllRoleNames().length - 1}</span>
                          )}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>My Account</span>
                        <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {getAllRoleNames().length > 0 && (
                      <>
                        <DropdownMenuLabel className="text-xs">Roles: {getAllRoleNames().join(", ")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SidebarFooter>
          </Sidebar>
          <div className="flex w-full flex-1 flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-16 lg:px-6">
              <SidebarTrigger />
              <div className="w-full flex-1" />
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
