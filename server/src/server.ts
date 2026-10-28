import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';

let server: ReturnType<typeof app.listen> | undefined;
let shuttingDown = false;

async function main() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    server = app.listen(env.PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server listening on port ${env.PORT}`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Received ${signal}; shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out.');
    process.exit(1);
  }, 25_000);
  forceExit.unref();

  const finish = async (error?: Error) => {
    if (error) logger.error('HTTP server shutdown failed:', error);
    clearTimeout(forceExit);
    try {
      await prisma.$disconnect();
      process.exit(error ? 1 : 0);
    } catch (disconnectError) {
      logger.error('Database disconnect failed:', disconnectError);
      process.exit(1);
    }
  };

  if (server) server.close((error) => void finish(error));
  else await finish();
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

main();
