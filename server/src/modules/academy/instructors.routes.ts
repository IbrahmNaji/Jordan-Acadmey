import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { recordAudit, requestIp } from '../../utils/audit';
import { entityId } from './shared';

const router = Router();
router.use(authenticate);

const createSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    specialty: z.string().trim().max(120).nullable().optional(),
    bio: z.string().trim().max(2000).nullable().optional(),
    phone: z.string().trim().max(24).nullable().optional(),
    email: z.string().trim().email().max(160).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

const updateSchema = createSchema.partial();

router.get(
  '/',
  requirePermission('courses:read'),
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        search: z.string().trim().min(1).max(120).optional(),
        includeInactive: z.enum(['true', 'false']).optional(),
      })
      .parse(req.query);

    const where: Prisma.InstructorWhereInput = {};
    if (query.includeInactive !== 'true') where.isActive = true;
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { specialty: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.instructor.findMany({
      where,
      include: { _count: { select: { courses: true, batches: true } } },
      orderBy: { fullName: 'asc' },
    });
    res.json({ items });
  }),
);

router.post(
  '/',
  requirePermission('courses:write'),
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const instructor = await prisma.instructor.create({
      data: {
        fullName: body.fullName,
        specialty: body.specialty ?? null,
        bio: body.bio ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        isActive: body.isActive ?? true,
      },
    });
    await recordAudit({
      actor: req.user,
      action: 'instructor.create',
      entityType: 'Instructor',
      entityId: instructor.id,
      summary: `إضافة مدرب ${instructor.fullName}`,
      ip: requestIp(req),
    });
    res.status(201).json(instructor);
  }),
);

router.patch(
  '/:id',
  requirePermission('courses:write'),
  validate({ body: updateSchema }),
  asyncHandler(async (req, res) => {
    const id = entityId(req.params.id, 'INSTRUCTOR_NOT_FOUND');
    const body = req.body as z.infer<typeof updateSchema>;
    const existing = await prisma.instructor.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'INSTRUCTOR_NOT_FOUND');

    const data: Prisma.InstructorUpdateInput = {};
    if (body.fullName !== undefined) data.fullName = body.fullName;
    if (body.specialty !== undefined) data.specialty = body.specialty;
    if (body.bio !== undefined) data.bio = body.bio;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.email !== undefined) data.email = body.email;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const updated = await prisma.instructor.update({ where: { id }, data });
    await recordAudit({
      actor: req.user,
      action: 'instructor.update',
      entityType: 'Instructor',
      entityId: id,
      summary: `تعديل مدرب ${updated.fullName}`,
      metadata: { fields: Object.keys(body) },
      ip: requestIp(req),
    });
    res.json(updated);
  }),
);

export default router;
