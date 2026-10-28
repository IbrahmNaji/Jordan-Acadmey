// client/src/App.tsx
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/auth';

import PublicLayout from './components/public/PublicLayout';
import HomePage from './pages/public/HomePage';
import NotFoundPage from './pages/public/NotFoundPage';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Leads = lazy(() => import('./pages/Leads'));
const LeadDetails = lazy(() => import('./pages/LeadDetails'));
const FollowUps = lazy(() => import('./pages/FollowUps'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const Enrollments = lazy(() => import('./pages/Enrollments'));
const Reports = lazy(() => import('./pages/Reports'));
const UsersPage = lazy(() => import('./pages/Users'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const Brokerage = lazy(() => import('./pages/Brokerage'));
const Academy = lazy(() => import('./pages/Academy'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Operations = lazy(() => import('./pages/Operations'));

const CoursesPage = lazy(() => import('./pages/public/CoursesPage'));
const MarketplacePage = lazy(() => import('./pages/public/MarketplacePage'));
const SparePartsPage = lazy(() => import('./pages/public/SparePartsPage'));

const CourseDetailPage = lazy(() => import('./pages/public/CourseDetailPage'));
const WorkshopPage = lazy(() => import('./pages/public/WorkshopPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const FaqPage = lazy(() => import('./pages/public/FaqPage'));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/public/TermsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-4">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-flame-500 border-t-transparent" />
        <p className="text-xs font-medium text-steel-600">جارٍ التحميل…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) return <RouteFallback />;

  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}

function RequireRole({
  roles,
  children,
}: {
  roles: Array<'ADMIN' | 'MANAGER' | 'AGENT'>;
  children: ReactNode;
}) {
  const { user } = useAuthStore();
  if (user && !roles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}

/** يستدعي loadUser مرة واحدة عند بدء التطبيق */
function AuthBootstrap({ children }: { children: ReactNode }) {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function LegacyLeadRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/admin/leads/${id}` : '/admin/leads'} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* ── الموقع العام ─────────────────────────────── */}
              <Route element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="courses" element={<CoursesPage />} />
                <Route path="marketplace" element={<MarketplacePage />} />
                <Route path="spare-parts" element={<SparePartsPage />} />
                <Route path="courses/:slug" element={<CourseDetailPage />} />
                <Route path="workshop" element={<WorkshopPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="faq" element={<FaqPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* ── لوحة الإدارة ─────────────────────────────── */}
              <Route path="/admin/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="leads" element={<Leads />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="brokerage" element={<Brokerage />} />
                <Route path="operations" element={<RequireRole roles={['ADMIN','MANAGER']}><Operations /></RequireRole>} />
                <Route path="leads/:id" element={<LeadDetails />} />
                <Route path="follow-ups" element={<FollowUps />} />
                <Route path="campaigns" element={<Campaigns />} />
                <Route path="enrollments" element={<Enrollments />} />
                <Route path="attendance" element={<Attendance />} />
                <Route
                  path="academy"
                  element={
                    <RequireRole roles={['ADMIN', 'MANAGER']}>
                      <Academy />
                    </RequireRole>
                  }
                />
                <Route path="reports" element={<Reports />} />
                <Route path="users" element={<UsersPage />} />
                <Route
                  path="audit"
                  element={
                    <RequireRole roles={['ADMIN']}>
                      <AuditLog />
                    </RequireRole>
                  }
                />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>

              {/* ── روابط قديمة ──────────────────────────────── */}
              <Route path="/login" element={<Navigate to="/admin/login" replace />} />
              <Route path="/leads" element={<Navigate to="/admin/leads" replace />} />
              <Route path="/leads/:id" element={<LegacyLeadRedirect />} />
              <Route
                path="/campaigns"
                element={<Navigate to="/admin/campaigns" replace />}
              />
              <Route
                path="/enrollments"
                element={<Navigate to="/admin/enrollments" replace />}
              />
              <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthBootstrap>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
