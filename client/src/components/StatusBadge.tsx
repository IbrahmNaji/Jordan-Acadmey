// client/src/components/StatusBadge.tsx
import clsx from 'clsx';
import type { LeadStatus } from '../types';

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; classes: string }
> = {
  NEW: {
    label: 'جديد',
    classes: 'bg-gray-100 text-gray-800 ring-gray-200',
  },
  CONTACTED: {
    label: 'تم التواصل',
    classes: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  QUALIFIED: {
    label: 'مؤهّل',
    classes: 'bg-flame-50 text-flame-700 ring-flame-200',
  },
  INTERESTED: {
    label: 'مهتم',
    classes: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  FOLLOW_UP: {
    label: 'متابعة',
    classes: 'bg-orange-50 text-orange-800 ring-orange-200',
  },
  ENROLLED: {
    label: 'مسجّل',
    classes: 'bg-green-50 text-green-700 ring-green-200',
  },
  LOST: {
    label: 'مفقود',
    classes: 'bg-red-50 text-red-700 ring-red-200',
  },
  NOT_INTERESTED: {
    label: 'غير مهتم',
    classes: 'bg-gray-100 text-gray-600 ring-gray-200',
  },
};

export default function StatusBadge({
  status,
  className,
  size = 'md',
}: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    classes: 'bg-gray-100 text-gray-700 ring-gray-200',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full ring-1 font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        cfg.classes,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}