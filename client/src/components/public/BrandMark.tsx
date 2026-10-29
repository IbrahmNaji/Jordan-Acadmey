import clsx from 'clsx';
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
      <span className="flex h-12 w-[76px] shrink-0 items-center justify-center overflow-hidden bg-white sm:h-14 sm:w-[90px]">
        <img
          src="/jordan-tech-academy-logo.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain"
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
