// server/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import leadsRoutes from './modules/leads/leads.routes';
import campaignsRoutes from './modules/campaigns/campaigns.routes';
import activitiesRoutes from './modules/activities/activities.routes';
import enrollmentsRoutes from './modules/enrollments/enrollments.routes';
import reportsRoutes from './modules/reports/reports.routes';
import usersRoutes from './modules/users/users.routes';
import publicRoutes from './modules/public/public.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import auditRoutes from './modules/audit/audit.routes';
import academyRoutes from './modules/academy';
import vehiclesRoutes from './modules/vehicles/vehicles.routes';
import brokerageRoutes from './modules/brokerage/brokerage.routes';
import workshopRoutes from './modules/workshop/workshop.routes';
import partsRoutes from './modules/parts/parts.routes';
import mediaRoutes from './modules/media/media.routes';
import {
  isAdminRecoveryDiagnosticsEnabled,
  registerAdminRecoveryDiagnostics,
} from './modules/adminRecovery/adminRecoveryDiagnostics';
import { bootstrapAdminAccount } from './modules/adminRecovery/adminBootstrap.service';
import { registerAdminBootstrapRoute } from './modules/adminRecovery/adminBootstrap.routes';

export const app = express();

app.disable('x-powered-by');
if (env.TRUST_PROXY) app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use(
  '/api',
  rateLimit({
    windowMs: 60_000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: 'RATE_LIMITED' });
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/brokerage', brokerageRoutes);
app.use('/api/workshop', workshopRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/media', mediaRoutes);

registerAdminRecoveryDiagnostics({
  app,
  enabled: isAdminRecoveryDiagnosticsEnabled(
    env.ADMIN_RECOVERY_DIAGNOSTICS_ENABLED,
  ),
  key: env.ADMIN_RECOVERY_DIAGNOSTICS_KEY,
  inspect: async () => {
    const [userCount, adminAccounts] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true, role: true },
        orderBy: { email: 'asc' },
      }),
    ]);

    return {
      userCount,
      adminAccounts,
    };
  },
});

registerAdminBootstrapRoute({
  app,
  enabled: env.ADMIN_BOOTSTRAP_ENABLED,
  key: env.ADMIN_BOOTSTRAP_KEY,
  createAdmin: ({ email, password }) => bootstrapAdminAccount(email, password),
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

app.use(errorHandler);
