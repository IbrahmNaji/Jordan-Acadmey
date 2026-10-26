import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { assertEnrollmentAccess } from '../../utils/access';

const router = Router();
router.use(authenticate);

const courseEnum = z.enum(['MECHANICS', 'ELECTRICAL', 'DIAGNOSTICS', 'HYBRID']);
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

const MONEY_MAX = 1_000_000_000;

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

function enrollmentId(raw: unknown) {
  const parsed = z.string().uuid().safeParse(raw);
  if (!parsed.success) throw new AppError(404, 'ENROLLMENT_NOT_FOUND');
  return parsed.data;
}

router.post(
  '/',
  requirePermission('enrollments:write'),
  validate({
    body: z
      .object({
        leadId: z.string().uuid(),
        course: courseEnum,
        totalFee: z.number().positive().max(MONEY_MAX),
        paymentPlan: z.string().trim().max(120).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        notes: z.string().trim().max(2000).optional(),
      })
      .strict(),
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

    if (req.user!.role === 'AGENT') {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, assignedToId: req.user!.id },
        select: { id: true },
      });
      if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND');
    }

    const [lead, existing] = await Promise.all([
      prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } }),
      prisma.enrollment.findUnique({
        where: { leadId },
        select: { id: true },
      }),
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
  })
);

router.get(
  '/',
  requirePermission('enrollments:read'),
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        status: statusEnum.optional(),
        course: courseEnum.optional(),
        search: z.string().trim().min(1).max(120).optional(),
        page: z.coerce.number().int().min(1).max(10_000).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(25),
      })
      .parse(req.query);

    const leadFilter: Prisma.LeadWhereInput = {};
    if (req.user!.role === 'AGENT') {
      leadFilter.assignedToId = req.user!.id;
    }
    if (query.search) {
      leadFilter.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const where: Prisma.EnrollmentWhereInput = {
      ...(Object.keys(leadFilter).length ? { lead: leadFilter } : {}),
      ...(query.status && { status: query.status }),
      ...(query.course && { course: query.course }),
    };

    const summaryWhere: Prisma.EnrollmentWhereInput = {
      ...where,
      status: query.status === 'CANCELLED' ? 'CANCELLED' : { not: 'CANCELLED' },
    };

    const activeWhere: Prisma.EnrollmentWhereInput = {
      ...summaryWhere,
      status: 'ACTIVE',
    };

    const [items, total, summary, active] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: DETAIL_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.enrollment.count({ where }),
      prisma.enrollment.aggregate({
        where: summaryWhere,
        _sum: { totalFee: true, paidAmount: true },
        _count: true,
      }),
      prisma.enrollment.count({ where: activeWhere }),
    ]);

    res.json({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      summary: {
        active,
        total: summary._count,
        totalFees: summary._sum.totalFee ?? 0,
        collected: summary._sum.paidAmount ?? 0,
      },
    });
  })
);

router.get(
  '/:id',
  requirePermission('enrollments:read'),
  asyncHandler(async (req, res) => {
    const enrollment = await assertEnrollmentAccess(
      req.user!,
      enrollmentId(req.params.id),
    );
    res.json(enrollment);
  })
);

router.patch(
  '/:id',
  requirePermission('enrollments:manage'),
  validate({
    body: z
      .object({
        status: statusEnum.optional(),
        totalFee: z.number().positive().max(MONEY_MAX).optional(),
        paymentPlan: z.string().trim().max(120).nullable().optional(),
        startDate: z.coerce.date().nullable().optional(),
        endDate: z.coerce.date().nullable().optional(),
        notes: z.string().trim().max(2000).nullable().optional(),
      })
      .strict(),
  }),
  asyncHandler(async (req, res) => {
    const id = enrollmentId(req.params.id);
    const enrollment = await prisma.enrollment.findUnique({ where: { id } });
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
        where: { id },
        data,
        include: DETAIL_INCLUDE,
      })
    );
  })
);

router.post(
  '/:id/payments',
  requirePermission('payments:write'),
  validate({
    body: z
      .object({
        amount: z.number().positive().max(MONEY_MAX),
        method: paymentMethodEnum,
        reference: z.string().trim().max(120).optional(),
        note: z.string().trim().max(500).optional(),
      })
      .strict(),
  }),
  asyncHandler(async (req, res) => {
    const enrollment = await assertEnrollmentAccess(
      req.user!,
      enrollmentId(req.params.id),
    );
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
          enrollmentId: enrollment.id,
          amount,
          method: req.body.method,
          reference: req.body.reference,
          note: req.body.note,
          recordedById: req.user!.id,
        },
      });
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { paidAmount: { increment: amount } },
      });
      return created;
    });

    res.status(201).json(payment);
  })
);

export default router;
