"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Added useSearchParams
import AuthModal from "@/components/AuthModel";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading) {
      if (user) {
        const destination = searchParams.get("redirect") || "/workspace";
        router.replace(destination);
      } else if (searchParams.has("redirect")) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOpen(true);
      }
    }
  }, [user, loading, router, searchParams]);

  if (loading) return <div>Checking authentication...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <main className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm dark:bg-zinc-900 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Welcome</h1>
        <p className="mb-6 text-zinc-600">Sign in to continue to your workspace</p>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full h-11 rounded-md bg-black text-white"
        >
          Login / Sign Up
        </button>
      </main>

      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}