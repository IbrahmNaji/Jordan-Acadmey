import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { recordAudit, requestIp } from '../../utils/audit';
import { parseDateOnly } from './shared';

const router = Router();
router.use(authenticate);

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ يجب أن يكون بصيغة YYYY-MM-DD');

const attendanceStatusEnum = z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);

const recordSchema = z
  .object({
    enrollmentId: z.string().uuid(),
    status: attendanceStatusEnum,
    note: z.string().trim().max(300).nullable().optional(),
  })
  .strict();

const saveSchema = z
  .object({
    batchId: z.string().uuid(),
    sessionDate: dateOnlySchema,
    records: z.array(recordSchema).min(1).max(500),
  })
  .strict()
  .refine(
    (value) =>
      new Set(value.records.map((row) => row.enrollmentId)).size ===
      value.records.length,
    { message: 'DUPLICATE_ENROLLMENT', path: ['records'] },
  );

router.get(
  '/',
  requirePermission('attendance:read'),
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        batchId: z.string().uuid(),
        date: dateOnlySchema.optional(),
      })
      .parse(req.query);

    const dateValue = query.date ?? new Date().toISOString().slice(0, 10);
    const sessionDate = parseDateOnly(dateValue);

    const batch = await prisma.courseBatch.findUnique({
      where: { id: query.batchId },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        capacity: true,
        startDate: true,
        endDate: true,
        course: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!batch) throw new AppError(404, 'BATCH_NOT_FOUND');

    const enrollments = await prisma.enrollment.findMany({
      where: { batchId: batch.id, status: { not: 'CANCELLED' } },
      select: {
        id: true,
        status: true,
        lead: { select: { id: true, fullName: true, phone: true } },
        attendance: {
          where: { sessionDate },
          select: { status: true, note: true },
        },
      },
    });

    const students = enrollments
      .map(({ attendance, ...row }) => ({
        ...row,
        attendance: attendance[0] ?? null,
      }))
      .sort((a, b) => a.lead.fullName.localeCompare(b.lead.fullName, 'ar'));

    res.json({
      batch,
      sessionDate: dateValue,
      students,
    });
  }),
);

router.post(
  '/',
  requirePermission('attendance:write'),
  validate({ body: saveSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof saveSchema>;
    const sessionDate = parseDateOnly(body.sessionDate);

    const batch = await prisma.courseBatch.findUnique({
      where: { id: body.batchId },
      select: { id: true },
    });
    if (!batch) throw new AppError(404, 'BATCH_NOT_FOUND');

    const enrollmentIds = body.records.map((row) => row.enrollmentId);
    const validCount = await prisma.enrollment.count({
      where: {
        batchId: batch.id,
        id: { in: enrollmentIds },
        status: { not: 'CANCELLED' },
      },
    });
    if (validCount !== enrollmentIds.length) {
      throw new AppError(400, 'ATTENDANCE_ENROLLMENT_MISMATCH');
    }

    const saved = await prisma.$transaction(
      body.records.map((row) =>
        prisma.attendance.upsert({
          where: {
            enrollmentId_sessionDate: {
              enrollmentId: row.enrollmentId,
              sessionDate,
            },
          },
          update: {
            status: row.status,
            note: row.note ?? null,
            recordedById: req.user!.id,
          },
          create: {
            enrollmentId: row.enrollmentId,
            sessionDate,
            status: row.status,
            note: row.note ?? null,
            recordedById: req.user!.id,
          },
        }),
      ),
    );

    await recordAudit({
      actor: req.user,
      action: 'attendance.record',
      entityType: 'CourseBatch',
      entityId: batch.id,
      summary: `تسجيل حضور ${saved.length} طالب بتاريخ ${body.sessionDate}`,
      metadata: { sessionDate: body.sessionDate, records: saved.length },
      ip: requestIp(req),
    });

    res.json({ saved: saved.length, sessionDate: body.sessionDate });
  }),
);

export default router;
