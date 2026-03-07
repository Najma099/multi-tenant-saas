import { parentPort } from 'node:worker_threads';
import { redisClient, YJS_UPDATE_QUEUE } from "../services/redisQueue";
import * as Y from "yjs";
import { prisma } from "../database";
import { syncBlockText } from "../database/repository/block.repo";

const BATCH_DELAY_MS = 2000;
const pageUpdateBuffer = new Map<number, string[]>();

let isRunning = true;

parentPort?.on('message', async (msg) => {
  if (msg === 'shutdown') {
    isRunning = false;
    await redisClient.quit();
  }
});

setInterval(processBuffer, BATCH_DELAY_MS);

async function run() {
  console.log('[Worker] 🔁 Listening on Redis queue...');
  while (isRunning) {
    try {
      const item = await redisClient.brpop(YJS_UPDATE_QUEUE, 5);
      if (!item) continue;

      const { pageId, update } = JSON.parse(item[1]);
      console.log(`[Worker] 📥 Received update for pageId=${pageId}`);

      let entry = pageUpdateBuffer.get(pageId);
      if (!entry) {
        entry = [];
        pageUpdateBuffer.set(pageId, entry);
      }
      entry.push(update);

    } catch (err: any) {
      if (!isRunning) break;
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  await processBuffer();
  await prisma.$disconnect();
  process.exit(0);
}

async function processBuffer() {
  if (pageUpdateBuffer.size === 0) return;

  const entriesToProcess = Array.from(pageUpdateBuffer.entries());
  pageUpdateBuffer.clear();

  for (const [pageId, updatesText] of entriesToProcess) {
    try {
      console.log(`[Worker] Processing pageId=${pageId}, updates=${updatesText.length}`);

      const page = await prisma.page.findUnique({
        where: { id: parseInt(pageId.toString()) },
        select: { yjsState: true }
      });

      const doc = new Y.Doc();
      if (page?.yjsState) {
        Y.applyUpdate(doc, new Uint8Array(page.yjsState));
      }

      // Snapshot text BEFORE applying new updates
      const blockTexts = doc.getMap("block-texts");
      const before = new Map<string, string>();
      blockTexts.forEach((value, key) => {
        before.set(key, (value as Y.Text).toString());
      });

      // Apply all updates
      for (const updateBase64 of updatesText) {
        try {
          Y.applyUpdate(doc, Buffer.from(updateBase64, 'base64'));
        } catch (e) {
          console.error(`[Worker] Failed to apply update for pageId=${pageId}:`, e);
        }
      }

      // 1. Save merged yjsState blob
      await prisma.page.update({
        where: { id: parseInt(pageId.toString()) },
        data: { yjsState: Buffer.from(Y.encodeStateAsUpdate(doc)) }
      });

      // 2. Only sync blocks whose text actually changed 👈
      let syncCount = 0;
      for (const [blockIdStr, value] of blockTexts.entries()) {
        const text = (value as Y.Text).toString();
        if (before.get(blockIdStr) === text) continue; // skip unchanged

        const blockId = parseInt(blockIdStr);
        await syncBlockText(blockId, text)
          .then(() => {
            syncCount++;
            console.log(`[Worker] ✅ Synced blockId=${blockId} text="${text.slice(0, 30)}"`);
          })
          .catch((err) => console.error(`[Worker] ❌ Failed to sync blockId=${blockId}:`, err));
      }

      console.log(`[Worker] ✅ Saved pageId=${pageId}, synced ${syncCount} changed blocks`);

    } catch (error) {
      console.error(`[Worker] ❌ Failed to process pageId=${pageId}:`, error);
    }
  }
}

run();