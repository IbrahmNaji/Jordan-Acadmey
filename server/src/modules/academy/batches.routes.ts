import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { recordAudit, requestIp } from '../../utils/audit';
import {
  batchStatusEnum,
  deliveryModeEnum,
  entityId,
  isUniqueViolation,
} from './shared';

const router = Router();
router.use(authenticate);

const createSchema = z
  .object({
    courseId: z.string().uuid(),
    code: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, 'رمز الدفعة غير صالح')
      .nullable()
      .optional(),
    title: z.string().trim().max(120).nullable().optional(),
    startDate: z.coerce.date().nullable().optional(),
    endDate: z.coerce.date().nullable().optional(),
    capacity: z.number().int().min(1).max(100_000).nullable().optional(),
    instructorId: z.string().uuid().nullable().optional(),
    status: batchStatusEnum.optional(),
    deliveryMode: deliveryModeEnum.nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

const updateSchema = createSchema.omit({ courseId: true }).partial();

function assertDateRange(start?: Date | null, end?: Date | null) {
  if (start && end && start > end) throw new AppError(400, 'INVALID_DATE_RANGE');
}

async function assertCourseAndInstructor(
  courseId: string,
  instructorId?: string | null,
) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });
  if (!course) throw new AppError(404, 'COURSE_NOT_FOUND');
  if (instructorId) {
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      select: { id: true },
    });
    if (!instructor) throw new AppError(404, 'INSTRUCTOR_NOT_FOUND');
  }
}

const BATCH_INCLUDE = {
  course: {
    select: {
      id: true,
      title: true,
      slug: true,
      courseType: true,
      status: true,
    },
  },
  instructor: { select: { id: true, fullName: true } },
  enrollments: {
    where: { status: { not: 'CANCELLED' as const } },
    select: { id: true },
  },
};

router.get(
  '/',
  requirePermission('courses:read'),
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        courseId: z.string().uuid().optional(),
        status: batchStatusEnum.optional(),
      })
      .parse(req.query);

    const where: Prisma.CourseBatchWhereInput = {};
    if (query.courseId) where.courseId = query.courseId;
    if (query.status) where.status = query.status;

    const rows = await prisma.courseBatch.findMany({
      where,
      include: BATCH_INCLUDE,
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    });

    const items = rows.map(({ enrollments, ...batch }) => ({
      ...batch,
      enrolledCount: enrollments.length,
    }));
    res.json({ items });
  }),
);

router.post(
  '/',
  requirePermission('courses:write'),
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    await assertCourseAndInstructor(body.courseId, body.instructorId);
    assertDateRange(body.startDate, body.endDate);

    try {
      const batch = await prisma.courseBatch.create({
        data: {
          courseId: body.courseId,
          code: body.code ?? null,
          title: body.title ?? null,
          startDate: body.startDate ?? null,
          endDate: body.endDate ?? null,
          capacity: body.capacity ?? null,
          instructorId: body.instructorId ?? null,
          status: body.status ?? 'PLANNED',
          deliveryMode: body.deliveryMode ?? null,
          notes: body.notes ?? null,
        },
        include: BATCH_INCLUDE,
      });
      const { enrollments, ...rest } = batch;
      await recordAudit({
        actor: req.user,
        action: 'batch.create',
        entityType: 'CourseBatch',
        entityId: batch.id,
        summary: `إنشاء دفعة ${batch.code ?? batch.title ?? batch.id}`,
        metadata: { courseId: batch.courseId, status: batch.status },
        ip: requestIp(req),
      });
      res.status(201).json({ ...rest, enrolledCount: enrollments.length });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(409, 'BATCH_CODE_TAKEN');
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
    const id = entityId(req.params.id, 'BATCH_NOT_FOUND');
    const body = req.body as z.infer<typeof updateSchema>;
    const existing = await prisma.courseBatch.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'BATCH_NOT_FOUND');
    await assertCourseAndInstructor(existing.courseId, body.instructorId);

    const nextStart =
      body.startDate !== undefined ? body.startDate : existing.startDate;
    const nextEnd = body.endDate !== undefined ? body.endDate : existing.endDate;
    assertDateRange(nextStart, nextEnd);

    if (body.capacity !== undefined && body.capacity !== null) {
      const active = await prisma.enrollment.count({
        where: { batchId: id, status: { not: 'CANCELLED' } },
      });
      if (body.capacity < active) {
        throw new AppError(409, 'CAPACITY_BELOW_ENROLLED');
      }
    }

    const data: Prisma.CourseBatchUpdateInput = {};
    if (body.code !== undefined) data.code = body.code;
    if (body.title !== undefined) data.title = body.title;
    if (body.startDate !== undefined) data.startDate = body.startDate;
    if (body.endDate !== undefined) data.endDate = body.endDate;
    if (body.capacity !== undefined) data.capacity = body.capacity;
    if (body.instructorId !== undefined) {
      data.instructor = body.instructorId
        ? { connect: { id: body.instructorId } }
        : { disconnect: true };
    }
    if (body.status !== undefined) data.status = body.status;
    if (body.deliveryMode !== undefined) {
      data.deliveryMode = body.deliveryMode;
    }
    if (body.notes !== undefined) data.notes = body.notes;

    try {
      const batch = await prisma.courseBatch.update({
        where: { id },
        data,
        include: BATCH_INCLUDE,
      });
      const { enrollments, ...rest } = batch;
      await recordAudit({
        actor: req.user,
        action: 'batch.update',
        entityType: 'CourseBatch',
        entityId: id,
        summary: `تعديل دفعة ${batch.code ?? batch.title ?? batch.id}`,
        metadata: {
          fields: Object.keys(body),
          status: batch.status,
          capacity: batch.capacity,
        },
        ip: requestIp(req),
      });
      res.json({ ...rest, enrolledCount: enrollments.length });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(409, 'BATCH_CODE_TAKEN');
      }
      throw error;
    }
  }),
);

export default router;
