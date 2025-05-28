import { CheckCircle2, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface RedirectScreenProps {
  applicationName?: string
  className?: string
  showSuccess?: boolean
}

export function RedirectScreen({ applicationName, className, showSuccess = true }: RedirectScreenProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-300",
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        {showSuccess && (
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        )}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Authentication Successful</h2>
          <p className="text-muted-foreground">
            {applicationName ? `Redirecting you to ${applicationName}...` : "Redirecting you to your destination..."}
          </p>
        </div>
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    </div>
  )
}
