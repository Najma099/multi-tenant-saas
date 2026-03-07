import { ClientMeta, broadcastToRoom } from "../room";
import { deleteBlock } from "../../database/repository/block.repo";

interface DeletePayload {
  blockId: number;
}

export async function handleBlockDelete(client: ClientMeta, payload: DeletePayload): Promise<void> {
  try {
    await deleteBlock(payload.blockId);
  } catch (err) {
    console.error(`[Delete] ❌ Failed to delete blockId=${payload.blockId}:`, err);
  }

  broadcastToRoom(client.pageId, {
    type: "block_deleted",
    blockId: payload.blockId,
  }, client);
}