import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { recordAudit, requestIp } from '../../utils/audit';
import { entityId, isUniqueViolation, slugSchema } from './shared';

const router = Router();
router.use(authenticate);

const createSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    slug: slugSchema,
    description: z.string().trim().max(500).nullable().optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
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
        includeInactive: z.enum(['true', 'false']).optional(),
      })
      .parse(req.query);

    const items = await prisma.courseCategory.findMany({
      where: query.includeInactive === 'true' ? {} : { isActive: true },
      include: { _count: { select: { courses: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
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
    try {
      const category = await prisma.courseCategory.create({
        data: {
          name: body.name,
          slug: body.slug,
          description: body.description ?? null,
          sortOrder: body.sortOrder ?? 0,
          isActive: body.isActive ?? true,
        },
      });
      await recordAudit({
        actor: req.user,
        action: 'category.create',
        entityType: 'CourseCategory',
        entityId: category.id,
        summary: `إنشاء تصنيف ${category.name}`,
        ip: requestIp(req),
      });
      res.status(201).json(category);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(409, 'CATEGORY_SLUG_TAKEN');
      }
      throw error;
    }
  }),
);

router.patch(
  '/:id',
  requirePermission('courses:write'),
  validate({ body: updateSchema }),
  asyncHandler(async (req, res) => {
    const id = entityId(req.params.id, 'CATEGORY_NOT_FOUND');
    const body = req.body as z.infer<typeof updateSchema>;
    const existing = await prisma.courseCategory.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'CATEGORY_NOT_FOUND');

    const data: Prisma.CourseCategoryUpdateInput = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.description !== undefined) data.description = body.description;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    try {
      const updated = await prisma.courseCategory.update({
        where: { id },
        data,
      });
      await recordAudit({
        actor: req.user,
        action: 'category.update',
        entityType: 'CourseCategory',
        entityId: id,
        summary: `تعديل تصنيف ${updated.name}`,
        metadata: { fields: Object.keys(body) },
        ip: requestIp(req),
      });
      res.json(updated);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(409, 'CATEGORY_SLUG_TAKEN');
      }
      throw error;
    }
  }),
);

export default router;
