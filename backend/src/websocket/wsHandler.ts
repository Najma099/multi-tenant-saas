
import { ClientMeta } from "./room";
import { handleCursor } from "./Handler/cursonHandler";
import { handleEdit } from "./Handler/editHandler";
import { handleBlockCreate } from "./Handler/createHandler";
import { handleBlockDelete } from "./Handler/deleteHandler";
import { applyClientUpdate } from "./yjsManager";
import { broadcastToRoom } from "./room";
import { enqueueYjsUpdate } from "../services/redisQueue";

interface IncomingMessage {
  type: string;
  [key: string]: unknown;
}

export function handleMessage(client: ClientMeta, raw: string): void {
  let msg: IncomingMessage;

  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }

  switch (msg.type) {
    case "block_create":
      handleBlockCreate(client, {
        tempId: msg.tempId as number,
        realBlock: msg.realBlock as Record<string, unknown>,
      });
      break;

    case "block_delete":
      handleBlockDelete(client, {
        blockId: msg.blockId as number,
      }).catch((err) => console.error('[WS] block_delete failed:', err)); ;
      break;
    case "cursor":
      handleCursor(client, { blockId: msg.blockId as number });
      break;

    case "edit":
      handleEdit(client, {
        blockId: msg.blockId as number,
        content: msg.content as Record<string, unknown>,
        type: msg.blockType as string | undefined,
      }).catch(() => { });
      break;

    case "yjs_update":
      const updateBase64 = msg.update as string;
      
      applyClientUpdate(client.pageId, updateBase64).catch(() => {});
    
      enqueueYjsUpdate(parseInt(client.pageId), updateBase64)
        .then(() => console.log(`[WS] ✅ Enqueued update for pageId=${client.pageId}`))
        .catch((err) => console.error(`[WS] ❌ Enqueue failed:`, err));

      broadcastToRoom(client.pageId, {
        type: "yjs_update",
        update: updateBase64,
        clientId: client.userId,
      }, client);
      break;

    default:
      break;
  }
}