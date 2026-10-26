import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
router.use(authenticate);

const courseEnum = z.enum([
  'MECHANICS',
  'ELECTRICAL',
  'DIAGNOSTICS',
  'HYBRID',
]);
const statusEnum = z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']);
const paymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'SHAM_CASH',
  'OTHER',
]);

const COURSE_LABEL: Record<z.infer<typeof courseEnum>, string> = {
  MECHANICS: 'ميكانيكا',
  ELECTRICAL: 'كهرباء',
  DIAGNOSTICS: 'تشخيص أعطال',
  HYBRID: 'هايبرد',
};

const DETAIL_INCLUDE = {
  lead: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      whatsapp: true,
      email: true,
    },
  },
  payments: { orderBy: { paidAt: 'desc' as const } },
};

router.post(
  '/',
  validate({
    body: z.object({
      leadId: z.string().uuid(),
      course: courseEnum,
      totalFee: z.number().positive().max(1_000_000_000),
      paymentPlan: z.string().trim().max(120).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      notes: z.string().trim().max(2000).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { leadId, course, totalFee, paymentPlan, startDate, endDate, notes } =
      req.body as {
        leadId: string;
        course: z.infer<typeof courseEnum>;
        totalFee: number;
        paymentPlan?: string;
        startDate?: Date;
        endDate?: Date;
        notes?: string;
      };

    if (startDate && endDate && startDate > endDate) {
      throw new AppError(400, 'INVALID_DATE_RANGE');
    }

    const [lead, existing] = await Promise.all([
      prisma.lead.findUnique({ where: { id: leadId } }),
      prisma.enrollment.findUnique({ where: { leadId } }),
    ]);
    if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND');
    if (existing) throw new AppError(409, 'LEAD_ALREADY_ENROLLED');

    const enrollment = await prisma.$transaction(async (tx) => {
      const created = await tx.enrollment.create({
        data: {
          leadId,
          course,
          totalFee,
          paymentPlan,
          startDate,
          endDate,
          notes,
        },
        include: DETAIL_INCLUDE,
      });
      await tx.lead.update({
        where: { id: leadId },
        data: { status: 'ENROLLED', convertedAt: new Date() },
      });
      await tx.activity.create({
        data: {
          leadId,
          userId: req.user!.id,
          type: 'ENROLLMENT',
          content: `تم التسجيل في دورة ${COURSE_LABEL[course]} برسوم ${Number(
            totalFee,
          ).toLocaleString('en-US')} ل.س`,
        },
      });
      return created;
    });

    res.status(201).json(enrollment);
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        status: statusEnum.optional(),
        course: courseEnum.optional(),
        search: z.string().trim().min(1).optional(),
      })
      .parse(req.query);

    const where: Prisma.EnrollmentWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.course) where.course = query.course;
    if (query.search) {
      where.lead = {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search } },
        ],
      };
    }

    res.json(
      await prisma.enrollment.findMany({
        where,
        include: DETAIL_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
    );
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: req.params.id },
      include: DETAIL_INCLUDE,
    });
    if (!enrollment) throw new AppError(404, 'ENROLLMENT_NOT_FOUND');
    res.json(enrollment);
  }),
);

router.patch(
  '/:id',
  authorize('ADMIN', 'MANAGER', 'AGENT'),
  validate({
    body: z.object({
      status: statusEnum.optional(),
      totalFee: z.number().positive().max(1_000_000_000).optional(),
      paymentPlan: z.string().trim().max(120).nullable().optional(),
      startDate: z.coerce.date().nullable().optional(),
      endDate: z.coerce.date().nullable().optional(),
      notes: z.string().trim().max(2000).nullable().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: req.params.id },
    });
    if (!enrollment) throw new AppError(404, 'ENROLLMENT_NOT_FOUND');

    const body = req.body as {
      status?: z.infer<typeof statusEnum>;
      totalFee?: number;
      paymentPlan?: string | null;
      startDate?: Date | null;
      endDate?: Date | null;
      notes?: string | null;
    };

    const nextStart =
      body.startDate !== undefined ? body.startDate : enrollment.startDate;
    const nextEnd =
      body.endDate !== undefined ? body.endDate : enrollment.endDate;
    if (nextStart && nextEnd && nextStart > nextEnd) {
      throw new AppError(400, 'INVALID_DATE_RANGE');
    }

    const data: Prisma.EnrollmentUpdateInput = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.totalFee !== undefined) {
      const totalFee = new Prisma.Decimal(body.totalFee);
      if (totalFee.lessThan(enrollment.paidAmount)) {
        throw new AppError(400, 'FEE_BELOW_PAID');
      }
      data.totalFee = totalFee;
    }
    if (body.paymentPlan !== undefined) data.paymentPlan = body.paymentPlan;
    if (body.startDate !== undefined) data.startDate = body.startDate;
    if (body.endDate !== undefined) data.endDate = body.endDate;
    if (body.notes !== undefined) data.notes = body.notes;

    res.json(
      await prisma.enrollment.update({
        where: { id: req.params.id },
        data,
        include: DETAIL_INCLUDE,
      }),
    );
  }),
);

router.post(
  '/:id/payments',
  authorize('ADMIN', 'MANAGER', 'AGENT'),
  validate({
    body: z.object({
      amount: z.number().positive().max(1_000_000_000),
      method: paymentMethodEnum,
      reference: z.string().trim().max(120).optional(),
      note: z.string().trim().max(500).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const enrollmentId = req.params.id;
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) throw new AppError(404, 'ENROLLMENT_NOT_FOUND');
    if (enrollment.status === 'CANCELLED') {
      throw new AppError(400, 'ENROLLMENT_CANCELLED');
    }

    const amount = new Prisma.Decimal(req.body.amount);
    const remaining = enrollment.totalFee.minus(enrollment.paidAmount);
    if (amount.greaterThan(remaining)) {
      throw new AppError(400, 'PAYMENT_EXCEEDS_REMAINING');
    }

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          enrollmentId,
          amount,
          method: req.body.method,
          reference: req.body.reference,
          note: req.body.note,
          recordedById: req.user!.id,
        },
      });
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { paidAmount: { increment: amount } },
      });
      return created;
    });

    res.status(201).json(payment);
  }),
);

export default router;
