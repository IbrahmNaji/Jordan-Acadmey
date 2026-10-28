import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import {
  Check,
  CheckCircle2,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import clsx from 'clsx';
import { usePublicCourses, useSubmitInquiry } from '../../hooks/usePublic';
import type { InquiryPayload } from '../../types/public';
import {
  contact,
  contactMethods,
  toWhatsAppLink,
} from '../../content/site';

const inquirySchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'اكتب الاسم الكامل (حرفان على الأقل)')
      .max(120, 'الاسم طويل جداً'),
    phone: z
      .string()
      .trim()
      .min(6, 'اكتب رقم هاتف صالحاً')
      .max(24, 'رقم الهاتف طويل جداً')
      .regex(/^[\d+\s()-]+$/, 'رقم الهاتف يحتوي على رموز غير صالحة'),
    whatsapp: z
      .string()
      .trim()
      .max(24, 'رقم واتساب طويل جداً')
      .regex(/^[\d+\s()-]*$/, 'رقم واتساب غير صالح')
      .optional(),
    email: z
      .string()
      .trim()
      .max(160, 'البريد الإلكتروني طويل جداً')
      .refine(
        (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        'صيغة البريد الإلكتروني غير صحيحة',
      )
      .optional(),
    courseSlug: z.string().optional(),
    contactMethod: z.enum(['PHONE', 'WHATSAPP', 'EMAIL']),
    notes: z.string().trim().max(1500, 'الملاحظات طويلة جداً (1500 حرف كحد أقصى)').optional(),
    consent: z
      .boolean()
      .refine((value) => value === true, 'يجب الموافقة على سياسة الخصوصية'),
  })
  .superRefine((data, ctx) => {
    if (data.contactMethod === 'EMAIL' && !data.email) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'أدخل بريدك الإلكتروني لأنك اخترت التواصل عبر البريد',
      });
    }
  });

type FormValues = z.infer<typeof inquirySchema>;

function getSubmitError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; message?: string }
      | undefined;
    if (!error.response) {
      return 'تعذّر الاتصال بالخادم. تحقق من اتصال الإنترنت ثم أعد المحاولة.';
    }
    if (error.response.status === 429) {
      return (
        data?.message ??
        'تم إرسال عدد كبير من الاستفسارات. يرجى المحاولة بعد قليل.'
      );
    }
    if (data?.error === 'EMAIL_REQUIRED') {
      return 'أدخل بريدك الإلكتروني أو اختر طريقة تواصل أخرى.';
    }
    if (data?.error === 'VALIDATION_ERROR') {
      return 'تحقق من الحقول المطلوبة ثم أعد المحاولة.';
    }
    if (data?.error === 'INVALID_COURSE') {
      return 'المسار المحدد غير متاح حالياً. اختر مساراً آخر أو أرسل دون تحديد.';
    }
  }
  return 'تعذّر إرسال الاستفسار. أعد المحاولة بعد قليل.';
}

const methodIcons = {
  PHONE: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
} as const;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-red-600">
      {message}
    </p>
  );
}

export default function InquiryForm({
  defaultCourseSlug,
  defaultCourseTitle,
  compact = false,
  className,
}: {
  defaultCourseSlug?: string;
  defaultCourseTitle?: string;
  compact?: boolean;
  className?: string;
}) {
  const coursesQuery = usePublicCourses();
  const mutation = useSubmitInquiry();
  const [submitted, setSubmitted] = useState(false);
  const [wasDuplicate, setWasDuplicate] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      fullName: '',
      phone: '',
      whatsapp: '',
      email: '',
      courseSlug: defaultCourseSlug ?? '',
      contactMethod: 'WHATSAPP',
      notes: '',
      consent: false,
    },
  });

  useEffect(() => {
    if (defaultCourseSlug) {
      setValue('courseSlug', defaultCourseSlug, { shouldValidate: false });
    }
  }, [defaultCourseSlug, setValue]);

  const selectedMethod = watch('contactMethod');
  const courses = coursesQuery.data ?? [];
  const hasDefaultCourseOption =
    !!defaultCourseSlug && courses.some((course) => course.slug === defaultCourseSlug);

  const onSubmit = handleSubmit(async (values) => {
    const payload: InquiryPayload = {
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      whatsapp: values.whatsapp?.trim() || undefined,
      email: values.email?.trim() || undefined,
      courseSlug: values.courseSlug || undefined,
      contactMethod: values.contactMethod,
      notes: values.notes?.trim() || undefined,
      consent: true,
    };
    const result = await mutation.mutateAsync(payload);
    setWasDuplicate(result.duplicate);
    setSubmitted(true);
  });

  const startNewInquiry = () => {
    mutation.reset();
    setSubmitted(false);
    setWasDuplicate(false);
    reset({
      fullName: '',
      phone: '',
      whatsapp: '',
      email: '',
      courseSlug: defaultCourseSlug ?? '',
      contactMethod: 'WHATSAPP',
      notes: '',
      consent: false,
    });
  };

  if (submitted) {
    const methodLabel =
      contactMethods.find((method) => method.value === selectedMethod)?.label ??
      'اختيارك';
    return (
      <div
        role="status"
        className={clsx(
          'flex h-full flex-col justify-center border border-flame-500/30 bg-white p-6 sm:p-10',
          className,
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-flame-50 text-flame-600">
          <CheckCircle2 size={28} aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-extrabold text-ink-900">
          {wasDuplicate ? 'لدينا استفسار حديث بهذا الرقم' : 'وصل استفسارك'}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-8 text-steel-600">
          {wasDuplicate ? (
            'وجدنا استفساراً حديثاً مرتبطاً برقم الهاتف الذي أدخلته، لذلك لم ننشئ نسخة مكررة. إذا كان لديك طلب مختلف، أضف تفاصيله عند التواصل معنا.'
          ) : (
            <>
              سُجّل استفسارك بنجاح، وسيتواصل معك فريق الأكاديمية عبر «
              {methodLabel}» لمناقشة التفاصيل. إرسال النموذج لا يُعد تسجيلاً
              نهائياً.
            </>
          )}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={startNewInquiry} className="btn-flame">
            إرسال استفسار آخر
          </button>
          <Link
            to="/courses"
            className="inline-flex min-h-[48px] items-center border border-ink-900/20 px-5 font-display text-sm font-bold text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-paper"
          >
            تصفح المسارات
          </Link>
          {contact.whatsapp && (
            <a
              href={toWhatsAppLink(
                contact.whatsapp,
                'مرحباً، أرسلت استفساراً عبر موقع الأكاديمية وأود متابعة التفاصيل.',
              )}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[48px] items-center gap-2 border border-green-600/30 bg-green-50 px-5 font-display text-sm font-bold text-green-800 transition hover:border-green-700 hover:bg-green-100"
            >
              <MessageCircle size={16} aria-hidden="true" />
              تابع عبر واتساب
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'border border-ink-900/10 bg-white p-6 shadow-panel sm:p-8',
        className,
      )}
    >
      <p className="eyebrow">استفسار مباشر</p>

      <h2 className="mt-3 font-display text-2xl font-extrabold text-ink-900">
        أخبرنا بما تحتاجه
      </h2>
      <p className="mt-2 text-[13px] leading-7 text-steel-600">
        املأ البيانات الأساسية، وسيتم الرد عليك بالطريقة التي تفضلها. الحقول
        المعلّمة بـ <span className="text-flame-700">*</span> مطلوبة.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-7 space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="fullName" className="public-label">
              الاسم الكامل <span className="text-flame-700">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="الاسم والكنية"
              className={clsx('public-input', errors.fullName && 'border-red-400')}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              {...register('fullName')}
            />
            <FieldError id="fullName-error" message={errors.fullName?.message} />
          </div>

          <div>
            <label htmlFor="phone" className="public-label">
              رقم الهاتف <span className="text-flame-700">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              dir="ltr"
              autoComplete="tel"
              placeholder="+963 9XX XXX XXX"
              className={clsx(
                'public-input text-left',
                errors.phone && 'border-red-400',
              )}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
              {...register('phone')}
            />
            {!errors.phone && (
              <p id="phone-hint" className="mt-1.5 text-[11px] text-steel-600">
                رقم يمكننا الوصول إليك عبره.
              </p>
            )}
            <FieldError id="phone-error" message={errors.phone?.message} />
          </div>

          <div>
            <label htmlFor="whatsapp" className="public-label">
              رقم واتساب <span className="text-steel-600">(اختياري)</span>
            </label>
            <input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              dir="ltr"
              autoComplete="tel"
              placeholder="إن اختلف عن رقم الهاتف"
              className={clsx(
                'public-input text-left',
                errors.whatsapp && 'border-red-400',
              )}
              aria-invalid={!!errors.whatsapp}
              aria-describedby={
                errors.whatsapp ? 'whatsapp-error' : undefined
              }
              {...register('whatsapp')}
            />
            <FieldError
              id="whatsapp-error"
              message={errors.whatsapp?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="email" className="public-label">
              البريد الإلكتروني{' '}
              <span className="text-steel-600">(اختياري)</span>
            </label>
            <input
              id="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder="name@example.com"
              className={clsx(
                'public-input text-left',
                errors.email && 'border-red-400',
              )}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            <FieldError id="email-error" message={errors.email?.message} />
          </div>
        </div>

        <div className="border-t border-ink-900/10 pt-6">
          <label htmlFor="courseSlug" className="public-label">
            المسار الذي يهمك
          </label>
          <select
            id="courseSlug"
            className="public-input appearance-none bg-[length:16px] bg-[left_1rem_center] bg-no-repeat pl-10"
            aria-describedby="course-hint"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236E757D' stroke-width='2'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
            }}
            {...register('courseSlug')}
          >
            <option value="">غير محدد / أستشير الأكاديمية</option>
            {!hasDefaultCourseOption && defaultCourseSlug && (
              <option value={defaultCourseSlug}>
                {defaultCourseTitle ?? defaultCourseSlug}
              </option>
            )}
            {courses.map((course) => (
              <option key={course.slug} value={course.slug}>
                {course.title}
              </option>
            ))}
          </select>
          <p id="course-hint" className="mt-1.5 text-[11px] text-steel-600">
            {coursesQuery.isLoading
              ? 'جارٍ تحميل المسارات...'
              : coursesQuery.isError
                ? 'تعذّر تحميل قائمة المسارات حالياً، ويمكنك إرسال الاستفسار دون تحديدها.'
                : 'يمكنك ترك الحقل دون تحديد إذا لم تكن متأكداً.'}
          </p>
        </div>

        <fieldset className="border-t border-ink-900/10 pt-6">
          <legend className="public-label">
            طريقة التواصل المفضلة <span className="text-flame-700">*</span>
          </legend>
          <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {contactMethods.map((method) => {
              const Icon = methodIcons[method.value];
              const active = selectedMethod === method.value;
              return (
                <label
                  key={method.value}
                  className={clsx(
                    'relative flex cursor-pointer items-start gap-3 border p-3.5 transition-colors',
                    active
                      ? 'border-flame-500 bg-flame-50'
                      : 'border-ink-900/15 hover:border-ink-900/35',
                  )}
                >
                  <input
                    type="radio"
                    value={method.value}
                    className="peer sr-only"
                    {...register('contactMethod')}
                  />
                  <span
                    aria-hidden="true"
                    className={clsx(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center',
                      active
                        ? 'bg-flame-500 text-ink-950'
                        : 'bg-paper-muted text-steel-600',
                    )}
                  >
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-display text-[13px] font-bold text-ink-900">
                      {method.label}
                      {active && (
                        <Check
                          size={13}
                          className="text-flame-600"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-5 text-steel-600">
                      {method.hint}
                    </span>
                  </span>
                  <span className="pointer-events-none absolute inset-0 peer-focus-visible:ring-2 peer-focus-visible:ring-flame-500 peer-focus-visible:ring-offset-2" />
                </label>
              );
            })}
          </div>
          <FieldError
            id="contactMethod-error"
            message={errors.contactMethod?.message}
          />
        </fieldset>

        <div className="border-t border-ink-900/10 pt-6">
          <label htmlFor="notes" className="public-label">
            ملاحظات إضافية{' '}
            <span className="text-steel-600">(اختياري)</span>
          </label>
          <textarea
            id="notes"
            rows={compact ? 3 : 4}
            placeholder="خبرتك السابقة، هدفك من التدريب، أو أي سؤال تريد طرحه."
            className={clsx(
              'public-input resize-y',
              errors.notes && 'border-red-400',
            )}
            aria-invalid={!!errors.notes}
            aria-describedby={errors.notes ? 'notes-error' : undefined}
            {...register('notes')}
          />
          <FieldError id="notes-error" message={errors.notes?.message} />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-[12px] leading-6 text-steel-600">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-flame-500"
              aria-invalid={!!errors.consent}
              aria-describedby={errors.consent ? 'consent-error' : undefined}
              {...register('consent')}
            />
            <span>
              أوافق على معالجة بياناتي للتواصل معي بخصوص استفساري، وفق{' '}
              <Link
                to="/privacy"
                target="_blank"
                rel="noreferrer"
                className="text-flame-700 underline underline-offset-4 hover:text-flame-600"
              >
                سياسة الخصوصية
              </Link>
              . <span className="text-flame-700">*</span>
            </span>
          </label>
          <FieldError id="consent-error" message={errors.consent?.message} />
        </div>

        {mutation.isError && (
          <div
            role="alert"
            className="border border-red-200 bg-red-50 p-3.5 text-[13px] leading-6 text-red-700"
          >
            {getSubmitError(mutation.error)}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="btn-flame w-full"
          >
            {isSubmitting || mutation.isPending ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                  aria-hidden="true"
                />
                جارٍ إرسال الاستفسار...
              </>
            ) : (
              <>
                <Send size={16} aria-hidden="true" />
                إرسال الاستفسار
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[11px] leading-6 text-steel-600">
            لا يُعد إرسال النموذج تسجيلاً نهائياً؛ سيتواصل معك الفريق لتأكيد
            التفاصيل.
          </p>
        </div>
      </form>
    </div>
  );
}
