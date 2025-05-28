'use client';

import { ReactNode, createContext, useContext, useEffect, useState, useCallback } from 'react';

// You can customize these imports based on your actual lib functions
import {
  getToken,
  getUserFromToken,
  login as loginApi,
  logout as logoutApi,
  LoginPayload,
  JwtPayload,
  getRefreshToken,
  clearTokens,
} from '@/lib/authCore';

interface AuthContextType {
  token: string | null;
  user: JwtPayload | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshToken?: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // On mount, sync from localStorage
  useEffect(() => {
    const accessToken = getToken();
    const refresh = getRefreshToken?.();
    setToken(accessToken);
    setRefreshToken(refresh);
    setUser(accessToken ? getUserFromToken(accessToken) : null);
  }, []);

  // Login function
  const login = useCallback(async (payload: LoginPayload) => {
    const result = await loginApi(payload);
    if (result.accessToken) {
      setToken(result.accessToken);
      setUser(getUserFromToken(result.accessToken));
      localStorage.setItem('accessToken', result.accessToken);
    }
    if (result.refreshToken) {
      setRefreshToken(result.refreshToken);
      localStorage.setItem('refreshToken', result.refreshToken);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    logoutApi?.(); // If you want to call server-side logout
    clearTokens?.();
    setToken(null);
    setUser(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
