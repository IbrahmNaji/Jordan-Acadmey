import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthService } from './auth.service';

const router = Router();
const service = new AuthService();

router.post(
  '/login',
  validate({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }),
  }),
  asyncHandler(async (req, res) => {
    const result = await service.login(req.body.email, req.body.password);
    res.json(result);
  })
);

router.post(
  '/refresh',
  validate({ body: z.object({ refreshToken: z.string().min(10) }) }),
  asyncHandler(async (req, res) => {
    const result = await service.refresh(req.body.refreshToken);
    res.json(result);
  })
);

router.post(
  '/logout',
  validate({ body: z.object({ refreshToken: z.string().min(10) }) }),
  asyncHandler(async (req, res) => {
    await service.logout(req.body.refreshToken);
    res.status(204).send();
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await service.me(req.user!.id));
  })
);

export default router;