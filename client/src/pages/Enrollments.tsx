import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Banknote,
  CreditCard,
  Eye,
  GraduationCap,
  Inbox,
  Plus,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import EnrollmentStatusBadge from '../components/EnrollmentStatusBadge';
import EnrollmentDetailsModal from '../components/EnrollmentDetailsModal';
import PaymentModal from '../components/PaymentModal';
import { useEnrollments } from '../hooks/useEnrollments';
import {
  COURSE_LABEL,
  COURSE_OPTIONS,
  ENROLLMENT_STATUS_OPTIONS,
} from '../lib/constants';
import { formatDate, formatMoney, toNumber } from '../lib/format';
import type {
  CourseType,
  Enrollment,
  EnrollmentStatus,
} from '../types';

const PAGE_SIZE = 20;

export default function Enrollments() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState<CourseType | ''>('');
  const [status, setStatus] = useState<EnrollmentStatus | ''>('');
  const [page, setPage] = useState(1);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [paying, setPaying] = useState<Enrollment | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const enrollmentsQuery = useEnrollments({
    status: status || undefined,
    course: course || undefined,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const enrollments = enrollmentsQuery.data?.items ?? [];
  const summary = enrollmentsQuery.data?.summary;
  const total = enrollmentsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hasFilters = search !== '' || course !== '' || status !== '';
  const totalFees = toNumber(summary?.totalFees);
  const collected = toNumber(summary?.collected);
  const outstanding = Math.max(0, totalFees - collected);

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCourse('');
    setStatus('');
    setPage(1);
  };

  const statCards = [
    {
      label: 'الطلاب النشطون',
      value: (summary?.active ?? 0).toLocaleString('en-US'),
      hint: `${(summary?.total ?? 0).toLocaleString('en-US')} تسجيل إجمالاً`,
      icon: GraduationCap,
      chip: 'bg-ink-900/[0.05] text-ink-700',
    },
    {
      label: 'إجمالي الرسوم',
      value: formatMoney(totalFees),
      hint: 'للتسجيلات غير الملغاة',
      icon: Banknote,
      chip: 'bg-flame-50 text-flame-700',
    },
    {
      label: 'المحصّل',
      value: formatMoney(collected),
      hint: `نسبة التحصيل ${
        totalFees ? ((collected / totalFees) * 100).toFixed(1) : '0.0'
      }%`,
      icon: Wallet,
      chip: 'bg-green-50 text-green-600',
    },
    {
      label: 'المتبقي',
      value: formatMoney(outstanding),
      hint: 'ذمم الطلاب الحالية',
      icon: CreditCard,
      chip: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            التسجيلات والدورات
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            متابعة الطلاب المسجّلين، الرسوم، والدفعات.
          </p>
        </div>
        <Link
          to="/admin/leads"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          <Plus size={16} />
          تسجيل عميل جديد
        </Link>
      </div>

      <div className="rounded-lg bg-flame-50 px-3 py-2 text-xs text-ink-800 ring-1 ring-flame-200">
        لإنشاء تسجيل جديد، افتح بطاقة العميل المحتمل من صفحة العملاء ثم اختر
        «تحويل إلى تسجيل».
      </div>

      {/* Stats */}
      {enrollmentsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value, hint, icon: Icon, chip }) => (
            <div
              key={label}
              className="rounded-xl bg-white p-4 ring-1 ring-gray-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="mt-1.5 text-xl font-bold tabular-nums text-gray-900">
                    {value}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">{hint}</p>
                </div>
                <span className={clsx('rounded-full p-2', chip)}>
                  <Icon size={18} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث باسم الطالب أو الهاتف..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
          </div>

          <select
            value={course}
            onChange={(e) => {
              setCourse(e.target.value as CourseType | '');
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
          >
            <option value="">كل الدورات</option>
            {COURSE_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as EnrollmentStatus | '');
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
          >
            <option value="">كل الحالات</option>
            {ENROLLMENT_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              <X size={14} />
              مسح
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
        {enrollmentsQuery.isLoading ? (
          <TableSkeleton />
        ) : enrollmentsQuery.isError ? (
          <div className="p-6">
            <p className="text-sm text-red-700">
              تعذّر تحميل التسجيلات. تحقق من اتصال الخادم ثم أعد المحاولة.
            </p>
            <button
              type="button"
              onClick={() => enrollmentsQuery.refetch()}
              className="mt-3 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : enrollments.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onClear={clearFilters}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <Th>الطالب</Th>
                    <Th>الدورة</Th>
                    <Th>الحالة</Th>
                    <Th>البداية</Th>
                    <Th>الرسوم</Th>
                    <Th>المدفوع</Th>
                    <Th>المتبقي</Th>
                    <Th className="text-center">إجراءات</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enrollments.map((enrollment) => {
                    const rowTotal = toNumber(enrollment.totalFee);
                    const paid = toNumber(enrollment.paidAmount);
                    const remaining = Math.max(0, rowTotal - paid);
                    const paidPercent =
                      rowTotal > 0 ? Math.min(100, (paid / rowTotal) * 100) : 0;
                    const canPay =
                      enrollment.status !== 'CANCELLED' && remaining > 0;

                    return (
                      <tr
                        key={enrollment.id}
                        className="transition-colors hover:bg-flame-50/40"
                      >
                        <Td>
                          <Link
                            to={`/admin/leads/${enrollment.leadId}`}
                            className="font-medium text-gray-900 hover:text-flame-700"
                          >
                            {enrollment.lead?.fullName ?? '—'}
                          </Link>
                          <p
                            dir="ltr"
                            className="mt-0.5 text-right text-xs tabular-nums text-gray-500"
                          >
                            {enrollment.lead?.phone ?? ''}
                          </p>
                        </Td>
                        <Td className="text-gray-700">
                          <p>
                            {enrollment.courseRef?.title ??
                              COURSE_LABEL[enrollment.course] ??
                              enrollment.course}
                          </p>
                          {enrollment.batch && (
                            <p className="text-xs text-gray-400">
                              {enrollment.batch.code ??
                                enrollment.batch.title ??
                                'دفعة'}
                            </p>
                          )}
                        </Td>
                        <Td>
                          <EnrollmentStatusBadge status={enrollment.status} />
                        </Td>
                        <Td className="text-xs tabular-nums text-gray-600">
                          {formatDate(enrollment.startDate)}
                        </Td>
                        <Td className="tabular-nums text-gray-800">
                          {formatMoney(rowTotal)}
                        </Td>
                        <Td>
                          <span className="tabular-nums text-green-700">
                            {formatMoney(paid)}
                          </span>
                          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${paidPercent}%` }}
                            />
                          </div>
                        </Td>
                        <Td
                          className={clsx(
                            'font-medium tabular-nums',
                            remaining > 0 ? 'text-amber-700' : 'text-green-700',
                          )}
                        >
                          {remaining > 0 ? formatMoney(remaining) : 'مكتمل'}
                        </Td>
                        <Td>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailsId(enrollment.id)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-flame-700 hover:bg-flame-50"
                            >
                              <Eye size={13} />
                              تفاصيل
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaying(enrollment)}
                              disabled={!canPay}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:text-gray-500 disabled:hover:bg-transparent"
                            >
                              <Wallet size={13} />
                              دفعة
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                {total.toLocaleString('en-US')} تسجيل — الصفحة {page} من{' '}
                {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || enrollmentsQuery.isFetching}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  السابق
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={
                    page >= totalPages || enrollmentsQuery.isFetching
                  }
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <EnrollmentDetailsModal
        open={!!detailsId}
        enrollmentId={detailsId ?? undefined}
        onClose={() => setDetailsId(null)}
        onPay={(enrollment) => setPaying(enrollment)}
      />

      <PaymentModal
        open={!!paying}
        enrollment={paying}
        onClose={() => setPaying(null)}
      />
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={clsx(
        'px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide',
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={clsx('px-4 py-3 align-middle', className)}>{children}</td>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-8 gap-2 px-4 py-3">
          {Array.from({ length: 8 }).map((__, j) => (
            <div
              key={j}
              className="h-4 w-3/4 rounded bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-full bg-gray-100 p-3 text-gray-400">
        {hasFilters ? <Inbox size={22} /> : <GraduationCap size={22} />}
      </div>
      <div>
        <p className="font-medium text-gray-900">
          {hasFilters
            ? 'لا توجد تسجيلات مطابقة للفلاتر'
            : 'لا توجد تسجيلات بعد'}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {hasFilters
            ? 'جرّب تعديل البحث أو مسح الفلاتر.'
            : 'حوّل عميلاً محتملاً إلى تسجيل لبدء متابعة الطلاب والرسوم.'}
        </p>
      </div>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg px-3 py-1.5 text-sm text-flame-700 hover:bg-flame-50"
        >
          مسح الفلاتر
        </button>
      ) : (
        <Link
          to="/admin/leads"
          className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          <Plus size={16} />
          الذهاب إلى العملاء
        </Link>
      )}
    </div>
  );
}
