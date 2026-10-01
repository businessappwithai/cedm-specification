import React, { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { setUnauthorizedCallback } from "@/lib/api-client";
import {
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
  getSession,
} from "@/lib/auth";

/**
 * The signed-in user, as `/api/auth/me` and `/api/auth/login` actually return
 * them.
 *
 * The key is `pid`, not `id` — that is what the backend's `UserResponse`
 * serialises. This interface used to claim an `id` that never arrived; nothing
 * read it, so the lie was invisible, but it would have handed the next caller
 * `undefined`.
 */
interface User {
  pid: string;
  email: string;
  name: string;
  sysUserId?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // `useCallback` so the effect below can depend on it honestly. Declared
  // inline it was a new function every render, which is why it was omitted from
  // the dependency list — and an omitted dependency is a stale closure waiting
  // to happen, not a smaller one.
  const refreshSession = useCallback(async () => {
    try {
      const { data } = await getSession();
      setUser((data as { user?: User } | null)?.user ?? null);
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      await refreshSession();
      setIsLoading(false);
    };

    checkSession();

    // Register 401 unauthorized callback for API client
    setUnauthorizedCallback(async () => {
      setUser(null);
      await authSignOut();
      window.location.href = "/auth/login";
    });
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await authSignIn(email, password);
      if (error) throw new Error(error);
      setUser((data as { user?: User } | null)?.user ?? null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authSignOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const { data: _data, error } = await authSignUp(email, password, name);
      if (error) {
        throw new Error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = () => user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        logout,
        signup,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
