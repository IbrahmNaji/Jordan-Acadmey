import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  Banknote,
  CalendarClock,
  GraduationCap,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useReportOverview } from '../hooks/useReports';
import {
  CHANNEL_LABEL,
  COURSE_LABEL,
  LEAD_STATUS_LABEL,
} from '../lib/constants';
import {
  formatDate,
  formatMoney,
  formatMonthLabel,
  formatMonthShort,
  formatNumber,
  toNumber,
} from '../lib/format';
import type { ReportOverview } from '../types';
import { fetchBusinessLinesReport } from '../api/reports';

const RANGE_PRESETS = [
  { id: '30d', label: 'آخر 30 يوماً', days: 30 },
  { id: '90d', label: 'آخر 3 أشهر', days: 90 },
  { id: '180d', label: 'آخر 6 أشهر', days: 180 },
  { id: '365d', label: 'آخر 12 شهراً', days: 365 },
] as const;

type RangePreset = (typeof RANGE_PRESETS)[number]['id'];

function buildRange(days: number) {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));
  return { from: from.toISOString(), to: to.toISOString() };
}

function barHeight(value: number, max: number) {
  if (value <= 0) return '0%';
  return `${Math.max(4, (value / max) * 100)}%`;
}

export default function Reports() {
  const [preset, setPreset] = useState<RangePreset>('90d');

  const range = useMemo(() => {
    const days =
      RANGE_PRESETS.find((r) => r.id === preset)?.days ?? 90;
    return buildRange(days);
  }, [preset]);

  const reportQuery = useReportOverview(range);
  const report = reportQuery.data;
  const businessLinesQuery=useQuery({queryKey:['business-lines-report',range],queryFn:()=>fetchBusinessLinesReport(range)});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
          <p className="mt-1 text-sm text-gray-600">
            نظرة تحليلية على الاستفسارات والتسجيلات والتحصيل.
          </p>
          {report && (
            <p className="mt-1 text-xs text-gray-600">
              الفترة: {formatDate(report.range.from)} —{' '}
              {formatDate(report.range.to)}
            </p>
          )}
        </div>

        <div className="inline-flex self-start rounded-lg bg-gray-100 p-1 text-sm">
          {RANGE_PRESETS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPreset(option.id)}
              className={clsx(
                'whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                preset === option.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!report && reportQuery.isLoading ? (
        <ReportsSkeleton />
      ) : reportQuery.isError ? (
        <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
          <p className="text-sm text-red-700">
            تعذّر تحميل التقرير. تحقق من اتصال الخادم ثم أعد المحاولة.
          </p>
          <button
            type="button"
            onClick={() => reportQuery.refetch()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
          >
            <RefreshCw size={14} />
            إعادة المحاولة
          </button>
        </div>
      ) : report ? (
        <div
          className={clsx(
            'space-y-4 transition-opacity',
            reportQuery.isFetching && 'opacity-70',
          )}
        >
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="استفسارات جديدة"
              value={formatNumber(report.summary.newLeads)}
              hint={`تحوّل منها ${formatNumber(
                report.summary.enrolledLeads,
              )} إلى مسجّل`}
              icon={Users}
              tone="bg-flame-50 text-flame-700"
            />
            <KpiCard
              label="تسجيلات جديدة"
              value={formatNumber(report.summary.newEnrollments)}
              hint={`الطلاب النشطون حالياً: ${formatNumber(
                report.summary.activeStudents,
              )}`}
              icon={GraduationCap}
              tone="bg-ink-900/[0.05] text-ink-700"
            />
            <KpiCard
              label="معدل التحويل"
              value={`${report.summary.conversionRate.toFixed(1)}%`}
              hint="المسجّلون ÷ استفسارات الفترة"
              icon={TrendingUp}
              tone="bg-steel-200/50 text-steel-600"
            />
            <KpiCard
              label="التحصيل في الفترة"
              value={formatMoney(report.summary.revenue)}
              hint={`رسوم تسجيلات الفترة: ${formatMoney(
                report.summary.totalFees,
              )}`}
              icon={Banknote}
              tone="bg-green-50 text-green-600"
            />
            <KpiCard
              label="المتبقي على الطلاب"
              value={formatMoney(report.summary.outstanding)}
              hint="إجمالي الذمم غير المسددة حالياً"
              icon={Wallet}
              tone="bg-amber-50 text-amber-600"
            />
            <KpiCard
              label="متابعات مستحقة"
              value={formatNumber(report.summary.followUpsDue)}
              hint="تحتاج تواصلاً اليوم"
              icon={CalendarClock}
              tone="bg-red-50 text-red-600"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <TrendChart data={report.monthly} />
            <RevenueChart data={report.monthly} />
          </div>

          {/* Status + courses */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
              <h2 className="font-bold text-gray-900">
                توزيع الاستفسارات حسب الحالة
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                عدد الاستفسارات المُنشأة خلال الفترة
              </p>
              <div className="mt-4">
                <StatusBreakdown data={report.byStatus} />
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
              <h2 className="font-bold text-gray-900">أداء الدورات</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                الرسوم والتحصيل حسب نوع الدورة
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {report.byCourse.map((row) => {
                  const totalFees = toNumber(row.totalFees);
                  const collected = toNumber(row.collected);
                  const percent = totalFees
                    ? Math.min(100, (collected / totalFees) * 100)
                    : 0;
                  return (
                    <div
                      key={row.course}
                      className="rounded-lg p-3 ring-1 ring-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">
                          {COURSE_LABEL[row.course] ?? row.course}
                        </p>
                        <span className="text-[11px] text-gray-500">
                          {formatNumber(row.enrollments)} تسجيل
                        </span>
                      </div>
                      <dl className="mt-2 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">رسوم الفترة</dt>
                          <dd className="font-medium tabular-nums">
                            {formatMoney(row.totalFees)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">محصّل</dt>
                          <dd className="font-medium tabular-nums text-green-700">
                            {formatMoney(row.collected)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">متبقٍ حالياً</dt>
                          <dd className="font-medium tabular-nums text-amber-700">
                            {formatMoney(row.outstanding)}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
            <div className="flex flex-col gap-1 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-gray-900">أداء مصادر الحملات</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  الاستفسارات والتحويل والإيرادات المنسوبة لكل مصدر
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {formatNumber(report.bySource.length)} مصدر
              </span>
            </div>
            {report.bySource.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-500">
                لا توجد بيانات مصادر في هذه الفترة.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <Th>المصدر</Th>
                      <Th>القناة</Th>
                      <Th>الاستفسارات</Th>
                      <Th>المسجّلون</Th>
                      <Th>نسبة التحويل</Th>
                      <Th>الإيرادات</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.bySource.map((row) => (
                      <tr
                        key={row.sourceId ?? 'none'}
                        className="hover:bg-flame-50/40"
                      >
                        <Td className="font-medium text-gray-900">
                          {row.source}
                        </Td>
                        <Td className="text-xs text-gray-600">
                          {row.channel
                            ? CHANNEL_LABEL[row.channel] ?? row.channel
                            : '—'}
                        </Td>
                        <Td className="tabular-nums">
                          {formatNumber(row.leads)}
                        </Td>
                        <Td className="tabular-nums">
                          {formatNumber(row.enrolled)}
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className="w-10 text-xs tabular-nums text-gray-700">
                              {row.conversionRate.toFixed(0)}%
                            </span>
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-flame-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    row.conversionRate,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </Td>
                        <Td className="font-medium tabular-nums text-green-700">
                          {formatMoney(row.revenue)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
      <BusinessLineSection report={businessLinesQuery.data} loading={businessLinesQuery.isLoading} error={businessLinesQuery.isError}/>
    </div>
  );
}

function BusinessLineSection({report,loading,error}:{report:Awaited<ReturnType<typeof fetchBusinessLinesReport>>|undefined;loading:boolean;error:boolean}){
  const amount=(rows:Array<{currency:string;amount:string}>)=>rows.length?rows.map(row=><span key={row.currency} className="block tabular-nums">{formatNumber(Number(row.amount))} {row.currency}</span>):'—';
  return <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-gray-200"><div><h2 className="font-bold text-gray-900">أنشطة المركبات والكراج وقطع الغيار</h2><p className="mt-1 text-xs text-gray-500">تظهر اتفاقيات المركبات المبالغ المتفق عليها والمحصلة؛ الكراج يعرض الفواتير والمدفوعات، ولا تُحتسب عروض الموردين كإيراد.</p></div>{loading?<p className="text-sm text-gray-500">جارٍ تحميل التقرير…</p>:error?<p role="alert" className="text-sm text-red-700">تعذر تحميل تقرير الأنشطة.</p>:report&&<div className="grid gap-3 md:grid-cols-3"><div className="rounded-lg bg-paper p-4"><h3 className="font-semibold">اتفاقيات المركبات</h3><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs text-gray-500">مبالغ الاتفاقيات خلال الفترة</dt><dd>{amount(report.brokerage.agreements)}</dd></div><div><dt className="text-xs text-gray-500">مبالغ محصلة خلال الفترة</dt><dd className="text-green-700">{amount(report.brokerage.collected)}</dd></div><div><dt className="text-xs text-gray-500">الرصيد الحالي المستحق</dt><dd className="text-amber-700">{amount(report.brokerage.outstanding)}</dd></div></dl></div><div className="rounded-lg bg-paper p-4"><h3 className="font-semibold">الكراج</h3><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs text-gray-500">فواتير تم تسليمها خلال الفترة</dt><dd>{amount(report.workshop.invoices)}</dd></div><div><dt className="text-xs text-gray-500">مدفوعات الكراج خلال الفترة</dt><dd className="text-green-700">{amount(report.workshop.collected)}</dd></div><div><dt className="text-xs text-gray-500">الرصيد الحالي للفواتير المسلّمة</dt><dd className="text-amber-700">{amount(report.workshop.outstanding)}</dd></div></dl></div><div className="rounded-lg bg-paper p-4"><h3 className="font-semibold">قطع الغيار</h3><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between"><dt>الطلبات</dt><dd>{formatNumber(report.parts.requests)}</dd></div><div className="flex justify-between"><dt>العروض المسجلة</dt><dd>{formatNumber(report.parts.quotations)}</dd></div><p className="text-xs text-gray-500">لا تمثل عروض الموردين إيراداً للشركة.</p></dl></div></div>}</section>;
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ size?: number }>;
  tone: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-1.5 truncate text-xl font-bold tabular-nums text-gray-900">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">{hint}</p>
        </div>
        <span className={clsx('rounded-full p-2', tone)}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: ReportOverview['monthly'] }) {
  const max = Math.max(
    1,
    ...data.map((d) => Math.max(d.leads, d.enrollments)),
  );
  const hasData = data.some((d) => d.leads > 0 || d.enrollments > 0);

  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-bold text-gray-900">
            حركة الاستفسارات والتسجيلات
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">مقارنة شهرية</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-600">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-flame-500" />
            استفسارات
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            تسجيلات
          </span>
        </div>
      </div>

      {hasData ? (
        <>
          <div className="mt-5 flex items-end gap-1 border-b border-gray-100 pb-1">
            {data.map((row) => (
              <div
                key={row.month}
                className="flex min-w-0 flex-1 flex-col items-center"
              >
                <div className="flex h-44 w-full items-end justify-center gap-1">
                  <div
                    className="w-2.5 rounded-t bg-flame-500"
                    style={{ height: barHeight(row.leads, max) }}
                    title={`${formatMonthLabel(row.month)}: ${row.leads} استفسار`}
                  />
                  <div
                    className="w-2.5 rounded-t bg-green-500"
                    style={{ height: barHeight(row.enrollments, max) }}
                    title={`${formatMonthLabel(row.month)}: ${row.enrollments} تسجيل`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1">
            {data.map((row) => (
              <span
                key={row.month}
                title={formatMonthLabel(row.month)}
                className="min-w-0 flex-1 truncate text-center text-[10px] text-gray-500"
              >
                {formatMonthShort(row.month)}
              </span>
            ))}
          </div>
        </>
      ) : (
        <ChartEmpty />
      )}
    </div>
  );
}

function RevenueChart({ data }: { data: ReportOverview['monthly'] }) {
  const max = Math.max(1, ...data.map((d) => toNumber(d.revenue)));
  const hasData = data.some((d) => toNumber(d.revenue) > 0);

  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
      <div>
        <h2 className="font-bold text-gray-900">التحصيل الشهري</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          مجموع الدفعات المستلمة كل شهر
        </p>
      </div>

      {hasData ? (
        <>
          <div className="mt-5 flex items-end gap-1 border-b border-gray-100 pb-1">
            {data.map((row) => (
              <div
                key={row.month}
                className="flex min-w-0 flex-1 flex-col items-center"
              >
                <div className="flex h-44 w-full items-end justify-center">
                  <div
                    className="w-3.5 rounded-t bg-amber-500"
                    style={{
                      height: barHeight(toNumber(row.revenue), max),
                    }}
                    title={`${formatMonthLabel(row.month)}: ${formatMoney(
                      row.revenue,
                    )}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1">
            {data.map((row) => (
              <span
                key={row.month}
                title={formatMonthLabel(row.month)}
                className="min-w-0 flex-1 truncate text-center text-[10px] text-gray-500"
              >
                {formatMonthShort(row.month)}
              </span>
            ))}
          </div>
        </>
      ) : (
        <ChartEmpty />
      )}
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="mt-4 flex h-52 items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500">
      لا توجد حركة مسجّلة في هذه الفترة.
    </div>
  );
}

function StatusBreakdown({
  data,
}: {
  data: ReportOverview['byStatus'];
}) {
  const max = Math.max(1, ...data.map((row) => row.count));
  const hasData = data.some((row) => row.count > 0);

  if (!hasData) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        لا توجد استفسارات في هذه الفترة.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {data.map((row) => (
        <div key={row.status}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-700">
              {LEAD_STATUS_LABEL[row.status] ?? row.status}
            </span>
            <span className="font-semibold tabular-nums text-gray-800">
              {formatNumber(row.count)}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-flame-500"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide">
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

function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-72 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-72 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}
