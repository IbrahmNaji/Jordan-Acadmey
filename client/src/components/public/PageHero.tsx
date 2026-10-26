import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import clsx from 'clsx';

export interface Crumb {
  label: string;
  to?: string;
}

export default function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt = '',
  breadcrumb,
  children,
  compact = false,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  image?: string;
  imageAlt?: string;
  breadcrumb?: Crumb[];
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 text-paper">
      {image && (
        <img
          src={image}
          alt={imageAlt}
          aria-hidden={imageAlt ? undefined : 'true'}
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          fetchPriority="high"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-l from-ink-950 via-ink-950/90 to-ink-950/35"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-dark opacity-20"
        style={{ backgroundSize: '56px 56px' }}
      />

      <div
        className={clsx(
          'shell relative',
          compact ? 'py-12 sm:py-16' : 'py-14 sm:py-20 lg:py-24',
        )}
      >
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="مسار التنقل" className="mb-10">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-steel-400">
              <li>
                <Link
                  to="/"
                  className="transition-colors hover:text-flame-400"
                >
                  الرئيسية
                </Link>
              </li>
              {breadcrumb.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-2">
                  <ChevronLeft
                    size={13}
                    aria-hidden="true"
                    className="text-steel-600"
                  />
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className="transition-colors hover:text-flame-400"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-paper">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="max-w-3xl">
          <p className="eyebrow text-flame-400">{eyebrow}</p>
          <h1 className="mt-4 text-balance font-display text-4xl font-extrabold leading-[1.18] sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-5 max-w-2xl text-[15px] leading-8 text-steel-300 sm:text-base">
              {description}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}
