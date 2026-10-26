import type { Request } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from './logger';
import type { AuthUser } from '../middleware/auth';

interface AuditInput {
  actor?: AuthUser | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
}

/** Audit writes are best-effort: a logging failure must not roll back business state. */
export async function recordAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actor?.id ?? null,
        actorRole: input.actor?.role ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
        metadata: input.metadata,
        ipAddress: input.ip ?? null,
      },
    });
  } catch (error) {
    logger.error('Failed to write audit log', {
      action: input.action,
      entityType: input.entityType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function requestIp(req: Request): string | null {
  return req.ip ?? null;
}

/** Masks an email so failed-login audits can be correlated without storing contact data. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}
