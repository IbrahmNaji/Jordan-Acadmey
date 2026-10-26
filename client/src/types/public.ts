import type { CourseType } from './index';

export interface PublicCourse {
  slug: string;
  title: string;
  shortTitle: string;
  courseType: CourseType;
  tagline: string;
  summary: string;
  description: string[];
  focus: string[];
  format: string;
  note: string;
  image: string;
  imageAlt: string;
  featured: boolean;
}

export interface PublicCourseDetail extends PublicCourse {
  related: PublicCourse[];
}

export type ContactMethod = 'PHONE' | 'WHATSAPP' | 'EMAIL';

export interface InquiryPayload {
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  courseSlug?: string;
  contactMethod: ContactMethod;
  notes?: string;
  consent: true;
}

export interface InquiryResponse {
  ok: true;
}
