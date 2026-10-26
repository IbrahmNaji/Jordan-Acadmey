import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  validate({
    body: z.object({
      leadId: z.string().uuid(),
      type: z.enum(['CALL', 'WHATSAPP_MSG', 'NOTE']),
      content: z.string().min(1).max(2000),
    }),
  }),
  asyncHandler(async (req, res) => {
    const activity = await prisma.activity.create({
      data: { ...req.body, userId: req.user!.id },
    });
    await prisma.lead.update({
      where: { id: req.body.leadId },
      data: { lastContactedAt: new Date() },
    });
    res.status(201).json(activity);
  })
);

router.get(
  '/lead/:leadId',
  asyncHandler(async (req, res) => {
    res.json(
      await prisma.activity.findMany({
        where: { leadId: req.params.leadId },
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
      })
    );
  })
);

export default router;