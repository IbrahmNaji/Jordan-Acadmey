import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { LeadsService } from './leads.service';

const router = Router();
const service = new LeadsService();
router.use(authenticate);

const createSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
  age: z.coerce.number().int().min(15).max(90).optional(),
  interestedIn: z.enum(['MECHANICS', 'ELECTRICAL', 'DIAGNOSTICS', 'HYBRID']).optional(),
  sourceId: z.string().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

router.post(
  '/',
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(req.body, req.user!.id));
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await service.list({
      status: req.query.status as any,
      assignedToId: req.query.assignedToId as string,
      sourceId: req.query.sourceId as string,
      search: req.query.search as string,
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 25,
    });
    res.json(result);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await service.getById(req.params.id));
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await service.update(req.params.id, req.body, req.user!.id));
  })
);

router.patch(
  '/:id/status',
  validate({
    body: z.object({
      status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'INTERESTED', 'FOLLOW_UP', 'ENROLLED', 'LOST', 'NOT_INTERESTED']),
      reason: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    res.json(await service.changeStatus(req.params.id, req.body.status, req.user!.id, req.body.reason));
  })
);

router.patch(
  '/:id/assign',
  validate({ body: z.object({ assignedToId: z.string().nullable() }) }),
  asyncHandler(async (req, res) => {
    res.json(await service.assign(req.params.id, req.body.assignedToId, req.user!.id));
  })
);

router.patch(
  '/:id/follow-up',
  validate({ body: z.object({ nextFollowUpAt: z.string() }) }),
  asyncHandler(async (req, res) => {
    res.json(await service.setFollowUp(req.params.id, new Date(req.body.nextFollowUpAt), req.user!.id));
  })
);

export default router;