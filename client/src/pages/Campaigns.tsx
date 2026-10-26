// client/src/pages/Campaigns.tsx
import { useState } from 'react';
import clsx from 'clsx';
import { Plus, Pencil, Power, PowerOff, Megaphone } from 'lucide-react';
import CampaignForm from '../components/CampaignForm';
import {
  useCampaigns,
  useToggleCampaign,
} from '../hooks/useCampaigns';
import type { CampaignSource, Channel } from '../types';

const CHANNEL_LABEL: Record<Channel, string> = {
  FACEBOOK: 'فيسبوك',
  INSTAGRAM: 'إنستغرام',
  WHATSAPP: 'واتساب',
  PHONE: 'هاتف',
  WALK_IN: 'زيارة مباشرة',
  REFERRAL: 'توصية',
  GOOGLE_ADS: 'إعلانات جوجل',
  OTHER: 'أخرى',
};

const CHANNEL_BADGE: Record<Channel, string> = {
  FACEBOOK: 'bg-blue-50 text-blue-700 ring-blue-200',
  INSTAGRAM: 'bg-pink-50 text-pink-700 ring-pink-200',
  WHATSAPP: 'bg-green-50 text-green-700 ring-green-200',
  PHONE: 'bg-gray-100 text-gray-700 ring-gray-200',
  WALK_IN: 'bg-amber-50 text-amber-800 ring-amber-200',
  REFERRAL: 'bg-steel-200/50 text-ink-700 ring-steel-200',
  GOOGLE_ADS: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
  OTHER: 'bg-gray-100 text-gray-600 ring-gray-200',
};

export default function Campaigns() {
  const [showAll, setShowAll] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignSource | undefined>();

  const campaignsQuery = useCampaigns(showAll);
  const toggle = useToggleCampaign();

  const campaigns = campaignsQuery.data ?? [];

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (c: CampaignSource) => {
    setEditing(c);
    setFormOpen(true);
  };

  const onToggle = (c: CampaignSource) => {
    toggle.toggle(c.id, !c.isActive);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مصادر الحملات</h1>
          <p className="mt-1 text-sm text-gray-600">
            إدارة مصادر الـ Leads وقنوات الاستقطاب (Facebook, Instagram, Referral…)
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          <Plus size={16} />
          إضافة مصدر
        </button>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-lg bg-gray-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className={clsx(
            'rounded-md px-3 py-1.5 font-medium',
            !showAll
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-800',
          )}
        >
          النشطة فقط
        </button>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className={clsx(
            'rounded-md px-3 py-1.5 font-medium',
            showAll
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-800',
          )}
        >
          الكل (مع المعطّلة)
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
        {campaignsQuery.isLoading ? (
          <Skeleton />
        ) : campaignsQuery.isError ? (
          <div className="p-6 text-sm text-red-700">
            تعذّر تحميل المصادر. تحقق من اتصال الخادم.
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState onCreate={openCreate} showAll={showAll} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>الاسم</Th>
                  <Th>القناة</Th>
                  <Th>UTM</Th>
                  <Th>الوصف</Th>
                  <Th>العملاء</Th>
                  <Th>الحالة</Th>
                  <Th className="text-center">إجراءات</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className={clsx(
                      'hover:bg-flame-50/40 transition-colors',
                      !c.isActive && 'opacity-60',
                    )}
                  >
                    <Td>
                      <span className="font-medium text-gray-900">
                        {c.name}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className={clsx(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1',
                          CHANNEL_BADGE[c.channel] ??
                            'bg-gray-100 text-gray-700 ring-gray-200',
                        )}
                      >
                        {CHANNEL_LABEL[c.channel] ?? c.channel}
                      </span>
                    </Td>
                    <Td className="text-xs text-gray-600">
                      {c.utmSource || c.utmMedium || c.utmCampaign ? (
                        <div className="flex flex-wrap gap-1">
                          {c.utmSource && (
                            <UtmChip label="src" value={c.utmSource} />
                          )}
                          {c.utmMedium && (
                            <UtmChip label="med" value={c.utmMedium} />
                          )}
                          {c.utmCampaign && (
                            <UtmChip label="cmp" value={c.utmCampaign} />
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td className="max-w-xs truncate text-gray-700">
                      {c.description ?? '—'}
                    </Td>
                    <Td className="text-center tabular-nums text-gray-700">
                      {c._count?.leads ?? 0}
                    </Td>
                    <Td>
                      {c.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                          نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                          معطّل
                        </span>
                      )}
                    </Td>
                    <Td className="text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
                          title="تعديل"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggle(c)}
                          disabled={toggle.isPending}
                          className={clsx(
                            'rounded-md p-1.5',
                            c.isActive
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-700 hover:bg-green-50',
                            toggle.isPending && 'opacity-50',
                          )}
                          title={c.isActive ? 'تعطيل' : 'تفعيل'}
                        >
                          {c.isActive ? (
                            <PowerOff size={14} />
                          ) : (
                            <Power size={14} />
                          )}
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CampaignForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        campaign={editing}
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

function UtmChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      dir="ltr"
      className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700 tabular-nums"
    >
      <span className="text-gray-500">{label}</span>
      {value}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-2 px-4 py-3">
          {Array.from({ length: 6 }).map((__, j) => (
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
  onCreate,
  showAll,
}: {
  onCreate: () => void;
  showAll: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-full bg-gray-100 p-3 text-gray-400">
        <Megaphone size={22} />
      </div>
      <div>
        <p className="font-medium text-gray-900">
          {showAll
            ? 'لا توجد مصادر بعد'
            : 'لا توجد مصادر نشطة'}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {showAll
            ? 'أضف أول مصدر لبدء تصنيف مصادر الـ Leads.'
            : 'فعّل مصدراً أو أضف واحداً جديداً.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800"
      >
        <Plus size={16} />
        إضافة مصدر
      </button>
    </div>
  );
}