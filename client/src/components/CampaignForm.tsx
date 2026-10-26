// client/src/components/CampaignForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { X } from 'lucide-react';
import {
  useCreateCampaign,
  useUpdateCampaign,
} from '../hooks/useCampaigns';
import type { CampaignSource, Channel } from '../types';

const CHANNEL_OPTIONS: { value: Channel; label: string }[] = [
  { value: 'FACEBOOK', label: 'فيسبوك' },
  { value: 'INSTAGRAM', label: 'إنستغرام' },
  { value: 'WHATSAPP', label: 'واتساب' },
  { value: 'PHONE', label: 'هاتف' },
  { value: 'WALK_IN', label: 'زيارة مباشرة' },
  { value: 'REFERRAL', label: 'توصية' },
  { value: 'GOOGLE_ADS', label: 'إعلانات جوجل' },
  { value: 'OTHER', label: 'أخرى' },
];

const schema = z.object({
  name: z.string().trim().min(2, 'اسم المصدر مطلوب (حرفان على الأقل)'),
  channel: z.enum([
    'FACEBOOK',
    'INSTAGRAM',
    'WHATSAPP',
    'PHONE',
    'WALK_IN',
    'REFERRAL',
    'GOOGLE_ADS',
    'OTHER',
  ]),
  utmSource: z.string().trim().max(80).optional().or(z.literal('')),
  utmMedium: z.string().trim().max(80).optional().or(z.literal('')),
  utmCampaign: z.string().trim().max(120).optional().or(z.literal('')),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CampaignFormProps {
  open: boolean;
  onClose: () => void;
  campaign?: CampaignSource;
  onSuccess?: (campaign: CampaignSource) => void;
}

const empty = (v: string | undefined) => {
  const t = v?.trim();
  return t ? t : undefined;
};

export default function CampaignForm({
  open,
  onClose,
  campaign,
  onSuccess,
}: CampaignFormProps) {
  const isEdit = !!campaign;
  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      channel: 'FACEBOOK',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (campaign) {
      reset({
        name: campaign.name,
        channel: campaign.channel,
        utmSource: campaign.utmSource ?? '',
        utmMedium: campaign.utmMedium ?? '',
        utmCampaign: campaign.utmCampaign ?? '',
        description: campaign.description ?? '',
        isActive: campaign.isActive,
      });
    } else {
      reset({
        name: '',
        channel: 'FACEBOOK',
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        description: '',
        isActive: true,
      });
    }
  }, [open, campaign, reset]);

  if (!open) return null;

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      channel: values.channel,
      utmSource: empty(values.utmSource),
      utmMedium: empty(values.utmMedium),
      utmCampaign: empty(values.utmCampaign),
      description: empty(values.description),
      isActive: values.isActive ?? true,
    };

    try {
      const saved = isEdit
        ? await updateMutation.mutateAsync({
            id: campaign.id,
            payload,
          })
        : await createMutation.mutateAsync(payload);
      onSuccess?.(saved);
      onClose();
    } catch {
      /* error state أدناه */
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
        className="w-full max-w-xl rounded-xl bg-white shadow-xl ring-1 ring-gray-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'تعديل مصدر الحملة' : 'إضافة مصدر حملة'}
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
            <Field label="اسم المصدر *" error={errors.name?.message}>
              <input
                {...register('name')}
                className={inputCls(!!errors.name)}
                placeholder="مثال: Facebook - Spring Ads"
              />
            </Field>

            <Field label="القناة *" error={errors.channel?.message}>
              <select
                {...register('channel')}
                className={inputCls(!!errors.channel)}
              >
                {CHANNEL_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="UTM Source" error={errors.utmSource?.message}>
              <input
                {...register('utmSource')}
                className={inputCls(!!errors.utmSource)}
                placeholder="facebook"
                dir="ltr"
              />
            </Field>

            <Field label="UTM Medium" error={errors.utmMedium?.message}>
              <input
                {...register('utmMedium')}
                className={inputCls(!!errors.utmMedium)}
                placeholder="cpc"
                dir="ltr"
              />
            </Field>

            <Field
              label="UTM Campaign"
              error={errors.utmCampaign?.message}
            >
              <input
                {...register('utmCampaign')}
                className={inputCls(!!errors.utmCampaign)}
                placeholder="spring_2025"
                dir="ltr"
              />
            </Field>

            <Field label="مُفعّل؟" error={errors.isActive?.message}>
              <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="h-4 w-4 rounded border-steel-300 accent-flame-500 focus:ring-flame-500"
                />
                متاح للاختيار في نماذج الـ Leads
              </label>
            </Field>
          </div>

          <Field label="الوصف" error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={3}
              className={inputCls(!!errors.description)}
              placeholder="وصف قصير للحملة..."
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
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}