import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

export default function PublicLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <a
        href="#main-content"
        className="sr-only z-[60] bg-flame-500 px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:right-4 focus:top-4"
      >
        تجاوز إلى المحتوى الرئيسي
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <div key={location.pathname} className="page-transition">
          <Suspense fallback={<PublicPageLoading />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PublicPageLoading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center bg-paper"
      aria-busy="true"
      aria-label="جارٍ التحميل"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-flame-500 border-t-transparent" />
        <p className="text-xs font-medium text-steel-600">جارٍ التحميل…</p>
      </div>
    </div>
  );
}
