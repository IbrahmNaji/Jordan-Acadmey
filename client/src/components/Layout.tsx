// client/src/components/Layout.tsx
import { Suspense, useEffect, useRef, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from '../store/auth';
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  Car,
  Handshake,
  Wrench,
  ClipboardCheck,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ScrollText,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import BrandMark from './public/BrandMark';
import NotificationBell from './NotificationBell';
import { site } from '../content/site';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  roles?: Array<'ADMIN' | 'MANAGER' | 'AGENT'>;
};

const navigationGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'المتابعة اليومية',
    items: [
      { to: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
      { to: '/admin/leads', label: 'العملاء المحتملون', icon: Users },
      { to: '/admin/vehicles', label: 'بيع وشراء المركبات', icon: Car },
      { to: '/admin/brokerage', label: 'صفقات المركبات', icon: Handshake },
      { to: '/admin/operations', label: 'الكراج وقطع الغيار', icon: Wrench, roles: ['ADMIN', 'MANAGER'] },
      {
        to: '/admin/follow-ups',
        label: 'المتابعات المستحقة',
        icon: CalendarClock,
      },
    ],
  },
  {
    label: 'البرامج والمبيعات',
    items: [
      {
        to: '/admin/enrollments',
        label: 'التسجيلات والدفعات',
        icon: GraduationCap,
      },
      {
        to: '/admin/attendance',
        label: 'الحضور',
        icon: ClipboardCheck,
      },
      {
        to: '/admin/academy',
        label: 'إدارة الأكاديمية',
        icon: BookOpen,
        roles: ['ADMIN', 'MANAGER'],
      },
      { to: '/admin/campaigns', label: 'مصادر التسويق', icon: Megaphone },
    ],
  },
  {
    label: 'التحليل والإدارة',
    items: [
      { to: '/admin/reports', label: 'التقارير', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
      {
        to: '/admin/users',
        label: 'فريق العمل',
        icon: ShieldCheck,
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        to: '/admin/audit',
        label: 'سجل العمليات',
        icon: ScrollText,
        roles: ['ADMIN'],
      },
    ],
  },
];

const ROLE_LABEL: Record<'ADMIN' | 'MANAGER' | 'AGENT', string> = {
  ADMIN: 'مدير النظام',
  MANAGER: 'مدير',
  AGENT: 'موظف متابعة',
};

const PAGE_TITLES: Array<{ test: (path: string) => boolean; title: string }> = [
  { test: (p) => p === '/admin', title: 'لوحة التحكم' },
  { test: (p) => /^\/admin\/leads\/.+/.test(p), title: 'بطاقة العميل' },
  { test: (p) => p === '/admin/leads', title: 'العملاء المحتملون' },
  { test: (p) => p === '/admin/vehicles', title: 'بيع وشراء المركبات' },
  { test: (p) => p === '/admin/brokerage', title: 'صفقات المركبات' },
  { test: (p) => p === '/admin/operations', title: 'الكراج وقطع الغيار' },
  { test: (p) => p === '/admin/follow-ups', title: 'المتابعات المستحقة' },
  { test: (p) => p === '/admin/enrollments', title: 'التسجيلات والدفعات' },
  { test: (p) => p === '/admin/attendance', title: 'الحضور' },
  { test: (p) => p === '/admin/academy', title: 'إدارة الأكاديمية' },
  { test: (p) => p === '/admin/campaigns', title: 'مصادر التسويق' },
  { test: (p) => p === '/admin/reports', title: 'التقارير' },
  { test: (p) => p === '/admin/users', title: 'فريق العمل' },
  { test: (p) => p === '/admin/audit', title: 'سجل العمليات' },
];

function getPageTitle(pathname: string) {
  return (
    PAGE_TITLES.find((entry) => entry.test(pathname))?.title ?? 'لوحة الإدارة'
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);
  const user = useAuth((s) => s.user);
  const title = getPageTitle(location.pathname);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${title} | لوحة الإدارة — ${site.name}`;
  }, [title]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.classList.add('is-locked');
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-admin-bg text-ink-900">
      <aside className="sticky top-0 hidden h-screen w-[17rem] shrink-0 flex-col border-l border-white/[0.06] bg-admin-sidebar shadow-2xl lg:flex">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="إغلاق القائمة"
            className="absolute inset-0 h-full w-full cursor-default bg-ink-950/70 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="قائمة التنقل"
            className="absolute inset-y-0 right-0 flex w-80 max-w-[86vw] flex-col bg-admin-sidebar shadow-lift animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-xs font-medium text-steel-400">
                لوحة الإدارة
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-steel-400 transition hover:bg-white/10 hover:text-white"
                aria-label="إغلاق القائمة"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <SidebarContent
                user={user}
                onLogout={handleLogout}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-steel-200/70 bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-steel-200 bg-white text-steel-600 shadow-sm transition hover:border-flame-300 hover:text-ink-900 lg:hidden"
                aria-label="فتح قائمة التنقل"
                aria-expanded={mobileOpen}
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-steel-600">
                  لوحة إدارة الأكاديمية
                </p>
                <h1 className="truncate text-base font-bold text-ink-900">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1.5 rounded-md border border-steel-300 px-3 py-1.5 text-xs font-medium text-steel-600 transition hover:border-ink-900/30 hover:bg-white hover:text-ink-900 sm:inline-flex"
              >
                <ExternalLink size={13} />
                الموقع العام
              </Link>
              <div className="hidden h-6 w-px bg-steel-200 sm:block" />
              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold text-ink-900">
                  {user?.fullName}
                </p>
                <p className="text-[10px] text-steel-600">
                  {user ? ROLE_LABEL[user.role] : ''}
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-flame-400">
                {user?.fullName?.trim().charAt(0) ?? 'أ'}
              </span>
            </div>
          </div>
        </header>

        <main className="admin-scope flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <div key={location.pathname} className="page-transition">
              <Suspense fallback={<AdminPageLoading />}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </main>

        <footer className="border-t border-steel-200/70 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1 text-[11px] text-steel-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {site.name} — {site.descriptor}
            </p>
            <p>نظام إدارة الأكاديمية</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({
  user,
  onLogout,
  onNavigate,
}: {
  user: ReturnType<typeof useAuth.getState>['user'];
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  const role = user?.role ?? 'AGENT';

  return (
    <>
      <div className="border-b border-white/10 px-5 py-5">
        <Link to="/admin" onClick={onNavigate} className="block">
          <BrandMark onDark compact />
        </Link>
        <span className="mt-3 inline-flex items-center gap-2 border border-white/10 px-2 py-1 text-[10px] font-medium text-steel-400">
          <span className="h-1.5 w-1.5 bg-flame-500" aria-hidden="true" />
          لوحة الإدارة
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="التنقل الإداري">
        {navigationGroups.map((group) => {
          const items = group.items.filter(
            (item) => !item.roles || item.roles.includes(role),
          );
          if (items.length === 0) return null;

          return (
            <div key={group.label} className="mb-5 last:mb-0">
              <p className="mb-1.5 px-3 text-[10px] font-medium text-white/30">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      clsx(
                        'relative flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition duration-200',
                        isActive
                          ? 'bg-white/[0.08] text-white shadow-inner'
                          : 'text-steel-400 hover:bg-admin-sidebarHover hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-2 right-0 w-1 rounded-full bg-flame-400 shadow-flame"
                          />
                        )}
                        <Icon
                          size={17}
                          className={isActive ? 'text-flame-400' : 'text-steel-500'}
                        />
                        <span>{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-flame-400">
            {user?.fullName?.trim().charAt(0) ?? 'أ'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">
              {user?.fullName}
            </p>
            <p className="truncate text-[10px] text-steel-500">
              {ROLE_LABEL[role]}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-steel-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut size={15} />
          تسجيل الخروج
        </button>
      </div>
    </>
  );
}

function AdminPageLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="h-7 w-48 animate-pulse rounded bg-steel-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl bg-white ring-1 ring-steel-200/70"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-white ring-1 ring-steel-200/70" />
    </div>
  );
}
