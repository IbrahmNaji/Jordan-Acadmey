import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../middleware/errorHandler';
import { prisma } from '../../config/prisma';
import { listNotifications } from '../../utils/notifications';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        unread: z.enum(['true', 'false']).optional(),
        page: z.coerce.number().int().min(1).max(10_000).default(1),
        pageSize: z.coerce.number().int().min(1).max(50).default(20),
      })
      .parse(req.query);

    res.json(
      await listNotifications(req.user!.id, {
        unreadOnly: query.unread === 'true',
        page: query.page,
        pageSize: query.pageSize,
      }),
    );
  }),
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const parsed = z.string().uuid().safeParse(req.params.id);
    if (!parsed.success) throw new AppError(404, 'NOTIFICATION_NOT_FOUND');

    const result = await prisma.notification.updateMany({
      where: { id: parsed.data, userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      const exists = await prisma.notification.findFirst({
        where: { id: parsed.data, userId: req.user!.id },
        select: { id: true },
      });
      if (!exists) throw new AppError(404, 'NOTIFICATION_NOT_FOUND');
    }
    res.status(204).send();
  }),
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ updated: result.count });
  }),
);

export default router;
