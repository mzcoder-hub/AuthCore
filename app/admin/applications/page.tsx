"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Check, Copy, Eye, EyeOff, MoreHorizontal, Plus, Search } from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast" // Assuming you have useToast
import { fetchWithAuth } from "@/lib/api"

// Define types based on your API response
type Application = {
  id: string
  name: string
  type: "Web" | "Mobile" | "SPA" | "Service"
  clientId: string
  clientSecret?: string
  redirectUris: string[]
  status: "Active" | "Inactive" | "Development"
  createdAt: string
  description?: string
  accessTokenLifetime?: number // in minutes
  refreshTokenLifetime?: number // in days
  allowedUsers?: string[] // IDs of users allowed to access this application
}

type ApiResponse = {
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  items: Application[]
}

export default function ApplicationsPage() {
  const { toast } = useToast() // Initialize toast
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [selectedApp, setSelectedApp] = useState<Application | null>(null) // Store full app object
  const [isSecretDialogOpen, setIsSecretDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Pagination state
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: meta.page.toString(),
        limit: meta.limit.toString(),
        search: searchQuery,
        status: activeTab === "all" ? "" : activeTab, // Use activeTab for status filter
        type: activeTab === "all" ? "" : activeTab, // Use activeTab for type filter (if applicable)
      })

      const data: ApiResponse = await fetchWithAuth(`applications?${params}`) // Updated call
      setApplications(data.items)
      setMeta(data.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch applications")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load applications.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [meta.page, meta.limit, searchQuery, activeTab, toast])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const copyToClipboard = (text: string, id: string, isSecret = false) => {
    navigator.clipboard.writeText(text)
    if (isSecret) {
      setCopiedSecret(id)
      setTimeout(() => setCopiedSecret(null), 2000)
    } else {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
    toast({
      title: "Copied!",
      description: isSecret ? "Client secret copied to clipboard." : "Client ID copied to clipboard.",
      duration: 1500,
    })
  }

  const handleDeleteApplication = async () => {
    if (!selectedApp) return

    try {
      await fetchWithAuth(`applications/${selectedApp.id}`, "DELETE") // Updated call
      toast({
        title: "Success",
        description: "Application deleted successfully.",
      })
      setIsDeleteDialogOpen(false)
      setSelectedApp(null)
      fetchApplications() // Refresh the list
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete application.",
        variant: "destructive",
      })
    }
  }

  const toggleShowSecret = (id: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleRotateClientSecret = async () => {
    if (!selectedApp) return

    try {
      await fetchWithAuth(`applications/${selectedApp.id}/rotate-secret`, "POST") // Updated call
      toast({
        title: "Success",
        description: "Client secret has been rotated. Make sure to update your application with the new secret.",
      })
      setIsSecretDialogOpen(false)
      setSelectedApp(null)
      fetchApplications() // Refresh to get the new secret
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to rotate client secret.",
        variant: "destructive",
      })
    }
  }

  const handlePageChange = (newPage: number) => {
    setMeta((prev) => ({ ...prev, page: newPage }))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground mt-2">Manage client applications that use your authentication service</p>
        </div>
        <Link href="/admin/applications/create">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Register Application
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Registered Applications</CardTitle>
          <CardDescription>
            Applications that can authenticate users through your service ({meta.total} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex md:flex-row sm:grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="web">Web</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
                <TabsTrigger value="spa">SPA</TabsTrigger>
                <TabsTrigger value="service">Service</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">Error: {error}</div>
          )}

          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Client ID</TableHead>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: meta.limit }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : applications.length > 0 ? (
                    applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="font-medium">{app.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                            {app.redirectUris.length > 0
                              ? `${app.redirectUris[0]}${app.redirectUris.length > 1 ? ` +${app.redirectUris.length - 1} more` : ""}`
                              : "No redirect URIs"}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{app.type}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-muted px-1 py-0.5 text-sm">{app.clientId}</code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(app.clientId, app.id)}
                              >
                                {copiedId === app.id ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                <span className="sr-only">Copy client ID</span>
                              </Button>
                            </div>
                            {app.clientSecret && (
                              <div className="flex items-center gap-2">
                                <code className="rounded bg-muted px-1 py-0.5 text-sm max-w-[150px] truncate">
                                  {showSecrets[app.id] ? app.clientSecret : "••••••••••••••••"}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleShowSecret(app.id)}
                                >
                                  {showSecrets[app.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                  <span className="sr-only">
                                    {showSecrets[app.id] ? "Hide client secret" : "Show client secret"}
                                  </span>
                                </Button>
                                {showSecrets[app.id] && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(app.clientSecret || "", app.id, true)}
                                  >
                                    {copiedSecret === app.id ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                    <span className="sr-only">Copy client secret</span>
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge
                            variant="outline"
                            className={
                              app.status === "Active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                                : app.status === "Development"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }
                          >
                            {app.status === "Active" && <Check className="mr-1 h-3 w-3" />}
                            {app.status}
                          </Badge>
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
                                <Link href={`/admin/applications/${app.id}`} className="flex w-full">
                                  View details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link href={`/admin/applications/${app.id}/edit`} className="flex w-full">
                                  Edit application
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedApp(app) // Pass the full app object
                                  setIsSecretDialogOpen(true)
                                }}
                              >
                                Rotate client secret
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Link href={`/admin/applications/${app.id}/users`} className="flex w-full">
                                  Manage users
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedApp(app) // Pass the full app object
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                Delete application
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No applications found.
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
                {meta.total} applications
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

      {/* Rotate Secret Dialog */}
      <Dialog open={isSecretDialogOpen} onOpenChange={setIsSecretDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate Client Secret</DialogTitle>
            <DialogDescription>
              Are you sure you want to rotate the client secret for &quot;{selectedApp?.name}&quot;? This will
              invalidate the current secret and generate a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Make sure to update your application with the new client secret immediately
              after rotation.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSecretDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRotateClientSecret}>
              Rotate Secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Application Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the application &quot;{selectedApp?.name}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Deleting this application will permanently remove it and all associated data.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteApplication}>
              Delete Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
