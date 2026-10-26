import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { findPublicCourse } from '../../content/courses';

const WEBSITE_SOURCE = 'الموقع الإلكتروني';

const CONTACT_METHOD_LABEL: Record<string, string> = {
  PHONE: 'اتصال هاتفي',
  WHATSAPP: 'واتساب',
  EMAIL: 'بريد إلكتروني',
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
  async createInquiry(input: InquiryInput) {
    const course = input.courseSlug
      ? findPublicCourse(input.courseSlug)
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

    await prisma.lead.create({
      data: {
        fullName: input.fullName,
        phone: input.phone,
        whatsapp: input.whatsapp || null,
        email: input.email || null,
        city: 'دمشق',
        interestedIn: course?.courseType,
        sourceId: source.id,
        status: 'NEW',
        notes: noteLines.join('\n'),
      },
    });

    return { duplicate: false };
  }
}
