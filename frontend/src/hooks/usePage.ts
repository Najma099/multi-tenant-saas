"use client";

import { useEffect, useState, useCallback } from "react";
import { Page } from "@/types/page.type";
import { fetchPageByWorkspace } from "../lib/page.api";
import { useWorkspace } from "@/context/WorkspaceContext";

export function usePage() {
  const { activeWorkspace } = useWorkspace();

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);

  const refetchPages = useCallback(async () => {
    if (!activeWorkspace) {
      setPages([]);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchPageByWorkspace(activeWorkspace.id);
      setPages(data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    refetchPages();
  }, [refetchPages]);

  return {
    pages,
    loading,
    refetchPages,
  };
}
