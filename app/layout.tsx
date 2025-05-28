import type React from "react";
import type { Metadata } from "next";

import { Inter } from "next/font/google";

import { Providers } from "@/app/providers";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AuthCore - Centralized Authentication System",
  description:
    "A centralized authentication system similar to Keycloak or FusionAuth",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
