import * as Y from "yjs";
import { enqueueYjsUpdate } from "../services/redisQueue";
import { prisma } from "../database";

const documents = new Map<string, Y.Doc>();
const loadingDocs = new Map<string, Promise<Y.Doc>>();

export async function getOrLoadDocument(pageId: string): Promise<Y.Doc> {
    if (documents.has(pageId)) return documents.get(pageId)!;

    if (!loadingDocs.has(pageId)) {
        loadingDocs.set(pageId, (async () => {
            const doc = new Y.Doc();
            try {
                const page = await prisma.page.findUnique({
                    where: { id: parseInt(pageId) },
                    select: { yjsState: true }
                });
                if (page && page.yjsState) {
                    Y.applyUpdate(doc, new Uint8Array(page.yjsState));
                }
            } catch (e) {
            }

            doc.on("update", (update: Uint8Array) => {
                const updateBase64 = Buffer.from(update).toString("base64");
                enqueueYjsUpdate(parseInt(pageId), updateBase64).catch(() => { });
            });

            documents.set(pageId, doc);
            loadingDocs.delete(pageId);
            return doc;
        })());
    }

    return loadingDocs.get(pageId)!;
}

export async function applyClientUpdate(pageId: string, updateBase64: string): Promise<void> {
    const doc = await getOrLoadDocument(pageId);
    try {
        const updateBuffer = Buffer.from(updateBase64, "base64");
        Y.applyUpdate(doc, updateBuffer);
    } catch (err) {
    }
}

export async function encodeDocumentState(pageId: string): Promise<string> {
    const doc = await getOrLoadDocument(pageId);
    const stateVector = Y.encodeStateAsUpdate(doc);
    return Buffer.from(stateVector).toString("base64");
}

export function destroyDocumentIfEmpty(pageId: string): void {
    documents.delete(pageId);
}
