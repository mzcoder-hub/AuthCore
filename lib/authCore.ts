// lib/authCore.ts
import * as jwtDecode from "jwt-decode";

export type LoginPayload = {
  email: string;
  password: string;
  client_id: string;
  redirect_uri: string;
  state?: string; // optional
};

// LOGIN
export async function login({
  email,
  password,
  client_id,
  redirect_uri,
  state,
}: {
  email: string;
  password: string;
  client_id: string;
  redirect_uri: string;
  state?: string;
}) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_AUTHCORE_BASE_URL || "http://localhost:3000/api"}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        client_id,
        redirect_uri,
        state,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Login failed");
  }

  const data = await res.json();

  // Save tokens to localStorage
  if (typeof window !== "undefined") {
    if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
    if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
  }

  return data;
}

// LOGOUT
export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

// TOKEN HELPERS
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

export function clearTokens() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

// JWT PAYLOAD TYPE (customize fields as needed)
export type JwtPayload = {
  sub: string;
  email: string;
  roles: any[]; // Change to your Role shape
  applicationId?: string;
  exp?: number;
  iat?: number;
};

// JWT DECODE
export function getUserFromToken(token?: string): JwtPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const t = token || getToken();
    if (!t) return null;
    return jwtDecode<JwtPayload>(t);
  } catch (err) {
    return null;
  }
}
