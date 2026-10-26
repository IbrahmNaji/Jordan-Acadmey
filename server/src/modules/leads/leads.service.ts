import { Prisma, LeadStatus, CourseType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { AuthUser } from '../../middleware/auth';
import { assertLeadAccess, leadAccessWhere } from '../../utils/access';

interface CreateInput {
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  age?: number;
  interestedIn?: CourseType;
  sourceId?: string;
  assignedToId?: string;
  notes?: string;
}

type UpdateInput = Partial<
  Omit<CreateInput, 'assignedToId'> & {
    whatsapp: string | null;
    email: string | null;
    city: string | null;
    age: number | null;
    interestedIn: CourseType | null;
    sourceId: string | null;
    notes: string | null;
  }
>;

async function ensureSourceExists(sourceId: string) {
  const source = await prisma.campaignSource.findUnique({
    where: { id: sourceId },
    select: { id: true },
  });
  if (!source) throw new AppError(400, 'INVALID_SOURCE');
}

export class LeadsService {
  async create(input: CreateInput, user: AuthUser) {
    const dup = await prisma.lead.findFirst({
      where: {
        phone: input.phone,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (dup) throw new AppError(409, 'DUPLICATE_LEAD');

    if (input.sourceId) await ensureSourceExists(input.sourceId);

    // Agents only see their own leads, so an unassigned record they create
    // would immediately disappear from their list.
    const assignedToId =
      user.role === 'AGENT' ? user.id : input.assignedToId ?? null;

    if (assignedToId && user.role !== 'AGENT') {
      const assignee = await prisma.user.findFirst({
        where: { id: assignedToId, isActive: true },
        select: { id: true },
      });
      if (!assignee) throw new AppError(400, 'INVALID_ASSIGNEE');
    }

    return prisma.lead.create({
      data: {
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        whatsapp: input.whatsapp?.trim() || null,
        email: input.email?.trim().toLowerCase() || null,
        city: input.city?.trim() || null,
        age: input.age ?? null,
        interestedIn: input.interestedIn ?? null,
        sourceId: input.sourceId ?? null,
        assignedToId,
        notes: input.notes?.trim() || null,
        status: 'NEW',
        activities: {
          create: {
            userId: user.id,
            type: 'NOTE',
            content: 'تم إنشاء الاستفسار',
          },
        },
      },
      include: { source: true, assignedTo: { select: { fullName: true } } },
    });
  }

  async list(
    filters: {
      status?: LeadStatus;
      assignedToId?: string;
      sourceId?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    },
    user: AuthUser,
  ) {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 25, 100);
    const scope = leadAccessWhere(user);

    const where: Prisma.LeadWhereInput = {
      ...scope,
      // An agent's own scope always wins over a forged filter.
      ...(filters.status && { status: filters.status }),
      ...(filters.assignedToId &&
        user.role !== 'AGENT' && { assignedToId: filters.assignedToId }),
      ...(filters.sourceId && { sourceId: filters.sourceId }),
      ...(filters.search && {
        OR: [
          { fullName: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          source: { select: { name: true, channel: true } },
          assignedTo: { select: { fullName: true } },
          enrollment: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lead.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getById(id: string, user: AuthUser) {
    const lead = await prisma.lead.findFirst({
      where: { id, ...leadAccessWhere(user) },
      include: {
        source: true,
        assignedTo: { select: { id: true, fullName: true, email: true } },
        enrollment: { include: { payments: true } },
        activities: {
          include: { user: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND');
    return lead;
  }

  async update(id: string, input: UpdateInput, user: AuthUser) {
    await assertLeadAccess(user, id);
    if (input.sourceId) await ensureSourceExists(input.sourceId);

    const data: Prisma.LeadUncheckedUpdateInput = {};
    if (input.fullName !== undefined) data.fullName = input.fullName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.whatsapp !== undefined) data.whatsapp = input.whatsapp;
    if (input.email !== undefined) {
      data.email = input.email?.toLowerCase() ?? null;
    }
    if (input.city !== undefined) data.city = input.city;
    if (input.age !== undefined) data.age = input.age;
    if (input.interestedIn !== undefined) {
      data.interestedIn = input.interestedIn;
    }
    if (input.sourceId !== undefined) data.sourceId = input.sourceId;
    if (input.notes !== undefined) data.notes = input.notes;
    data.activities = {
      create: { userId: user.id, type: 'NOTE', content: 'تم تحديث البيانات' },
    };

    return prisma.lead.update({ where: { id }, data });
  }

  async changeStatus(
    id: string,
    status: LeadStatus,
    user: AuthUser,
    reason?: string,
  ) {
    const lead = await assertLeadAccess(user, id);
    if (lead.status === status) {
      return prisma.lead.findUniqueOrThrow({ where: { id } });
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: {
          status,
          convertedAt: status === 'ENROLLED' ? new Date() : undefined,
          lostReason: status === 'LOST' ? reason ?? null : undefined,
        },
      });
      await tx.activity.create({
        data: {
          leadId: id,
          userId: user.id,
          type: 'STATUS_CHANGE',
          content: `${lead.status} → ${status}${reason ? ` (${reason})` : ''}`,
          metadata: { from: lead.status, to: status, reason: reason ?? null },
        },
      });
      return updated;
    });
  }

  async assign(id: string, assignedToId: string | null, actor: AuthUser) {
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND');

    if (assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: { id: assignedToId, isActive: true },
        select: { id: true },
      });
      if (!assignee) throw new AppError(400, 'INVALID_ASSIGNEE');
    }

    return prisma.lead.update({
      where: { id },
      data: {
        assignedToId,
        activities: {
          create: {
            userId: actor.id,
            type: 'NOTE',
            content: assignedToId ? 'تم إسناد الاستفسار' : 'تم إلغاء الإسناد',
          },
        },
      },
    });
  }

  async setFollowUp(id: string, nextFollowUpAt: Date | null, user: AuthUser) {
    await assertLeadAccess(user, id);

    return prisma.lead.update({
      where: { id },
      data: {
        nextFollowUpAt,
        activities: {
          create: {
            userId: user.id,
            type: 'FOLLOW_UP_SET',
            content: nextFollowUpAt
              ? `موعد متابعة: ${nextFollowUpAt.toISOString()}`
              : 'تم إلغاء موعد المتابعة',
          },
        },
      },
    });
  }
}
