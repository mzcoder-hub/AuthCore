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

export default function CreateApplicationPage() {
  const router = useRouter()
  const [redirectUris, setRedirectUris] = useState<string[]>([""])
  const [applicationType, setApplicationType] = useState<string>("web")

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would submit the form data to your API
    // For now, we'll just redirect back to the applications page
    router.push("/admin/applications")
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
                <div className="space-y-2">
                  <Label htmlFor="name">Application Name</Label>
                  <Input id="name" placeholder="My Application" required />
                  <p className="text-sm text-muted-foreground">
                    A descriptive name for your application. This will be shown to users during authentication.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Application Type</Label>
                  <RadioGroup defaultValue="web" className="grid grid-cols-2 gap-4" onValueChange={setApplicationType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="web" id="web" />
                      <Label htmlFor="web" className="font-normal">
                        Web Application
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="spa" id="spa" />
                      <Label htmlFor="spa" className="font-normal">
                        Single Page App
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mobile" id="mobile" />
                      <Label htmlFor="mobile" className="font-normal">
                        Mobile/Native App
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="service" id="service" />
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
                            applicationType === "web" || applicationType === "spa"
                              ? "https://example.com/callback"
                              : applicationType === "mobile"
                                ? "com.example.app://callback"
                                : ""
                          }
                          disabled={applicationType === "service"}
                        />
                        {redirectUris.length > 1 && (
                          <Button type="button" variant="outline" size="icon" onClick={() => removeRedirectUri(index)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {applicationType !== "service" && (
                    <Button type="button" variant="outline" size="sm" onClick={addRedirectUri}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Redirect URI
                    </Button>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {applicationType === "service"
                      ? "Service applications don't require redirect URIs."
                      : "URIs where users will be redirected after authentication. Must exactly match the redirect URI used in your application."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe your application..." />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.push("/admin/applications")}>
                  Cancel
                </Button>
                <Button type="submit">Register Application</Button>
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
                  <Input id="token-lifetime" type="number" defaultValue={60} className="w-24" />
                  <Select defaultValue="minutes">
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
                  <Input id="refresh-token-lifetime" type="number" defaultValue={30} className="w-24" />
                  <Select defaultValue="days">
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
                    <input type="checkbox" id="authorization-code" className="h-4 w-4" defaultChecked />
                    <Label htmlFor="authorization-code" className="font-normal">
                      Authorization Code
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="implicit" className="h-4 w-4" />
                    <Label htmlFor="implicit" className="font-normal">
                      Implicit
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="password" className="h-4 w-4" />
                    <Label htmlFor="password" className="font-normal">
                      Password
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="client-credentials" className="h-4 w-4" />
                    <Label htmlFor="client-credentials" className="font-normal">
                      Client Credentials
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="refresh-token" className="h-4 w-4" defaultChecked />
                    <Label htmlFor="refresh-token" className="font-normal">
                      Refresh Token
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Token Signing Algorithm</Label>
                <Select defaultValue="RS256">
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
                <Label>CORS Settings</Label>
                <Textarea placeholder="https://example.com, https://app.example.com" />
                <p className="text-sm text-muted-foreground">
                  Comma-separated list of allowed origins for CORS requests
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/admin/applications")}>
                Cancel
              </Button>
              <Button>Register Application</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
