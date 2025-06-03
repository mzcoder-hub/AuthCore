"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, Copy, ExternalLink, Eye, EyeOff, Loader2, Users } from "lucide-react"

import { ApplicationLaunchButton } from "@/components/application-launch-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast" // Assuming useToast is available
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  grantTypes?: string[]
  tokenSigningAlgorithm?: string
  corsOrigins?: string[]
}

type User = {
  id: string
  name: string
  email: string
  status: string
  roles: any[]
  applications: any[]
}

export default function ApplicationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const applicationId = params.id as string

  const [application, setApplication] = useState<Application | null>(null)
  const [applicationUsers, setApplicationUsers] = useState<User[]>([]) // Users specifically for this app
  const [loading, setLoading] = useState(true)
  const [showSecret, setShowSecret] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [isSecretDialogOpen, setIsSecretDialogOpen] = useState(false) // For rotate secret dialog

  const fetchApplicationDetails = useCallback(async () => {
    setLoading(true)
    try {
      const appData: Application = await fetchWithAuth(`applications/${applicationId}`) // Updated call
      setApplication(appData)

      // Fetch users associated with this application
      // Assuming an endpoint like applications/:id/users or filtering from all users
      // For simplicity, let's assume the application object itself contains allowedUsers IDs
      // and we fetch full user details separately if needed.
      // Or, if the backend returns users directly with the application:
      // const usersData = await fetchWithAuth(`applications/${applicationId}/users`);
      // setApplicationUsers(usersData.items);

      // For now, let's assume the application object has `allowedUsers` as an array of user IDs
      // and we need to fetch user details for each. This is less efficient.
      // A better API would return the full user objects directly or a dedicated endpoint.
      // Given the previous `usersSlice` had `applications: string[]`, let's assume we need to fetch all users
      // and filter them. This is what the previous Redux version did.
      // Let's adapt to fetch all users and filter, similar to `users/page.tsx`'s `fetchWithAuth` pattern.

      const allUsersResponse = await fetchWithAuth(`users?limit=1000`) // Updated call
      const filteredUsers = allUsersResponse.items.filter((user: User) =>
        user.applications.some((app: { id: string }) => app.id === applicationId),
      )
      setApplicationUsers(filteredUsers)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load application details.",
        variant: "destructive",
      })
      setApplication(null) // Clear application on error
    } finally {
      setLoading(false)
    }
  }, [applicationId, toast])

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails()
    }
  }, [applicationId, fetchApplicationDetails])

  const copyToClipboard = (text: string, isSecret = false) => {
    navigator.clipboard.writeText(text)
    if (isSecret) {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    } else {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
    toast({
      title: "Copied!",
      description: isSecret ? "Client secret copied to clipboard." : "Client ID copied to clipboard.",
      duration: 1500,
    })
  }

  const handleRotateClientSecret = async () => {
    if (!application) return

    try {
      await fetchWithAuth(`applications/${application.id}/rotate-secret`, "POST") // Updated call
      toast({
        title: "Success",
        description: "Client secret has been rotated. Make sure to update your application with the new secret.",
      })
      setIsSecretDialogOpen(false)
      fetchApplicationDetails() // Refresh to get the new secret
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to rotate client secret.",
        variant: "destructive",
      })
    }
  }

  if (loading || !application) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading application details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{application.name}</h1>
        <Badge
          variant="outline"
          className={
            application.status === "Active"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              : application.status === "Development"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
          }
        >
          {application.status === "Active" && <Check className="mr-1 h-3 w-3" />}
          {application.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
            <CardDescription>Basic information about this application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-1 text-sm font-medium">Description</h3>
              <p className="text-sm text-muted-foreground">{application.description || "No description provided"}</p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium">Application Type</h3>
              <p className="text-sm">{application.type}</p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium">Created</h3>
              <p className="text-sm">{new Date(application.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium">Redirect URIs</h3>
              {application.redirectUris.length > 0 ? (
                <ul className="space-y-1">
                  {application.redirectUris.map((uri, index) => (
                    <li key={index} className="text-sm">
                      <code className="rounded bg-muted px-1 py-0.5">{uri}</code>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No redirect URIs configured</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push(`/admin/applications/${applicationId}/edit`)}>
              Edit Details
            </Button>
            {application.redirectUris.length > 0 && (
              <ApplicationLaunchButton
                applicationId={application.id}
                applicationName={application.name}
                redirectUri={application.redirectUris[0]}
              />
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credentials</CardTitle>
            <CardDescription>Authentication credentials for this application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-1 text-sm font-medium">Client ID</h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-2 py-1 text-sm">{application.clientId}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(application.clientId)}
                >
                  {copiedId ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  <span className="sr-only">Copy client ID</span>
                </Button>
              </div>
            </div>
            {application.clientSecret && (
              <div>
                <h3 className="mb-1 text-sm font-medium">Client Secret</h3>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-2 py-1 text-sm">
                    {showSecret ? application.clientSecret : "••••••••••••••••••••••••••••••••"}
                  </code>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showSecret ? "Hide" : "Show"} client secret</span>
                  </Button>
                  {showSecret && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(application.clientSecret || "", true)}
                    >
                      {copiedSecret ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      <span className="sr-only">Copy client secret</span>
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Keep this secret secure. It will not be shown again.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="mb-1 text-sm font-medium">Access Token Lifetime</h3>
                <p className="text-sm">
                  {application.accessTokenLifetime ? `${application.accessTokenLifetime} minutes` : "60 minutes"}
                </p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-medium">Refresh Token Lifetime</h3>
                <p className="text-sm">
                  {application.refreshTokenLifetime === 0
                    ? "No refresh token"
                    : application.refreshTokenLifetime
                      ? `${application.refreshTokenLifetime} days`
                      : "30 days"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => setIsSecretDialogOpen(true)}>
              Rotate Client Secret
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authorized Users</CardTitle>
          <CardDescription>Users who have access to this application</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users ({applicationUsers.length})</TabsTrigger>
              <TabsTrigger value="access">Access Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="mt-4">
              {applicationUsers.length > 0 ? (
                <div className="space-y-4">
                  {applicationUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
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
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Users className="mb-2 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No users assigned</h3>
                  <p className="text-sm text-muted-foreground">This application has no authorized users yet.</p>
                  <Button className="mt-4" onClick={() => router.push(`/admin/applications/${applicationId}/users`)}>
                    Manage Users
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="access" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium">Access Control</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      <Users className="mr-1 h-3 w-3" />
                      {applicationUsers.length} authorized user{applicationUsers.length !== 1 ? "s" : ""}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/applications/${applicationId}/users`)}
                    >
                      Manage Users
                    </Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="mb-2 text-sm font-medium">Authentication URLs</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Authorization Endpoint</p>
                      <code className="block rounded bg-muted px-2 py-1 text-sm">
                        https://auth.example.com/oauth/authorize
                      </code>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Token Endpoint</p>
                      <code className="block rounded bg-muted px-2 py-1 text-sm">
                        https://auth.example.com/oauth/token
                      </code>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">User Info Endpoint</p>
                      <code className="block rounded bg-muted px-2 py-1 text-sm">
                        https://auth.example.com/oauth/userinfo
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-center justify-between">
            <Button variant="outline" onClick={() => router.push(`/admin/applications/${applicationId}/users`)}>
              Manage Users
            </Button>
            <Link href="/docs/integration" target="_blank">
              <Button variant="ghost" size="sm">
                Integration Guide
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>

      {/* Rotate Secret Dialog */}
      <Dialog open={isSecretDialogOpen} onOpenChange={setIsSecretDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate Client Secret</DialogTitle>
            <DialogDescription>
              Are you sure you want to rotate the client secret for &quot;{application?.name}&quot;? This will
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
    </div>
  )
}
