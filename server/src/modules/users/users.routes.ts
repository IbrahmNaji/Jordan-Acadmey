// server/src/modules/users/users.routes.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { asyncHandler } from '../../utils/asyncHandler';
import { passwordSchema } from '../../utils/validation';
import { recordAudit, requestIp } from '../../utils/audit';

const router = Router();
router.use(authenticate);

const roleEnum = z.enum(['ADMIN', 'MANAGER', 'AGENT']);

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  phone: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

function userId(raw: unknown) {
  const parsed = z.string().uuid().safeParse(raw);
  if (!parsed.success) throw new AppError(404, 'USER_NOT_FOUND');
  return parsed.data;
}

router.get(
  '/',
  requirePermission('users:read'),
  asyncHandler(async (req, res) => {
    const query = z
      .object({ includeInactive: z.enum(['true', 'false']).optional() })
      .parse(req.query);

    res.json(
      await prisma.user.findMany({
        where:
          query.includeInactive === 'true' ? undefined : { isActive: true },
        select: publicUserSelect,
        orderBy: { fullName: 'asc' },
      })
    );
  })
);

router.post(
  '/',
  requirePermission('users:write'),
  validate({
    body: z
      .object({
        fullName: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(160),
        phone: z.string().trim().max(24).optional(),
        role: roleEnum,
        password: passwordSchema,
      })
      .strict(),
  }),
  asyncHandler(async (req, res) => {
    const { fullName, email, phone, role, password } = req.body as {
      fullName: string;
      email: string;
      phone?: string;
      role: 'ADMIN' | 'MANAGER' | 'AGENT';
      password: string;
    };

    const user = await prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        phone: phone || null,
        role,
        passwordHash: await bcrypt.hash(password, 12),
      },
      select: publicUserSelect,
    });

    await recordAudit({
      actor: req.user,
      action: 'user.create',
      entityType: 'User',
      entityId: user.id,
      summary: 'إنشاء مستخدم',
      metadata: { role },
      ip: requestIp(req),
    });

    res.status(201).json(user);
  })
);

router.patch(
  '/:id',
  requirePermission('users:write'),
  validate({
    body: z
      .object({
        fullName: z.string().trim().min(2).max(120).optional(),
        phone: z.string().trim().max(24).nullable().optional(),
        role: roleEnum.optional(),
        isActive: z.boolean().optional(),
      })
      .strict(),
  }),
  asyncHandler(async (req, res) => {
    const id = userId(req.params.id);
    const body = req.body as {
      fullName?: string;
      phone?: string | null;
      role?: 'ADMIN' | 'MANAGER' | 'AGENT';
      isActive?: boolean;
    };

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new AppError(404, 'USER_NOT_FOUND');

    if (id === req.user!.id) {
      if (body.isActive === false) {
        throw new AppError(400, 'CANNOT_DEACTIVATE_SELF');
      }
      if (body.role && body.role !== target.role) {
        throw new AppError(400, 'CANNOT_CHANGE_OWN_ROLE');
      }
    }

    const removingAdmin =
      target.role === 'ADMIN' &&
      target.isActive &&
      (body.role !== undefined && body.role !== 'ADMIN'
        ? true
        : body.isActive === false);

    if (removingAdmin) {
      const activeAdmins = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdmins <= 1) throw new AppError(400, 'LAST_ADMIN_PROTECTED');
    }

    if (body.role && body.role !== target.role) {
      await prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    if (body.isActive === false && target.isActive) {
      await prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(body.fullName !== undefined && { fullName: body.fullName }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      select: publicUserSelect,
    });

    await recordAudit({
      actor: req.user,
      action: 'user.update',
      entityType: 'User',
      entityId: id,
      summary: 'تعديل حساب مستخدم',
      metadata: {
        role: body.role ?? null,
        isActive: body.isActive ?? null,
      },
      ip: requestIp(req),
    });

    res.json(updated);
  })
);

router.post(
  '/:id/password',
  requirePermission('users:write'),
  validate({ body: z.object({ password: passwordSchema }).strict() }),
  asyncHandler(async (req, res) => {
    const id = userId(req.params.id);
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!target) throw new AppError(404, 'USER_NOT_FOUND');

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { passwordHash: await bcrypt.hash(req.body.password, 12) },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await recordAudit({
      actor: req.user,
      action: 'user.password_reset',
      entityType: 'User',
      entityId: id,
      summary: 'إعادة تعيين كلمة مرور مستخدم',
      ip: requestIp(req),
    });

    res.status(204).send();
  })
);

export default router;
