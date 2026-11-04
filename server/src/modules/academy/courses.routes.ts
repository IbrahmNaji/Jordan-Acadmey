import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { recordAudit, requestIp } from '../../utils/audit';
import {
  MONEY_MAX,
  courseStatusEnum,
  courseTypeEnum,
  deliveryModeEnum,
  entityId,
  isUniqueViolation,
  slugSchema,
} from './shared';

const router = Router();
router.use(authenticate);

const stringList = (maxLength: number, maxItems: number) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems);

const createSchema = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(2).max(160),
    titleEnglish: z.string().trim().max(200).nullable().optional(),
    shortTitle: z.string().trim().min(1).max(60),
    courseType: courseTypeEnum,
    courseTypes: stringList(60, 20).min(1).optional(),
    categoryId: z.string().uuid().nullable().optional(),
    instructorId: z.string().uuid().nullable().optional(),
    tagline: z.string().trim().min(2).max(220),
    summary: z.string().trim().min(2).max(600),
    description: stringList(2000, 20).min(1),
    focus: stringList(250, 30),
    prerequisites: stringList(250, 30).optional(),
    format: z.string().trim().min(2).max(500),
    note: z.string().trim().min(2).max(500),
    image: z.string().trim().min(1).max(500),
    imageAlt: z.string().trim().min(1).max(200),
    gallery: stringList(500, 30).optional(),
    videos: z.array(z.string().trim().url().max(1000).refine((value) => /^https?:\/\//i.test(value))).max(20).optional(),
    contentSections: z.array(z.object({
      title: z.string().trim().min(1).max(120),
      body: z.string().trim().max(5000).default(''),
      items: stringList(500, 30).default([]),
    }).strict()).max(30).optional(),
    faqs: z.array(z.object({
      question: z.string().trim().min(1).max(300),
      answer: z.string().trim().min(1).max(3000),
    }).strict()).max(30).optional(),
    location: z.string().trim().max(180).nullable().optional(),
    duration: z.string().trim().max(120).nullable().optional(),
    registrationOpen: z.boolean().optional(),
    deliveryMode: deliveryModeEnum.optional(),
    price: z.number().positive().max(MONEY_MAX).nullable().optional(),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase())
      .optional(),
    featured: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
    status: courseStatusEnum.optional(),
  })
  .strict();

const updateSchema = createSchema.partial();

async function assertRefs(input: {
  categoryId?: string | null;
  instructorId?: string | null;
}) {
  if (input.categoryId) {
    const category = await prisma.courseCategory.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });
    if (!category) throw new AppError(404, 'CATEGORY_NOT_FOUND');
  }
  if (input.instructorId) {
    const instructor = await prisma.instructor.findUnique({
      where: { id: input.instructorId },
      select: { id: true },
    });
    if (!instructor) throw new AppError(404, 'INSTRUCTOR_NOT_FOUND');
  }
}

router.get(
  '/',
  requirePermission('courses:read'),
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        status: courseStatusEnum.optional(),
        courseType: courseTypeEnum.optional(),
        search: z.string().trim().min(1).max(120).optional(),
      })
      .parse(req.query);

    const where: Prisma.CourseWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.courseType) where.courseType = query.courseType;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { shortTitle: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.course.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        instructor: { select: { id: true, fullName: true } },
        _count: { select: { batches: true, enrollments: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ items });
  }),
);

router.get(
  '/:id',
  requirePermission('courses:read'),
  asyncHandler(async (req, res) => {
    const id = entityId(req.params.id, 'COURSE_NOT_FOUND');
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        instructor: { select: { id: true, fullName: true } },
        _count: { select: { enrollments: true } },
        batches: {
          orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
          include: {
            instructor: { select: { id: true, fullName: true } },
            enrollments: {
              where: { status: { not: 'CANCELLED' } },
              select: { id: true },
            },
          },
        },
      },
    });
    if (!course) throw new AppError(404, 'COURSE_NOT_FOUND');

    const { batches, ...rest } = course;
    res.json({
      ...rest,
      batches: batches.map(({ enrollments, ...batch }) => ({
        ...batch,
        enrolledCount: enrollments.length,
      })),
    });
  }),
);

router.post(
  '/',
  requirePermission('courses:write'),
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    await assertRefs(body);

    try {
      const course = await prisma.course.create({
        data: {
          slug: body.slug,
          title: body.title,
          titleEnglish: body.titleEnglish ?? null,
          shortTitle: body.shortTitle,
          courseType: body.courseType,
          courseTypes: body.courseTypes ?? [body.courseType],
          categoryId: body.categoryId ?? null,
          instructorId: body.instructorId ?? null,
          tagline: body.tagline,
          summary: body.summary,
          description: body.description,
          focus: body.focus,
          prerequisites: body.prerequisites ?? [],
          format: body.format,
          note: body.note,
          image: body.image,
          imageAlt: body.imageAlt,
          gallery: body.gallery ?? [],
          videos: body.videos ?? [],
          contentSections: body.contentSections ?? [],
          faqs: body.faqs ?? [],
          location: body.location ?? null,
          duration: body.duration ?? null,
          registrationOpen: body.registrationOpen ?? true,
          deliveryMode: body.deliveryMode ?? 'ONSITE',
          price: body.price ?? null,
          currency: body.currency ?? 'SYP',
          featured: body.featured ?? false,
          sortOrder: body.sortOrder ?? 0,
          status: body.status ?? 'DRAFT',
        },
      });
      await recordAudit({
        actor: req.user,
        action: 'course.create',
        entityType: 'Course',
        entityId: course.id,
        summary: `إنشاء دورة ${course.title}`,
        metadata: { slug: course.slug, status: course.status },
        ip: requestIp(req),
      });
      res.status(201).json(course);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(409, 'COURSE_SLUG_TAKEN');
      }
      throw error;
    }
  }),
);

router.patch(
  '/:id',
  requirePermission('courses:write'),
  validate({ body: updateSchema }),
  asyncHandler(async (req, res) => {
    const id = entityId(req.params.id, 'COURSE_NOT_FOUND');
    const body = req.body as z.infer<typeof updateSchema>;
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'COURSE_NOT_FOUND');
    await assertRefs(body);

    const data: Prisma.CourseUpdateInput = {};
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.title !== undefined) data.title = body.title;
    if (body.titleEnglish !== undefined) data.titleEnglish = body.titleEnglish;
    if (body.shortTitle !== undefined) data.shortTitle = body.shortTitle;
    if (body.courseType !== undefined) data.courseType = body.courseType;
    if (body.courseTypes !== undefined) {
      data.courseTypes = body.courseTypes;
    }
    if (body.categoryId !== undefined) {
      data.category = body.categoryId
        ? { connect: { id: body.categoryId } }
        : { disconnect: true };
    }
    if (body.instructorId !== undefined) {
      data.instructor = body.instructorId
        ? { connect: { id: body.instructorId } }
        : { disconnect: true };
    }
    if (body.tagline !== undefined) data.tagline = body.tagline;
    if (body.summary !== undefined) data.summary = body.summary;
    if (body.description !== undefined) data.description = body.description;
    if (body.focus !== undefined) data.focus = body.focus;
    if (body.prerequisites !== undefined) {
      data.prerequisites = body.prerequisites;
    }
    if (body.format !== undefined) data.format = body.format;
    if (body.note !== undefined) data.note = body.note;
    if (body.image !== undefined) data.image = body.image;
    if (body.imageAlt !== undefined) data.imageAlt = body.imageAlt;
    if (body.gallery !== undefined) data.gallery = body.gallery;
    if (body.videos !== undefined) data.videos = body.videos;
    if (body.contentSections !== undefined) data.contentSections = body.contentSections;
    if (body.faqs !== undefined) data.faqs = body.faqs;
    if (body.location !== undefined) data.location = body.location;
    if (body.duration !== undefined) data.duration = body.duration;
    if (body.registrationOpen !== undefined) data.registrationOpen = body.registrationOpen;
    if (body.deliveryMode !== undefined) {
      data.deliveryMode = body.deliveryMode;
    }
    if (body.price !== undefined) data.price = body.price;
    if (body.currency !== undefined) data.currency = body.currency;
    if (body.featured !== undefined) data.featured = body.featured;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.status !== undefined) data.status = body.status;

    try {
      const updated = await prisma.course.update({ where: { id }, data });
      await recordAudit({
        actor: req.user,
        action: 'course.update',
        entityType: 'Course',
        entityId: id,
        summary: `تعديل دورة ${updated.title}`,
        metadata: {
          fields: Object.keys(body),
          status: updated.status,
          price: updated.price ? updated.price.toString() : null,
        },
        ip: requestIp(req),
      });
      res.json(updated);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(409, 'COURSE_SLUG_TAKEN');
      }
      throw error;
    }
  }),
);

router.delete(
  '/:id',
  requirePermission('courses:write'),
  asyncHandler(async (req, res) => {
    const id = entityId(req.params.id, 'COURSE_NOT_FOUND');
    const existing = await prisma.course.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true, batches: true } } },
    });
    if (!existing) throw new AppError(404, 'COURSE_NOT_FOUND');
    if (existing._count.enrollments > 0 || existing._count.batches > 0) {
      throw new AppError(409, 'COURSE_HAS_HISTORY');
    }
    await prisma.course.delete({ where: { id } });
    await recordAudit({
      actor: req.user,
      action: 'course.delete',
      entityType: 'Course',
      entityId: id,
      summary: `حذف دورة ${existing.title}`,
      metadata: { slug: existing.slug },
      ip: requestIp(req),
    });
    res.status(204).send();
  }),
);

export default router;
