"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink } from "lucide-react"

import { Button, type ButtonProps } from "@/components/ui/button"
import { RedirectScreen } from "@/components/redirect-screen"

interface ApplicationLaunchButtonProps extends ButtonProps {
  applicationId: string
  applicationName: string
  redirectUri: string
}

export function ApplicationLaunchButton({
  applicationId,
  applicationName,
  redirectUri,
  children,
  ...props
}: ApplicationLaunchButtonProps) {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleLaunch = () => {
    setIsRedirecting(true)

    // Redirect to the application redirect page with necessary parameters
    const redirectUrl = `/applications/redirect?app_id=${applicationId}&app_name=${encodeURIComponent(applicationName)}&redirect_uri=${encodeURIComponent(redirectUri)}`

    // Short delay to show the redirect screen
    setTimeout(() => {
      router.push(redirectUrl)
    }, 500)
  }

  return (
    <>
      {isRedirecting && <RedirectScreen applicationName={applicationName} />}
      <Button onClick={handleLaunch} {...props}>
        {children || (
          <>
            <span>Launch</span>
            <ExternalLink className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </>
  )
}
