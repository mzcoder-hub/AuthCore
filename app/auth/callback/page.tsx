"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RedirectScreen } from "@/components/redirect-screen";

// Optionally, import jwtDecode if you want to parse user info from the token
// import jwtDecode from "jwt-decode";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Read tokens and params from URL
  const accessToken = searchParams.get("token"); // from backend
  const refreshToken = searchParams.get("refresh_token"); // if sent by backend (optional)
  const state = searchParams.get("state");
  const redirectUri = searchParams.get("redirect_uri") || "/admin";
  const applicationName = searchParams.get("app_name") || undefined;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const processAuth = async () => {
      try {
        if (!accessToken) throw new Error("No access token provided");

        // --- Store tokens (for demo; use HTTP-only cookies in production!) ---
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

        // Optionally: parse JWT for user info (if needed in app state)
        // try {
        //   const decoded = jwtDecode(accessToken);
        //   localStorage.setItem("user", JSON.stringify(decoded));
        // } catch (err) {
        //   // Ignore JWT parse errors
        // }

        // Wait for a nice UX, then redirect
        await new Promise((r) => setTimeout(r, 1200));
        // Allow both relative and absolute redirects
        if (/^https?:\/\//.test(redirectUri)) {
          window.location.href = redirectUri;
        } else {
          router.push(redirectUri);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };

    processAuth();
  }, [accessToken, refreshToken, redirectUri, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="mb-4 text-xl font-semibold">Authentication Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return <RedirectScreen applicationName={applicationName} />;
}
