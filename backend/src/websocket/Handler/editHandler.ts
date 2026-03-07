import { ClientMeta, broadcastToRoom } from "../room";
import { updateBlock } from "../../database/repository/block.repo"; // adjust path
import { BlockType } from "@prisma/client";

interface EditPayload {
  blockId: number;
  content: Record<string, unknown>;
  type?: string;
}

export async function handleEdit(client: ClientMeta, payload: EditPayload): Promise<void> {
  try {
    await updateBlock(
      payload.blockId,
      payload.content,
      payload.type as BlockType | undefined
    );

    broadcastToRoom(client.pageId, {
      type: "edit_update",
      userId: client.userId,
      blockId: payload.blockId,
      content: payload.content,
      blockType: payload.type,
    }, client);
  } catch (err) {

    client.ws.send(JSON.stringify({
      type: "edit_error",
      blockId: payload.blockId,
      message: "Failed to save changes",
    }));
  }
}