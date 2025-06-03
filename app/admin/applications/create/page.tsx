"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast" // Assuming you have useToast
import { fetchWithAuth } from "@/lib/api"

export default function CreateApplicationPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [applicationType, setApplicationType] = useState<"Web" | "SPA" | "Mobile" | "Service">("Web") // Changed to match backend enum
  const [redirectUris, setRedirectUris] = useState<string[]>([""])
  const [accessTokenLifetime, setAccessTokenLifetime] = useState<number>(60)
  const [accessTokenLifetimeUnit, setAccessTokenLifetimeUnit] = useState<string>("minutes")
  const [refreshTokenLifetime, setRefreshTokenLifetime] = useState<number>(30)
  const [refreshTokenLifetimeUnit, setRefreshTokenLifetimeUnit] = useState<string>("days")
  const [grantTypes, setGrantTypes] = useState<string[]>(["authorization_code", "refresh_token"]) // Assuming these are the default
  const [tokenSigningAlgorithm, setTokenSigningAlgorithm] = useState<string>("RS256")
  const [corsOrigins, setCorsOrigins] = useState<string>("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addRedirectUri = () => {
    setRedirectUris([...redirectUris, ""])
  }

  const updateRedirectUri = (index: number, value: string) => {
    const newUris = [...redirectUris]
    newUris[index] = value
    setRedirectUris(newUris)
  }

  const removeRedirectUri = (index: number) => {
    const newUris = [...redirectUris]
    newUris.splice(index, 1)
    setRedirectUris(newUris)
  }

  const handleGrantTypeChange = (type: string, checked: boolean) => {
    setGrantTypes((prev) => (checked ? [...prev, type] : prev.filter((t) => t !== type)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Convert lifetimes to minutes/days
      const finalAccessTokenLifetime =
        accessTokenLifetimeUnit === "minutes"
          ? accessTokenLifetime
          : accessTokenLifetimeUnit === "hours"
            ? accessTokenLifetime * 60
            : accessTokenLifetimeUnit === "days"
              ? accessTokenLifetime * 60 * 24
              : accessTokenLifetime // Default to minutes if unknown

      const finalRefreshTokenLifetime =
        refreshTokenLifetimeUnit === "minutes"
          ? refreshTokenLifetime
          : refreshTokenLifetimeUnit === "hours"
            ? refreshTokenLifetime * 60
            : refreshTokenLifetimeUnit === "days"
              ? refreshTokenLifetime
              : refreshTokenLifetime // Default to days if unknown

      const payload = {
        name,
        description: description || null,
        type: applicationType,
        redirectUris: redirectUris.filter(Boolean), // Filter out empty strings
        accessTokenLifetime: finalAccessTokenLifetime,
        refreshTokenLifetime: finalRefreshTokenLifetime,
        // Assuming backend handles clientId, clientSecret generation and status default
        // Add other advanced fields if your API supports them directly on creation
        grantTypes, // Assuming backend expects an array of strings
        tokenSigningAlgorithm,
        corsOrigins: corsOrigins
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }

      await fetchWithAuth("applications", "POST", payload) // Updated call

      toast({
        title: "Success",
        description: "Application registered successfully!",
      })
      router.push("/admin/applications")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register application")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to register application.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Register Application</h1>
        <p className="text-muted-foreground mt-2">Add a new application to your authentication service</p>
      </div>

      <Tabs defaultValue="standard" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="standard">Standard Setup</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Configuration</TabsTrigger>
        </TabsList>
        <TabsContent value="standard" className="mt-4">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
                <CardDescription>
                  Basic information about the application that will use your authentication service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}
                <div className="space-y-2">
                  <Label htmlFor="name">Application Name</Label>
                  <Input
                    id="name"
                    placeholder="My Application"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    A descriptive name for your application. This will be shown to users during authentication.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Application Type</Label>
                  <RadioGroup
                    defaultValue="Web" // Changed to "Web" to match backend enum
                    className="grid grid-cols-2 gap-4"
                    onValueChange={(value: "Web" | "SPA" | "Mobile" | "Service") => setApplicationType(value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Web" id="web" />
                      <Label htmlFor="web" className="font-normal">
                        Web Application
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SPA" id="spa" />
                      <Label htmlFor="spa" className="font-normal">
                        Single Page App
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Mobile" id="mobile" />
                      <Label htmlFor="mobile" className="font-normal">
                        Mobile/Native App
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Service" id="service" />
                      <Label htmlFor="service" className="font-normal">
                        Service/API
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Redirect URIs</Label>
                  <div className="space-y-2">
                    {redirectUris.map((uri, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={uri}
                          onChange={(e) => updateRedirectUri(index, e.target.value)}
                          placeholder={
                            applicationType === "Web" || applicationType === "SPA"
                              ? "https://example.com/callback"
                              : applicationType === "Mobile"
                                ? "com.example.app://callback"
                                : ""
                          }
                          disabled={applicationType === "Service"}
                        />
                        {redirectUris.length > 1 && (
                          <Button type="button" variant="outline" size="icon" onClick={() => removeRedirectUri(index)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {applicationType !== "Service" && (
                    <Button type="button" variant="outline" size="sm" onClick={addRedirectUri}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Redirect URI
                    </Button>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {applicationType === "Service"
                      ? "Service applications don't require redirect URIs."
                      : "URIs where users will be redirected after authentication. Must exactly match the redirect URI used in your application."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your application..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.push("/admin/applications")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Registering..." : "Register Application"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
        <TabsContent value="advanced" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>Configure detailed settings for your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="token-lifetime">Access Token Lifetime</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="token-lifetime"
                    type="number"
                    value={accessTokenLifetime}
                    onChange={(e) => setAccessTokenLifetime(Number(e.target.value))}
                    className="w-24"
                  />
                  <Select value={accessTokenLifetimeUnit} onValueChange={setAccessTokenLifetimeUnit}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Seconds</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh-token-lifetime">Refresh Token Lifetime</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="refresh-token-lifetime"
                    type="number"
                    value={refreshTokenLifetime}
                    onChange={(e) => setRefreshTokenLifetime(Number(e.target.value))}
                    className="w-24"
                  />
                  <Select value={refreshTokenLifetimeUnit} onValueChange={setRefreshTokenLifetimeUnit}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Grant Types</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="authorization-code"
                      className="h-4 w-4"
                      checked={grantTypes.includes("authorization_code")}
                      onChange={(e) => handleGrantTypeChange("authorization_code", e.target.checked)}
                    />
                    <Label htmlFor="authorization-code" className="font-normal">
                      Authorization Code
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="implicit"
                      className="h-4 w-4"
                      checked={grantTypes.includes("implicit")}
                      onChange={(e) => handleGrantTypeChange("implicit", e.target.checked)}
                    />
                    <Label htmlFor="implicit" className="font-normal">
                      Implicit
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="password"
                      className="h-4 w-4"
                      checked={grantTypes.includes("password")}
                      onChange={(e) => handleGrantTypeChange("password", e.target.checked)}
                    />
                    <Label htmlFor="password" className="font-normal">
                      Password
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="client-credentials"
                      className="h-4 w-4"
                      checked={grantTypes.includes("client_credentials")}
                      onChange={(e) => handleGrantTypeChange("client_credentials", e.target.checked)}
                    />
                    <Label htmlFor="client-credentials" className="font-normal">
                      Client Credentials
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="refresh-token"
                      className="h-4 w-4"
                      checked={grantTypes.includes("refresh_token")}
                      onChange={(e) => handleGrantTypeChange("refresh_token", e.target.checked)}
                    />
                    <Label htmlFor="refresh-token" className="font-normal">
                      Refresh Token
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Token Signing Algorithm</Label>
                <Select value={tokenSigningAlgorithm} onValueChange={setTokenSigningAlgorithm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RS256">RS256</SelectItem>
                    <SelectItem value="HS256">HS256</SelectItem>
                    <SelectItem value="ES256">ES256</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cors-settings">CORS Settings</Label>
                <Textarea
                  id="cors-settings"
                  placeholder="https://example.com, https://app.example.com"
                  value={corsOrigins}
                  onChange={(e) => setCorsOrigins(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Comma-separated list of allowed origins for CORS requests
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/admin/applications")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register Application"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
