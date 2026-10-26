import type {
  Channel,
  CourseType,
  EnrollmentStatus,
  LeadStatus,
  PaymentMethod,
} from '../types';

export const COURSE_OPTIONS: Array<{ value: CourseType; label: string }> = [
  { value: 'MECHANICS', label: 'ميكانيكا' },
  { value: 'ELECTRICAL', label: 'كهرباء' },
  { value: 'DIAGNOSTICS', label: 'تشخيص أعطال' },
  { value: 'HYBRID', label: 'هايبرد' },
];

export const COURSE_LABEL: Record<CourseType, string> = {
  MECHANICS: 'ميكانيكا',
  ELECTRICAL: 'كهرباء',
  DIAGNOSTICS: 'تشخيص أعطال',
  HYBRID: 'هايبرد',
};

export const LEAD_STATUS_OPTIONS: Array<{
  value: LeadStatus;
  label: string;
}> = [
  { value: 'NEW', label: 'جديد' },
  { value: 'CONTACTED', label: 'تم التواصل' },
  { value: 'QUALIFIED', label: 'مؤهّل' },
  { value: 'INTERESTED', label: 'مهتم' },
  { value: 'FOLLOW_UP', label: 'متابعة' },
  { value: 'ENROLLED', label: 'مسجّل' },
  { value: 'LOST', label: 'مفقود' },
  { value: 'NOT_INTERESTED', label: 'غير مهتم' },
];

export const LEAD_STATUS_LABEL = Object.fromEntries(
  LEAD_STATUS_OPTIONS.map((s) => [s.value, s.label]),
) as Record<LeadStatus, string>;

export const ENROLLMENT_STATUS_OPTIONS: Array<{
  value: EnrollmentStatus;
  label: string;
}> = [
  { value: 'ACTIVE', label: 'نشط' },
  { value: 'COMPLETED', label: 'مكتمل' },
  { value: 'CANCELLED', label: 'ملغى' },
];

export const ENROLLMENT_STATUS_CONFIG: Record<
  EnrollmentStatus,
  { label: string; classes: string }
> = {
  ACTIVE: {
    label: 'نشط',
    classes: 'bg-green-50 text-green-700 ring-green-200',
  },
  COMPLETED: {
    label: 'مكتمل',
    classes: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  CANCELLED: {
    label: 'ملغى',
    classes: 'bg-gray-100 text-gray-600 ring-gray-200',
  },
};

export const PAYMENT_METHOD_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
}> = [
  { value: 'CASH', label: 'نقدي' },
  { value: 'BANK_TRANSFER', label: 'حوالة بنكية' },
  { value: 'SHAM_CASH', label: 'شام كاش' },
  { value: 'OTHER', label: 'أخرى' },
];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'نقدي',
  BANK_TRANSFER: 'حوالة بنكية',
  SHAM_CASH: 'شام كاش',
  OTHER: 'أخرى',
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  FACEBOOK: 'فيسبوك',
  INSTAGRAM: 'إنستغرام',
  WHATSAPP: 'واتساب',
  PHONE: 'هاتف',
  WALK_IN: 'زيارة مباشرة',
  REFERRAL: 'توصية',
  GOOGLE_ADS: 'إعلانات جوجل',
  OTHER: 'أخرى',
};
