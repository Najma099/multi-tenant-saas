import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { originUrl } from './config';
import router from './routes/index';
import { errorHandler } from './middleware/error.middleware';
import { NotFoundError } from './core/ApiError';

import { Worker } from 'node:worker_threads';
import path from 'path';

let dbWorker: Worker;

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

export const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }));

app.use(helmet());

app.use(cors({
  origin: originUrl,
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(cookieParser());

app.get('/health', async (_req, res) => {
  try {
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'warming' });
  }
});

app.use('/api/v1', router);
app.use((_req, _res, next) => next(new NotFoundError()));
app.use(errorHandler);

function startWorker() {
  dbWorker = new Worker(path.resolve(__dirname, './worker.js'));

  dbWorker.on('error', (err) => {
    console.error('DB Worker error:', err);
  });

  dbWorker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`DB Worker exited with code ${code}, restarting...`);
      setTimeout(startWorker, 3000);
    }
  });
}

startWorker();

function shutdown() {
  console.log("Shutting down worker...");
  dbWorker?.postMessage('shutdown');
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);