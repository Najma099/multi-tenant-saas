'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2,
  Plus,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import WorkspaceItem from './workspaceItem'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import WorkspaceCreateModal from './workspaceCreateModal';
import { Workspace } from '@/types/workspace.type';
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkSpaceProfile() {
  const router = useRouter();
  const {
    workspaces,
    activeWorkspace,
    isLoading,
    switchWorkspace,
    removeWorkspace,
    renameWorkspace
  } = useWorkspace();

  const { user, loading: authLoading } = useAuth();
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  if (authLoading) return (
    <div className="flex items-center gap-3 p-4 w-full">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );

  const handleDelete = async (e: Event, id: number, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"?`)) return;

    setProcessingId(id);
    try {
      await removeWorkspace(id);
      toast.success("Workspace deleted");
    } catch {
      toast.error("Failed to delete workspace");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRename = async (e: Event, id: number, currentName: string) => {
    e.stopPropagation();
    const newName = prompt("Rename workspace:", currentName);
    if (!newName || newName === currentName) return;

    setProcessingId(id);
    try {
      await renameWorkspace(id, newName);
      toast.success("Workspace renamed");
    } catch {
      toast.error("Failed to rename");
    } finally {
      setProcessingId(null);
    }
  };

  const handleWorkspaceSwitch = (workspace: Workspace) => {
    switchWorkspace(workspace);
    router.push(`/workspace/${workspace.id}`);
  };


  const personalWorkspaces = workspaces.filter(w => (w._count?.members || 1) === 1);
  const sharedWorkspaces = workspaces.filter(w => (w._count?.members || 1) > 1);

  return (
    <div className="w-full px-2 py-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-2 h-12 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-0 group transition-colors"
            disabled={isLoading}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-white dark:text-zinc-900 shadow-sm transition-transform group-active:scale-95">
                {isLoading ? <Loader2 className="animate-spin" size={14} /> : (activeWorkspace?.name?.[0]?.toUpperCase() || <Building2 size={14} />)}
              </div>
              <div className="flex flex-col items-start overflow-hidden text-left">
                <span className="text-sm font-semibold truncate w-32">
                  {activeWorkspace?.name || 'Select Workspace'}
                </span>
                <span className="text-[10px] text-zinc-500 truncate w-32">
                  {user?.name || 'Workspace'}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-900 transition-colors" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64 p-1.5 shadow-xl border-zinc-200 dark:border-zinc-800" align="start" sideOffset={8}>
          <div className="px-2 py-2 mb-1">
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Account</p>
            <p className="text-xs font-medium truncate text-zinc-700 dark:text-zinc-300">{user?.email}</p>
          </div>

          <DropdownMenuSeparator className="opacity-50" />

          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold py-2 px-2">
            Workspaces
          </DropdownMenuLabel>

          <ScrollArea className="h-fit max-h-72">
            <DropdownMenuGroup className="space-y-0.5">

              {personalWorkspaces.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-[10px] px-2 py-1 text-zinc-500 uppercase">Personal</DropdownMenuLabel>
                  {personalWorkspaces.map(workspace => (
                    <WorkspaceItem
                      key={workspace.id}
                      workspace={workspace}
                      isActive={activeWorkspace?.id === workspace.id}
                      isProcessing={processingId === workspace.id}
                      handleWorkspaceSwitch={handleWorkspaceSwitch}
                      handleRename={handleRename}
                      handleDelete={handleDelete}
                    />
                  ))}
                </>
              )}

              {sharedWorkspaces.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-[10px] px-2 py-1 text-zinc-500 uppercase">Shared</DropdownMenuLabel>
                  {sharedWorkspaces.map(workspace => (
                    <WorkspaceItem
                      key={workspace.id}
                      workspace={workspace}
                      isActive={activeWorkspace?.id === workspace.id}
                      isProcessing={processingId === workspace.id}
                      handleWorkspaceSwitch={handleWorkspaceSwitch}
                      handleRename={handleRename}
                      handleDelete={handleDelete}
                      showOwner={true}
                      user={user}
                    />
                  ))}
                </>
              )}

            </DropdownMenuGroup>
          </ScrollArea>

          <DropdownMenuSeparator className="my-1.5 opacity-50" />

          <DropdownMenuItem
            onSelect={() => setIsNewWorkspaceModalOpen(true)}
            className="cursor-pointer gap-2 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 focus:bg-zinc-100 dark:focus:bg-zinc-800"
          >
            <Plus size={16} />
            <span className="text-xs font-medium">Add Workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WorkspaceCreateModal
        isOpen={isNewWorkspaceModalOpen}
        onClose={() => setIsNewWorkspaceModalOpen(false)}
      />
    </div>
  );
}

