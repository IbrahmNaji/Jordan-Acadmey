import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { authenticate, requirePermission } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { prisma } from '../../config/prisma';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  requirePermission('audit:read'),
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        action: z.string().trim().max(80).optional(),
        entityType: z.string().trim().max(60).optional(),
        entityId: z.string().trim().max(60).optional(),
        actorId: z.string().uuid().optional(),
        page: z.coerce.number().int().min(1).max(10_000).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(25),
      })
      .parse(req.query);

    const where: Prisma.AuditLogWhereInput = {
      ...(query.action && { action: { contains: query.action } }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...(query.actorId && { actorId: query.actorId }),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, fullName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ items, total, page: query.page, pageSize: query.pageSize });
  }),
);

export default router;
