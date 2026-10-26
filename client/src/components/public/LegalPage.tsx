import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageMeta from './PageMeta';
import PageHero from './PageHero';

export default function LegalPage({
  title,
  description,
  updated,
  children,
}: {
  title: string;
  description: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageMeta title={title} description={description} />
      <PageHero
        compact
        eyebrow="معلومات قانونية"
        title={title}
        description={description}
        breadcrumb={[{ label: title }]}
      />
      <section className="bg-paper py-12 lg:py-16">
        <div className="shell max-w-4xl">
          <p className="inline-flex border border-ink-900/10 bg-white px-3 py-1.5 text-[11px] text-steel-600">
            {updated}
          </p>
          <div className="prose-academy mt-6 border border-ink-900/10 bg-white p-6 sm:p-10">
            {children}
          </div>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 border border-ink-900/10 bg-white p-5 sm:flex-row sm:items-center">
            <p className="text-[12px] leading-6 text-steel-600">
              لديك سؤال حول هذه الصفحة؟ تواصل معنا وسنوضح ما تحتاجه.
            </p>
            <Link
              to="/contact"
              className="inline-flex shrink-0 items-center gap-2 border border-ink-900/15 px-4 py-2 font-display text-xs font-bold text-ink-900 transition-colors hover:border-flame-500 hover:text-flame-700"
            >
              تواصل معنا
              <ArrowLeft size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
