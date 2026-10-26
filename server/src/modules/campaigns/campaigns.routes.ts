import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
router.use(authenticate);

const channelEnum = z.enum([
  'FACEBOOK',
  'INSTAGRAM',
  'WHATSAPP',
  'PHONE',
  'WALK_IN',
  'REFERRAL',
  'GOOGLE_ADS',
  'OTHER',
]);

const campaignSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    channel: channelEnum,
    utmSource: z.string().trim().max(120).optional(),
    utmMedium: z.string().trim().max(120).optional(),
    utmCampaign: z.string().trim().max(120).optional(),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        includeInactive: z.enum(['true', 'false']).optional(),
      })
      .parse(req.query);
    const includeInactive = query.includeInactive === 'true';
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
  requirePermission('campaigns:write'),
  validate({ body: campaignSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await prisma.campaignSource.create({ data: req.body }));
  })
);

router.patch(
  '/:id',
  requirePermission('campaigns:write'),
  validate({ body: campaignSchema.partial() }),
  asyncHandler(async (req, res) => {
    const parsed = z.string().uuid().safeParse(req.params.id);
    if (!parsed.success) throw new AppError(404, 'NOT_FOUND');
    res.json(
      await prisma.campaignSource.update({
        where: { id: parsed.data },
        data: req.body,
      })
    );
  })
);

export default router;
