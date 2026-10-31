import { createHash, timingSafeEqual } from 'node:crypto';
import express, {
  type Express,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import rateLimit from 'express-rate-limit';

const diagnosticsGlobal = globalThis as typeof globalThis & {
  __adminRecoveryDiagnosticsRateLimiter?: ReturnType<typeof rateLimit>;
};
const adminRecoveryDiagnosticsRateLimiter =
  diagnosticsGlobal.__adminRecoveryDiagnosticsRateLimiter ??
  rateLimit({
    windowMs: 60_000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ error: 'RATE_LIMITED' }),
  });
diagnosticsGlobal.__adminRecoveryDiagnosticsRateLimiter =
  adminRecoveryDiagnosticsRateLimiter;

export interface AdminRecoveryDiagnosticsResult {
  userCount: number;
  adminAccounts: Array<{ email: string; role: string }>;
}

export interface AdminRecoveryDiagnosticsResponse {
  userCount: number;
  adminAccounts: Array<{ email: string; role: string }>;
}

interface RegisterAdminRecoveryDiagnosticsOptions {
  app: Express;
  enabled: boolean;
  key?: string;
  inspect: () => Promise<AdminRecoveryDiagnosticsResult>;
}

export function isAdminRecoveryDiagnosticsEnabled(value?: boolean): boolean {
  return value === true;
}

export function toAdminRecoveryDiagnosticsResponse(
  result: AdminRecoveryDiagnosticsResult,
): AdminRecoveryDiagnosticsResponse {
  return {
    userCount: result.userCount,
    adminAccounts: result.adminAccounts.map(({ email, role }) => ({ email, role })),
  };
}

function matchesKey(suppliedKey: string, expectedKey: string): boolean {
  const suppliedDigest = createHash('sha256').update(suppliedKey).digest();
  const expectedDigest = createHash('sha256').update(expectedKey).digest();
  return timingSafeEqual(suppliedDigest, expectedDigest);
}

export function createAdminRecoveryKeyGuard(expectedKey: string): RequestHandler {
  if (Buffer.byteLength(expectedKey, 'utf8') < 32) {
    throw new Error('Admin recovery diagnostics key must be at least 32 bytes.');
  }

  return (req, res, next) => {
    const suppliedKey = req.get('x-admin-recovery-key') ?? '';
    if (!matchesKey(suppliedKey, expectedKey)) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }
    next();
  };
}

export function registerAdminRecoveryDiagnostics({
  app,
  enabled,
  key,
  inspect,
}: RegisterAdminRecoveryDiagnosticsOptions): void {
  if (!enabled) return;
  if (!key || Buffer.byteLength(key, 'utf8') < 32) {
    throw new Error('Admin recovery diagnostics key must be at least 32 bytes.');
  }

  const router = express.Router();
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  router.post(
    '/inspect',
    adminRecoveryDiagnosticsRateLimiter,
    createAdminRecoveryKeyGuard(key),
    async (_req, res) => {
      try {
        res.json(toAdminRecoveryDiagnosticsResponse(await inspect()));
      } catch {
        // Never pass database errors to the global logger or response.
        res.status(503).json({ error: 'DIAGNOSTICS_UNAVAILABLE' });
      }
    },
  );

  app.use('/api/_ops/admin-recovery', router);
}
