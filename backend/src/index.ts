import http from "http";
import { app } from "./app";
import { port } from "./config";
import { initWsServer } from "./websocket/wsServer";

process.on("uncaughtException", (err) => {
  console.error('[Server] Uncaught Exception:', err); // 👈 log it, don't swallow
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error('[Server] Unhandled Rejection:', reason); // 👈 same
  process.exit(1);
});

async function start() {
  try {
    const httpServer = http.createServer(app);
    initWsServer(httpServer);

    httpServer.listen(port, () => {
      console.log(`[Server] ✅ Running on port ${port}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error('[Server] start() rejected:', err);
  process.exit(1);
});