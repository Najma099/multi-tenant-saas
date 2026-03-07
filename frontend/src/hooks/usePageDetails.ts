"use client";

import { useEffect, useState, useCallback } from "react";
import { Page } from "@/types/page.type";
import { fetchPageById } from "@/lib/page.api";
import { useWorkspace } from "@/context/WorkspaceContext";

export function usePageDetail(pageId: number) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);

  const { activeWorkspace } = useWorkspace();

  const refetchPage = useCallback(async () => {
    if (!pageId || !activeWorkspace) return;

    try {
      setLoading(true);
      const data = await fetchPageById(activeWorkspace.id, pageId);
      setPage(data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [pageId, activeWorkspace]);

  useEffect(() => {
    refetchPage();
  }, [refetchPage]);

  return { page, loading, refetchPage };
}