"use client";

import apiClient from "@/lib/apiClient";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthResponse } from '@/types/auth.type'

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

interface AuthFormData {
  name: string;
  email: string;
  password: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
}: AuthModalProps) {
  const router = useRouter();

  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);
  const [formData, setFormData] = useState<AuthFormData>({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({ name: "", email: "", password: "" });
  }, [authMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAuth = async () => {
    try {
        const res = await apiClient.post<AuthResponse>(
        authMode === "register" ? "/auth/signup" : "/auth/signin",
        {
            name: authMode === "register" ? formData.name : undefined,
            email: formData.email,
            password: formData.password,
        }
        );

        if (res.tokens) {
        apiClient.setTokens(res.tokens);
        localStorage.setItem("user", JSON.stringify(res.user));
        
        toast.success(authMode === "login" ? "Welcome back!" : "Account created!");
        onClose();
        router.push("/workspace");
        }
    } catch (err) {
        console.error(err);
        toast.error("Authentication failed. Check your credentials.");
    }
    };

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (isOpen) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 text-black">
        <button onClick={onClose} className="absolute right-4 top-4">
          <X />
        </button>

        <div className="mb-6 flex items-center gap-2">
          welcome to Notion
        </div>

        <h2 className="mb-6 text-2xl font-bold">
          {authMode === "login" ? "Welcome Back" : "Create Account"}
        </h2>

        {authMode === "register" && (
          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
            className="mb-3 w-full rounded border p-3"
          />
        )}

        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
          className="mb-3 w-full rounded border p-3"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
          className="mb-4 w-full rounded border p-3"
        />

        <button
          onClick={handleAuth}
          className="w-full rounded bg-blue-600 py-3 text-white"
        >
          {authMode === "login" ? "Sign In" : "Sign Up"}
        </button>

        <button
          onClick={() =>
            setAuthMode(authMode === "login" ? "register" : "login")
          }
          className="mt-4 w-full text-blue-600"
        >
          {authMode === "login"
            ? "Create an account"
            : "Already have an account?"}
        </button>
      </div>
    </div>
  );
}
