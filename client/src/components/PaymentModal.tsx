import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet, X } from 'lucide-react';
import { useRecordPayment } from '../hooks/useEnrollments';
import { getApiErrorMessage } from '../lib/apiError';
import {
  COURSE_LABEL,
  PAYMENT_METHOD_OPTIONS,
} from '../lib/constants';
import { formatMoney, toNumber } from '../lib/format';
import type { Enrollment } from '../types';

const schema = z.object({
  amount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'SHAM_CASH', 'OTHER']),
  reference: z.string().trim().max(120).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export default function PaymentModal({
  open,
  enrollment,
  onClose,
}: {
  open: boolean;
  enrollment: Enrollment | null;
  onClose: () => void;
}) {
  const remaining = enrollment
    ? Math.max(
        0,
        toNumber(enrollment.totalFee) - toNumber(enrollment.paidAmount),
      )
    : 0;
  const paymentMutation = useRecordPayment();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: remaining,
      method: 'CASH',
      reference: '',
      note: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    reset({
      amount: remaining,
      method: 'CASH',
      reference: '',
      note: '',
    });
  }, [open, enrollment?.id, remaining, reset]);

  if (!open || !enrollment) return null;

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    if (values.amount > remaining + 0.001) {
      setServerError('المبلغ أكبر من المتبقي على الطالب.');
      return;
    }
    try {
      await paymentMutation.mutateAsync({
        enrollmentId: enrollment.id,
        payload: {
          amount: values.amount,
          method: values.method,
          reference: values.reference || undefined,
          note: values.note || undefined,
        },
      });
      onClose();
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  });

  const disabled = isSubmitting || remaining <= 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl ring-1 ring-gray-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">تسجيل دفعة</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {enrollment.lead?.fullName ?? 'طالب'} —{' '}
              {COURSE_LABEL[enrollment.course] ?? enrollment.course}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4" noValidate>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-center ring-1 ring-gray-200">
            <div>
              <p className="text-[11px] text-gray-500">الإجمالي</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">
                {formatMoney(enrollment.totalFee)}
              </p>
            </div>
            <div className="border-x border-gray-200">
              <p className="text-[11px] text-gray-500">المدفوع</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-green-700">
                {formatMoney(enrollment.paidAmount)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">المتبقي</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-amber-700">
                {formatMoney(remaining)}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              المبلغ المستلم *
            </label>
            <input
              type="number"
              min={0}
              max={remaining}
              step="0.01"
              {...register('amount')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
            {errors.amount?.message && (
              <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>
            )}
            <p className="mt-1 text-[11px] text-gray-500">
              الحد الأقصى: {formatMoney(remaining)}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              طريقة الدفع *
            </label>
            <select
              {...register('method')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            >
              {PAYMENT_METHOD_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              رقم المرجع / الإشعار
            </label>
            <input
              {...register('reference')}
              placeholder="اختياري، مثال: رقم الحوالة"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ملاحظة
            </label>
            <textarea
              {...register('note')}
              rows={2}
              placeholder="اختياري"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-green-300"
            >
              <Wallet size={16} />
              {isSubmitting ? 'جارٍ الحفظ...' : 'تأكيد الدفعة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
