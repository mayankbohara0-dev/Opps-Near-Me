"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, getSessionUser, logoutAction } from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  setUser: (u: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  loading: true,
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate from HttpOnly Cookie on mount via Server Action
    getSessionUser().then((u) => {
      setUserState(u);
      setLoading(false);
    });
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
  }, []);

  const logout = useCallback(async () => {
    await logoutAction();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: user?.role === "admin",
      loading,
      setUser,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
