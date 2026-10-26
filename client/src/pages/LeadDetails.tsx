// client/src/pages/LeadDetails.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import {
  ArrowRight,
  Phone,
  MessageCircle,
  Pencil,
  UserCheck,
  CalendarClock,
  GraduationCap,
  Send,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LeadForm from '../components/LeadForm';
import {
  useAssignLead,
  useChangeLeadStatus,
  useLead,
  useSetFollowUp,
} from '../hooks/useLeads';
import api from '../api/client';
import { fetchAcademyCourses, fetchBatches } from '../api/academy';
import { getApiErrorMessage } from '../lib/apiError';
import { useAuth } from '../store/auth';
import type {
  Activity,
  ActivityType,
  LeadStatus,
  User,
} from '../types';

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'NEW', label: 'جديد' },
  { value: 'CONTACTED', label: 'تم التواصل' },
  { value: 'QUALIFIED', label: 'مؤهّل' },
  { value: 'INTERESTED', label: 'مهتم' },
  { value: 'FOLLOW_UP', label: 'متابعة' },
  { value: 'ENROLLED', label: 'مسجّل' },
  { value: 'LOST', label: 'مفقود' },
  { value: 'NOT_INTERESTED', label: 'غير مهتم' },
];

const COURSE_OPTIONS = [
  { value: 'MECHANICS', label: 'ميكانيكا' },
  { value: 'ELECTRICAL', label: 'كهرباء' },
  { value: 'DIAGNOSTICS', label: 'تشخيص أعطال' },
  { value: 'HYBRID', label: 'هايبرد' },
] as const;

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ar-SY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateInputValue(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ── Activities (inline API — سنضيف hooks لاحقاً) ──
async function fetchActivities(leadId: string): Promise<Activity[]> {
  const { data } = await api.get<Activity[]>(`/activities/lead/${leadId}`);
  return data;
}

async function createActivity(payload: {
  leadId: string;
  type: ActivityType;
  content: string;
}): Promise<Activity> {
  const { data } = await api.post<Activity>('/activities', payload);
  return data;
}

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const leadQuery = useLead(id);
  const lead = leadQuery.data;
  const role = useAuth((s) => s.user?.role);
  const canAssign = role === 'ADMIN' || role === 'MANAGER';

  const [editOpen, setEditOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState<LeadStatus | ''>('');
  const [reason, setReason] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // مزامنة الحقول المحلية عند وصول البيانات
  useEffect(() => {
    if (lead) {
      setStatusDraft(lead.status);
      setFollowUp(toDateInputValue(lead.nextFollowUpAt));
      setAssignTo(lead.assignedToId ?? '');
    }
  }, [lead?.id, lead?.status, lead?.nextFollowUpAt, lead?.assignedToId]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = useChangeLeadStatus(id ?? '');
  const assignMutation = useAssignLead(id ?? '');
  const followUpMutation = useSetFollowUp(id ?? '');

  const activitiesQuery = useQuery({
    queryKey: ['activities', 'lead', id],
    queryFn: () => fetchActivities(id as string),
    enabled: !!id,
    staleTime: 15_000,
  });

  const activityMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities', 'lead', id] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'agents'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users');
      return data;
    },
    enabled: canAssign,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const agents = useMemo(
    () => (usersQuery.data ?? []).filter((u) => u.isActive),
    [usersQuery.data],
  );

  if (leadQuery.isLoading) {
    return <DetailsSkeleton />;
  }

  if (leadQuery.isError || !lead) {
    return (
      <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
        <p className="text-sm text-red-700">
          تعذّر تحميل بيانات العميل المحتمل. قد يكون الرابط غير صحيح أو حُذف.
        </p>
        <button
          onClick={() => navigate('/admin/leads')}
          className="mt-3 rounded-lg px-3 py-1.5 text-sm text-flame-700 hover:bg-flame-50"
        >
          العودة إلى القائمة
        </button>
      </div>
    );
  }

  const whatsappNumber = (lead.whatsapp || lead.phone || '').replace(
    /[^\d]/g,
    '',
  );
  const waHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.startsWith('963') ? '' : '963'}${whatsappNumber.replace(/^0+/, '')}`
    : undefined;
  const telHref = lead.phone ? `tel:${lead.phone}` : undefined;

  const onSaveStatus = async () => {
    if (!statusDraft || statusDraft === lead.status) return;
    setActionError(null);
    setActionNotice(null);
    try {
      await changeStatus.mutateAsync({
        status: statusDraft,
        reason: reason.trim() || undefined,
      });
      setReason('');
      setActionNotice('تم تحديث حالة العميل.');
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const onAssign = async () => {
    setActionError(null);
    setActionNotice(null);
    try {
      await assignMutation.mutateAsync(assignTo || null);
      setActionNotice('تم تحديث المسؤول عن العميل.');
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const onSaveFollowUp = async () => {
    setActionError(null);
    setActionNotice(null);
    try {
      await followUpMutation.mutateAsync(followUp ? followUp : null);
      setActionNotice(
        followUp ? 'تم حفظ موعد المتابعة.' : 'تم إلغاء موعد المتابعة.',
      );
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/leads"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="رجوع"
          >
            <ArrowRight size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {lead.fullName}
              </h1>
              <StatusBadge status={lead.status} />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              أُنشئ في {formatDate(lead.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {telHref && (
            <a
              href={telHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Phone size={14} /> اتصال
            </a>
          )}
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              <MessageCircle size={14} /> واتساب
            </a>
          )}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={14} /> تعديل
          </button>
        </div>
      </div>

      {/* 3 Columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Column 1: Client Info */}
        <section className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            بيانات العميل
          </h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="الهاتف">
              <span dir="ltr" className="tabular-nums">
                {lead.phone}
              </span>
            </Row>
            <Row label="واتساب">
              {lead.whatsapp ? (
                <span dir="ltr" className="tabular-nums">
                  {lead.whatsapp}
                </span>
              ) : (
                '—'
              )}
            </Row>
            <Row label="البريد">{lead.email ?? '—'}</Row>
            <Row label="المدينة">{lead.city ?? '—'}</Row>
            <Row label="العمر">{lead.age ?? '—'}</Row>
            <Row label="الدورة المهتم بها">
              {COURSE_OPTIONS.find((c) => c.value === lead.interestedIn)
                ?.label ?? '—'}
            </Row>
            <Row label="المصدر">{lead.source?.name ?? '—'}</Row>
            <Row label="المسؤول">
              {lead.assignedTo?.fullName ?? '—'}
            </Row>
            <Row label="آخر تواصل">
              {formatDateTime(lead.lastContactedAt)}
            </Row>
            <Row label="المتابعة القادمة">
              {formatDate(lead.nextFollowUpAt)}
            </Row>
            {lead.notes && (
              <div className="pt-2 border-t border-gray-100">
                <dt className="mb-1 text-xs font-medium text-gray-500">
                  ملاحظات
                </dt>
                <dd className="whitespace-pre-line text-gray-700">
                  {lead.notes}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Column 2: Activities */}
        <section className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">الأنشطة</h2>
            <span className="text-xs text-gray-500">
              {(activitiesQuery.data ?? []).length} نشاط
            </span>
          </div>

          <ActivityComposer
            onSubmit={(type, content) =>
              activityMutation.mutateAsync({
                leadId: lead.id,
                type,
                content,
              })
            }
            loading={activityMutation.isPending}
          />

          <div className="mt-4 max-h-96 overflow-y-auto pr-1">
            {activitiesQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 rounded bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : (activitiesQuery.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                لا توجد أنشطة مسجّلة بعد.
              </p>
            ) : (
              <ol className="space-y-3">
                {(activitiesQuery.data ?? []).slice(0, 10).map((a) => (
                  <li key={a.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1',
                          activityColor(a.type),
                        )}
                      >
                        {activityLabel(a.type)}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums">
                        {formatDateTime(a.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-gray-700">
                      {a.content}
                    </p>
                    {a.user?.fullName && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        — {a.user.fullName}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        {/* Column 3: Actions */}
        <section className="rounded-xl bg-white p-5 ring-1 ring-gray-200 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900">إجراءات</h2>

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

          {/* Change Status */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <UserCheck size={14} /> تغيير الحالة
            </label>
            <div className="flex gap-2">
              <select
                value={statusDraft}
                onChange={(e) =>
                  setStatusDraft(e.target.value as LeadStatus | '')
                }
                className="flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onSaveStatus}
                disabled={
                  changeStatus.isPending ||
                  !statusDraft ||
                  statusDraft === lead.status
                }
                className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:bg-ink-900/30"
              >
                حفظ
              </button>
            </div>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="سبب التغيير (اختياري)"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
          </div>

          {/* Assign */}
          {canAssign && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <UserCheck size={14} /> تعيين المسؤول
              </label>
              <div className="flex gap-2">
                <select
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                  disabled={usersQuery.isLoading}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
                >
                  <option value="">— بدون —</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onAssign}
                  disabled={
                    assignMutation.isPending ||
                    assignTo === (lead.assignedToId ?? '')
                  }
                  className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:bg-ink-900/30"
                >
                  حفظ
                </button>
              </div>
              {usersQuery.isError && (
                <p className="mt-1 text-[11px] text-gray-500">
                  قائمة المستخدمين غير متاحة حالياً.
                </p>
              )}
            </div>
          )}

          {/* Follow-up */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <CalendarClock size={14} /> متابعة قادمة
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
              />
              <button
                type="button"
                onClick={onSaveFollowUp}
                disabled={followUpMutation.isPending}
                className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:bg-ink-900/30"
              >
                حفظ
              </button>
            </div>
            {lead.nextFollowUpAt && (
              <button
                type="button"
                onClick={() => {
                  setFollowUp('');
                  void onSaveFollowUp();
                }}
                disabled={followUpMutation.isPending}
                className="mt-1.5 text-[11px] text-gray-500 underline-offset-2 hover:text-flame-700 hover:underline"
              >
                إلغاء موعد المتابعة الحالي
              </button>
            )}
          </div>

          {/* Convert */}
          <div className="pt-4 border-t border-gray-100">
            {lead.status === 'ENROLLED' ? (
              <Link
                to="/admin/enrollments"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                <GraduationCap size={16} />
                عرض التسجيل والدفعات
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setEnrollOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                <GraduationCap size={16} />
                تحويل إلى تسجيل
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Edit Modal */}
      <LeadForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        lead={lead}
      />

      {/* Enroll Modal */}
      <EnrollModal
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        leadId={lead.id}
        defaultCourse={lead.interestedIn ?? 'MECHANICS'}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['leads'] });
          qc.invalidateQueries({ queryKey: ['dashboard'] });
          qc.invalidateQueries({ queryKey: ['enrollments'] });
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-left text-gray-800">{children}</dd>
    </div>
  );
}

function ActivityComposer({
  onSubmit,
  loading,
}: {
  onSubmit: (type: ActivityType, content: string) => Promise<unknown>;
  loading: boolean;
}) {
  const [type, setType] = useState<ActivityType>('NOTE');
  const [content, setContent] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      await onSubmit(type, trimmed);
      setContent('');
    } catch {
      /* إبقاء النص */
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-lg bg-gray-50 p-2 ring-1 ring-gray-200 space-y-2"
    >
      <div className="flex gap-1.5">
        {(['CALL', 'WHATSAPP_MSG', 'NOTE'] as ActivityType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={clsx(
              'rounded-md px-2 py-1 text-[11px] font-medium',
              type === t
                ? 'bg-ink-900 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100',
            )}
          >
            {activityLabel(t)}
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        placeholder="اكتب ملخص النشاط..."
        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-flame-500"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-ink-900 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-ink-800 disabled:bg-ink-900/30"
        >
          <Send size={12} /> إضافة
        </button>
      </div>
    </form>
  );
}

const enrollSchema = z.object({
  courseId: z.string().uuid('اختر دورة منشورة'),
  batchId: z.string().uuid().optional().or(z.literal('')),
  totalFee: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  paymentPlan: z.string().trim().max(120).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});
type EnrollInput = z.input<typeof enrollSchema>;
type EnrollValues = z.output<typeof enrollSchema>;

function EnrollModal({
  open,
  onClose,
  leadId,
  defaultCourse,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  leadId: string;
  defaultCourse: 'MECHANICS' | 'ELECTRICAL' | 'DIAGNOSTICS' | 'HYBRID';
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EnrollInput, unknown, EnrollValues>({
    resolver: zodResolver(enrollSchema),
    defaultValues: {
      courseId: '',
      batchId: '',
      totalFee: 0,
      paymentPlan: '',
      startDate: '',
      notes: '',
    },
  });

  const coursesQuery = useQuery({
    queryKey: ['academy', 'courses', 'published'],
    queryFn: () => fetchAcademyCourses({ status: 'PUBLISHED' }),
    enabled: open,
    staleTime: 60_000,
  });
  const courses = coursesQuery.data ?? [];
  const selectedCourseId = watch('courseId');

  const batchesQuery = useQuery({
    queryKey: ['academy', 'batches', 'open', selectedCourseId],
    queryFn: () =>
      fetchBatches({ status: 'OPEN', courseId: selectedCourseId }),
    enabled: open && Boolean(selectedCourseId),
    staleTime: 30_000,
  });
  const batches = batchesQuery.data ?? [];

  useEffect(() => {
    if (!open) return;
    reset({
      courseId: '',
      batchId: '',
      totalFee: 0,
      paymentPlan: '',
      startDate: '',
      notes: '',
    });
  }, [open, reset]);

  useEffect(() => {
    if (!open || courses.length === 0) return;
    if (courses.some((course) => course.id === selectedCourseId)) return;
    const match =
      courses.find((course) => course.courseType === defaultCourse) ?? courses[0];
    setValue('courseId', match.id);
  }, [open, courses, defaultCourse, selectedCourseId, setValue]);

  useEffect(() => {
    if (!open) return;
    setValue('batchId', '');
  }, [selectedCourseId, open, setValue]);

  useEffect(() => {
    if (!open) return;
    const course = courses.find((item) => item.id === selectedCourseId);
    if (!course) return;
    setValue('totalFee', course.price ? Number(course.price) : 0);
  }, [open, courses, selectedCourseId, setValue]);

  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = handleSubmit(async (values) => {
    setError(null);
    const course = courses.find((item) => item.id === values.courseId);
    if (!course) {
      setError('اختر دورة منشورة.');
      return;
    }
    try {
      await api.post('/enrollments', {
        leadId,
        courseId: values.courseId,
        batchId: values.batchId || undefined,
        course: course.courseType,
        totalFee: values.totalFee,
        paymentPlan: values.paymentPlan || undefined,
        startDate: values.startDate || undefined,
        notes: values.notes || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ??
          'تعذّر إنشاء التسجيل. تحقق من البيانات.',
      );
    }
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl ring-1 ring-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 px-5 py-3">
          <h3 className="text-base font-bold text-gray-900">
            تحويل إلى تسجيل
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            سيتم ربط التسجيل بهذا العميل المحتمل وتحديث حالته تلقائياً.
          </p>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              الدورة *
            </span>
            <select
              {...register('courseId')}
              disabled={coursesQuery.isLoading || courses.length === 0}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 disabled:bg-gray-50"
            >
              <option value="">
                {coursesQuery.isLoading ? 'جارٍ تحميل الدورات…' : 'اختر دورة'}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            {errors.courseId?.message && (
              <span className="mt-1 block text-xs text-red-600">
                {errors.courseId.message}
              </span>
            )}
            {coursesQuery.isError && (
              <span className="mt-1 block text-xs text-gray-500">
                تعذّر تحميل الدورات المنشورة.
              </span>
            )}
            {!coursesQuery.isLoading && courses.length === 0 && (
              <span className="mt-1 block text-xs text-amber-700">
                لا توجد دورات منشورة. انشر دورة من إدارة الأكاديمية أولاً.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              الدفعة (اختياري)
            </span>
            <select
              {...register('batchId')}
              disabled={!selectedCourseId || batchesQuery.isLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 disabled:bg-gray-50"
            >
              <option value="">بدون دفعة محددة</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.code ?? batch.title ?? 'دفعة'} —{' '}
                  {batch.enrolledCount}/{batch.capacity ?? '∞'}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] text-gray-500">
              تُعرض الدفعات المفتوحة فقط، ولا يمكن التسجيل في دفعة مكتملة.
            </span>
            {batchesQuery.isError && (
              <span className="mt-1 block text-xs text-gray-500">
                تعذّر تحميل الدفعات.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              الرسوم الإجمالية (ل.س) *
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              {...register('totalFee')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
            {errors.totalFee?.message && (
              <span className="mt-1 block text-xs text-red-600">
                {errors.totalFee.message}
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              خطة الدفع
            </span>
            <input
              {...register('paymentPlan')}
              placeholder="مثال: دفعة واحدة / تقسيط"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              تاريخ البداية
            </span>
            <input
              type="date"
              {...register('startDate')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              ملاحظات
            </span>
            <textarea
              rows={2}
              {...register('notes')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-green-400"
            >
              {isSubmitting ? 'جارٍ الحفظ...' : 'تأكيد التسجيل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 rounded bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-72 rounded-xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Labels/colors
// ─────────────────────────────────────────────
function activityLabel(type: ActivityType) {
  switch (type) {
    case 'CALL':
      return 'اتصال';
    case 'WHATSAPP_MSG':
      return 'واتساب';
    case 'NOTE':
      return 'ملاحظة';
    case 'STATUS_CHANGE':
      return 'تغيير حالة';
    case 'FOLLOW_UP_SET':
      return 'متابعة';
    case 'ENROLLMENT':
      return 'تسجيل';
    default:
      return type;
  }
}

function activityColor(type: ActivityType) {
  switch (type) {
    case 'CALL':
      return 'bg-blue-50 text-blue-700 ring-blue-200';
    case 'WHATSAPP_MSG':
      return 'bg-green-50 text-green-700 ring-green-200';
    case 'NOTE':
      return 'bg-gray-100 text-gray-700 ring-gray-200';
    case 'STATUS_CHANGE':
      return 'bg-amber-50 text-amber-800 ring-amber-200';
    case 'FOLLOW_UP_SET':
      return 'bg-orange-50 text-orange-800 ring-orange-200';
    case 'ENROLLMENT':
      return 'bg-flame-50 text-flame-700 ring-flame-200';
    default:
      return 'bg-gray-100 text-gray-700 ring-gray-200';
  }
}