"use client";

import { useEffect, useRef } from "react";
import { wsClient } from "../lib/wsClient";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/apiClient";
import * as Y from "yjs";
import { CustomYjsProvider, YjsMessage } from "@/lib/yjsProvider";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:9090/ws";

interface UseWebSocketOptions {
  pageId: string;
  workspaceId: string;
  onMessage: (msg: Record<string, unknown>) => void;
}

export function useWebSocket({ pageId, workspaceId, onMessage }: UseWebSocketOptions) {
  const { user } = useAuth();

  const yDocRef = useRef(new Y.Doc());
  const yProviderRef = useRef<CustomYjsProvider | null>(null);

  const onMessageRef = useRef(onMessage);
  // eslint-disable-next-line react-hooks/refs
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!user) return;
    const token = apiClient.getAccessToken();
    if (!token) return;

    const timer = setTimeout(() => {
      wsClient.connect(WS_URL, {
        pageId: String(pageId),
        workspaceId: String(workspaceId),
        userId: String(user.id),
        name: user.name ?? user.email,
        token,
      });
    }, 50);


    yProviderRef.current = new CustomYjsProvider(yDocRef.current, (msg) => {
      wsClient.send(msg);
    });

    const unsub = wsClient.onMessage((msg) => {
      if (msg.type === "yjs_init" || msg.type === "yjs_update") {
        yProviderRef.current?.handleMessage(msg as unknown as YjsMessage);
      }
      onMessageRef.current(msg);
    });

    return () => {
      clearTimeout(timer);
      unsub();
      wsClient.disconnect();
    };
  }, [pageId, workspaceId, user]);

  return {
    send: (msg: Record<string, unknown>) => wsClient.send(msg),
    tabId: wsClient.getTabId(),
    // eslint-disable-next-line react-hooks/refs
    doc: yDocRef.current,
  };
}