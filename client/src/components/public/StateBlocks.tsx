import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export function Spinner({
  label = 'جارٍ التحميل...',
  onDark = false,
}: {
  label?: string;
  onDark?: boolean;
}) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-16 text-sm"
    >
      <Loader2
        size={20}
        className="animate-spin text-flame-500"
        aria-hidden="true"
      />
      <span className={onDark ? 'text-steel-300' : 'text-steel-600'}>
        {label}
      </span>
    </div>
  );
}

export function CourseGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="border border-ink-900/10 bg-white p-0"
        >
          <div className="aspect-[16/10] animate-pulse bg-steel-200" />
          <div className="space-y-3 p-6">
            <div className="h-5 w-2/3 animate-pulse rounded bg-steel-200" />
            <div className="h-3 w-full animate-pulse rounded bg-steel-200" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-steel-200" />
            <div className="h-8 w-1/3 animate-pulse rounded bg-steel-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  title = 'تعذّر تحميل المحتوى',
  message = 'تحقق من اتصال الإنترنت ثم أعد المحاولة.',
  onRetry,
  onDark = false,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onDark?: boolean;
}) {
  return (
    <div
      role="alert"
      className={clsx(
        'flex flex-col items-start gap-4 border p-6 sm:flex-row sm:items-center sm:justify-between',
        onDark
          ? 'border-white/15 bg-white/[0.03]'
          : 'border-red-200 bg-red-50/60',
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={20}
          className="mt-0.5 shrink-0 text-red-500"
          aria-hidden="true"
        />
        <div>
          <p
            className={clsx(
              'font-display text-sm font-bold',
              onDark ? 'text-paper' : 'text-ink-900',
            )}
          >
            {title}
          </p>
          <p
            className={clsx(
              'mt-1 text-sm',
              onDark ? 'text-steel-400' : 'text-steel-600',
            )}
          >
            {message}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 border border-ink-900/20 px-4 py-2 text-xs font-semibold text-ink-900 transition hover:border-flame-500 hover:text-flame-600"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center border border-dashed border-ink-900/20 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-dark text-steel-600">
        <Inbox size={22} aria-hidden="true" />
      </span>
      <p className="mt-4 font-display text-base font-bold text-ink-900">
        {title}
      </p>
      <p className="mt-1 max-w-sm text-sm leading-7 text-steel-600">
        {message}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
