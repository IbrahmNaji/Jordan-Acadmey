import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    res.json(
      await prisma.campaignSource.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { leads: true } } },
      })
    );
  })
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate({
    body: z.object({
      name: z.string().min(2).max(120),
      channel: z.enum(['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'PHONE', 'WALK_IN', 'REFERRAL', 'GOOGLE_ADS', 'OTHER']),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      description: z.string().max(500).optional(),
      isActive: z.boolean().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await prisma.campaignSource.create({ data: req.body }));
  })
);

router.patch(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate({
    body: z
      .object({
        name: z.string().min(2).max(120),
        channel: z.enum(['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'PHONE', 'WALK_IN', 'REFERRAL', 'GOOGLE_ADS', 'OTHER']),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        description: z.string().max(500).optional(),
        isActive: z.boolean(),
      })
      .partial(),
  }),
  asyncHandler(async (req, res) => {
    res.json(await prisma.campaignSource.update({ where: { id: req.params.id }, data: req.body }));
  })
);

export default router;