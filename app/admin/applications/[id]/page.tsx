"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, Copy, ExternalLink, Eye, EyeOff, Loader2, Users } from "lucide-react"

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchApplications, type Application } from "@/lib/redux/slices/applicationsSlice"
import { fetchUsers } from "@/lib/redux/slices/usersSlice"
import { ApplicationLaunchButton } from "@/components/application-launch-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ApplicationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useAppDispatch()

  const applicationId = params.id as string
  const { applications, loading } = useAppSelector((state) => state.applications)
  const { users } = useAppSelector((state) => state.users)

  const [application, setApplication] = useState<Application | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  useEffect(() => {
    dispatch(fetchApplications())
    dispatch(fetchUsers())
  }, [dispatch])

  useEffect(() => {
    if (applications.length > 0) {
      const app = applications.find((a) => a.id === applicationId)
      if (app) {
        setApplication(app)
      }
    }
  }, [applications, applicationId])

  const copyToClipboard = (text: string, isSecret = false) => {
    navigator.clipboard.writeText(text)
    if (isSecret) {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    } else {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const applicationUsers = users.filter((user) => user.applications.includes(applicationId))

  if (loading === "pending" || !application) {
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
            <Button variant="outline" className="w-full">
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
    </div>
  )
}
