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
app.use(cors({ origin: originUrl, credentials: true, optionsSuccessStatus: 200 }));
app.use(cookieParser());

app.use('/api/v1', router);
app.get('/api/v1/health', async (_req, res) => {
  try {
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'warming' });
  }
});

app.use((_req, _res, next) => next(new NotFoundError()));
app.use(errorHandler);

function startWorker() {
  const workerPath = path.resolve(__dirname, './workers/worker.js');
  console.log(`[App] Spawning worker from: ${workerPath}`); 

  dbWorker = new Worker(workerPath, {
    stdout: true, 
    stderr: true, 
  });

  dbWorker.stdout?.pipe(process.stdout);
  dbWorker.stderr?.pipe(process.stderr);

  dbWorker.on('online', () => {
    console.log('[App] ✅ DB Worker is online'); 
  });

  dbWorker.on('error', (err) => {
    console.error('[App] ❌ DB Worker error:', err);
  });

  dbWorker.on('exit', (code) => {
    console.warn(`[App] DB Worker exited with code ${code}`);
    if (code !== 0) {
      console.log('[App] Restarting worker in 3s...');
      setTimeout(startWorker, 3000);
    }
  });
}

startWorker();

function shutdown() {
  console.log('[App] Shutdown signal received, notifying worker...');
  dbWorker?.postMessage('shutdown');
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);