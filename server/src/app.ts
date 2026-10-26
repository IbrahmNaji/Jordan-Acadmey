// server/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
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

export const app = express();

app.disable('x-powered-by');
if (env.TRUST_PROXY) app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
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

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

app.use(errorHandler);
