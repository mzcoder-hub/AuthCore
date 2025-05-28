"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, KeyRound } from "lucide-react"

import { login } from "@/lib/authCore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RedirectScreen } from "@/components/redirect-screen"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const redirectTo = searchParams.get("redirect_to") || "/admin"
  const applicationName = searchParams.get("app_name") || null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const client_id = process.env.NEXT_PUBLIC_AUTHCORE_CLIENT_ID || "your-client-id"
      const baseUrl = window.location.origin // http://localhost:3001 or deployed domain

      const redirectUri = new URL("/auth/callback", baseUrl)
      redirectUri.searchParams.set("redirect_uri", redirectTo)
      if (applicationName) {
        redirectUri.searchParams.set("app_name", applicationName)
      }

      const response = await login({
        email,
        password,
        client_id,
        redirect_uri: redirectUri.toString(),
        state: applicationName ?? "AuthCore",
      })

      setIsRedirecting(true)

      setTimeout(() => {
        if (response.accessToken) {
          // Save tokens for session management
          localStorage.setItem("accessToken", response.accessToken);
          if (response.refreshToken) localStorage.setItem("refreshToken", response.refreshToken);
      
          router.push(redirectTo);
        } else {
          setError("Login failed: No access token received");
        }
      }, 1500)
      
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      {isRedirecting && <RedirectScreen applicationName={applicationName || undefined} />}

      <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8">
        <Button variant="ghost" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <span className="text-lg font-bold text-primary-foreground">ID</span>
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Sign in to AuthCore</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <span className="relative bg-muted px-2 text-xs text-muted-foreground">Secure Authentication</span>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <KeyRound className="h-4 w-4" />
              <span>Local authentication with secure password storage</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
