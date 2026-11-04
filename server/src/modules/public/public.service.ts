import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { createCustomerForPerson } from '../../utils/customer';
import {
  CONSENT_VERSION,
  INQUIRY_CONSENT_PURPOSE,
} from '../../config/consent';
import { notifyRoles } from '../../utils/notifications';

const WEBSITE_SOURCE = 'الموقع الإلكتروني';

const CONTACT_METHOD_LABEL: Record<string, string> = {
  PHONE: 'اتصال هاتفي',
  WHATSAPP: 'واتساب',
  EMAIL: 'بريد إلكتروني',
};

const PUBLIC_COURSE_SELECT = {
  slug: true,
  title: true,
  shortTitle: true,
  courseType: true,
  courseTypes: true,
  tagline: true,
  summary: true,
  description: true,
  focus: true,
  format: true,
  note: true,
  image: true,
  imageAlt: true,
  featured: true,
} satisfies Prisma.CourseSelect;

const PUBLIC_INSTRUCTOR_COURSES = {
  where: { status: 'PUBLISHED' as const },
  select: { slug: true, title: true },
  orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
};

interface InquiryInput {
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  courseSlug?: string;
  contactMethod: 'PHONE' | 'WHATSAPP' | 'EMAIL';
  notes?: string;
  consent: true;
}

export class PublicService {
  async listCourses() {
    const items = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: PUBLIC_COURSE_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items;
  }

  async getCourse(slug: string) {
    const course = await prisma.course.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: {
        ...PUBLIC_COURSE_SELECT,
        instructor: {
          select: {
            id: true,
            fullName: true,
            specialty: true,
            bio: true,
            imageUrl: true,
            isActive: true,
            courses: PUBLIC_INSTRUCTOR_COURSES,
          },
        },
      },
    });
    if (!course) return null;
    const related = await prisma.course.findMany({
      where: { status: 'PUBLISHED', slug: { not: slug } },
      select: PUBLIC_COURSE_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: 3,
    });
    const { instructor, ...publicCourse } = course;
    return {
      ...publicCourse,
      instructor: instructor?.isActive
        ? {
            id: instructor.id,
            fullName: instructor.fullName,
            specialty: instructor.specialty,
            bio: instructor.bio,
            imageUrl: instructor.imageUrl,
            courses: instructor.courses,
          }
        : null,
      related,
    };
  }

  async listInstructors() {
    return prisma.instructor.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        specialty: true,
        bio: true,
        imageUrl: true,
        courses: PUBLIC_INSTRUCTOR_COURSES,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async createInquiry(input: InquiryInput, context: { ip?: string | null } = {}) {
    const course = input.courseSlug
      ? await prisma.course.findFirst({
          where: { slug: input.courseSlug, status: 'PUBLISHED' },
          select: { title: true, courseType: true },
        })
      : undefined;
    if (input.courseSlug && !course) {
      throw new AppError(400, 'INVALID_COURSE');
    }
    if (input.contactMethod === 'EMAIL' && !input.email) {
      throw new AppError(400, 'EMAIL_REQUIRED');
    }
    if (input.contactMethod === 'WHATSAPP' && !(input.whatsapp || input.phone)) {
      throw new AppError(400, 'WHATSAPP_REQUIRED');
    }

    const recentDuplicate = await prisma.lead.findFirst({
      where: {
        phone: input.phone,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (recentDuplicate) return { duplicate: true };

    const source = await prisma.campaignSource.upsert({
      where: { name: WEBSITE_SOURCE },
      update: { isActive: true },
      create: {
        name: WEBSITE_SOURCE,
        channel: 'OTHER',
        description: 'استفسارات نموذج الموقع العام',
      },
      select: { id: true },
    });

    const noteLines = [
      course ? `الدورة المطلوبة: ${course.title}` : 'الدورة المطلوبة: غير محددة',
      `طريقة التواصل المفضلة: ${CONTACT_METHOD_LABEL[input.contactMethod]}`,
      input.notes ? `ملاحظات الزائر: ${input.notes}` : null,
      'المصدر: نموذج الموقع العام، مع موافقة على سياسة الخصوصية.',
    ].filter(Boolean);

    const leadId = await prisma.$transaction(async (tx) => {
      const customer = await createCustomerForPerson(
        {
          fullName: input.fullName,
          phone: input.phone,
          whatsapp: input.whatsapp,
          email: input.email,
          city: 'دمشق',
        },
        tx,
      );
      const lead = await tx.lead.create({
        data: {
          fullName: input.fullName,
          phone: input.phone,
          whatsapp: input.whatsapp || null,
          email: input.email || null,
          city: 'دمشق',
          interestedIn: course?.courseType,
          sourceId: source.id,
          customerId: customer.id,
          status: 'NEW',
          notes: noteLines.join('\n'),
        },
        select: { id: true },
      });
      await tx.consentRecord.create({
        data: {
          customerId: customer.id,
          leadId: lead.id,
          purpose: INQUIRY_CONSENT_PURPOSE,
          version: CONSENT_VERSION,
          source: 'public_inquiry_form',
          ipAddress: context.ip ?? null,
        },
      });
      return lead.id;
    });

    await notifyRoles(['ADMIN', 'MANAGER'], {
      type: 'LEAD_CREATED',
      title: 'استفسار جديد من الموقع',
      body: `${input.fullName} — ${input.phone}`,
      link: `/admin/leads/${leadId}`,
      entityType: 'Lead',
      entityId: leadId,
      dedupeKey: `lead-created-${leadId}`,
    });

    return { duplicate: false };
  }
}
