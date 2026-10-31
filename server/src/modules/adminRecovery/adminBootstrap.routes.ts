import { createHash, timingSafeEqual } from 'node:crypto';
import express, { type Express, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import { passwordSchema } from '../../utils/validation';
import { AdminBootstrapConflictError } from './adminBootstrap.service';

type AdminBootstrapRateLimitGlobal = typeof globalThis & {
  __adminBootstrapRateLimiter?: ReturnType<typeof rateLimit>;
};
const bootstrapGlobal = globalThis as AdminBootstrapRateLimitGlobal;
const adminBootstrapRateLimiter =
  bootstrapGlobal.__adminBootstrapRateLimiter ??
  rateLimit({
    windowMs: 60_000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ error: 'RATE_LIMITED' }),
  });
bootstrapGlobal.__adminBootstrapRateLimiter = adminBootstrapRateLimiter;

const createAdminBodySchema = z
  .object({
    email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
    password: passwordSchema,
  })
  .strict();

interface RegisterAdminBootstrapOptions {
  app: Express;
  enabled: boolean;
  key?: string;
  createAdmin: (input: {
    email: string;
    password: string;
  }) => Promise<{ email: string; role: string }>;
}

function matchesKey(suppliedKey: string, expectedKey: string): boolean {
  const suppliedDigest = createHash('sha256').update(suppliedKey).digest();
  const expectedDigest = createHash('sha256').update(expectedKey).digest();
  return timingSafeEqual(suppliedDigest, expectedDigest);
}

function createBootstrapKeyGuard(expectedKey: string): RequestHandler {
  return (req, res, next) => {
    const suppliedKey = req.get('x-admin-bootstrap-key') ?? '';
    if (!matchesKey(suppliedKey, expectedKey)) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }
    next();
  };
}

export function registerAdminBootstrapRoute({
  app,
  enabled,
  key,
  createAdmin,
}: RegisterAdminBootstrapOptions): void {
  if (!enabled) return;
  if (!key || Buffer.byteLength(key, 'utf8') < 32) {
    throw new Error('Admin bootstrap requires a temporary key of at least 32 bytes.');
  }

  const router = express.Router();
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  router.post(
    '/create-admin',
    adminBootstrapRateLimiter,
    createBootstrapKeyGuard(key),
    async (req, res) => {
      const parsed = createAdminBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'INVALID_REQUEST' });
      }

      try {
        const user = await createAdmin(parsed.data);
        return res.status(201).json({
          status: 'created',
          email: user.email,
          role: user.role,
        });
      } catch (error) {
        if (error instanceof AdminBootstrapConflictError) {
          return res.status(409).json({ error: 'BOOTSTRAP_NOT_AVAILABLE' });
        }
        logger.error('Admin bootstrap failed; error details were suppressed.');
        return res.status(503).json({ error: 'BOOTSTRAP_UNAVAILABLE' });
      }
    },
  );

  app.use('/api/_ops/admin-bootstrap', router);
}
