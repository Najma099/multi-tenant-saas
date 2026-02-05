"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import type { User } from "@/types/auth.type";
import { toast } from "sonner";

const STORAGE_USER = "user";

async function fetchCurrentUser(): Promise<User | null> {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_USER);
  if (stored) {
    try {
      return JSON.parse(stored) as User;
    } catch {
      localStorage.removeItem(STORAGE_USER);
    }
  }

  const token = apiClient.getAccessToken();
  if (!token) return null;

  try {
    const user = await apiClient.get<User>("/auth/me");
    if (user) {
      localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    }
    return user ?? null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const token = apiClient.getAccessToken();

    if (!token) {
      setUser(null);
      localStorage.removeItem(STORAGE_USER);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        apiClient.startTokenRefreshTimer();
      }
    } catch (err) {
      console.error("Auth check failed", err);
      toast.error("Please login again.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    apiClient.clearTokens();

    void apiClient.delete("/auth/signout").catch(() => {});
    setUser(null);
    router.push("/");
  }, [router]);

  return {
    user,
    loading,
    logout,
    refreshUser,
  };
}
