'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { acceptWorkspaceInvite } from "@/lib/invite.api";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const { refreshWorkspaces } = useWorkspace();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleAccept = async () => {
      try {
        if (!params.token) return;
        const { workspaceId } = await acceptWorkspaceInvite(params.token);
        await refreshWorkspaces();

        setStatus("success");
        toast.success("Welcome to the workspace!");

        setTimeout(() => {
          router.push(`/workspace/${workspaceId}`);
        }, 1500);
      } catch (err: unknown) {
        setStatus("error");
        const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Invalid invitation";
        setErrorMessage(message);
        toast.error(message);
      }
    };

    handleAccept();
  }, [params.token, router, refreshWorkspaces]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400">Joining workspace...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-zinc-900 dark:text-zinc-100 font-semibold">Success! Redirecting...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-zinc-900 dark:text-zinc-100 font-semibold mb-2">Error</p>
            <p className="text-sm text-zinc-500">{errorMessage}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg"
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}