import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../middleware/errorHandler';
import { LeadsService } from './leads.service';

const router = Router();
const service = new LeadsService();
router.use(authenticate);

const uuid = z.string().uuid();
const courseEnum = z.enum(['MECHANICS', 'ELECTRICAL', 'DIAGNOSTICS', 'HYBRID']);
const statusEnum = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'INTERESTED',
  'FOLLOW_UP',
  'ENROLLED',
  'LOST',
  'NOT_INTERESTED',
]);

function leadId(raw: unknown) {
  const parsed = uuid.safeParse(raw);
  if (!parsed.success) throw new AppError(404, 'LEAD_NOT_FOUND');
  return parsed.data;
}

const phoneSchema = z
  .string()
  .trim()
  .min(6)
  .max(24)
  .regex(/^[\d+\s()-]+$/, 'رقم الهاتف غير صالح');

const createSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phone: phoneSchema,
    whatsapp: z.string().trim().max(24).regex(/^[\d+\s()-]*$/).optional(),
    email: z.string().trim().email().max(160).optional(),
    city: z.string().trim().max(80).optional(),
    age: z.coerce.number().int().min(15).max(90).optional(),
    interestedIn: courseEnum.optional(),
    sourceId: uuid.optional(),
    assignedToId: uuid.optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

const updateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: phoneSchema.optional(),
    whatsapp: z.string().trim().max(24).regex(/^[\d+\s()-]*$/).nullable().optional(),
    email: z.string().trim().email().max(160).nullable().optional(),
    city: z.string().trim().max(80).nullable().optional(),
    age: z.coerce.number().int().min(15).max(90).nullable().optional(),
    interestedIn: courseEnum.nullable().optional(),
    sourceId: uuid.nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

const followUpSchema = z
  .object({
    nextFollowUpAt: z.union([z.string().trim().min(1), z.null()]),
  })
  .strict();

const listQuerySchema = z.object({
  status: statusEnum.optional(),
  assignedToId: uuid.optional(),
  sourceId: uuid.optional(),
  search: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

router.post(
  '/',
  requirePermission('leads:write'),
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(req.body, req.user!));
  })
);

router.get(
  '/',
  requirePermission('leads:read'),
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    res.json(await service.list(query, req.user!));
  })
);

router.get(
  '/:id',
  requirePermission('leads:read'),
  asyncHandler(async (req, res) => {
    res.json(await service.getById(leadId(req.params.id), req.user!));
  })
);

router.patch(
  '/:id',
  requirePermission('leads:write'),
  validate({ body: updateSchema }),
  asyncHandler(async (req, res) => {
    res.json(
      await service.update(
        leadId(req.params.id),
        req.body as Parameters<LeadsService['update']>[1],
        req.user!,
      ),
    );
  })
);

router.patch(
  '/:id/status',
  requirePermission('leads:write'),
  validate({
    body: z
      .object({
        status: statusEnum,
        reason: z.string().trim().max(300).optional(),
      })
      .strict(),
  }),
  asyncHandler(async (req, res) => {
    res.json(
      await service.changeStatus(
        leadId(req.params.id),
        req.body.status,
        req.user!,
        req.body.reason,
      ),
    );
  })
);

router.patch(
  '/:id/assign',
  requirePermission('leads:assign'),
  validate({ body: z.object({ assignedToId: uuid.nullable() }).strict() }),
  asyncHandler(async (req, res) => {
    res.json(
      await service.assign(
        leadId(req.params.id),
        req.body.assignedToId,
        req.user!,
      ),
    );
  })
);

router.patch(
  '/:id/follow-up',
  requirePermission('leads:write'),
  validate({ body: followUpSchema }),
  asyncHandler(async (req, res) => {
    const raw = req.body.nextFollowUpAt as string | null;
    let nextFollowUpAt: Date | null = null;
    if (raw !== null) {
      nextFollowUpAt = new Date(raw);
      if (Number.isNaN(nextFollowUpAt.getTime())) {
        throw new AppError(400, 'INVALID_DATE');
      }
    }
    res.json(
      await service.setFollowUp(
        leadId(req.params.id),
        nextFollowUpAt,
        req.user!,
      ),
    );
  })
);

export default router;
