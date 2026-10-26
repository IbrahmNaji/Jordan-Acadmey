import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../middleware/errorHandler';
import { assertLeadAccess } from '../../utils/access';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  requirePermission('leads:write'),
  validate({
    body: z
      .object({
        leadId: z.string().uuid(),
        type: z.enum(['CALL', 'WHATSAPP_MSG', 'NOTE']),
        content: z.string().trim().min(1).max(2000),
      })
      .strict(),
  }),
  asyncHandler(async (req, res) => {
    const { leadId, type, content } = req.body as {
      leadId: string;
      type: 'CALL' | 'WHATSAPP_MSG' | 'NOTE';
      content: string;
    };
    await assertLeadAccess(req.user!, leadId);

    const activity = await prisma.$transaction(async (tx) => {
      const created = await tx.activity.create({
        data: { leadId, userId: req.user!.id, type, content },
      });
      await tx.lead.update({
        where: { id: leadId },
        data: { lastContactedAt: new Date() },
      });
      return created;
    });

    res.status(201).json(activity);
  })
);

router.get(
  '/lead/:leadId',
  requirePermission('leads:read'),
  asyncHandler(async (req, res) => {
    const parsed = z.string().uuid().safeParse(req.params.leadId);
    if (!parsed.success) throw new AppError(404, 'LEAD_NOT_FOUND');
    await assertLeadAccess(req.user!, parsed.data);

    res.json(
      await prisma.activity.findMany({
        where: { leadId: parsed.data },
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
    );
  })
);

export default router;
