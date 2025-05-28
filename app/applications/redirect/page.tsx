"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { RedirectScreen } from "@/components/redirect-screen"

export default function ApplicationRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get parameters from URL
  const applicationId = searchParams.get("app_id")
  const applicationName = searchParams.get("app_name")
  const redirectUri = searchParams.get("redirect_uri")

  useEffect(() => {
    // This simulates preparing a redirect to an external application
    // with the appropriate tokens/parameters
    const prepareRedirect = async () => {
      if (!applicationId || !redirectUri) {
        // If missing required parameters, redirect to dashboard
        router.push("/admin")
        return
      }

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2500))

      // In a real implementation, you would:
      // 1. Generate tokens for the application
      // 2. Construct the redirect URL with tokens
      // 3. Redirect the user to the application

      // For demo purposes, we'll just redirect to the URI as-is
      window.location.href = redirectUri
    }

    prepareRedirect()
  }, [applicationId, redirectUri, router])

  return <RedirectScreen applicationName={applicationName || undefined} />
}
