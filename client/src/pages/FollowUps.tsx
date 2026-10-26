// client/src/pages/FollowUps.tsx
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  Inbox,
  MessageCircle,
  Phone,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import clsx from 'clsx';
import StatusBadge from '../components/StatusBadge';
import { useFollowUps } from '../hooks/useReports';
import { formatDate, formatNumber } from '../lib/format';
import type { Lead } from '../types';

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function overdueDays(iso?: string | null) {
  if (!iso) return 0;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return 0;
  const today = startOfDay(new Date()).getTime();
  const dueDay = startOfDay(due).getTime();
  return Math.max(0, Math.round((today - dueDay) / 86_400_000));
}

function overdueLabel(days: number) {
  if (days <= 0) return 'مستحقة اليوم';
  if (days === 1) return 'متأخرة يوماً واحداً';
  if (days === 2) return 'متأخرة يومين';
  if (days <= 10) return `متأخرة ${days} أيام`;
  return `متأخرة ${days} يوماً`;
}

function whatsappHref(lead: Lead) {
  const digits = (lead.whatsapp || lead.phone || '').replace(/[^\d]/g, '');
  if (!digits) return undefined;
  return `https://wa.me/${digits.startsWith('963') ? '' : '963'}${digits.replace(/^0+/, '')}`;
}

export default function FollowUps() {
  const query = useFollowUps();
  const leads = query.data ?? [];

  const overdueCount = leads.filter(
    (lead) => overdueDays(lead.nextFollowUpAt) > 0,
  ).length;
  const unassignedCount = leads.filter((lead) => !lead.assignedToId).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">المتابعات المستحقة</h1>
          <p className="mt-1 text-sm text-steel-600">
            استفسارات حان موعدها ولم تُتابع بعد، مرتبة من الأقدم إلى الأحدث.
          </p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-steel-300 bg-white px-3 py-2 text-xs font-semibold text-steel-600 transition hover:border-ink-900/25 hover:text-ink-900 disabled:opacity-60"
        >
          <RefreshCw
            size={14}
            className={query.isFetching ? 'animate-spin' : undefined}
          />
          تحديث
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryTile
          label="إجمالي المستحق"
          value={formatNumber(leads.length)}
          icon={CalendarClock}
          tone="bg-flame-50 text-flame-700"
          loading={query.isLoading}
        />
        <SummaryTile
          label="متأخرة عن موعدها"
          value={formatNumber(overdueCount)}
          icon={CalendarCheck}
          tone="bg-red-50 text-red-600"
          loading={query.isLoading}
        />
        <SummaryTile
          label="بدون مسؤول"
          value={formatNumber(unassignedCount)}
          icon={UserRound}
          tone="bg-amber-50 text-amber-700"
          loading={query.isLoading}
        />
      </div>

      {query.isLoading ? (
        <div className="space-y-2 rounded-xl bg-white p-4 ring-1 ring-steel-200/70">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-lg bg-steel-200/60"
            />
          ))}
        </div>
      ) : query.isError ? (
        <div className="rounded-xl bg-white p-6 ring-1 ring-steel-200/70">
          <p className="text-sm text-red-700">
            تعذّر تحميل المتابعات المستحقة. تحقّق من اتصال الخادم ثم أعد
            المحاولة.
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-steel-200/60 px-3 py-1.5 text-sm text-ink-800 hover:bg-steel-200"
          >
            <RefreshCw size={14} />
            إعادة المحاولة
          </button>
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-16 text-center ring-1 ring-steel-200/70">
          <span className="rounded-full bg-green-50 p-3 text-green-600">
            <CalendarCheck size={22} />
          </span>
          <div>
            <p className="font-semibold text-ink-900">
              لا توجد متابعات مستحقة الآن
            </p>
            <p className="mt-1 text-sm text-steel-600">
              كل المتابعات محدثة. ستظهر هنا أي متابعة يتجاوز موعدها.
            </p>
          </div>
          <Link
            to="/admin/leads"
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-flame-700 hover:text-flame-600"
          >
            فتح قائمة العملاء
            <ArrowLeft size={15} />
          </Link>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl bg-white ring-1 ring-steel-200/70 lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-steel-200/70 bg-admin-bg/60 text-[11px] text-steel-600">
                  <tr>
                    <Th>العميل</Th>
                    <Th>الحالة</Th>
                    <Th>موعد المتابعة</Th>
                    <Th>المسؤول</Th>
                    <Th>المصدر</Th>
                    <Th className="text-left">إجراءات</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-200/60">
                  {leads.map((lead) => {
                    const days = overdueDays(lead.nextFollowUpAt);
                    const wa = whatsappHref(lead);
                    return (
                      <tr
                        key={lead.id}
                        className="transition-colors hover:bg-flame-50/40"
                      >
                        <Td>
                          <Link
                            to={`/admin/leads/${lead.id}`}
                            className="font-semibold text-ink-900 transition hover:text-flame-700"
                          >
                            {lead.fullName}
                          </Link>
                          <p
                            dir="ltr"
                            className="mt-0.5 text-right text-xs tabular-nums text-steel-600"
                          >
                            {lead.phone}
                          </p>
                        </Td>
                        <Td>
                          <StatusBadge status={lead.status} size="sm" />
                        </Td>
                        <Td>
                          <p className="text-xs tabular-nums text-ink-800">
                            {formatDate(lead.nextFollowUpAt)}
                          </p>
                          <span
                            className={clsx(
                              'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1',
                              days > 0
                                ? 'bg-red-50 text-red-700 ring-red-200'
                                : 'bg-amber-50 text-amber-800 ring-amber-200',
                            )}
                          >
                            {overdueLabel(days)}
                          </span>
                        </Td>
                        <Td className="text-xs text-steel-600">
                          {lead.assignedTo?.fullName ?? 'غير معيّن'}
                        </Td>
                        <Td className="text-xs text-steel-600">
                          {lead.source?.name ?? '—'}
                        </Td>
                        <Td>
                          <div className="flex items-center justify-end gap-1.5">
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="rounded-md border border-steel-300 p-1.5 text-steel-600 transition hover:border-ink-900/30 hover:text-ink-900"
                                aria-label={`اتصال بـ ${lead.fullName}`}
                                title="اتصال"
                              >
                                <Phone size={14} />
                              </a>
                            )}
                            {wa && (
                              <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md border border-steel-300 p-1.5 text-green-700 transition hover:border-green-300 hover:bg-green-50"
                                aria-label={`واتساب ${lead.fullName}`}
                                title="واتساب"
                              >
                                <MessageCircle size={14} />
                              </a>
                            )}
                            <Link
                              to={`/admin/leads/${lead.id}`}
                              className="inline-flex items-center gap-1 rounded-md bg-ink-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-ink-800"
                            >
                              الملف
                              <ArrowLeft size={12} />
                            </Link>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-3 lg:hidden">
            {leads.map((lead) => {
              const days = overdueDays(lead.nextFollowUpAt);
              const wa = whatsappHref(lead);
              return (
                <li
                  key={lead.id}
                  className="rounded-xl bg-white p-4 ring-1 ring-steel-200/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/admin/leads/${lead.id}`}
                        className="font-semibold text-ink-900"
                      >
                        {lead.fullName}
                      </Link>
                      <p
                        dir="ltr"
                        className="mt-0.5 text-right text-xs tabular-nums text-steel-600"
                      >
                        {lead.phone}
                      </p>
                    </div>
                    <StatusBadge status={lead.status} size="sm" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={clsx(
                        'rounded-full px-2 py-0.5 font-medium ring-1',
                        days > 0
                          ? 'bg-red-50 text-red-700 ring-red-200'
                          : 'bg-amber-50 text-amber-800 ring-amber-200',
                      )}
                    >
                      {overdueLabel(days)}
                    </span>
                    <span className="text-steel-600">
                      {formatDate(lead.nextFollowUpAt)}
                    </span>
                    <span className="text-steel-600">
                      المسؤول: {lead.assignedTo?.fullName ?? 'غير معيّن'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-steel-200/60 pt-3">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-steel-300 py-1.5 text-xs font-medium text-steel-600"
                      >
                        <Phone size={13} /> اتصال
                      </a>
                    )}
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-green-200 bg-green-50 py-1.5 text-xs font-medium text-green-700"
                      >
                        <MessageCircle size={13} /> واتساب
                      </a>
                    )}
                    <Link
                      to={`/admin/leads/${lead.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-ink-900 py-1.5 text-xs font-semibold text-white"
                    >
                      الملف <ArrowLeft size={12} />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="flex items-center gap-2 text-[11px] text-steel-600">
            <Inbox size={13} />
            تُحدّث القائمة تلقائياً عند تعديل مواعيد المتابعة من بطاقة العميل.
          </p>
        </>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: string;
  icon: typeof CalendarClock;
  tone: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-steel-200/70">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-steel-600">{label}</p>
          {loading ? (
            <div className="mt-2 h-6 w-10 animate-pulse rounded bg-steel-200/70" />
          ) : (
            <p className="mt-1.5 text-xl font-bold tabular-nums text-ink-900">
              {value}
            </p>
          )}
        </div>
        <span className={clsx('rounded-full p-2.5', tone)}>
          <Icon size={18} />
        </span>
      </div>
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
        'px-4 py-2.5 text-right text-[11px] font-semibold',
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
