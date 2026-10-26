import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import type { AuthUser } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
router.use(authenticate);

function scopeFor(user: AuthUser): Prisma.LeadWhereInput {
  return user.role === 'AGENT' ? { assignedToId: user.id } : {};
}


const COURSES = ['MECHANICS', 'ELECTRICAL', 'DIAGNOSTICS', 'HYBRID'] as const;
const STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'INTERESTED',
  'FOLLOW_UP',
  'ENROLLED',
  'LOST',
  'NOT_INTERESTED',
] as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const scope = scopeFor(req.user!);
    const hasScope = Object.keys(scope).length > 0;

    const [totalLeads, enrolled, byStatus, bySource, totalRevenue] = await Promise.all([
      prisma.lead.count({ where: scope }),
      prisma.lead.count({ where: { ...scope, status: 'ENROLLED' } }),
      prisma.lead.groupBy({ by: ['status'], where: scope, _count: true }),
      prisma.lead.groupBy({ by: ['sourceId'], where: scope, _count: true }),
      prisma.payment.aggregate({
        where: hasScope ? { enrollment: { lead: scope } } : undefined,
        _sum: { amount: true },
      }),
    ]);

    const sources = await prisma.campaignSource.findMany({
      select: { id: true, name: true, channel: true },
    });

    res.json({
      totalLeads,
      enrolled,
      conversionRate: totalLeads ? (enrolled / totalLeads) * 100 : 0,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      bySource: bySource.map(s => ({
        source:
          sources.find(x => x.id === s.sourceId)?.name ?? 'بدون مصدر',
        count: s._count,
      })),
      totalRevenue: totalRevenue._sum.amount ?? 0,
    });
  })
);

router.get(
  '/follow-ups',
  asyncHandler(async (req, res) => {
    const due = await prisma.lead.findMany({
      where: {
        ...scopeFor(req.user!),
        nextFollowUpAt: { lte: new Date() },
        status: { notIn: ['ENROLLED', 'LOST', 'NOT_INTERESTED'] },
      },
      include: { assignedTo: { select: { fullName: true } } },
      orderBy: { nextFollowUpAt: 'asc' },
      take: 200,
    });
    res.json(due);
  })
);

router.get(
  '/overview',
  requirePermission('reports:read'),
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
      })
      .parse(req.query);

    const now = new Date();
    const to = query.to ?? now;
    const from = query.from ?? new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (from > to) throw new AppError(400, 'INVALID_DATE_RANGE');

    const [
      leads,
      enrollments,
      payments,
      openEnrollments,
      activeStudents,
      followUpsDue,
      sources,
    ] = await Promise.all([
      prisma.lead.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { status: true, sourceId: true, createdAt: true },
      }),
      prisma.enrollment.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: {
          course: true,
          totalFee: true,
          paidAmount: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.payment.findMany({
        where: { paidAt: { gte: from, lte: to } },
        select: {
          amount: true,
          paidAt: true,
          enrollment: {
            select: { lead: { select: { sourceId: true } } },
          },
        },
      }),
      prisma.enrollment.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { course: true, totalFee: true, paidAmount: true },
      }),
      prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      prisma.lead.count({
        where: {
          nextFollowUpAt: { lte: now },
          status: { notIn: ['ENROLLED', 'LOST', 'NOT_INTERESTED'] },
        },
      }),
      prisma.campaignSource.findMany({
        select: { id: true, name: true, channel: true },
      }),
    ]);

    const activeRangeEnrollments = enrollments.filter(
      e => e.status !== 'CANCELLED'
    );
    const enrolledLeads = leads.filter(l => l.status === 'ENROLLED').length;
    const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalFees = activeRangeEnrollments.reduce(
      (sum, e) => sum + Number(e.totalFee),
      0
    );
    const collected = activeRangeEnrollments.reduce(
      (sum, e) => sum + Number(e.paidAmount),
      0
    );
    const outstanding = openEnrollments.reduce(
      (sum, e) => sum + (Number(e.totalFee) - Number(e.paidAmount)),
      0
    );

    const byStatus = STATUSES.map(status => ({
      status,
      count: leads.filter(l => l.status === status).length,
    }));

    const byCourse = COURSES.map(course => {
      const rows = activeRangeEnrollments.filter(e => e.course === course);
      const openRows = openEnrollments.filter(e => e.course === course);
      return {
        course,
        enrollments: rows.length,
        totalFees: round2(rows.reduce((s, e) => s + Number(e.totalFee), 0)),
        collected: round2(rows.reduce((s, e) => s + Number(e.paidAmount), 0)),
        outstanding: round2(
          openRows.reduce(
            (s, e) => s + (Number(e.totalFee) - Number(e.paidAmount)),
            0
          )
        ),
      };
    });

    const sourceRows = new Map<
      string,
      {
        sourceId: string | null;
        source: string;
        channel: (typeof sources)[number]['channel'] | null;
        leads: number;
        enrolled: number;
        revenue: number;
      }
    >();
    sourceRows.set('none', {
      sourceId: null,
      source: 'بدون مصدر',
      channel: null,
      leads: 0,
      enrolled: 0,
      revenue: 0,
    });
    for (const source of sources) {
      sourceRows.set(source.id, {
        sourceId: source.id,
        source: source.name,
        channel: source.channel,
        leads: 0,
        enrolled: 0,
        revenue: 0,
      });
    }
    for (const lead of leads) {
      const row = sourceRows.get(lead.sourceId ?? 'none');
      if (!row) continue;
      row.leads += 1;
      if (lead.status === 'ENROLLED') row.enrolled += 1;
    }
    for (const payment of payments) {
      const key = payment.enrollment.lead.sourceId ?? 'none';
      const row = sourceRows.get(key);
      if (row) row.revenue += Number(payment.amount);
    }
    const bySource = Array.from(sourceRows.values())
      .filter(row => row.leads > 0 || row.revenue > 0)
      .map(row => ({
        ...row,
        revenue: round2(row.revenue),
        conversionRate: row.leads ? (row.enrolled / row.leads) * 100 : 0,
      }))
      .sort((a, b) => b.leads - a.leads || b.revenue - a.revenue);

    const buckets: Array<{ key: string; start: Date; end: Date }> = [];
    const lastMonth = new Date(to.getFullYear(), to.getMonth(), 1);
    let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    const earliest = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() - 11,
      1
    );
    if (cursor < earliest) cursor = earliest;
    while (cursor <= lastMonth) {
      const start = new Date(cursor);
      const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      buckets.push({ key: monthKey(cursor), start, end });
      cursor = end;
    }

    const monthly = buckets.map(bucket => {
      const inBucket = (d: Date) => d >= bucket.start && d < bucket.end;
      return {
        month: bucket.key,
        leads: leads.filter(l => inBucket(l.createdAt)).length,
        enrollments: enrollments.filter(e => inBucket(e.createdAt)).length,
        revenue: round2(
          payments
            .filter(p => inBucket(p.paidAt))
            .reduce((sum, p) => sum + Number(p.amount), 0)
        ),
      };
    });

    res.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        newLeads: leads.length,
        enrolledLeads,
        conversionRate: leads.length ? (enrolledLeads / leads.length) * 100 : 0,
        newEnrollments: enrollments.length,
        activeStudents,
        revenue: round2(revenue),
        totalFees: round2(totalFees),
        collected: round2(collected),
        outstanding: round2(outstanding),
        followUpsDue,
      },
      byStatus,
      bySource,
      byCourse,
      monthly,
    });
  })
);

export default router;
