import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  CalendarClock,
  DollarSign,
  Inbox,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useDashboardStats, useFollowUps } from '../hooks/useReports';
import { LEAD_STATUS_LABEL } from '../lib/constants';
import { formatDate, formatMoney, formatNumber } from '../lib/format';
import type { Lead } from '../types';

export default function Dashboard() {
  const statsQuery = useDashboardStats();
  const followUpsQuery = useFollowUps();
  const stats = statsQuery.data;

  if (statsQuery.isLoading) return <DashboardSkeleton />;

  if (statsQuery.isError || !stats) {
    return (
      <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
        <p className="text-sm text-red-700">
          تعذّر تحميل بيانات لوحة التحكم. تحقق من اتصال الخادم.
        </p>
        <button
          type="button"
          onClick={() => statsQuery.refetch()}
          className="mt-3 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const cards = [
    {
      label: 'إجمالي الاستفسارات',
      value: formatNumber(stats.totalLeads),
      hint: 'عرض العملاء المحتملين',
      icon: Users,
      tone: 'bg-flame-50 text-flame-700',
      to: '/admin/leads',
    },
    {
      label: 'المسجّلون',
      value: formatNumber(stats.enrolled),
      hint: 'عرض التسجيلات',
      icon: Target,
      tone: 'bg-green-50 text-green-600',
      to: '/admin/enrollments',
    },
    {
      label: 'نسبة التحويل',
      value: `${stats.conversionRate.toFixed(1)}%`,
      hint: 'تفاصيل التقارير',
      icon: TrendingUp,
      tone: 'bg-ink-900/[0.05] text-ink-700',
      to: '/admin/reports',
    },
    {
      label: 'إجمالي الإيرادات',
      value: formatMoney(stats.totalRevenue),
      hint: 'الدفعات المحصّلة',
      icon: DollarSign,
      tone: 'bg-amber-50 text-amber-600',
      to: '/admin/reports',
    },
  ];

  const maxStatus = Math.max(1, ...stats.byStatus.map((s) => s.count));
  const maxSource = Math.max(1, ...stats.bySource.map((s) => s.count));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-gray-600">
          نظرة سريعة على حركة الأكاديمية والمتابعات اليوم.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, hint, icon: Icon, tone, to }) => (
          <Link
            key={label}
            to={to}
            className="group rounded-xl bg-white p-5 ring-1 ring-gray-200 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-2 truncate text-2xl font-bold tabular-nums text-gray-900">
                  {value}
                </p>
                <p className="mt-1 text-[11px] text-flame-700 opacity-0 transition-opacity group-hover:opacity-100">
                  {hint}
                </p>
              </div>
              <span className={clsx('rounded-full p-3', tone)}>
                <Icon size={20} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">
              الاستفسارات حسب الحالة
            </h2>
            <Link
              to="/admin/leads"
              className="text-xs text-flame-700 hover:text-flame-800"
            >
              عرض الكل
            </Link>
          </div>
          {stats.byStatus.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              لا توجد استفسارات بعد.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {stats.byStatus.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">
                      {LEAD_STATUS_LABEL[item.status] ?? item.status}
                    </span>
                    <span className="font-semibold tabular-nums text-gray-800">
                      {formatNumber(item.count)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-flame-500"
                      style={{
                        width: `${(item.count / maxStatus) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">
              الاستفسارات حسب المصدر
            </h2>
            <Link
              to="/admin/campaigns"
              className="text-xs text-flame-700 hover:text-flame-800"
            >
              إدارة المصادر
            </Link>
          </div>
          {stats.bySource.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              لا توجد بيانات مصادر بعد.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {stats.bySource.map((item) => (
                <div key={item.source}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate text-gray-700">
                      {item.source}
                    </span>
                    <span className="font-semibold tabular-nums text-gray-800">
                      {formatNumber(item.count)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{
                        width: `${(item.count / maxSource) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FollowUpsSection
        leads={followUpsQuery.data ?? []}
        loading={followUpsQuery.isLoading}
        error={followUpsQuery.isError}
      />
    </div>
  );
}

function FollowUpsSection({
  leads,
  loading,
  error,
}: {
  leads: Lead[];
  loading: boolean;
  error: boolean;
}) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200">
      <div className="flex flex-col gap-1 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-orange-500" />
          <h2 className="font-bold text-gray-900">متابعات مستحقة</h2>
          {!loading && !error && (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-orange-200">
              {formatNumber(leads.length)}
            </span>
          )}
        </div>
        <Link
          to="/admin/leads"
          className="text-xs text-flame-700 hover:text-flame-800"
        >
          فتح قائمة العملاء
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <p className="px-5 py-8 text-center text-sm text-red-700">
          تعذّر تحميل المتابعات المستحقة.
        </p>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <div className="rounded-full bg-gray-100 p-3 text-gray-400">
            <Inbox size={20} />
          </div>
          <p className="text-sm text-gray-600">
            لا توجد متابعات مستحقة اليوم. عمل رائع!
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {leads.slice(0, 6).map((lead) => (
            <li key={lead.id}>
              <Link
                to={`/admin/leads/${lead.id}`}
                className="flex flex-col gap-2 px-5 py-3 transition-colors hover:bg-flame-50/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {lead.fullName}
                    </span>
                    <StatusBadge status={lead.status} size="sm" />
                  </div>
                  <p
                    dir="ltr"
                    className="mt-0.5 text-right text-xs tabular-nums text-gray-500"
                  >
                    {lead.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">
                    {formatDate(lead.nextFollowUpAt)}
                  </span>
                  <OverdueBadge iso={lead.nextFollowUpAt} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OverdueBadge({ iso }: { iso?: string | null }) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.floor(
    (Date.now() - date.getTime()) / (24 * 60 * 60 * 1000),
  );
  const label = days <= 0 ? 'اليوم' : `متأخرة ${formatNumber(days)} يوم`;
  return (
    <span
      className={clsx(
        'rounded-full px-2 py-0.5 text-[11px] font-medium ring-1',
        days <= 0
          ? 'bg-amber-50 text-amber-700 ring-amber-200'
          : 'bg-red-50 text-red-700 ring-red-200',
      )}
    >
      {label}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 rounded bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}
