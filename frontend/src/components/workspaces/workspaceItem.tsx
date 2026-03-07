import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Check, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Workspace } from '@/types/workspace.type';
import { User } from '@/types/auth.type';

interface WorkspaceItemProps {
    workspace: Workspace;
    isActive: boolean;
    isProcessing: boolean;
    handleWorkspaceSwitch: (workspace: Workspace) => void;
    handleRename: (e: Event, id: number, name: string) => void;
    handleDelete: (e: Event, id: number, name: string) => void;
    showOwner?: boolean;
    user?: User | null
}

export default function WorkspaceItem({
    workspace,
    isActive,
    isProcessing,
    handleWorkspaceSwitch,
    handleRename,
    handleDelete,
    showOwner = false,
    user
}: WorkspaceItemProps) {
    const isOwner = user?.id === workspace.owner.id;

    return (
        <div className="relative group/item">
            <DropdownMenuItem
                onSelect={() =>
                    !isProcessing && handleWorkspaceSwitch(workspace)
                }
                className={`flex items-center gap-2 p-2 cursor-pointer rounded-md transition-all ${isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
            >
                <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-colors ${isActive
                            ? 'bg-white dark:bg-zinc-700 border-zinc-300 text-zinc-900'
                            : 'bg-zinc-100 dark:bg-zinc-800 border-transparent'
                        }`}
                >
                    {isProcessing ? (
                        <Loader2 size={10} className="animate-spin" />
                    ) : (
                        workspace.name?.[0]?.toUpperCase()
                    )}
                </div>

                <span className="flex-1 truncate text-sm">
                    {workspace.name}
                    {workspace._count?.members > 1 && (
                        <span className="text-[10px] text-zinc-400 ml-1">
                            (Shared
                            {showOwner
                                ? workspace.owner?.id === user?.id
                                    ? ' by you'
                                    : workspace.owner?.name
                                        ? ` by ${workspace.owner.name}`
                                        : ''
                                : ''}
                            )
                        </span>
                    )}
                </span>

                {isActive && (
                    <Check
                        size={14}
                        className="text-zinc-900 dark:text-zinc-100"
                    />
                )}
            </DropdownMenuItem>

            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover/item:opacity-100 data-[state=open]:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal
                                size={14}
                                className="text-zinc-500"
                            />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32 shadow-lg">
                        <DropdownMenuItem
                            onSelect={(e) =>
                                handleRename(e, workspace.id, workspace.name)
                            }
                            className="gap-3 text-xs flex"
                        >
                            <Pencil size={12} /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={(e) =>
                                handleDelete(e, workspace.id, workspace.name)
                            }
                            className="gap-3 text-xs text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 flex"
                        >
                            <Trash2 size={12} /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
