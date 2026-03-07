"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBlocks } from "@/hooks/useBlock";
import { usePageDetail } from "@/hooks/usePageDetails";
import { useWorkspace } from "@/context/WorkspaceContext";
import BlockList from "./BlockList";
import PageHeader from "../WorkspacePages/PageHeader";
import { updatePage } from "@/lib/page.api";
import { Block } from "@/types/block.type";
import { History } from "lucide-react";
import { toast } from "sonner";

import { useWebSocket } from "@/hooks/useWebsockets";
import { useCursor } from "@/hooks/useCursor";
import CursorOverlay from "@/components/CursonOverlay";

export default function BlockEditor({ pageId }: { pageId: number }) {
  const { activeWorkspace } = useWorkspace();
  const { page } = usePageDetail(pageId);

  const {
    blocks,
    loading,
    refetchBlocks,
    optimisticUpdateBlock,
    optimisticDeleteBlock,
    optimisticAddBlock,
    setBlocks,
  } = useBlocks(pageId);

  const [icon, setIcon] = useState("");
  const [cover, setCover] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const synced = useRef(false);

  const canEdit = activeWorkspace?.role !== "VIEWER";

  useEffect(() => {
    synced.current = false;
    setIcon("");
    setCover("");
  }, [pageId]);

  useEffect(() => {
    if (page && !synced.current) {
      setIcon(page.icon ?? "");
      setCover(page.coverImage ?? "");
      synced.current = true;
    }
  }, [page]);

  const handleMessage = useCallback(
    (msg: Record<string, unknown>) => {
      switch (msg.type) {
        case "cursor_update":
        case "user_left":
        case "user_joined":
          // eslint-disable-next-line react-hooks/immutability
          handleCursorMessage(msg);
          break;

        case "edit_update":
          setBlocks((prev) =>
            prev.map((b) =>
              b.id === msg.blockId
                ? {
                  ...b,
                  content: msg.content as Block["content"],
                  type: (msg.blockType as Block["type"]) ?? b.type,
                }
                : b
            )
          );
          break;

        case "edit_error":
          toast.error("Failed to save changes — please try again");
          refetchBlocks();
          break;

        case "restore":
          toast.info("Page was restored to a previous version");
          refetchBlocks();
          break;

        case "block_created":
          setBlocks(prev => {
            const exists = prev.some(b => b.id === (msg.realBlock as Block).id);
            if (exists) return prev;
            return [...prev, msg.realBlock as Block].sort((a, b) => a.position - b.position);
          });
          break;

        case "block_deleted":
          setBlocks(prev => prev.filter(b => b.id !== msg.blockId));
          break;
      }
    },
    [setBlocks, refetchBlocks]
  );

  const { send, doc: yDoc } = useWebSocket({
    pageId: String(pageId),
    workspaceId: String(activeWorkspace?.id),
    onMessage: handleMessage,
  });

  const { cursors, sendCursorToBlock, handleCursorMessage } = useCursor(
    send,
    String(pageId)
  );

  const handleOptimisticUpdate = useCallback(
    (blockId: number, updates: Partial<Block>) => {
      optimisticUpdateBlock(blockId, updates);
    },
    [optimisticUpdateBlock]
  );

  const handleIconChange = async (newIcon: string) => {
    setIcon(newIcon);
    try {
      await updatePage(activeWorkspace!.id, pageId, { icon: newIcon });
    } catch {
      toast.error("Failed to update icon");
    }
  };

  const handleCoverChange = async (newCover: string) => {
    setCover(newCover);
    try {
      await updatePage(activeWorkspace!.id, pageId, { coverImage: newCover });
    } catch {
      setCover(cover);
      toast.error("Failed to update cover");
    }
  };

  if (!activeWorkspace) return null;

  return (
    <div className="relative">
      <PageHeader
        icon={icon}
        cover={cover}
        onIconChange={handleIconChange}
        onCoverChange={handleCoverChange}
      />

      <div className="flex items-center justify-end px-24 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <button
          onClick={() => setHistoryOpen(true)}
          className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
        >
          <History size={13} />
          History
        </button>
      </div>

      <div className="relative mx-auto max-w-225 px-24 pb-32">
        <CursorOverlay cursors={cursors} />

        <BlockList
          blocks={blocks}
          loading={loading}
          pageId={pageId}
          refetchBlocks={refetchBlocks}
          optimisticUpdateBlock={handleOptimisticUpdate}
          optimisticDeleteBlock={optimisticDeleteBlock}
          optimisticAddBlock={optimisticAddBlock}
          setBlocks={setBlocks}
          sendWsMessage={canEdit ? send : () => { }}
          canEdit={canEdit}
          sendCursorToBlock={canEdit ? sendCursorToBlock : undefined}
          yDoc={yDoc}
        />

        {!canEdit && (
          <p className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
            You have view-only access to this page
          </p>
        )}
      </div>
    </div>
  );
}