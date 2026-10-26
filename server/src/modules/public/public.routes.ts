import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { PublicService } from './public.service';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const service = new PublicService();

const inquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'تم إرسال عدد كبير من الاستفسارات. يرجى المحاولة بعد قليل.',
    });
  },
});

const inquirySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(24)
    .regex(/^[\d+\s()-]+$/, 'رقم الهاتف غير صالح'),
  whatsapp: z
    .string()
    .trim()
    .max(24)
    .regex(/^[\d+\s()-]*$/, 'رقم واتساب غير صالح')
    .optional()
    .or(z.literal('')),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  courseSlug: z.string().trim().max(64).optional().or(z.literal('')),
  contactMethod: z.enum(['PHONE', 'WHATSAPP', 'EMAIL']),
  notes: z.string().trim().max(1500).optional().or(z.literal('')),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'يجب الموافقة على سياسة الخصوصية' }),
  }),
});

router.get(
  '/courses',
  asyncHandler(async (_req, res) => {
    const items = await service.listCourses();
    res.json({ items });
  }),
);

router.get(
  '/courses/:slug',
  asyncHandler(async (req, res) => {
    const course = await service.getCourse(req.params.slug);
    if (!course) throw new AppError(404, 'COURSE_NOT_FOUND');
    res.json(course);
  }),
);

router.post(
  '/inquiries',
  inquiryLimiter,
  validate({ body: inquirySchema }),
  asyncHandler(async (req, res) => {
    await service.createInquiry(req.body, { ip: req.ip });
    res.status(201).json({ ok: true });
  }),
);

export default router;
