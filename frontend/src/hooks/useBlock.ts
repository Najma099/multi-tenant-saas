"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchBlock } from "@/lib/block.api";
import { Block } from "@/types/block.type";

export function useBlocks(pageId?: number) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBlocks = useCallback(async () => {
    if (!pageId) return;

    try {
      setLoading(true);
      const data = await fetchBlock(pageId);
      setBlocks(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const optimisticUpdateBlock = useCallback((blockId: number, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    ));
  }, []);

  const optimisticDeleteBlock = useCallback((blockId: number) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
  }, []);

  const optimisticAddBlock = useCallback((newBlock: Block) => {
    setBlocks(prev => [...prev, newBlock].sort((a, b) => a.position - b.position));
  }, []);

  return {
    blocks,
    loading,
    setBlocks,
    refetchBlocks: loadBlocks,
    optimisticUpdateBlock,
    optimisticDeleteBlock,
    optimisticAddBlock,
  };
}