import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { safePrismaErrorLogMessage } from '../utils/safePrismaErrorLog';

type PrismaLoggingOptions = {
  log: [
    { emit: 'stdout'; level: 'warn' },
    { emit: 'event'; level: 'error' },
  ];
};

type PrismaClientWithErrorEvents = PrismaClient<PrismaLoggingOptions>;

const globalForPrisma = global as unknown as {
  prisma?: PrismaClientWithErrorEvents;
  safePrismaErrorLogAttached?: boolean;
};

export const prisma: PrismaClientWithErrorEvents =
  globalForPrisma.prisma ??
  new PrismaClient<PrismaLoggingOptions>({
    log: [
      { emit: 'stdout', level: 'warn' },
      { emit: 'event', level: 'error' },
    ],
  });
 
if (!globalForPrisma.safePrismaErrorLogAttached) {
  prisma.$on('error', (event) => {
    logger.error(safePrismaErrorLogMessage(event));
  });
  globalForPrisma.safePrismaErrorLogAttached = true;
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
