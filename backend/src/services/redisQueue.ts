import Redis from "ioredis";

// Config using local Redis fallback
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
export const redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

let hasLoggedError = false;
redisClient.on('error', (err: any) => {
    if (!hasLoggedError) {
        hasLoggedError = true;
    }
});
redisClient.on('connect', () => {
    if (hasLoggedError) {
        hasLoggedError = false;
    }
});

// Queue names
export const YJS_UPDATE_QUEUE = "yjs-update-queue";

export async function enqueueYjsUpdate(pageId: number, updateStr: string) {
    try {
        const data = JSON.stringify({ pageId, update: updateStr, timestamp: Date.now() });
        await redisClient.lpush(YJS_UPDATE_QUEUE, data);
    } catch (err) {
    }
}
