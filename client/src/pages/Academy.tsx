import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Plus,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import {
  createAcademyCourse,
  createBatch,
  createCategory,
  createInstructor,
  fetchAcademyCourse,
  fetchAcademyCourses,
  fetchBatches,
  fetchCategories,
  fetchInstructors,
  updateAcademyCourse,
  updateBatch,
  updateCategory,
  updateInstructor,
} from '../api/academy';
import { getApiErrorMessage } from '../lib/apiError';
import type {
  AcademyBatch,
  AcademyCourseSummary,
  BatchStatus,
  CourseCategory,
  CourseStatus,
  CourseType,
  DeliveryMode,
  Instructor,
} from '../types';

const COURSE_TYPE_LABEL: Record<CourseType, string> = {
  MECHANICS: 'ميكانيك',
  ELECTRICAL: 'كهرباء',
  DIAGNOSTICS: 'تشخيص أعطال',
  HYBRID: 'هايبرد',
};

const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  DRAFT: 'مسودة',
  PUBLISHED: 'منشورة',
  ARCHIVED: 'مؤرشفة',
};

const COURSE_STATUS_CLASS: Record<CourseStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-800 ring-amber-200',
  PUBLISHED: 'bg-green-50 text-green-700 ring-green-200',
  ARCHIVED: 'bg-gray-100 text-gray-600 ring-gray-200',
};

const BATCH_STATUS_LABEL: Record<BatchStatus, string> = {
  PLANNED: 'مخططة',
  OPEN: 'مفتوحة للتسجيل',
  ONGOING: 'جارية',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
};

const BATCH_STATUS_CLASS: Record<BatchStatus, string> = {
  PLANNED: 'bg-gray-100 text-gray-700 ring-gray-200',
  OPEN: 'bg-green-50 text-green-700 ring-green-200',
  ONGOING: 'bg-blue-50 text-blue-700 ring-blue-200',
  COMPLETED: 'bg-ink-900/5 text-ink-900 ring-ink-900/10',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
};

const DELIVERY_LABEL: Record<DeliveryMode, string> = {
  ONSITE: 'حضوري',
  ONLINE: 'عن بُعد',
  HYBRID: 'مختلط',
};

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500';

function formatMoney(value?: string | number | null, currency = 'SYP') {
  if (value === null || value === undefined || value === '') return '—';
  const suffix = currency === 'SYP' ? 'ل.س' : currency;
  return `${Number(value).toLocaleString('en-US')} ${suffix}`;
}

function toDateInput(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

type Tab = 'courses' | 'batches' | 'instructors' | 'categories';

export default function Academy() {
  const [tab, setTab] = useState<Tab>('courses');
  const [courseModal, setCourseModal] = useState<{
    open: boolean;
    id?: string;
  }>({ open: false });
  const [batchModal, setBatchModal] = useState<{
    open: boolean;
    batch?: AcademyBatch;
  }>({ open: false });
  const [instructorModal, setInstructorModal] = useState<{
    open: boolean;
    instructor?: Instructor;
  }>({ open: false });
  const [categoryModal, setCategoryModal] = useState<{
    open: boolean;
    category?: CourseCategory;
  }>({ open: false });
  const qc = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: ['academy', 'courses'],
    queryFn: () => fetchAcademyCourses(),
  });
  const batchesQuery = useQuery({
    queryKey: ['academy', 'batches'],
    queryFn: () => fetchBatches(),
  });
  const instructorsQuery = useQuery({
    queryKey: ['academy', 'instructors'],
    queryFn: () => fetchInstructors(),
  });
  const categoriesQuery = useQuery({
    queryKey: ['academy', 'categories'],
    queryFn: () => fetchCategories(),
  });

  const courses = coursesQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const instructors = instructorsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CourseStatus }) =>
      updateAcademyCourse(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academy'] });
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['academy'] });

  const tabs: Array<{ id: Tab; label: string; icon: typeof BookOpen }> = [
    { id: 'courses', label: 'الدورات', icon: BookOpen },
    { id: 'batches', label: 'الدفعات', icon: CalendarDays },
    { id: 'instructors', label: 'المدربون', icon: Users },
    { id: 'categories', label: 'التصنيفات', icon: GraduationCap },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إدارة الأكاديمية</h1>
        <p className="mt-1 text-sm text-gray-500">
          إدارة الدورات والدفعات والمدربين والتصنيفات. لا يظهر للزوار إلا المحتوى
          المنشور.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition',
              tab === id
                ? 'bg-ink-900 text-white'
                : 'text-gray-600 hover:bg-gray-100',
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'courses' && (
        <CoursesTab
          courses={courses}
          loading={coursesQuery.isLoading}
          error={coursesQuery.isError}
          onNew={() => setCourseModal({ open: true })}
          onEdit={(id) => setCourseModal({ open: true, id })}
          onStatus={(id, status) => statusMutation.mutate({ id, status })}
          statusPending={statusMutation.isPending}
        />
      )}

      {tab === 'batches' && (
        <BatchesTab
          batches={batches}
          courses={courses}
          loading={batchesQuery.isLoading}
          error={batchesQuery.isError}
          onNew={() => setBatchModal({ open: true })}
          onEdit={(batch) => setBatchModal({ open: true, batch })}
        />
      )}

      {tab === 'instructors' && (
        <InstructorsTab
          instructors={instructors}
          loading={instructorsQuery.isLoading}
          error={instructorsQuery.isError}
          onNew={() => setInstructorModal({ open: true })}
          onEdit={(instructor) =>
            setInstructorModal({ open: true, instructor })
          }
        />
      )}

      {tab === 'categories' && (
        <CategoriesTab
          categories={categories}
          loading={categoriesQuery.isLoading}
          error={categoriesQuery.isError}
          onNew={() => setCategoryModal({ open: true })}
          onEdit={(category) => setCategoryModal({ open: true, category })}
        />
      )}

      <CourseModal
        open={courseModal.open}
        courseId={courseModal.id}
        categories={categories}
        instructors={instructors}
        onClose={() => setCourseModal({ open: false })}
        onSaved={() => {
          refresh();
          setCourseModal({ open: false });
        }}
      />

      <BatchModal
        open={batchModal.open}
        batch={batchModal.batch}
        courses={courses}
        instructors={instructors}
        onClose={() => setBatchModal({ open: false })}
        onSaved={() => {
          refresh();
          setBatchModal({ open: false });
        }}
      />

      <InstructorModal
        open={instructorModal.open}
        instructor={instructorModal.instructor}
        onClose={() => setInstructorModal({ open: false })}
        onSaved={() => {
          refresh();
          setInstructorModal({ open: false });
        }}
      />

      <CategoryModal
        open={categoryModal.open}
        category={categoryModal.category}
        onClose={() => setCategoryModal({ open: false })}
        onSaved={() => {
          refresh();
          setCategoryModal({ open: false });
        }}
      />
    </div>
  );
}

function CoursesTab({
  courses,
  loading,
  error,
  onNew,
  onEdit,
  onStatus,
  statusPending,
}: {
  courses: AcademyCourseSummary[];
  loading: boolean;
  error: boolean;
  onNew: () => void;
  onEdit: (id: string) => void;
  onStatus: (id: string, status: CourseStatus) => void;
  statusPending: boolean;
}) {
  return (
    <section className="rounded-xl bg-white ring-1 ring-gray-200">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">الدورات</h2>
          <p className="text-xs text-gray-500">{courses.length} دورة</p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-800"
        >
          <Plus size={14} /> دورة جديدة
        </button>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <p className="px-4 py-8 text-center text-sm text-red-700">
          تعذّر تحميل الدورات.
        </p>
      ) : courses.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-gray-500">
          لا توجد دورات بعد. أنشئ أول دورة.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50 text-right text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">الدورة</th>
                <th className="px-4 py-2.5 font-medium">النوع</th>
                <th className="px-4 py-2.5 font-medium">الحالة</th>
                <th className="px-4 py-2.5 font-medium">الدفعات</th>
                <th className="px-4 py-2.5 font-medium">المسجلون</th>
                <th className="px-4 py-2.5 font-medium">السعر</th>
                <th className="px-4 py-2.5 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{course.title}</p>
                    <p className="text-xs text-gray-400" dir="ltr">
                      /{course.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {COURSE_TYPE_LABEL[course.courseType]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1',
                        COURSE_STATUS_CLASS[course.status],
                      )}
                    >
                      {COURSE_STATUS_LABEL[course.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">
                    {course._count?.batches ?? 0}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">
                    {course._count?.enrollments ?? 0}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatMoney(course.price, course.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(course.id)}
                        className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        تعديل
                      </button>
                      {course.status !== 'PUBLISHED' ? (
                        <button
                          type="button"
                          disabled={statusPending}
                          onClick={() => onStatus(course.id, 'PUBLISHED')}
                          className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          نشر
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={statusPending}
                          onClick={() => onStatus(course.id, 'DRAFT')}
                          className="rounded-md border border-amber-300 px-2.5 py-1 text-xs text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                        >
                          إرجاع لمسودة
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CourseModal({
  open,
  courseId,
  categories,
  instructors,
  onClose,
  onSaved,
}: {
  open: boolean;
  courseId?: string;
  categories: CourseCategory[];
  instructors: Instructor[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const detailQuery = useQuery({
    queryKey: ['academy', 'course', courseId],
    queryFn: () => fetchAcademyCourse(courseId as string),
    enabled: open && !!courseId,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;
  const detail = detailQuery.data;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const fd = new FormData(event.currentTarget);
    const text = (name: string) => String(fd.get(name) ?? '').trim();
    const nullable = (name: string) => text(name) || null;
    const lines = (name: string) =>
      text(name)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    const payload: Record<string, unknown> = {
      slug: text('slug'),
      title: text('title'),
      shortTitle: text('shortTitle'),
      courseType: text('courseType'),
      categoryId: nullable('categoryId'),
      instructorId: nullable('instructorId'),
      tagline: text('tagline'),
      summary: text('summary'),
      description: lines('description'),
      focus: lines('focus'),
      prerequisites: lines('prerequisites'),
      format: text('format'),
      note: text('note'),
      image: text('image'),
      imageAlt: text('imageAlt'),
      deliveryMode: text('deliveryMode'),
      price: text('price') ? Number(text('price')) : null,
      currency: text('currency') || 'SYP',
      featured: fd.get('featured') === 'on',
      sortOrder: Number(text('sortOrder') || 0),
      status: text('status'),
    };

    setSaving(true);
    try {
      if (courseId) {
        await updateAcademyCourse(courseId, payload);
      } else {
        await createAcademyCourse(payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={courseId ? 'تعديل الدورة' : 'دورة جديدة'}
      onClose={onClose}
    >
      {courseId && detailQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500">
          جارٍ تحميل بيانات الدورة…
        </p>
      ) : courseId && detailQuery.isError ? (
        <p className="py-10 text-center text-sm text-red-700">
          تعذّر تحميل بيانات الدورة.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="عنوان الدورة *">
              <input
                name="title"
                required
                defaultValue={detail?.title ?? ''}
                className={inputClass}
              />
            </Field>
            <Field label="العنوان المختصر *">
              <input
                name="shortTitle"
                required
                defaultValue={detail?.shortTitle ?? ''}
                className={inputClass}
              />
            </Field>
            <Field label="المعرّف في الرابط * (أحرف لاتينية وأرقام وشرطات)">
              <input
                name="slug"
                required
                dir="ltr"
                defaultValue={detail?.slug ?? ''}
                className={inputClass}
              />
            </Field>
            <Field label="نوع المسار *">
              <select
                name="courseType"
                defaultValue={detail?.courseType ?? 'MECHANICS'}
                className={inputClass}
              >
                {Object.entries(COURSE_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="الحالة">
              <select
                name="status"
                defaultValue={detail?.status ?? 'DRAFT'}
                className={inputClass}
              >
                {Object.entries(COURSE_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="نمط التدريب">
              <select
                name="deliveryMode"
                defaultValue={detail?.deliveryMode ?? 'ONSITE'}
                className={inputClass}
              >
                {Object.entries(DELIVERY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="التصنيف">
              <select
                name="categoryId"
                defaultValue={detail?.categoryId ?? ''}
                className={inputClass}
              >
                <option value="">— بدون —</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="المدرب">
              <select
                name="instructorId"
                defaultValue={detail?.instructorId ?? ''}
                className={inputClass}
              >
                <option value="">— بدون —</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.fullName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="السعر (اختياري)">
              <input
                name="price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={detail?.price ?? ''}
                className={inputClass}
              />
            </Field>
            <Field label="العملة">
              <input
                name="currency"
                dir="ltr"
                maxLength={3}
                defaultValue={detail?.currency ?? 'SYP'}
                className={inputClass}
              />
            </Field>
            <Field label="ترتيب العرض">
              <input
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={detail?.sortOrder ?? 0}
                className={inputClass}
              />
            </Field>
            <label className="flex items-center gap-2 self-end rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={detail?.featured ?? false}
                className="h-4 w-4 rounded border-gray-300 text-flame-600 focus:ring-flame-500"
              />
              دورة مميزة في الصفحة الرئيسية
            </label>
          </div>

          <div className="grid gap-3">
            <Field label="العبارة التعريفية *">
              <input
                name="tagline"
                required
                defaultValue={detail?.tagline ?? ''}
                className={inputClass}
              />
            </Field>
            <Field label="الملخص *">
              <textarea
                name="summary"
                required
                rows={2}
                defaultValue={detail?.summary ?? ''}
                className={inputClass}
              />
            </Field>
            <Field label="الوصف * (فقرة في كل سطر)">
              <textarea
                name="description"
                required
                rows={4}
                defaultValue={detail?.description?.join('\n') ?? ''}
                className={inputClass}
              />
            </Field>
            <Field label="محاور التدريب * (سطر لكل محور)">
              <textarea
                name="focus"
                required
                rows={4}
                defaultValue={detail?.focus?.join('\n') ?? ''}
                className={inputClass}
              />
            </Field>
            <Field label="المتطلبات السابقة (سطر لكل متطلب)">
              <textarea
                name="prerequisites"
                rows={3}
                defaultValue={detail?.prerequisites?.join('\n') ?? ''}
                className={inputClass}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="طريقة التدريب *">
                <input
                  name="format"
                  required
                  defaultValue={detail?.format ?? ''}
                  className={inputClass}
                />
              </Field>
              <Field label="ملاحظة التسجيل *">
                <input
                  name="note"
                  required
                  defaultValue={detail?.note ?? ''}
                  className={inputClass}
                />
              </Field>
              <Field label="مسار الصورة *">
                <input
                  name="image"
                  required
                  dir="ltr"
                  defaultValue={detail?.image ?? '/images/courses/mechanics.webp'}
                  className={inputClass}
                />
              </Field>
              <Field label="النص البديل للصورة *">
                <input
                  name="imageAlt"
                  required
                  defaultValue={detail?.imageAlt ?? ''}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <ModalActions saving={saving} onClose={onClose} label="حفظ الدورة" />
        </form>
      )}
    </ModalShell>
  );
}

function BatchesTab({
  batches,
  courses,
  loading,
  error,
  onNew,
  onEdit,
}: {
  batches: AcademyBatch[];
  courses: AcademyCourseSummary[];
  loading: boolean;
  error: boolean;
  onNew: () => void;
  onEdit: (batch: AcademyBatch) => void;
}) {
  const [courseFilter, setCourseFilter] = useState('');
  const filtered = useMemo(
    () =>
      courseFilter
        ? batches.filter((batch) => batch.courseId === courseFilter)
        : batches,
    [batches, courseFilter],
  );

  return (
    <section className="rounded-xl bg-white ring-1 ring-gray-200">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-900">الدفعات</h2>
          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs"
          >
            <option value="">كل الدورات</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onNew}
          disabled={courses.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
        >
          <Plus size={14} /> دفعة جديدة
        </button>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <p className="px-4 py-8 text-center text-sm text-red-700">
          تعذّر تحميل الدفعات.
        </p>
      ) : filtered.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-gray-500">
          لا توجد دفعات مطابقة.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-gray-50 text-right text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">الدفعة</th>
                <th className="px-4 py-2.5 font-medium">الدورة</th>
                <th className="px-4 py-2.5 font-medium">التواريخ</th>
                <th className="px-4 py-2.5 font-medium">المقاعد</th>
                <th className="px-4 py-2.5 font-medium">المدرب</th>
                <th className="px-4 py-2.5 font-medium">الحالة</th>
                <th className="px-4 py-2.5 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((batch) => {
                const full =
                  batch.capacity !== null &&
                  batch.capacity !== undefined &&
                  batch.enrolledCount >= batch.capacity;
                return (
                  <tr key={batch.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">
                        {batch.code ?? batch.title ?? 'دفعة'}
                      </p>
                      {batch.title && batch.code && (
                        <p className="text-xs text-gray-400">{batch.title}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {batch.course?.title ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600" dir="ltr">
                      {toDateInput(batch.startDate) || '—'} →{' '}
                      {toDateInput(batch.endDate) || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'tabular-nums text-sm',
                          full ? 'font-semibold text-red-700' : 'text-gray-700',
                        )}
                      >
                        {batch.enrolledCount} / {batch.capacity ?? '∞'}
                      </span>
                      {full && (
                        <span className="mr-1 text-[10px] text-red-600">
                          مكتملة
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {batch.instructor?.fullName ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1',
                          BATCH_STATUS_CLASS[batch.status],
                        )}
                      >
                        {BATCH_STATUS_LABEL[batch.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onEdit(batch)}
                        className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        تعديل
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function BatchModal({
  open,
  batch,
  courses,
  instructors,
  onClose,
  onSaved,
}: {
  open: boolean;
  batch?: AcademyBatch;
  courses: AcademyCourseSummary[];
  instructors: Instructor[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  if (!open) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const fd = new FormData(event.currentTarget);
    const text = (name: string) => String(fd.get(name) ?? '').trim();
    const nullable = (name: string) => text(name) || null;

    const payload: Record<string, unknown> = {
      courseId: text('courseId'),
      code: nullable('code'),
      title: nullable('title'),
      startDate: nullable('startDate'),
      endDate: nullable('endDate'),
      capacity: text('capacity') ? Number(text('capacity')) : null,
      instructorId: nullable('instructorId'),
      status: text('status'),
      deliveryMode: nullable('deliveryMode'),
      notes: nullable('notes'),
    };

    setSaving(true);
    try {
      if (batch) {
        const { courseId: _courseId, ...rest } = payload;
        await updateBatch(batch.id, rest);
      } else {
        await createBatch(payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={batch ? 'تعديل الدفعة' : 'دفعة جديدة'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-3">
        <Field label="الدورة *">
          <select
            name="courseId"
            required
            disabled={!!batch}
            defaultValue={batch?.courseId ?? courses[0]?.id ?? ''}
            className={inputClass}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </Field>
        {batch && (
          <p className="text-[11px] text-gray-500">
            لا يمكن تغيير دورة الدفعة بعد إنشائها.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="رمز الدفعة">
            <input
              name="code"
              dir="ltr"
              maxLength={40}
              defaultValue={batch?.code ?? ''}
              placeholder="B-2026-01"
              className={inputClass}
            />
          </Field>
          <Field label="اسم الدفعة">
            <input
              name="title"
              defaultValue={batch?.title ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="تاريخ البداية">
            <input
              name="startDate"
              type="date"
              defaultValue={toDateInput(batch?.startDate)}
              className={inputClass}
            />
          </Field>
          <Field label="تاريخ النهاية">
            <input
              name="endDate"
              type="date"
              defaultValue={toDateInput(batch?.endDate)}
              className={inputClass}
            />
          </Field>
          <Field label="السعة (فارغ = بلا حد)">
            <input
              name="capacity"
              type="number"
              min={1}
              defaultValue={batch?.capacity ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="المدرب">
            <select
              name="instructorId"
              defaultValue={batch?.instructorId ?? ''}
              className={inputClass}
            >
              <option value="">— بدون —</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الحالة">
            <select
              name="status"
              defaultValue={batch?.status ?? 'PLANNED'}
              className={inputClass}
            >
              {Object.entries(BATCH_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="نمط التدريب">
            <select
              name="deliveryMode"
              defaultValue={batch?.deliveryMode ?? ''}
              className={inputClass}
            >
              <option value="">— افتراضي —</option>
              {Object.entries(DELIVERY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="ملاحظات">
          <textarea
            name="notes"
            rows={2}
            defaultValue={batch?.notes ?? ''}
            className={inputClass}
          />
        </Field>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <ModalActions saving={saving} onClose={onClose} label="حفظ الدفعة" />
      </form>
    </ModalShell>
  );
}

function InstructorsTab({
  instructors,
  loading,
  error,
  onNew,
  onEdit,
}: {
  instructors: Instructor[];
  loading: boolean;
  error: boolean;
  onNew: () => void;
  onEdit: (instructor: Instructor) => void;
}) {
  return (
    <section className="rounded-xl bg-white ring-1 ring-gray-200">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">المدربون</h2>
          <p className="text-xs text-gray-500">{instructors.length} مدرب</p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-800"
        >
          <Plus size={14} /> مدرب جديد
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <p className="px-4 py-8 text-center text-sm text-red-700">
          تعذّر تحميل المدربين.
        </p>
      ) : instructors.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-gray-500">
          لا يوجد مدربون مسجّلون بعد.
        </p>
      ) : (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {instructors.map((instructor) => (
            <article
              key={instructor.id}
              className="rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {instructor.fullName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {instructor.specialty ?? '—'}
                  </p>
                </div>
                <span
                  className={clsx(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium ring-1',
                    instructor.isActive
                      ? 'bg-green-50 text-green-700 ring-green-200'
                      : 'bg-gray-100 text-gray-600 ring-gray-200',
                  )}
                >
                  {instructor.isActive ? 'نشط' : 'غير نشط'}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                {instructor.phone && (
                  <p dir="ltr" className="tabular-nums">
                    {instructor.phone}
                  </p>
                )}
                {instructor.email && (
                  <p dir="ltr" className="truncate">
                    {instructor.email}
                  </p>
                )}
                <p>
                  {instructor._count?.courses ?? 0} دورة ·{' '}
                  {instructor._count?.batches ?? 0} دفعة
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEdit(instructor)}
                className="mt-3 rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100"
              >
                تعديل
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function InstructorModal({
  open,
  instructor,
  onClose,
  onSaved,
}: {
  open: boolean;
  instructor?: Instructor;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  if (!open) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const fd = new FormData(event.currentTarget);
    const text = (name: string) => String(fd.get(name) ?? '').trim();
    const nullable = (name: string) => text(name) || null;
    const payload = {
      fullName: text('fullName'),
      specialty: nullable('specialty'),
      phone: nullable('phone'),
      email: nullable('email'),
      bio: nullable('bio'),
      isActive: fd.get('isActive') === 'on',
    };

    setSaving(true);
    try {
      if (instructor) {
        await updateInstructor(instructor.id, payload);
      } else {
        await createInstructor(payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={instructor ? 'تعديل المدرب' : 'مدرب جديد'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-3">
        <Field label="الاسم الكامل *">
          <input
            name="fullName"
            required
            defaultValue={instructor?.fullName ?? ''}
            className={inputClass}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="التخصص">
            <input
              name="specialty"
              defaultValue={instructor?.specialty ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="الهاتف">
            <input
              name="phone"
              dir="ltr"
              defaultValue={instructor?.phone ?? ''}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="البريد الإلكتروني">
          <input
            name="email"
            type="email"
            dir="ltr"
            defaultValue={instructor?.email ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="نبذة">
          <textarea
            name="bio"
            rows={3}
            defaultValue={instructor?.bio ?? ''}
            className={inputClass}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={instructor?.isActive ?? true}
            className="h-4 w-4 rounded border-gray-300 text-flame-600 focus:ring-flame-500"
          />
          مدرب نشط
        </label>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <ModalActions saving={saving} onClose={onClose} label="حفظ المدرب" />
      </form>
    </ModalShell>
  );
}

function CategoriesTab({
  categories,
  loading,
  error,
  onNew,
  onEdit,
}: {
  categories: CourseCategory[];
  loading: boolean;
  error: boolean;
  onNew: () => void;
  onEdit: (category: CourseCategory) => void;
}) {
  return (
    <section className="rounded-xl bg-white ring-1 ring-gray-200">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">التصنيفات</h2>
          <p className="text-xs text-gray-500">{categories.length} تصنيف</p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-800"
        >
          <Plus size={14} /> تصنيف جديد
        </button>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <p className="px-4 py-8 text-center text-sm text-red-700">
          تعذّر تحميل التصنيفات.
        </p>
      ) : categories.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-gray-500">
          لا توجد تصنيفات بعد.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-gray-50 text-right text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">الاسم</th>
                <th className="px-4 py-2.5 font-medium">المعرّف</th>
                <th className="px-4 py-2.5 font-medium">الدورات</th>
                <th className="px-4 py-2.5 font-medium">الحالة</th>
                <th className="px-4 py-2.5 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">
                      {category.name}
                    </p>
                    {category.description && (
                      <p className="text-xs text-gray-500">
                        {category.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600" dir="ltr">
                    {category.slug}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">
                    {category._count?.courses ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium ring-1',
                        category.isActive
                          ? 'bg-green-50 text-green-700 ring-green-200'
                          : 'bg-gray-100 text-gray-600 ring-gray-200',
                      )}
                    >
                      {category.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onEdit(category)}
                      className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      تعديل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CategoryModal({
  open,
  category,
  onClose,
  onSaved,
}: {
  open: boolean;
  category?: CourseCategory;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  if (!open) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const fd = new FormData(event.currentTarget);
    const text = (name: string) => String(fd.get(name) ?? '').trim();
    const payload = {
      name: text('name'),
      slug: text('slug'),
      description: text('description') || null,
      sortOrder: Number(text('sortOrder') || 0),
      isActive: fd.get('isActive') === 'on',
    };

    setSaving(true);
    try {
      if (category) {
        await updateCategory(category.id, payload);
      } else {
        await createCategory(payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={category ? 'تعديل التصنيف' : 'تصنيف جديد'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-3">
        <Field label="الاسم *">
          <input
            name="name"
            required
            defaultValue={category?.name ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="المعرّف * (أحرف لاتينية وأرقام وشرطات)">
          <input
            name="slug"
            required
            dir="ltr"
            defaultValue={category?.slug ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="الوصف">
          <textarea
            name="description"
            rows={2}
            defaultValue={category?.description ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="ترتيب العرض">
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={category?.sortOrder ?? 0}
            className={inputClass}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={category?.isActive ?? true}
            className="h-4 w-4 rounded border-gray-300 text-flame-600 focus:ring-flame-500"
          />
          تصنيف نشط
        </label>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <ModalActions saving={saving} onClose={onClose} label="حفظ التصنيف" />
      </form>
    </ModalShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
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
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl ring-1 ring-gray-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({
  saving,
  onClose,
  label,
}: {
  saving: boolean;
  onClose: () => void;
  label: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
      >
        إلغاء
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-ink-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
      >
        {saving ? 'جارٍ الحفظ…' : label}
      </button>
    </div>
  );
}
