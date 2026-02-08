import { app } from './app';
import { port } from './config';

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function start() {
  try {
    app.listen(port, () => {
      console.log(`Server running on port: ${port}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
