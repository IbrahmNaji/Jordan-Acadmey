import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { PublicService } from './public.service';
import { AppError } from '../../middleware/errorHandler';
import { VehiclesService } from '../vehicles/vehicles.service';
import { prisma } from '../../config/prisma';
import { createCustomerForPerson } from '../../utils/customer';
import { CONSENT_VERSION } from '../../config/consent';
import { notifyRoles } from '../../utils/notifications';
const vehicles = new VehiclesService();

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

router.get('/vehicles', asyncHandler(async (_req, res) => { res.json({ items: await vehicles.publicList() }); }));
router.get('/vehicles/:id', asyncHandler(async (req, res) => {
  const item = await vehicles.publicDetail(req.params.id);
  if (!item) throw new AppError(404, 'VEHICLE_NOT_FOUND');
  res.json(item);
}));
router.post('/vehicles/:id/inquiries', inquiryLimiter, validate({ body: z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(24).regex(/^[\d+\s()-]+$/),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  consent: z.literal(true),
}).strict() }), asyncHandler(async (req, res) => {
  await vehicles.inquiry(req.params.id, req.body, req.ip);
  res.status(201).json({ ok: true });
}));

router.get(
  '/courses',
  asyncHandler(async (_req, res) => {
    const items = await service.listCourses();
    res.json({ items });
  }),
);

router.get(
  '/instructors',
  asyncHandler(async (_req, res) => {
    const items = await service.listInstructors();
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
    const result = await service.createInquiry(req.body, { ip: req.ip });
    if (result.duplicate) {
      res.status(200).json({ ok: true, duplicate: true });
      return;
    }
    res.status(201).json({ ok: true, duplicate: false });
  }),
);

const serviceRequestContact = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(24).regex(/^[\d+\s()-]+$/),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  vehicleMake: z.string().trim().min(1).max(80),
  vehicleModel: z.string().trim().min(1).max(80),
  vehicleYear: z.coerce.number().int().min(1950).max(new Date().getFullYear()+1).optional(),
  consent: z.literal(true),
}).strict();

router.post('/workshop-requests', inquiryLimiter, validate({ body: serviceRequestContact.extend({
  requestedService: z.string().trim().min(2).max(160),
  reportedSymptoms: z.string().trim().max(2000).optional().or(z.literal('')),
  preferredAt: z.string().datetime().optional(),
}) }), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof serviceRequestContact> & { requestedService: string; reportedSymptoms?: string; preferredAt?: string };
  const request = await prisma.$transaction(async tx => {
    const customer = await createCustomerForPerson({ fullName: body.fullName, phone: body.phone, email: body.email }, tx);
    const record = await tx.workshopRequest.create({ data: { customerId: customer.id, vehicleMake: body.vehicleMake, vehicleModel: body.vehicleModel, vehicleYear: body.vehicleYear, requestedService: body.requestedService, reportedSymptoms: body.reportedSymptoms, preferredAt: body.preferredAt ? new Date(body.preferredAt) : null } });
    await tx.consentRecord.create({ data: { customerId: customer.id, purpose: 'WORKSHOP_SERVICE_REQUEST', version: CONSENT_VERSION, source: 'public_workshop_request', ipAddress: req.ip } });
    return record;
  });
  await notifyRoles(['ADMIN','MANAGER'], { type: 'WORKSHOP_REQUEST', title: 'طلب موعد ورشة جديد', body: `${body.fullName} — ${body.vehicleMake} ${body.vehicleModel}`, link: '/admin/workshop', entityType: 'WorkshopRequest', entityId: request.id, dedupeKey: `workshop-request-${request.id}` });
  res.status(201).json({ ok: true, requestId: request.id, status: 'NEW' });
}));

router.post('/parts-requests', inquiryLimiter, validate({ body: serviceRequestContact.extend({
  partName: z.string().trim().min(2).max(160),
  partNumber: z.string().trim().max(100).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(1).max(500).default(1),
}) }), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof serviceRequestContact> & { partName: string; partNumber?: string; description?: string; quantity: number };
  const request = await prisma.$transaction(async tx => {
    const customer = await createCustomerForPerson({ fullName: body.fullName, phone: body.phone, email: body.email }, tx);
    const record = await tx.partsRequest.create({ data: { customerId: customer.id, vehicleMake: body.vehicleMake, vehicleModel: body.vehicleModel, vehicleYear: body.vehicleYear, partName: body.partName, partNumber: body.partNumber, description: body.description, quantity: body.quantity } });
    await tx.consentRecord.create({ data: { customerId: customer.id, purpose: 'SPARE_PARTS_REQUEST', version: CONSENT_VERSION, source: 'public_parts_request', ipAddress: req.ip } });
    return record;
  });
  await notifyRoles(['ADMIN','MANAGER'], { type: 'PARTS_REQUEST', title: 'طلب قطعة غيار جديد', body: `${body.fullName} — ${body.partName}`, link: '/admin/parts', entityType: 'PartsRequest', entityId: request.id, dedupeKey: `parts-request-${request.id}` });
  res.status(201).json({ ok: true, requestId: request.id, status: 'NEW' });
}));

export default router;
