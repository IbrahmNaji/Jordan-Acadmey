import type { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from './logger';

export interface NotificationInput {
  type: string;
  title: string;
  body?: string;
  link?: string;
  entityType?: string;
  entityId?: string;
  /** Event-level key; per-user uniqueness is derived from it. */
  dedupeKey?: string;
}

async function insert(userIds: string[], input: NotificationInput) {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: unique.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        entityType: input.entityType,
        entityId: input.entityId,
        dedupeKey: input.dedupeKey ? `${input.dedupeKey}:${userId}` : null,
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    logger.error('Failed to create notifications', {
      type: input.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function notifyUser(
  userId: string | null | undefined,
  input: NotificationInput,
) {
  if (!userId) return;
  await insert([userId], input);
}

export async function notifyRoles(roles: Role[], input: NotificationInput) {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: roles }, isActive: true },
      select: { id: true },
    });
    await insert(
      users.map((user) => user.id),
      input,
    );
  } catch (error) {
    logger.error('Failed to resolve notification recipients', {
      type: input.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function listNotifications(
  userId: string,
  options: { unreadOnly?: boolean; page: number; pageSize: number },
) {
  const where = {
    userId,
    ...(options.unreadOnly ? { readAt: null } : {}),
  };
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items, total, unreadCount, page: options.page, pageSize: options.pageSize };
}
