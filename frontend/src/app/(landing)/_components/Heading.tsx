"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModel";

export const Heading = () => {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="max-w-3xl space-y-4 text-center">
        <h1 className="text-3xl font-bold sm:text-5xl md:text-5xl">
          Your Ideas💡, Documents📕, & Plans🚀. Welcome to{" "}
          <span className="underline">Zotion</span>
        </h1>

        <h2 className="text-base font-medium sm:text-xl">
          Zotion is the connected workspace where <br />
          better, faster work happens.
        </h2>

        {loading && (
          <div className="flex w-full items-center justify-center">
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        )}

        {!loading && user && (
          <Button asChild>
            <Link href="/workspace">
              Enter Workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}

        {!loading && !user && (
          <Button onClick={() => setIsOpen(true)}>
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
