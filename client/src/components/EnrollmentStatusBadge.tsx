import clsx from 'clsx';
import { ENROLLMENT_STATUS_CONFIG } from '../lib/constants';
import type { EnrollmentStatus } from '../types';

export default function EnrollmentStatusBadge({
  status,
  className,
}: {
  status: EnrollmentStatus;
  className?: string;
}) {
  const config =
    ENROLLMENT_STATUS_CONFIG[status] ?? ENROLLMENT_STATUS_CONFIG.ACTIVE;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 whitespace-nowrap',
        config.classes,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
}
