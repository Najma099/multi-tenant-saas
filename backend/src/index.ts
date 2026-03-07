import http from "http";
import { app } from "./app";
import { port } from "./config";
import { initWsServer } from "./websocket/wsServer";
import { startDbWorker } from "./workers/dbWorker";

process.on("uncaughtException", () => {
  process.exit(1);
});

process.on("unhandledRejection", () => {
  process.exit(1);
});

async function start() {
  try {
    const httpServer = http.createServer(app);
    initWsServer(httpServer);

    startDbWorker().catch(() => { });

    httpServer.listen(port, () => {
    });
  } catch (err) {
    process.exit(1);
  }
}

start().catch(() => {
  process.exit(1);
});