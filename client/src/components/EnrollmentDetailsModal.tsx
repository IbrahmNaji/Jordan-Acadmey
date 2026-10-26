import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ExternalLink,
  Mail,
  Phone,
  Wallet,
  X,
} from 'lucide-react';
import EnrollmentStatusBadge from './EnrollmentStatusBadge';
import { useEnrollment, useUpdateEnrollment } from '../hooks/useEnrollments';
import { getApiErrorMessage } from '../lib/apiError';
import {
  COURSE_LABEL,
  ENROLLMENT_STATUS_OPTIONS,
  PAYMENT_METHOD_LABEL,
} from '../lib/constants';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  toNumber,
} from '../lib/format';
import type { Enrollment, EnrollmentStatus } from '../types';

export default function EnrollmentDetailsModal({
  open,
  enrollmentId,
  onClose,
  onPay,
}: {
  open: boolean;
  enrollmentId?: string;
  onClose: () => void;
  onPay: (enrollment: Enrollment) => void;
}) {
  const query = useEnrollment(open ? enrollmentId : undefined, open);
  const enrollment = query.data;
  const updateMutation = useUpdateEnrollment(enrollmentId ?? '');
  const [status, setStatus] = useState<EnrollmentStatus>('ACTIVE');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enrollment) {
      setStatus(enrollment.status);
      setError(null);
    }
  }, [enrollment?.id, enrollment?.status]);

  if (!open) return null;

  const total = enrollment ? toNumber(enrollment.totalFee) : 0;
  const paid = enrollment ? toNumber(enrollment.paidAmount) : 0;
  const remaining = Math.max(0, total - paid);
  const paidPercent = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const canPay =
    !!enrollment &&
    enrollment.status !== 'CANCELLED' &&
    remaining > 0;

  const onSaveStatus = async () => {
    if (!enrollment || status === enrollment.status) return;
    setError(null);
    try {
      await updateMutation.mutateAsync({ status });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl rounded-xl bg-white shadow-xl ring-1 ring-gray-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">تفاصيل التسجيل</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              متابعة الرسوم والدفعات وحالة الطالب
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

        {query.isLoading ? (
          <div className="space-y-3 px-6 py-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : query.isError || !enrollment ? (
          <div className="px-6 py-10 text-center">
            <AlertCircle className="mx-auto mb-2 text-red-500" size={24} />
            <p className="text-sm text-red-700">
              تعذّر تحميل تفاصيل التسجيل.
            </p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-3 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="space-y-5 px-6 py-5">
            {/* Student */}
            <div className="flex flex-col gap-3 rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {enrollment.lead?.fullName ?? 'طالب'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  {enrollment.lead?.phone && (
                    <span dir="ltr" className="inline-flex items-center gap-1">
                      <Phone size={12} />
                      {enrollment.lead.phone}
                    </span>
                  )}
                  {enrollment.lead?.email && (
                    <span dir="ltr" className="inline-flex items-center gap-1">
                      <Mail size={12} />
                      {enrollment.lead.email}
                    </span>
                  )}
                </div>
              </div>
              <Link
                to={`/admin/leads/${enrollment.leadId}`}
                className="inline-flex items-center gap-1.5 self-start rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink size={13} />
                فتح بطاقة العميل
              </Link>
            </div>

            {/* Info + financial */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg p-1">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  بيانات الدورة
                </h3>
                <dl className="space-y-2 text-sm">
                  <Row label="الدورة">
                    {COURSE_LABEL[enrollment.course] ?? enrollment.course}
                  </Row>
                  <Row label="الحالة">
                    <EnrollmentStatusBadge status={enrollment.status} />
                  </Row>
                  <Row label="تاريخ البداية">
                    {formatDate(enrollment.startDate)}
                  </Row>
                  <Row label="تاريخ النهاية">
                    {formatDate(enrollment.endDate)}
                  </Row>
                  <Row label="خطة الدفع">
                    {enrollment.paymentPlan || '—'}
                  </Row>
                  <Row label="تاريخ التسجيل">
                    {formatDate(enrollment.createdAt)}
                  </Row>
                </dl>
                {enrollment.notes && (
                  <div className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 ring-1 ring-amber-200">
                    {enrollment.notes}
                  </div>
                )}
              </div>

              <div className="rounded-lg p-1">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  الوضع المالي
                </h3>
                <div className="space-y-2 rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">الرسوم الإجمالية</span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">المدفوع</span>
                    <span className="font-semibold tabular-nums text-green-700">
                      {formatMoney(paid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">المتبقي</span>
                    <span className="font-semibold tabular-nums text-amber-700">
                      {formatMoney(remaining)}
                    </span>
                  </div>
                  <div className="pt-1">
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">
                      تم تحصيل {paidPercent.toFixed(0)}% من الرسوم
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-gray-600">
                    تغيير حالة التسجيل
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as EnrollmentStatus)
                      }
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
                    >
                      {ENROLLMENT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={onSaveStatus}
                      disabled={
                        updateMutation.isPending || status === enrollment.status
                      }
                      className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:bg-ink-900/30"
                    >
                      {updateMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
                    </button>
                  </div>
                  {error && (
                    <p className="mt-1 text-xs text-red-600">{error}</p>
                  )}
                </div>
              </div>
            </div>

            {enrollment.status === 'CANCELLED' && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-700 ring-1 ring-gray-200">
                <AlertCircle size={14} />
                هذا التسجيل ملغى، لا يمكن تسجيل دفعات جديدة عليه.
              </div>
            )}

            {/* Payments */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  سجل الدفعات
                </h3>
                <span className="text-xs text-gray-500">
                  {(enrollment.payments ?? []).length} دفعة
                </span>
              </div>
              {(enrollment.payments ?? []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
                  لا توجد دفعات مسجّلة بعد.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg ring-1 ring-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-600">
                      <tr>
                        <th className="px-3 py-2 text-right font-semibold">
                          التاريخ
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                          المبلغ
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                          الطريقة
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                          تفاصيل
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(enrollment.payments ?? []).map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-3 py-2 text-xs text-gray-600 tabular-nums">
                            {formatDateTime(payment.paidAt)}
                          </td>
                          <td className="px-3 py-2 font-medium tabular-nums text-green-700">
                            {formatMoney(payment.amount)}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-700">
                            {PAYMENT_METHOD_LABEL[payment.method] ??
                              payment.method}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500">
                            {[payment.reference, payment.note]
                              .filter(Boolean)
                              .join(' — ') || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            إغلاق
          </button>
          {enrollment && (
            <button
              type="button"
              onClick={() => onPay(enrollment)}
              disabled={!canPay}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-500"
            >
              <Wallet size={16} />
              {enrollment.status === 'CANCELLED'
                ? 'التسجيل ملغى'
                : remaining <= 0
                  ? 'الرسوم مكتملة'
                  : 'تسجيل دفعة'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-left text-gray-800">{children}</dd>
    </div>
  );
}
