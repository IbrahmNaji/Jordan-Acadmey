// client/src/pages/Users.tsx
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  KeyRound,
  Mail,
  Power,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UserRoundPlus,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import {
  createUser,
  fetchUsers,
  resetUserPassword,
  updateUser,
  type DirectoryUser,
} from '../api/users';
import { getApiErrorMessage } from '../lib/apiError';
import { useAuth } from '../store/auth';
import { site } from '../content/site';
import type { Role } from '../types';

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'مدير النظام',
  MANAGER: 'مدير',
  AGENT: 'موظف متابعة',
};

const ROLE_TONE: Record<Role, string> = {
  ADMIN: 'bg-ink-900 text-paper ring-ink-900',
  MANAGER: 'bg-flame-50 text-flame-800 ring-flame-200',
  AGENT: 'bg-steel-200/50 text-ink-700 ring-steel-200',
};

export default function Users() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<DirectoryUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const me = useAuth((s) => s.user);
  const canWrite = me?.role === 'ADMIN';
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['users', 'directory', includeInactive],
    queryFn: () => fetchUsers(includeInactive),
    staleTime: 60_000,
    retry: false,
  });

  const toggleMutation = useMutation({
    mutationFn: (user: DirectoryUser) =>
      updateUser(user.id, { isActive: !user.isActive }),
    onSuccess: (_data, user) => {
      setActionError(null);
      setActionNotice(
        user.isActive ? 'تم تعطيل الحساب.' : 'تم تفعيل الحساب.',
      );
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => setActionError(getApiErrorMessage(error)),
  });

  const users = query.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      `${user.fullName} ${user.email}`.toLowerCase().includes(term),
    );
  }, [users, search]);

  const activeCount = users.filter((user) => user.isActive).length;
  const adminCount = users.filter(
    (user) => user.role === 'ADMIN' || user.role === 'MANAGER',
  ).length;

  const forbidden =
    (query.error as { response?: { status?: number } } | null)?.response
      ?.status === 403;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">فريق العمل</h1>
          <p className="mt-1 text-sm text-steel-600">
            حسابات الموظفين المسجّلين في نظام {site.name} وصلاحياتهم.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-steel-300 bg-white px-3 py-2 text-xs font-semibold text-steel-600 transition hover:border-ink-900/25 hover:text-ink-900 disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={query.isFetching ? 'animate-spin' : undefined}
            />
            تحديث
          </button>
          {canWrite && !forbidden && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink-800"
            >
              <UserRoundPlus size={14} />
              إضافة موظف
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {actionError}
        </div>
      )}
      {actionNotice && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800 ring-1 ring-green-200">
          {actionNotice}
        </div>
      )}

      {forbidden ? (
        <div className="rounded-xl bg-white p-6 ring-1 ring-steel-200/70">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-amber-50 p-2.5 text-amber-700">
              <ShieldAlert size={20} />
            </span>
            <div>
              <p className="font-semibold text-ink-900">صلاحية غير كافية</p>
              <p className="mt-1 text-sm leading-7 text-steel-600">
                عرض فريق العمل متاح لمدير النظام والمدير فقط. تواصل مع مسؤول
                النظام إذا كنت تحتاج إلى صلاحية إضافية.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile
              label="إجمالي الحسابات"
              value={query.isLoading ? '—' : String(users.length)}
              icon={UsersIcon}
            />
            <StatTile
              label="حسابات نشطة"
              value={query.isLoading ? '—' : String(activeCount)}
              icon={UserRound}
              tone="text-green-600 bg-green-50"
            />
            <StatTile
              label="مديرون ومشرفون"
              value={query.isLoading ? '—' : String(adminCount)}
              icon={ShieldCheck}
              tone="text-flame-700 bg-flame-50"
            />
          </div>

          <div className="rounded-xl bg-white ring-1 ring-steel-200/70">
            <div className="flex flex-col gap-3 border-b border-steel-200/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-steel-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ابحث بالاسم أو البريد…"
                  className="w-full rounded-lg border border-steel-300 bg-white py-2 pl-3 pr-9 text-xs text-ink-900 placeholder:text-steel-600 focus:border-flame-500 focus:outline-none focus:ring-2 focus:ring-flame-500/20"
                />
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-steel-600">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(event) => setIncludeInactive(event.target.checked)}
                  className="h-4 w-4 rounded border-steel-300 accent-flame-500"
                />
                إظهار الحسابات المعطّلة
              </label>
            </div>

            {query.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-14 animate-pulse rounded-lg bg-steel-200/50"
                  />
                ))}
              </div>
            ) : query.isError ? (
              <div className="p-6">
                <p className="text-sm text-red-700">
                  تعذّر تحميل قائمة فريق العمل. تحقّق من اتصال الخادم ثم أعد
                  المحاولة.
                </p>
                <button
                  type="button"
                  onClick={() => query.refetch()}
                  className="mt-3 rounded-lg bg-steel-200/60 px-3 py-1.5 text-sm text-ink-800 hover:bg-steel-200"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <span className="rounded-full bg-steel-200/50 p-3 text-steel-600">
                  <UserRound size={20} />
                </span>
                <p className="text-sm font-semibold text-ink-900">
                  {search.trim()
                    ? 'لا توجد نتائج مطابقة'
                    : 'لا توجد حسابات لعرضها'}
                </p>
                <p className="text-xs text-steel-600">
                  {search.trim()
                    ? 'جرّب تعديل كلمة البحث.'
                    : 'ستظهر الحسابات هنا عند إضافتها إلى النظام.'}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-steel-200/70 bg-admin-bg/60 text-[11px] text-steel-600">
                      <tr>
                        <Th>الموظف</Th>
                        <Th>البريد الإلكتروني</Th>
                        <Th>الدور</Th>
                        <Th>الحالة</Th>
                        {canWrite && <Th>إجراءات</Th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-steel-200/60">
                      {filtered.map((user) => (
                        <tr
                          key={user.id}
                          className="transition-colors hover:bg-flame-50/30"
                        >
                          <Td>
                            <div className="flex items-center gap-3">
                              <Avatar name={user.fullName} active={user.isActive} />
                              <span className="font-semibold text-ink-900">
                                {user.fullName}
                              </span>
                            </div>
                          </Td>
                          <Td>
                            <span
                              dir="ltr"
                              className="inline-flex items-center gap-1.5 text-right text-xs text-steel-600"
                            >
                              <Mail size={12} className="text-steel-400" />
                              {user.email}
                            </span>
                          </Td>
                          <Td>
                            <RoleBadge role={user.role} />
                          </Td>
                          <Td>
                            <ActiveBadge active={user.isActive} />
                          </Td>
                          {canWrite && (
                            <Td>
                              <UserActions
                                user={user}
                                disabled={user.id === me?.id}
                                busy={toggleMutation.isPending}
                                onReset={() => setResetTarget(user)}
                                onToggle={() => toggleMutation.mutate(user)}
                              />
                            </Td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="divide-y divide-steel-200/60 md:hidden">
                  {filtered.map((user) => (
                    <li key={user.id} className="px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <Avatar name={user.fullName} active={user.isActive} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-ink-900">
                              {user.fullName}
                            </p>
                            <RoleBadge role={user.role} />
                          </div>
                          <p
                            dir="ltr"
                            className="mt-0.5 text-right text-[11px] text-steel-600"
                          >
                            {user.email}
                          </p>
                          <p className="mt-1 text-[11px] text-steel-600">
                            {user.isActive ? 'حساب نشط' : 'حساب معطّل'}
                          </p>
                        </div>
                      </div>
                      {canWrite && (
                        <div className="mt-2 flex justify-end">
                          <UserActions
                            user={user}
                            disabled={user.id === me?.id}
                            busy={toggleMutation.isPending}
                            onReset={() => setResetTarget(user)}
                            onToggle={() => toggleMutation.mutate(user)}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <p className="text-[11px] leading-6 text-steel-600">
            {canWrite
              ? 'يمكنك إضافة الحسابات وتعطيلها وإعادة تعيين كلمات المرور. لا يمكن تعطيل حسابك أو تغيير دوره بنفسك.'
              : 'إنشاء الحسابات وتعديل الصلاحيات متاح لمدير النظام فقط لضمان أمان الوصول.'}
          </p>
        </>
      )}

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ['users'] });
            setCreateOpen(false);
            setActionError(null);
            setActionNotice('تم إنشاء الحساب بنجاح.');
          }}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={() => {
            setResetTarget(null);
            setActionError(null);
            setActionNotice('تم تغيير كلمة المرور وإنهاء جلسات الحساب.');
          }}
        />
      )}
    </div>
  );
}

function UserActions({
  user,
  disabled,
  busy,
  onToggle,
  onReset,
}: {
  user: DirectoryUser;
  disabled: boolean;
  busy: boolean;
  onToggle: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled || busy}
        title={user.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
        className={clsx(
          'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition disabled:opacity-40',
          user.isActive
            ? 'text-amber-700 hover:bg-amber-50'
            : 'text-green-700 hover:bg-green-50',
        )}
      >
        <Power size={12} />
        {user.isActive ? 'تعطيل' : 'تفعيل'}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-steel-600 transition hover:bg-steel-200/50"
      >
        <KeyRound size={12} />
        كلمة المرور
      </button>
    </div>
  );
}

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('AGENT');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createUser({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        password,
      }),
    onSuccess: onCreated,
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  return (
    <ModalShell title="إضافة موظف" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <Field label="الاسم الكامل">
          <input
            required
            minLength={2}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="البريد الإلكتروني">
          <input
            required
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="رقم الهاتف (اختياري)">
          <input
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="الدور">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={inputClass}
          >
            {(Object.keys(ROLE_LABEL) as Role[]).map((value) => (
              <option key={value} value={value}>
                {ROLE_LABEL[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="كلمة المرور المؤقتة">
          <input
            required
            type="password"
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
          <p className="mt-1 text-[11px] text-steel-600">
            10 أحرف على الأقل، وتشمل حرفاً ورقماً.
          </p>
        </Field>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-steel-200/70 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-steel-600 hover:bg-steel-200/50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-ink-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
          >
            {mutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onDone,
}: {
  user: DirectoryUser;
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => resetUserPassword(user.id, password),
    onSuccess: onDone,
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  return (
    <ModalShell title={`كلمة مرور: ${user.fullName}`} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (password !== confirm) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
          }
          setError(null);
          mutation.mutate();
        }}
      >
        <Field label="كلمة المرور الجديدة">
          <input
            required
            type="password"
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        </Field>
        <Field label="تأكيد كلمة المرور">
          <input
            required
            type="password"
            minLength={10}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        </Field>
        <p className="text-[11px] text-steel-600">
          سيتم إنهاء جميع جلسات هذا الحساب بعد التغيير.
        </p>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-steel-200/70 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-steel-600 hover:bg-steel-200/50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-ink-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
          >
            {mutation.isPending ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

const inputClass =
  'w-full rounded-lg border border-steel-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-flame-500 focus:outline-none focus:ring-2 focus:ring-flame-500/20';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-steel-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl ring-1 ring-steel-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-steel-200/70 px-5 py-3">
          <h3 className="text-sm font-bold text-ink-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-steel-600 hover:bg-steel-200/50"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Avatar({ name, active }: { name: string; active: boolean }) {
  return (
    <span
      className={clsx(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        active
          ? 'bg-ink-900 text-flame-400'
          : 'bg-steel-200/60 text-steel-600',
      )}
      aria-hidden="true"
    >
      {name.trim().charAt(0) || '؟'}
    </span>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1',
        ROLE_TONE[role],
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1',
        active
          ? 'bg-green-50 text-green-700 ring-green-200'
          : 'bg-steel-200/50 text-steel-600 ring-steel-200',
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {active ? 'نشط' : 'معطّل'}
    </span>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'text-steel-600 bg-steel-200/50',
}: {
  label: string;
  value: string;
  icon: typeof UsersIcon;
  tone?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-steel-200/70">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-steel-600">{label}</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-ink-900">
            {value}
          </p>
        </div>
        <span className={clsx('rounded-full p-2.5', tone)}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-right text-[11px] font-semibold">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-middle">{children}</td>;
}
