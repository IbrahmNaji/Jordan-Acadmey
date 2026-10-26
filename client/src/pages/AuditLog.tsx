import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Search } from 'lucide-react';
import { fetchAuditLogs } from '../api/audit';
import { formatDateTime } from '../lib/format';
import type { Role } from '../types';

const PAGE_SIZE = 25;

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'مدير النظام',
  MANAGER: 'مدير',
  AGENT: 'موظف متابعة',
};

const ACTION_LABEL: Record<string, string> = {
  'auth.login': 'تسجيل دخول',
  'auth.login_failed': 'محاولة دخول فاشلة',
  'auth.change_password': 'تغيير كلمة المرور',
  'user.create': 'إنشاء مستخدم',
  'user.update': 'تعديل مستخدم',
  'user.password_reset': 'إعادة تعيين كلمة مرور',
  'lead.create': 'إنشاء استفسار',
  'lead.update': 'تحديث استفسار',
  'lead.assign': 'إسناد استفسار',
  'lead.status_change': 'تغيير حالة استفسار',
  'enrollment.create': 'تسجيل في دورة',
  'enrollment.update': 'تعديل تسجيل',
  'payment.create': 'تسجيل دفعة',
  'campaign.create': 'إنشاء مصدر تسويق',
  'campaign.update': 'تعديل مصدر تسويق',
};

const ENTITY_LABEL: Record<string, string> = {
  User: 'مستخدم',
  Lead: 'استفسار',
  Enrollment: 'تسجيل',
  Payment: 'دفعة',
  CampaignSource: 'مصدر تسويق',
};

const ENTITY_OPTIONS = [
  'User',
  'Lead',
  'Enrollment',
  'Payment',
  'CampaignSource',
];

export default function AuditLog() {
  const [action, setAction] = useState('');
  const [debouncedAction, setDebouncedAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAction(action.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [action]);

  const query = useQuery({
    queryKey: ['audit-logs', { action: debouncedAction, entityType, page }],
    queryFn: () =>
      fetchAuditLogs({
        action: debouncedAction || undefined,
        entityType: entityType || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    staleTime: 15_000,
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">سجل العمليات</h1>
        <p className="mt-1 text-sm text-gray-600">
          سجل تدقيق للعمليات الحساسة: الحسابات والأدوار والإسناد والعمليات
          المالية.
        </p>
      </div>

      <div className="rounded-xl bg-white ring-1 ring-gray-200">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={action}
              onChange={(event) => setAction(event.target.value)}
              placeholder="بحث بنوع العملية، مثال: payment"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-9 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
          </div>
          <select
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
          >
            <option value="">كل الكيانات</option>
            {ENTITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {ENTITY_LABEL[option] ?? option}
              </option>
            ))}
          </select>
        </div>

        {query.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        ) : query.isError ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-red-700">تعذّر تحميل سجل العمليات.</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-3 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <ScrollText className="mx-auto mb-2 text-gray-400" size={26} />
            <p className="text-sm text-gray-600">
              لا توجد عمليات مطابقة للفلاتر الحالية.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600">
                  <tr>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      الوقت
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      العملية
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      المنفذ
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      الكيان
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      التفاصيل
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/70">
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-600 tabular-nums">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-medium text-gray-900">
                          {ACTION_LABEL[entry.action] ?? entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-700">
                        {entry.actor ? (
                          <span>
                            {entry.actor.fullName}{' '}
                            <span className="text-[10px] text-gray-500">
                              ({ROLE_LABEL[entry.actor.role]})
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">
                        {ENTITY_LABEL[entry.entityType] ?? entry.entityType}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">
                        {entry.summary ?? '—'}
                        {entry.ipAddress && (
                          <span
                            dir="ltr"
                            className="mr-2 text-[10px] text-gray-400"
                          >
                            {entry.ipAddress}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                {total.toLocaleString('en-US')} عملية — الصفحة {page} من{' '}
                {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page <= 1 || query.isFetching}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  السابق
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  disabled={page >= totalPages || query.isFetching}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
