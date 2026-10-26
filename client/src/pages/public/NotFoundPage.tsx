import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageMeta from '../../components/public/PageMeta';

export default function NotFoundPage() {
  return (
    <>
      <PageMeta title="الصفحة غير موجودة" />
      <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden bg-ink-950 py-20 text-paper">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid-dark opacity-25"
          style={{ backgroundSize: '56px 56px' }}
        />
        <div className="shell relative">
          <p className="font-display text-[92px] font-black leading-none text-flame-500 sm:text-[140px]">
            404
          </p>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            الصفحة التي تبحث عنها غير موجودة.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-8 text-steel-400">
            ربما تغيّر الرابط أو حُذفت الصفحة. يمكنك العودة إلى الرئيسية، أو
            استكشاف المسارات التدريبية من جديد.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/" className="btn-flame">
              الصفحة الرئيسية
              <ArrowLeft size={16} aria-hidden="true" />
            </Link>
            <Link to="/courses" className="btn-outline-light">
              تصفح الدورات
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
