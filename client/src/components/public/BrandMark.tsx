import clsx from 'clsx';
import { Wrench } from 'lucide-react';
import { site } from '../../content/site';

export default function BrandMark({
  onDark = false,
  compact = false,
}: {
  onDark?: boolean;
  compact?: boolean;
}) {
  return (
    <span className="flex items-center gap-3">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center bg-flame-500">
        <Wrench size={20} strokeWidth={2.4} className="text-ink-950" />
        <span
          aria-hidden="true"
          className={clsx(
            'absolute -bottom-1 -left-1 h-2 w-2',
            onDark ? 'bg-ink-950' : 'bg-paper',
          )}
        />
      </span>
      <span className="min-w-0">
        <span
          className={clsx(
            'block font-display text-[17px] font-extrabold leading-tight',
            onDark ? 'text-paper' : 'text-ink-900',
            compact && 'text-base',
          )}
        >
          {site.name}
        </span>
        <span
          className={clsx(
            'mt-0.5 block text-[10px] font-medium',
            onDark ? 'text-steel-400' : 'text-steel-600',
          )}
        >
          {site.descriptor}
        </span>
      </span>
    </span>
  );
}
