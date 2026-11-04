import type { CourseType } from './index';

export interface PublicCourse {
  slug: string;
  title: string;
  shortTitle: string;
  courseType: CourseType;
  courseTypes?: CourseType[];
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

export interface PublicInstructor {
  id: string;
  fullName: string;
  specialty: string | null;
  bio: string | null;
  imageUrl: string | null;
  courses: Array<{ slug: string; title: string }>;
}

export interface PublicCourseDetail extends PublicCourse {
  instructor: PublicInstructor | null;
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
  duplicate: boolean;
}
