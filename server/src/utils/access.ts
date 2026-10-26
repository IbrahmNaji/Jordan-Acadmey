import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import type { AuthUser } from '../middleware/auth';

/**
 * Agents may only touch leads assigned to them. Managers and admins see all.
 * Returning 404 (instead of 403) for out-of-scope records avoids leaking
 * whether another customer's record exists.
 */
export function leadAccessWhere(user: AuthUser): Prisma.LeadWhereInput {
  return user.role === 'AGENT' ? { assignedToId: user.id } : {};
}

export async function assertLeadAccess(user: AuthUser, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...leadAccessWhere(user) },
    select: { id: true, assignedToId: true, status: true },
  });
  if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND');
  return lead;
}

export async function assertEnrollmentAccess(
  user: AuthUser,
  enrollmentId: string,
) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      ...(user.role === 'AGENT'
        ? { lead: { assignedToId: user.id } }
        : {}),
    },
    include: { lead: { select: { assignedToId: true } } },
  });
  if (!enrollment) throw new AppError(404, 'ENROLLMENT_NOT_FOUND');
  return enrollment;
}
