import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { passwordSchema } from '../../utils/validation';
import { AuthService } from './auth.service';

const router = Router();
const service = new AuthService();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'TOO_MANY_ATTEMPTS',
      message: 'محاولات تسجيل دخول كثيرة. يرجى المحاولة بعد بضع دقائق.',
    });
  },
});

const tokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'RATE_LIMITED' });
  },
});

router.post(
  '/login',
  loginLimiter,
  validate({
    body: z
      .object({
        email: z.string().trim().email(),
        password: z.string().min(1).max(128),
      })
      .strict(),
  }),
  asyncHandler(async (req, res) => {
    const result = await service.login(req.body.email, req.body.password);
    res.json(result);
  })
);

router.post(
  '/refresh',
  tokenLimiter,
  validate({ body: z.object({ refreshToken: z.string().min(10) }).strict() }),
  asyncHandler(async (req, res) => {
    const result = await service.refresh(req.body.refreshToken);
    res.json(result);
  })
);

router.post(
  '/logout',
  validate({ body: z.object({ refreshToken: z.string().min(10) }).strict() }),
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

router.post(
  '/change-password',
  authenticate,
  validate({
    body: z
      .object({
        currentPassword: z.string().min(1).max(128),
        newPassword: passwordSchema,
      })
      .strict(),
  }),
  asyncHandler(async (req, res) => {
    await service.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    res.status(204).send();
  })
);

export default router;
