"use client";

import { Block, BlockType } from "@/types/block.type";
import { createBlock, deleteBlock } from "@/lib/block.api";
import BlockItem from "./BlockItem";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import * as Y from "yjs";

export default function BlockList({
  blocks,
  loading,
  pageId,
  optimisticUpdateBlock,
  optimisticDeleteBlock,
  optimisticAddBlock,
  setBlocks,
  sendWsMessage,
  canEdit,
  sendCursorToBlock,
  yDoc,
}: {
  blocks: Block[];
  loading: boolean;
  pageId: number;
  refetchBlocks: () => void;
  optimisticUpdateBlock: (blockId: number, updates: Partial<Block>) => void;
  optimisticDeleteBlock: (blockId: number) => void;
  optimisticAddBlock: (newBlock: Block) => void;
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  sendWsMessage: (msg: Record<string, unknown>) => void;
  canEdit: boolean;
  sendCursorToBlock?: (blockId: number) => void;
  yDoc: Y.Doc;
}) {

  const handleCreateBelow = async (position: number) => {
    const tempId = -Date.now();

    const tempBlock: Block = {
      id: tempId,
      pageId,
      type: BlockType.PARAGRAPH,
      content: { text: "" },
      position,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    optimisticAddBlock(tempBlock);

    try {
      const realBlock = await createBlock(pageId, BlockType.PARAGRAPH, { text: "" }, position);
      setBlocks(prev => {
        const filtered = prev.filter(b => b.id !== tempId);
        return [...filtered, realBlock].sort((a, b) => a.position - b.position);
      });
      sendWsMessage({
        type: "block_create",
        tempId,
        realBlock,
      });
      toast.error("Failed to create block");
      optimisticDeleteBlock(tempId);
    } catch (error) {
    }
  };

  const handleDelete = async (blockId: number) => {
    const deletedBlock = blocks.find(b => b.id === blockId);
    optimisticDeleteBlock(blockId);

    try {
      await deleteBlock(pageId, blockId);
      sendWsMessage({
        type: "block_delete",
        blockId,
      });
      toast.error("Failed to delete block");
      if (deletedBlock) optimisticAddBlock(deletedBlock);
    } catch (error) {
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 py-8 w-full max-w-3xl mx-auto">
        {/* Page Title Skeleton */}
        <Skeleton className="h-10 w-[60%] mb-10" />

        {/* Blocks Skeletons */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[95%]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {blocks.length === 0 ? (
        <div
          className="text-zinc-400 cursor-text py-2 px-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded transition-colors"
          onClick={() => handleCreateBelow(0)}
        >
          Click here to start writing...
        </div>
      ) : (
        blocks.map((block, index) => (
          <BlockItem
            key={block.id}
            block={block}
            pageId={pageId}
            onDelete={handleDelete}
            onCreateBelow={handleCreateBelow}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
            optimisticUpdate={optimisticUpdateBlock}
            sendWsMessage={sendWsMessage}
            sendCursorToBlock={canEdit ? sendCursorToBlock : undefined}
            yDoc={yDoc}
          />
        ))
      )}
    </div>
  );
}