// client/src/pages/Login.tsx
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LogIn,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import BrandMark from '../components/public/BrandMark';
import { site } from '../content/site';
import { useAuth } from '../store/auth';

function loginErrorMessage(error: unknown) {
  const err = error as {
    response?: { status?: number; data?: { error?: string } };
  };
  const code = err.response?.data?.error;
  if (err.response?.status === 429) {
    return 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.';
  }
  if (code === 'INVALID_CREDENTIALS') {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (code === 'VALIDATION_ERROR') {
    return 'تحقّق من صيغة البريد الإلكتروني وكلمة المرور.';
  }
  return 'تعذّر تسجيل الدخول. تحقّق من اتصال الخادم ثم أعد المحاولة.';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const destination = from?.startsWith('/admin') ? from : '/admin';

  useEffect(() => {
    document.title = `تسجيل الدخول | لوحة الإدارة — ${site.name}`;
  }, []);

  useEffect(() => {
    if (!loading && user) {
      navigate(destination, { replace: true });
    }
  }, [loading, user, navigate, destination]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-admin-bg">
      <div className="flex w-full flex-col lg:w-[52%]">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" aria-label={`${site.name} — الصفحة الرئيسية`}>
            <BrandMark compact />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-steel-600 transition hover:text-ink-900"
          >
            العودة إلى الموقع
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-flame-700">
                <ShieldCheck size={14} />
                منطقة إدارة محمية
              </span>
              <h1 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-[28px]">
                تسجيل الدخول إلى لوحة الإدارة
              </h1>
              <p className="mt-2 text-sm leading-7 text-steel-600">
                أدخل بيانات حسابك للوصول إلى العملاء والتسجيلات والتقارير.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="label">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-steel-400"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="input pr-9 text-left"
                    placeholder="name@academy.com"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-steel-400"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="input px-10"
                    placeholder="••••••••"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-steel-500 transition hover:bg-ink-900/5 hover:text-ink-900"
                    aria-label={
                      showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs leading-6 text-red-700 ring-1 ring-red-200"
                >
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-flame-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-flame-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn size={16} />
                {submitting ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
              </button>
            </form>

            {import.meta.env.DEV && (
              <p className="mt-6 rounded-lg border border-dashed border-steel-300 bg-white/60 px-3 py-2 text-[11px] leading-6 text-steel-600">
                بيئة تطوير: يمكن استخدام حساب الاختبار
                <span dir="ltr" className="mx-1 font-mono text-ink-800">
                  admin@academy.local
                </span>
                إن كان مُهيّأً في قاعدة البيانات.
              </p>
            )}

            <p className="mt-8 border-t border-steel-200 pt-4 text-[11px] leading-6 text-steel-600">
              الدخول مخصص لموظفي الأكاديمية. لا تشارك بيانات حسابك، وسيتم
              تسجيل خروجك تلقائياً عند انتهاء صلاحية الجلسة.
            </p>
          </div>
        </div>
      </div>

      <aside className="relative hidden isolate overflow-hidden bg-ink-950 lg:block lg:w-[48%]">
        <img
          src="/images/hero/hero-workshop.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/75 to-ink-950/30" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-grid-dark opacity-20"
          style={{ backgroundSize: '56px 56px' }}
        />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <p className="inline-flex items-center gap-3 font-display text-[11px] font-bold text-flame-400">
            <span className="h-px w-8 bg-flame-500" />
            {site.descriptor}
          </p>

          <div className="max-w-sm">
            <h2 className="font-display text-4xl font-black leading-tight text-paper">
              كل استفسار يبدأ
              <br />
              رحلة جديدة.
            </h2>
            <p className="mt-4 text-sm leading-8 text-steel-400">
              متابعة العملاء، إدارة التسجيلات والدفعات، وقراءة أداء الأكاديمية
              من مكان واحد.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 text-xs text-steel-400">
              <div>
                <p className="font-display text-xl font-bold text-paper">
                  {site.location}
                </p>
                <p className="mt-1">مقر الأكاديمية</p>
              </div>
              <div>
                <p className="font-display text-xl font-bold text-paper">
                  ورشة عملي
                </p>
                <p className="mt-1">بيئة التدريب</p>
              </div>
            </div>
          </div>

          <p className="text-[10px] leading-6 text-white/30">
            {site.imagesNotice}
          </p>
        </div>
      </aside>
    </div>
  );
}
