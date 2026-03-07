import { WebSocket } from "ws";

export interface ClientMeta {
  userId: string;
  tabId: string;
  name: string;
  pageId: string;
  workspaceId: string;
  color: string;
  ws: WebSocket;
}

const rooms = new Map<string, Set<ClientMeta>>();

export function getUserColor(userId: string): string {
  const colors = [
    "#E57373", "#64B5F6", "#81C784", "#FFB74D",
    "#BA68C8", "#4DB6AC", "#F06292", "#7986CB",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function joinRoom(pageId: string, client: ClientMeta): void {
  if (!rooms.has(pageId)) rooms.set(pageId, new Set());
  rooms.get(pageId)!.add(client);
}

export function leaveRoom(pageId: string, client: ClientMeta): boolean {
  const room = rooms.get(pageId);
  if (!room) return true;

  room.delete(client);

  const hasOtherTabs = [...room].some((c) => c.userId === client.userId);

  if (room.size === 0) rooms.delete(pageId);

  return !hasOtherTabs;
}

export function getRoom(pageId: string): Set<ClientMeta> {
  return rooms.get(pageId) ?? new Set();
}

export function broadcastToRoom(
  pageId: string,
  message: object,
  excludeClient?: ClientMeta
): void {
  const room = getRoom(pageId);
  const data = JSON.stringify(message);

  for (const client of room) {
    if (client === excludeClient) continue;
    if (client.ws.readyState === client.ws.OPEN) {
      client.ws.send(data);
    }
  }
}