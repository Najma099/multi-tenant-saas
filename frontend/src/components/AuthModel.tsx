"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import type { AuthResponse } from "@/types/auth.type";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/context/WorkspaceContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { refreshWorkspaces } = useWorkspace();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    apiClient.clearTokens();
    try {
      const endpoint = authMode === "register" ? "/auth/signup" : "/auth/signin";
      const payload = authMode === "register" ? formData : { email: formData.email, password: formData.password };

      const res = await apiClient.post<AuthResponse>(endpoint, payload);
      apiClient.setTokens(res.tokens);
      localStorage.setItem("user", JSON.stringify(res.user));

      await refreshUser();
      const freshWorkspaces = await refreshWorkspaces();

      toast.success(authMode === "register" ? "Welcome to Notion!" : "Welcome back!");
      onClose();

      const redirectTo = searchParams.get("redirect") ||
        (freshWorkspaces.length > 0
          ? `/workspace/${freshWorkspaces[0].id}`
          : "/wprkspace/9");
      router.push(redirectTo);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "An error occurred";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
      {/* Container - Fixed "rw-full" typo to "relative w-full" */}
      <div className="relative w-full max-w-md rounded-xl bg-white p-8 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition-all">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header/Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-black dark:bg-zinc-100 rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <span className="text-white dark:text-black font-bold text-xl">N</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {authMode === "login" ? "Log in" : "Create an account"}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {authMode === "login" ? "Welcome back to your workspace" : "Start your journey with us"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4" key={authMode}>
          {authMode === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 ml-0.5">Name</label>
              <input
                required
                name="name"
                autoComplete="name"
                placeholder="Enter your name..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all dark:text-zinc-100"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 ml-0.5">Email</label>
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all dark:text-zinc-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 ml-0.5">Password</label>
            <input
              required
              type="password"
              name="password"
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all dark:text-zinc-100"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center rounded-md bg-zinc-900 dark:bg-zinc-100 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-black dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="animate-spin text-zinc-400" size={18} />
            ) : (
              authMode === "login" ? "Continue" : "Sign Up"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t border-zinc-100 dark:border-zinc-800 pt-6 text-center">
          <button
            onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setFormData({ name: "", email: "", password: "" });
            }}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium"
          >
            {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}