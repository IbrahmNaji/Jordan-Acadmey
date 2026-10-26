import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, RotateCcw, Save } from 'lucide-react';
import clsx from 'clsx';
import {
  fetchAttendanceSheet,
  fetchBatches,
  saveAttendance,
} from '../api/academy';
import { getApiErrorMessage } from '../lib/apiError';
import type { AttendanceStatus } from '../types';

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: 'حاضر',
  ABSENT: 'غائب',
  LATE: 'متأخر',
  EXCUSED: 'بعذر',
};

const STATUS_ACTIVE_CLASS: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-green-600 text-white border-green-600',
  ABSENT: 'bg-red-600 text-white border-red-600',
  LATE: 'bg-amber-500 text-white border-amber-500',
  EXCUSED: 'bg-blue-600 text-white border-blue-600',
};

const STATUS_SUMMARY_CLASS: Record<AttendanceStatus, string> = {
  PRESENT: 'text-green-700',
  ABSENT: 'text-red-700',
  LATE: 'text-amber-700',
  EXCUSED: 'text-blue-700',
};

function todayInput() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

type DraftRow = { status: AttendanceStatus; note: string };

export default function Attendance() {
  const qc = useQueryClient();
  const [batchId, setBatchId] = useState('');
  const [date, setDate] = useState(todayInput);
  const [draft, setDraft] = useState<Record<string, DraftRow>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const batchesQuery = useQuery({
    queryKey: ['academy', 'batches'],
    queryFn: () => fetchBatches(),
  });
  const batches = batchesQuery.data ?? [];

  useEffect(() => {
    if (batchId || batches.length === 0) return;
    const preferred =
      batches.find((batch) => batch.status === 'OPEN') ??
      batches.find((batch) => batch.status === 'ONGOING') ??
      batches[0];
    setBatchId(preferred.id);
  }, [batchId, batches]);

  const sheetQuery = useQuery({
    queryKey: ['academy', 'attendance', batchId, date],
    queryFn: () => fetchAttendanceSheet(batchId, date),
    enabled: Boolean(batchId) && /^\d{4}-\d{2}-\d{2}$/.test(date),
  });
  const sheet = sheetQuery.data;

  useEffect(() => {
    if (!sheet) return;
    const next: Record<string, DraftRow> = {};
    for (const student of sheet.students) {
      if (student.attendance) {
        next[student.id] = {
          status: student.attendance.status,
          note: student.attendance.note ?? '',
        };
      }
    }
    setDraft(next);
  }, [sheet]);

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };
    for (const row of Object.values(draft)) counts[row.status] += 1;
    return counts;
  }, [draft]);

  const selectedCount = Object.keys(draft).length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = (sheet?.students ?? [])
        .filter((student) => draft[student.id])
        .map((student) => ({
          enrollmentId: student.id,
          status: draft[student.id].status,
          note: draft[student.id].note.trim() || null,
        }));
      if (!batchId || records.length === 0) {
        throw new Error('NO_RECORDS');
      }
      return saveAttendance({ batchId, sessionDate: date, records });
    },
    onSuccess: (result) => {
      setNotice(`تم حفظ حضور ${result.saved} طالب.`);
      setError(null);
      qc.invalidateQueries({
        queryKey: ['academy', 'attendance', batchId, date],
      });
    },
    onError: (err) => {
      setNotice(null);
      setError(
        err instanceof Error && err.message === 'NO_RECORDS'
          ? 'اختر حالة حضور لطالب واحد على الأقل.'
          : getApiErrorMessage(err),
      );
    },
  });

  const setStatus = (enrollmentId: string, status: AttendanceStatus) => {
    setDraft((current) => ({
      ...current,
      [enrollmentId]: {
        status,
        note: current[enrollmentId]?.note ?? '',
      },
    }));
  };

  const setNote = (enrollmentId: string, note: string) => {
    setDraft((current) => ({
      ...current,
      [enrollmentId]: {
        status: current[enrollmentId]?.status ?? 'PRESENT',
        note,
      },
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    if (!sheet) return;
    const next: Record<string, DraftRow> = {};
    for (const student of sheet.students) {
      next[student.id] = { status, note: draft[student.id]?.note ?? '' };
    }
    setDraft(next);
  };

  const resetSheet = () => {
    if (!sheet) return;
    const next: Record<string, DraftRow> = {};
    for (const student of sheet.students) {
      if (student.attendance) {
        next[student.id] = {
          status: student.attendance.status,
          note: student.attendance.note ?? '',
        };
      }
    }
    setDraft(next);
    setNotice(null);
    setError(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الحضور</h1>
        <p className="mt-1 text-sm text-gray-500">
          تسجيل حضور الطلاب لكل دفعة وتاريخ. لا تُنشأ سجلات تلقائية؛ تُحفظ فقط
          الحالات التي تحددها.
        </p>
      </div>

      <section className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              الدفعة
            </span>
            <select
              value={batchId}
              onChange={(event) => {
                setBatchId(event.target.value);
                setDraft({});
                setNotice(null);
                setError(null);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            >
              {batches.length === 0 && <option value="">لا توجد دفعات</option>}
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.course?.title ?? 'دورة'} —{' '}
                  {batch.code ?? batch.title ?? 'دفعة'}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              تاريخ الجلسة
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setDraft({});
                setNotice(null);
                setError(null);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
          </label>
        </div>
      </section>

      {batches.length === 0 ? (
        <p className="rounded-xl bg-white px-4 py-10 text-center text-sm text-gray-500 ring-1 ring-gray-200">
          لا توجد دفعات. أنشئ دفعة من صفحة إدارة الأكاديمية أولاً.
        </p>
      ) : sheetQuery.isLoading ? (
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        </div>
      ) : sheetQuery.isError ? (
        <p className="rounded-xl bg-white px-4 py-10 text-center text-sm text-red-700 ring-1 ring-gray-200">
          تعذّر تحميل كشف الحضور لهذه الدفعة.
        </p>
      ) : sheet ? (
        <section className="rounded-xl bg-white ring-1 ring-gray-200">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <ClipboardCheck size={16} className="text-flame-600" />
                  {sheet.batch.course.title} —{' '}
                  {sheet.batch.code ?? sheet.batch.title ?? 'دفعة'}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {sheet.sessionDate} · {sheet.students.length} طالب مسجّل
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map(
                  (status) => (
                    <span key={status} className="text-gray-600">
                      {STATUS_LABEL[status]}:{' '}
                      <strong className={STATUS_SUMMARY_CLASS[status]}>
                        {summary[status]}
                      </strong>
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>

          {sheet.students.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-500">
              لا يوجد طلاب مسجّلون في هذه الدفعة.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-4 py-2">
                <span className="text-xs text-gray-500">إجراءات سريعة:</span>
                <button
                  type="button"
                  onClick={() => markAll('PRESENT')}
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100"
                >
                  تحديد الكل حاضر
                </button>
                <button
                  type="button"
                  onClick={resetSheet}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100"
                >
                  <RotateCcw size={12} /> استعادة المحفوظ
                </button>
                <span className="mr-auto text-xs text-gray-500">
                  محدد: {selectedCount}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-gray-50 text-right text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">الطالب</th>
                      <th className="px-4 py-2.5 font-medium">الحضور</th>
                      <th className="px-4 py-2.5 font-medium">ملاحظة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sheet.students.map((student) => {
                      const row = draft[student.id];
                      return (
                        <tr key={student.id} className="hover:bg-gray-50/60">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">
                              {student.lead.fullName}
                            </p>
                            <p
                              className="text-xs text-gray-400 tabular-nums"
                              dir="ltr"
                            >
                              {student.lead.phone}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {(
                                ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const
                              ).map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => setStatus(student.id, status)}
                                  className={clsx(
                                    'rounded-md border px-2.5 py-1 text-xs font-medium transition',
                                    row?.status === status
                                      ? STATUS_ACTIVE_CLASS[status]
                                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100',
                                  )}
                                >
                                  {STATUS_LABEL[status]}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={row?.note ?? ''}
                              onChange={(event) =>
                                setNote(student.id, event.target.value)
                              }
                              disabled={!row}
                              placeholder={row ? '' : 'حدد الحالة أولاً'}
                              className="w-48 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-flame-500 disabled:bg-gray-50"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs">
              {error && <span className="text-red-700">{error}</span>}
              {notice && !error && (
                <span className="text-green-700">{notice}</span>
              )}
              {!error && !notice && (
                <span className="text-gray-500">
                  تُحفظ الحالات المحددة فقط.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={
                saveMutation.isPending ||
                selectedCount === 0 ||
                sheet.students.length === 0
              }
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-40"
            >
              <Save size={15} />
              {saveMutation.isPending ? 'جارٍ الحفظ…' : 'حفظ الحضور'}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
