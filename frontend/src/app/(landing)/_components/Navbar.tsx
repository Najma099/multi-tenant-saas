"use client";

import { useState } from "react";
import Link from "next/link";
import { useScrollTop } from "@/hooks/useScrollTop";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModel";

export const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const scrolled = useScrollTop();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav
        className={cn(
          "sticky inset-x-0 top-0 z-50 mx-auto flex w-full items-center bg-background p-6 dark:bg-[#1F1F1F]",
          scrolled && "border-b shadow-sm",
        )}
      >
        <Logo />

        <div className="flex w-full items-center justify-end md:ml-auto">
          <div className="flex items-center gap-x-2">
            {loading && <Skeleton className="h-9 w-24 rounded-md" />}

            {!loading && !user && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
                  Log In
                </Button>

                <Button size="sm" onClick={() => setIsOpen(true)}>
                  Get Started
                </Button>
              </>
            )}

            {!loading && user && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/workspace">Enter Workspace</Link>
                </Button>

                <Button variant="ghost" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            )}

            <ModeToggle />
          </div>
        </div>
      </nav>

      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
