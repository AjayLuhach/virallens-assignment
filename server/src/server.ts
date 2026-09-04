import app from './app.js';
import config from './config.js';
import { closeDb, connectDb } from './db/index.js';

const start = async (): Promise<void> => {
  await connectDb();

  const server = app.listen(config.port, config.host, () => {
    console.log(`ViralLens support API listening on port ${config.port}`);
    console.log(`Health check: http://localhost:${config.port}/health`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received, shutting down`);
    server.close();
    await closeDb();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

try {
  await start();
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
