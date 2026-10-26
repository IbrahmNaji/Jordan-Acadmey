import { Prisma, LeadStatus, CourseType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

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

export class LeadsService {
  async create(input: CreateInput, actorId: string) {
    const dup = await prisma.lead.findFirst({
      where: {
        phone: input.phone,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (dup) throw new AppError(409, 'DUPLICATE_LEAD', `Lead exists: ${dup.id}`);

    return prisma.lead.create({
      data: {
        ...input,
        status: 'NEW',
        activities: {
          create: { userId: actorId, type: 'NOTE', content: 'تم إنشاء الاستفسار' },
        },
      },
      include: { source: true, assignedTo: { select: { fullName: true } } },
    });
  }

  async list(filters: {
    status?: LeadStatus;
    assignedToId?: string;
    sourceId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 25, 100);
    const where: Prisma.LeadWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
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

  async getById(id: string) {
    const lead = await prisma.lead.findUnique({
      where: { id },
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

  async update(id: string, input: Partial<CreateInput>, actorId: string) {
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'LEAD_NOT_FOUND');

    return prisma.lead.update({
      where: { id },
      data: {
        ...input,
        activities: {
          create: { userId: actorId, type: 'NOTE', content: 'تم تحديث البيانات' },
        },
      },
    });
  }

  async changeStatus(id: string, status: LeadStatus, actorId: string, reason?: string) {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND');
    if (lead.status === status) return lead;

    return prisma.$transaction(async tx => {
      const updated = await tx.lead.update({
        where: { id },
        data: {
          status,
          convertedAt: status === 'ENROLLED' ? new Date() : lead.convertedAt,
          lostReason: status === 'LOST' ? reason : lead.lostReason,
        },
      });
      await tx.activity.create({
        data: {
          leadId: id,
          userId: actorId,
          type: 'STATUS_CHANGE',
          content: `${lead.status} → ${status}${reason ? ` (${reason})` : ''}`,
          metadata: { from: lead.status, to: status, reason },
        },
      });
      return updated;
    });
  }

  async assign(id: string, assignedToId: string | null, actorId: string) {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND');

    if (assignedToId) {
      const user = await prisma.user.findUnique({ where: { id: assignedToId } });
      if (!user || !user.isActive) throw new AppError(400, 'INVALID_ASSIGNEE');
    }

    return prisma.lead.update({
      where: { id },
      data: {
        assignedToId,
        activities: {
          create: {
            userId: actorId,
            type: 'NOTE',
            content: assignedToId ? 'تم إسناد الاستفسار' : 'تم إلغاء الإسناد',
          },
        },
      },
    });
  }

  async setFollowUp(id: string, nextFollowUpAt: Date, actorId: string) {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND');

    return prisma.lead.update({
      where: { id },
      data: {
        nextFollowUpAt,
        activities: {
          create: {
            userId: actorId,
            type: 'FOLLOW_UP_SET',
            content: `موعد متابعة: ${nextFollowUpAt.toISOString()}`,
          },
        },
      },
    });
  }
}