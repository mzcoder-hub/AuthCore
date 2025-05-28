import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            ID
          </div>
          <span>AuthCore</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="ghost" size="sm">
              Documentation
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="sm">Admin Console</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full flex items-center justify-center py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Simple Authentication for Your Applications
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Secure, lightweight, and easy-to-implement local authentication solution
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/admin">
                  <Button size="lg">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline" size="lg">
                    Documentation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full flex items-center justify-center py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Complete user lifecycle</CardDescription>
                </CardHeader>
                <CardContent>
                  Manage local users with a comprehensive admin interface. Create, update, and delete users with
                  role-based access control and detailed user profiles.
                </CardContent>
                <CardFooter>
                  <Link href="/docs/users" className="text-sm text-primary">
                    Learn more
                  </Link>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Application Registry</CardTitle>
                  <CardDescription>Secure client applications</CardDescription>
                </CardHeader>
                <CardContent>
                  Register and manage client applications with secure client IDs and secrets. Control which users have
                  access to each application with fine-grained permissions.
                </CardContent>
                <CardFooter>
                  <Link href="/docs/applications" className="text-sm text-primary">
                    Learn more
                  </Link>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Token Management</CardTitle>
                  <CardDescription>Secure authentication</CardDescription>
                </CardHeader>
                <CardContent>
                  Generate and validate secure JWT tokens for authentication. Configure token lifetimes and refresh
                  policies to balance security and user experience.
                </CardContent>
                <CardFooter>
                  <Link href="/docs/tokens" className="text-sm text-primary">
                    Learn more
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
        <section className="w-full flex items-center justify-center py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Built for Developers</h2>
              <p className="mt-4 text-gray-500 md:text-xl dark:text-gray-400">
                AuthCore provides a simple, secure, and developer-friendly authentication solution that integrates
                easily with your applications.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Simple Integration</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Integrate with any application using our REST API and client libraries. Support for web, mobile, and
                  service applications.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Secure by Default</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Industry-standard security practices with secure password hashing, JWT tokens, and protection against
                  common vulnerabilities.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Role-Based Access</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Assign roles to users and control access to applications and features based on those roles.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Comprehensive Audit</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Track all authentication events and admin actions with detailed audit logs for security and
                  compliance.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex h-16 w-full items-center border-t px-4 md:px-6">
        <div className="text-sm text-gray-500">© 2025 AuthCore. All rights reserved.</div>
      </footer>
    </div>
  )
}
