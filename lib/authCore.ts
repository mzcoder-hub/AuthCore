// lib/authCore.ts
import { jwtDecode } from "jwt-decode"

export type LoginPayload = {
  email: string
  password: string
  client_id: string
  redirect_uri: string
  state?: string // optional
}


// Role type based on your actual structure
export type Role = {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

// Role assignment type
export type RoleAssignment = {
  id: string
  userId: string
  roleId: string
  assignedAt: string
  role: Role
}

// JWT PAYLOAD TYPE (updated to match your actual structure)
export type JwtPayload = {
  sub: string
  email: string
  roles: RoleAssignment[]
  applicationId?: string
  exp?: number
  iat?: number
}

// LOGIN
export async function login({
  email,
  password,
  client_id,
  redirect_uri,
  state,
}: {
  email: string
  password: string
  client_id: string
  redirect_uri: string
  state?: string
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_AUTHCORE_BASE_URL || "http://localhost:3000/api"}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      client_id,
      redirectUri : redirect_uri,
      state,
    }),
  })

  console.log(res)

  console.log("Login response status:", res.status)

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Login failed")
  }

  const data = await res.json()

  // Save tokens to localStorage
  if (typeof window !== "undefined") {
    if (data.accessToken) localStorage.setItem("accessToken", data.accessToken)
    if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken)
  }

  return data
}

// LOGOUT
export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
  }
}

// TOKEN HELPERS
export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("accessToken")
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refreshToken")
}

export function clearTokens() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
  }
}

// JWT DECODE
export function getUserFromToken(token?: string): JwtPayload | null {
  if (typeof window === "undefined") return null
  try {
    const t = token || getToken()
    if (!t) return null

    const decoded = jwtDecode<JwtPayload>(t)

    return decoded
  } catch (err) {
    console.error("JWT decode error:", err)
    return null
  }
}

// Helper function to check if user has a specific role
export function hasRole(user: JwtPayload | null, roleName: string): boolean {
  if (!user?.roles?.length) return false
  return user.roles.some((roleAssignment) => roleAssignment.role.name === roleName)
}

// Helper function to get all role names
export function getUserRoles(user: JwtPayload | null): string[] {
  if (!user?.roles?.length) return []
  return user.roles.map((roleAssignment) => roleAssignment.role.name)
}