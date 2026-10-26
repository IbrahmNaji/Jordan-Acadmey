// client/src/components/LeadForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useCreateLead, useUpdateLead } from '../hooks/useLeads';
import { useCampaigns } from '../hooks/useCampaigns';
import type { Lead } from '../types';

const COURSE_OPTIONS = [
  { value: 'MECHANICS', label: 'ميكانيكا' },
  { value: 'ELECTRICAL', label: 'كهرباء' },
  { value: 'DIAGNOSTICS', label: 'تشخيص أعطال' },
  { value: 'HYBRID', label: 'هايبرد' },
] as const;

const schema = z.object({
  fullName: z.string().trim().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{7,20}$/, 'رقم هاتف غير صالح'),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{7,20}$/, 'رقم واتساب غير صالح')
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .email('بريد إلكتروني غير صالح')
    .or(z.literal('')),
  city: z.string().trim().max(80, 'اسم المدينة طويل').or(z.literal('')),
  age: z
    .union([z.coerce.number().int().min(10).max(100), z.nan()])
    .optional(),
  interestedIn: z
    .enum(['MECHANICS', 'ELECTRICAL', 'DIAGNOSTICS', 'HYBRID'])
    .or(z.literal(''))
    .optional(),
  sourceId: z.string().or(z.literal('')).optional(),
  notes: z.string().trim().max(2000, 'الملاحظات طويلة').or(z.literal('')),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface LeadFormProps {
  open: boolean;
  onClose: () => void;
  lead?: Lead;
  onSuccess?: (lead: Lead) => void;
}

function emptyToUndefined<T extends string | undefined>(v: T) {
  return v === '' ? undefined : v;
}

export default function LeadForm({
  open,
  onClose,
  lead,
  onSuccess,
}: LeadFormProps) {
  const isEdit = !!lead;
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead(lead?.id ?? '');
  const campaignsQuery = useCampaigns(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      phone: '',
      whatsapp: '',
      email: '',
      city: '',
      age: undefined,
      interestedIn: '',
      sourceId: '',
      notes: '',
    },
  });

  // تحميل قيم النموذج عند التعديل أو فتح modal الإنشاء
  useEffect(() => {
    if (!open) return;
    if (lead) {
      reset({
        fullName: lead.fullName,
        phone: lead.phone,
        whatsapp: lead.whatsapp ?? '',
        email: lead.email ?? '',
        city: lead.city ?? '',
        age: lead.age ?? undefined,
        interestedIn: lead.interestedIn ?? '',
        sourceId: lead.sourceId ?? '',
        notes: lead.notes ?? '',
      });
    } else {
      reset({
        fullName: '',
        phone: '',
        whatsapp: '',
        email: '',
        city: '',
        age: undefined,
        interestedIn: '',
        sourceId: '',
        notes: '',
      });
    }
  }, [open, lead, reset]);

  if (!open) return null;

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      whatsapp: emptyToUndefined(values.whatsapp?.trim()),
      email: emptyToUndefined(values.email?.trim()),
      city: emptyToUndefined(values.city?.trim()),
      age:
        typeof values.age === 'number' && !Number.isNaN(values.age)
          ? values.age
          : undefined,
      interestedIn: emptyToUndefined(values.interestedIn) as
        | 'MECHANICS'
        | 'ELECTRICAL'
        | 'DIAGNOSTICS'
        | 'HYBRID'
        | undefined,
      sourceId: emptyToUndefined(values.sourceId),
      notes: emptyToUndefined(values.notes?.trim()),
    };

    try {
      const saved = isEdit
        ? await updateMutation.mutateAsync(payload)
        : await createMutation.mutateAsync(payload);
      onSuccess?.(saved);
      onClose();
    } catch {
      // الأخطاء تُعرض عبر error state أدناه
    }
  });

  const submitError =
    (createMutation.error as any)?.response?.data?.error ??
    (updateMutation.error as any)?.response?.data?.error ??
    null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white shadow-xl ring-1 ring-gray-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'تعديل بيانات العميل المحتمل' : 'إضافة عميل محتمل'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="الاسم الكامل *" error={errors.fullName?.message}>
              <input
                {...register('fullName')}
                className={inputCls(!!errors.fullName)}
                placeholder="مثال: أحمد الخطيب"
                autoComplete="name"
              />
            </Field>

            <Field label="رقم الهاتف *" error={errors.phone?.message}>
              <input
                {...register('phone')}
                className={inputCls(!!errors.phone)}
                placeholder="09XXXXXXXX"
                inputMode="tel"
                dir="ltr"
                autoComplete="tel"
              />
            </Field>

            <Field label="رقم واتساب" error={errors.whatsapp?.message}>
              <input
                {...register('whatsapp')}
                className={inputCls(!!errors.whatsapp)}
                placeholder="09XXXXXXXX"
                inputMode="tel"
                dir="ltr"
              />
            </Field>

            <Field label="البريد الإلكتروني" error={errors.email?.message}>
              <input
                {...register('email')}
                className={inputCls(!!errors.email)}
                placeholder="name@example.com"
                inputMode="email"
                dir="ltr"
                autoComplete="email"
              />
            </Field>

            <Field label="المدينة" error={errors.city?.message}>
              <input
                {...register('city')}
                className={inputCls(!!errors.city)}
                placeholder="دمشق"
              />
            </Field>

            <Field label="العمر" error={errors.age?.message as string | undefined}>
              <input
                {...register('age')}
                type="number"
                min={10}
                max={100}
                className={inputCls(!!errors.age)}
                placeholder="18"
              />
            </Field>

            <Field
              label="الدورة المهتم بها"
              error={errors.interestedIn?.message as string | undefined}
            >
              <select
                {...register('interestedIn')}
                className={inputCls(!!errors.interestedIn)}
              >
                <option value="">— بدون تحديد —</option>
                {COURSE_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="المصدر" error={errors.sourceId?.message}>
              <select
                {...register('sourceId')}
                className={inputCls(!!errors.sourceId)}
                disabled={campaignsQuery.isLoading}
              >
                <option value="">— بدون مصدر —</option>
                {(campaignsQuery.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="ملاحظات" error={errors.notes?.message}>
            <textarea
              {...register('notes')}
              rows={3}
              className={inputCls(!!errors.notes)}
              placeholder="أي تفاصيل إضافية عن العميل..."
            />
          </Field>

          {submitError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {String(submitError)}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                'rounded-lg px-4 py-2 text-sm font-semibold text-white',
                isSubmitting
                  ? 'cursor-not-allowed bg-ink-900/40'
                  : 'bg-ink-900 hover:bg-ink-800',
              )}
            >
              {isSubmitting
                ? 'جارٍ الحفظ...'
                : isEdit
                  ? 'حفظ التعديلات'
                  : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function inputCls(hasError: boolean) {
  return clsx(
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500',
    'focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-flame-500',
    hasError ? 'border-red-400' : 'border-gray-300',
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}