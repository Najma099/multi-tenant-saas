"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Page } from "@/types/page.type";
import { deletePage, updatePage } from "@/lib/page.api";
import { useWorkspace } from "@/context/WorkspaceContext";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash, FileText } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/skeleton";

export default function PagesList({
  pages,
  loading,
  refetchPages,
}: {
  pages: Page[];
  loading: boolean;
  refetchPages: () => void;
}) {
  const { activeWorkspace } = useWorkspace();
  const params = useParams();

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [title, setTitle] = useState("");

  const pageIdFromUrl = params.pageId;
  const workspaceId = activeWorkspace?.id;

  const handleRename = async (pageId: number) => {
    if (!activeWorkspace || !title.trim()) return;
    setProcessingId(pageId);
    try {
      await updatePage(activeWorkspace.id, pageId, {
        title: title.trim(),
        parentPageId: null
      });
      setEditingPageId(null);
      refetchPages();
    } catch {
      toast.error("Failed to rename page");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (pageId: number) => {
    if (!activeWorkspace) return;
    setProcessingId(pageId);
    try {
      await deletePage(activeWorkspace.id, pageId);
      toast.success("Page moved to trash");
      refetchPages();
    } catch {
      toast.error("Failed to delete page");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 p-2">
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-4 w-[85%]" />
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {pages.map((page) => {
        const isProcessing = processingId === page.id;
        const isMenuOpen = openMenuId === page.id;
        const isActive = pageIdFromUrl === String(page.id);

        return (
          <div key={page.id} className="relative group">
            <Link
              href={`/workspace/${workspaceId}/pages/${page.id}`}
              className={`flex items-center justify-between px-2 py-1 rounded-md text-sm transition-colors ${isActive
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                } ${isMenuOpen ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
            >
              <div className="flex items-center flex-1 truncate mr-2 gap-2">
                <div className="shrink-0 w-4 h-4 flex items-center justify-center">
                  {isProcessing ? (
                    <Spinner />
                  ) : (
                    <FileText size={14} className={isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"} />
                  )}
                </div>

                <div className="flex-1 truncate">
                  {editingPageId === page.id ? (
                    <input
                      autoFocus
                      value={title}
                      onClick={(e) => e.preventDefault()}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => setEditingPageId(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRename(page.id);
                        }
                        if (e.key === "Escape") setEditingPageId(null);
                      }}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-1 outline-none"
                    />
                  ) : (
                    <span className={isProcessing ? "opacity-50" : ""}>
                      {page.title || "Untitled"}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* Actions Dropdown */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <DropdownMenu.Root onOpenChange={(open) => setOpenMenuId(open ? page.id : null)}>
                <DropdownMenu.Trigger asChild>
                  <button
                    disabled={isProcessing}
                    onClick={(e) => e.preventDefault()}
                    className={`p-1 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded transition-opacity outline-none ${isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                  >
                    <MoreHorizontal size={14} className="text-zinc-500" />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-md p-1 z-50"
                    side="right"
                    align="start"
                  >
                    <DropdownMenu.Item
                      onSelect={() => {
                        setEditingPageId(page.id);
                        setTitle(page.title);
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs outline-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    >
                      <Pencil size={12} /> Rename
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px bg-zinc-200 dark:border-zinc-800 my-1" />
                    <DropdownMenu.Item
                      onSelect={() => handleDelete(page.id)}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs outline-none cursor-pointer hover:bg-red-50 text-red-600 rounded"
                    >
                      <Trash size={12} /> Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        );
      })}
    </div>
  );
}
