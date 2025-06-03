"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getToken, getUserFromToken, clearTokens } from "@/lib/authCore"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = getToken()

        if (!token) {
          // No token found, redirect to login
          const redirectUrl = `/login?redirect_to=${encodeURIComponent(pathname)}`
          router.push(redirectUrl)
          return
        }

        const user = getUserFromToken(token)

        // console.log(user)

        if (!user) {
          // Invalid token, clear storage and redirect
          clearTokens()
          const redirectUrl = `/login?redirect_to=${encodeURIComponent(pathname)}`
          router.push(redirectUrl)
          return
        }

        // Check if token is expired
        if (user.exp && user.exp * 1000 < Date.now()) {
          // Token expired, clear storage and redirect
          clearTokens()
          const redirectUrl = `/login?redirect_to=${encodeURIComponent(pathname)}`
          router.push(redirectUrl)
          return
        }

        // Token is valid
        setIsAuthenticated(true)
      } catch (error) {
        // Error checking token, clear storage and redirect
        clearTokens()
        const redirectUrl = `/login?redirect_to=${encodeURIComponent(pathname)}`
        router.push(redirectUrl)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}
