import type { ReactNode } from 'react';
import clsx from 'clsx';
import Reveal from './Reveal';

export default function SectionHeading({
  eyebrow,
  title,
  description,
  onDark = false,
  action,
  align = 'start',
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  onDark?: boolean;
  action?: ReactNode;
  align?: 'start' | 'center';
  className?: string;
}) {
  return (
    <Reveal
      className={clsx(
        'flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={clsx('max-w-2xl', align === 'center' && 'mx-auto')}>
        <p className={clsx('eyebrow', onDark && 'text-flame-400')}>
          {eyebrow}
        </p>
        <h2
          className={clsx(
            'mt-4 text-3xl font-extrabold leading-[1.25] sm:text-4xl',
            onDark ? 'text-paper' : 'text-ink-900',
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={clsx(
              'mt-4 text-[15px] leading-8',
              onDark ? 'text-steel-400' : 'text-steel-600',
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
