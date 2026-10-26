// client/src/pages/Leads.tsx
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Plus,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Inbox,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LeadForm from '../components/LeadForm';
import { useLeads } from '../hooks/useLeads';
import { useCampaigns } from '../hooks/useCampaigns';
import type { Lead, LeadStatus } from '../types';

const PAGE_SIZE = 25;

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'NEW', label: 'جديد' },
  { value: 'CONTACTED', label: 'تم التواصل' },
  { value: 'QUALIFIED', label: 'مؤهّل' },
  { value: 'INTERESTED', label: 'مهتم' },
  { value: 'FOLLOW_UP', label: 'متابعة' },
  { value: 'ENROLLED', label: 'مسجّل' },
  { value: 'LOST', label: 'مفقود' },
  { value: 'NOT_INTERESTED', label: 'غير مهتم' },
];

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function Leads() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [sourceId, setSourceId] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status || undefined,
      sourceId: sourceId || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [search, status, sourceId, page],
  );

  const leadsQuery = useLeads(filters);
  const campaignsQuery = useCampaigns(true);

  const leads: Lead[] = leadsQuery.data?.items ?? [];
  const total = leadsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIdx = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, total);

  const hasActiveFilters =
    search.trim() !== '' || status !== '' || sourceId !== '';

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setSourceId('');
    setPage(1);
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العملاء المحتملون</h1>
          <p className="mt-1 text-sm text-gray-600">
            إدارة ومتابعة كل العملاء المحتملين في الأكاديمية.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          <Plus size={16} />
          إضافة عميل محتمل
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form
            onSubmit={onSearchSubmit}
            className="relative flex-1 min-w-0"
          >
            <Search
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="ابحث بالاسم أو الهاتف..."
              className="w-full rounded-lg border border-gray-300 bg-white pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
          </form>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as LeadStatus | '');
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
          >
            <option value="">كل الحالات</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={sourceId}
            onChange={(e) => {
              setSourceId(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            disabled={campaignsQuery.isLoading}
          >
            <option value="">كل المصادر</option>
            {(campaignsQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
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
        {leadsQuery.isLoading ? (
          <TableSkeleton />
        ) : leadsQuery.isError ? (
          <div className="p-6 text-sm text-red-700">
            تعذّر تحميل البيانات. تحقق من اتصال الخادم ثم أعد المحاولة.
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            onClear={clearFilters}
            onAdd={() => setFormOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>الاسم</Th>
                  <Th>الهاتف</Th>
                  <Th>الحالة</Th>
                  <Th>المصدر</Th>
                  <Th>المسؤول</Th>
                  <Th>التاريخ</Th>
                  <Th className="text-center">إجراءات</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-flame-50/40 transition-colors"
                  >
                    <Td>
                      <Link
                        to={`/admin/leads/${lead.id}`}
                        className="font-medium text-gray-900 hover:text-flame-700"
                      >
                        {lead.fullName}
                      </Link>
                    </Td>
                    <Td>
                      <span dir="ltr" className="tabular-nums">
                        {lead.phone}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={lead.status} size="sm" />
                    </Td>
                    <Td className="text-gray-700">
                      {lead.source?.name ?? '—'}
                    </Td>
                    <Td className="text-gray-700">
                      {lead.assignedTo?.fullName ?? '—'}
                    </Td>
                    <Td className="text-gray-500 tabular-nums">
                      {formatDate(lead.createdAt)}
                    </Td>
                    <Td className="text-center">
                      <Link
                        to={`/admin/leads/${lead.id}`}
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-flame-700 hover:bg-flame-50"
                      >
                        عرض
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {leads.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-gray-500 tabular-nums">
              عرض {startIdx}–{endIdx} من {total.toLocaleString('ar-SY')}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || leadsQuery.isFetching}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm',
                  page <= 1
                    ? 'text-gray-500'
                    : 'text-gray-700 hover:bg-gray-100',
                )}
              >
                <ChevronRight size={16} />
                السابق
              </button>
              <span className="px-2 text-xs text-gray-600 tabular-nums">
                صفحة {page} من {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || leadsQuery.isFetching}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm',
                  page >= totalPages
                    ? 'text-gray-500'
                    : 'text-gray-700 hover:bg-gray-100',
                )}
              >
                التالي
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <LeadForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setPage(1);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Presentational helpers
// ─────────────────────────────────────────────
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
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-2 px-4 py-3">
          <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-10 rounded bg-gray-100 animate-pulse mx-auto" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
  onAdd,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-full bg-gray-100 p-3 text-gray-400">
        <Inbox size={22} />
      </div>
      <div>
        <p className="font-medium text-gray-900">
          {hasFilters
            ? 'لا توجد نتائج مطابقة للفلاتر'
            : 'لا يوجد عملاء محتملون بعد'}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {hasFilters
            ? 'جرّب تعديل البحث أو مسح الفلاتر.'
            : 'ابدأ بإضافة أول عميل محتمل.'}
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
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          <Plus size={16} />
          إضافة عميل محتمل
        </button>
      )}
    </div>
  );
}