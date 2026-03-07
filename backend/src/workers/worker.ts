import { parentPort } from 'node:worker_threads';
import { redisClient, YJS_UPDATE_QUEUE } from "../services/redisQueue";
import * as Y from "yjs";
import { prisma } from "../database";

const BATCH_DELAY_MS = 2000;
const pageUpdateBuffer = new Map<number, string[]>();

let isRunning = true;

parentPort?.on('message', (msg) => {
  if (msg === 'shutdown') {
    isRunning = false;
  }
});

setInterval(processBuffer, BATCH_DELAY_MS);

async function run() {
  while (isRunning) {
    try {
      const item = await redisClient.brpop(YJS_UPDATE_QUEUE, 5);
      if (!item) continue;

      const { pageId, update } = JSON.parse(item[1]);

      let entry = pageUpdateBuffer.get(pageId);
      if (!entry) {
        entry = [];
        pageUpdateBuffer.set(pageId, entry);
      }
      entry.push(update);

    } catch (err) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Final flush before exiting
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
      const page = await prisma.page.findUnique({
        where: { id: parseInt(pageId.toString()) },
        select: { yjsState: true }
      });

      const doc = new Y.Doc();
      if (page?.yjsState) {
        Y.applyUpdate(doc, new Uint8Array(page.yjsState));
      }

      for (const updateBase64 of updatesText) {
        try {
          const updateBuffer = Buffer.from(updateBase64, 'base64');
          Y.applyUpdate(doc, updateBuffer);
        } catch {}
      }

      await prisma.page.update({
        where: { id: parseInt(pageId.toString()) },
        data: { yjsState: Buffer.from(Y.encodeStateAsUpdate(doc)) }
      });
    } catch {}
  }
}

run();