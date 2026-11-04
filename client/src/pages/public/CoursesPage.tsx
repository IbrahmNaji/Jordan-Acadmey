import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, X } from 'lucide-react';
import clsx from 'clsx';
import PageMeta from '../../components/public/PageMeta';
import PageHero from '../../components/public/PageHero';
import CourseCard from '../../components/public/CourseCard';
import Reveal from '../../components/public/Reveal';
import {
  CourseGridSkeleton,
  EmptyState,
  ErrorState,
} from '../../components/public/StateBlocks';
import InstructorProfileCard from '../../components/public/InstructorProfileCard';
import { usePublicCourses, usePublicInstructors } from '../../hooks/usePublic';
import { site } from '../../content/site';
import type { CourseType } from '../../types';

const COURSE_TYPE_LABEL: Record<CourseType, string> = {
  MECHANICS: 'ميكانيك',
  ELECTRICAL: 'كهرباء',
  DIAGNOSTICS: 'تشخيص أعطال',
  HYBRID: 'هايبرد',
};

export default function CoursesPage() {
  const coursesQuery = usePublicCourses();
  const instructorsQuery = usePublicInstructors();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? 'ALL';
  const queryParam = searchParams.get('q') ?? '';
  const [search, setSearch] = useState(queryParam);
  const categories = useMemo(() => {
    const values = new Set((coursesQuery.data ?? []).flatMap((course) =>
      course.courseTypes?.length ? course.courseTypes : [course.courseType],
    ));
    return [
      { value: 'ALL', label: 'كل المسارات' },
      ...Array.from(values, (value) => ({
        value,
        label: COURSE_TYPE_LABEL[value as CourseType] ?? value,
      })),
    ];
  }, [coursesQuery.data]);

  useEffect(() => {
    setSearch(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (location.hash !== '#instructors') return;
    document.getElementById('instructors')?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);

  const updateParams = (next: URLSearchParams) => {
    setSearchParams(next, { replace: true });
  };

  const selectCategory = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'ALL') next.delete('category');
    else next.set('category', value);
    updateParams(next);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (search.trim()) next.set('q', search.trim());
    else next.delete('q');
    updateParams(next);
  };

  const clearFilters = () => {
    setSearch('');
    updateParams(new URLSearchParams());
  };

  const filtered = useMemo(() => {
    const items = coursesQuery.data ?? [];
    const normalized = queryParam.trim().toLowerCase();
    return items.filter((course) => {
      const matchesCategory =
        category === 'ALL' || (course.courseTypes?.length ? course.courseTypes : [course.courseType]).includes(category);
      if (!matchesCategory) return false;
      if (!normalized) return true;
      const haystack = [
        course.title,
        course.shortTitle,
        course.summary,
        course.tagline,
        ...course.focus,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [coursesQuery.data, category, queryParam]);

  const isFiltered = category !== 'ALL' || !!queryParam;
  const total = coursesQuery.data?.length ?? 0;

  return (
    <>
      <PageMeta
        title="الدورات والمسارات التدريبية"
        description="مسارات تدريبية في ميكانيك السيارات والكهرباء والتشخيص والهايبرد. ابحث وقارن واطلب معلومات الدورة."
        image="/images/workshop/workshop-wide.webp"
      />
      <PageHero
        eyebrow="المسارات التدريبية"
        title="ابحث عن المسار الذي يبدأ منه هدفك."
        description="تصفّح الدورات المنشورة في أساسيات السيارة وأنظمتها، واستخدم البحث والتصنيف للوصول إلى الدورة المناسبة، ثم اطلب معلوماتها."
        image="/images/workshop/workshop-wide.webp"
        breadcrumb={[{ label: 'الدورات' }]}
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/contact" className="btn-flame">
            اطلب استشارة
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          <a href="#catalog" className="btn-outline-light">
            تصفح المسارات
          </a>
          <a href="#instructors" className="btn-outline-light">
            تعرّف على مدرّبينا
          </a>
        </div>
      </PageHero>

      <section id="catalog" className="scroll-mt-28 bg-paper py-12 lg:py-16">
        <div className="shell">
          <div className="border border-ink-900/10 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="group"
                aria-label="تصفية حسب المسار"
                className="flex flex-wrap gap-2"
              >
                {categories.map((item) => {
                  const active = category === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => selectCategory(item.value)}
                      aria-pressed={active}
                      className={clsx(
                        'min-h-[38px] border px-4 text-xs font-semibold transition-colors',
                        active
                          ? 'border-ink-900 bg-ink-900 text-paper'
                          : 'border-ink-900/15 text-steel-600 hover:border-ink-900/40 hover:text-ink-900',
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <form
                onSubmit={submitSearch}
                role="search"
                className="flex w-full items-stretch lg:max-w-xs"
              >
                <label htmlFor="course-search" className="sr-only">
                  البحث في الدورات
                </label>
                <div className="relative flex-1">
                  <Search
                    size={16}
                    aria-hidden="true"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-500"
                  />
                  <input
                    id="course-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ابحث عن مسار أو موضوع..."
                    className="h-[42px] w-full border border-l-0 border-ink-900/15 bg-white pr-9 pl-3 text-sm text-ink-900 placeholder:text-steel-600 focus:border-flame-500 focus:outline-none focus:ring-2 focus:ring-flame-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="flex h-[42px] items-center justify-center bg-flame-500 px-4 font-display text-xs font-bold text-white transition-colors hover:bg-flame-600"
                >
                  بحث
                </button>
              </form>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/10 pt-4 text-xs text-steel-600">
              <p>
                {coursesQuery.isLoading
                  ? 'جارٍ تحميل المسارات...'
                  : coursesQuery.isError
                    ? 'تعذّر تحميل النتائج'
                    : `${filtered.length} من ${total} مسارات`}
              </p>
              {isFiltered && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-flame-700 transition-colors hover:text-flame-600"
                >
                  <X size={12} aria-hidden="true" />
                  مسح البحث والتصفية
                </button>
              )}
            </div>
          </div>

          <div className="mt-10">
            {coursesQuery.isLoading ? (
              <CourseGridSkeleton count={4} />
            ) : coursesQuery.isError ? (
              <ErrorState
                title="تعذّر تحميل الدورات"
                message="تحقق من اتصال الإنترنت، ثم أعد المحاولة. إن استمرت المشكلة يمكنك إرسال استفسار وسنوافيك بالتفاصيل."
                onRetry={() => coursesQuery.refetch()}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="لا توجد نتائج مطابقة"
                message="جرّب كلمة بحث أخرى أو اختر تصنيفاً مختلفاً. يمكنك أيضاً طلب استشارة لاختيار المسار المناسب."
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="btn-outline-ink"
                    >
                      إعادة ضبط البحث
                    </button>
                    <Link to="/contact" className="btn-flame">
                      اطلب استشارة
                    </Link>
                  </div>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((course, index) => (
                  <Reveal key={course.slug} delay={(index % 3) * 70}>
                    <CourseCard course={course} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          <div className="mt-12 flex flex-col gap-4 border border-ink-900/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink-900">
                تفاصيل المواعيد والرسوم
              </h2>
              <p className="mt-1 max-w-xl text-[13px] leading-7 text-steel-600">
                تختلف تفاصيل الدفعات حسب المسار والمستوى، لذلك لا نعرض أسعاراً
                ثابتة هنا. أرسل استفسارك وسنوضح المتاح لك.
              </p>
            </div>
            <Link
              to="/contact"
              className="btn-outline-ink shrink-0 whitespace-nowrap"
            >
              اطلب التفاصيل
            </Link>
          </div>

          <p className="mt-6 text-[11px] leading-6 text-steel-600">
            {site.imagesNotice}
          </p>
        </div>
      </section>

      <section
        id="instructors"
        className="scroll-mt-28 border-t border-ink-900/10 bg-white py-16 lg:py-20"
        aria-labelledby="instructors-title"
        dir="rtl"
      >
        <div className="shell">
          <p className="eyebrow">فريق الأكاديمية</p>
          <h2
            id="instructors-title"
            className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl"
          >
            تعرّف على مدرّبينا
          </h2>
          <p className="mt-3 max-w-3xl font-display text-base font-semibold leading-8 text-flame-700">
            خبرة عملية ومعرفة متخصصة لمساعدتك على فهم تقنيات السيارات الحديثة وتطوير مهاراتك المهنية.
          </p>
          <div className="mt-4 max-w-3xl space-y-3 text-sm leading-8 text-steel-600">
            <p>
              يضم فريقنا التدريبي مهندسين ومتخصصين في مجالات السيارات والأنظمة الكهربائية والهجينة، يعملون على نقل المعرفة والخبرة إلى المتدربين من خلال الشرح النظري والتطبيق العملي وفق طبيعة كل دورة.
            </p>
            <p>
              تعرّف على مدرّبينا، واكتشف تخصصاتهم وخبراتهم والدورات التي يساهمون في تقديمها، لتختار المسار التدريبي الذي يناسب أهدافك المهنية.
            </p>
          </div>

          {instructorsQuery.isLoading ? (
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-96 animate-pulse border border-ink-900/10 bg-paper"
                />
              ))}
            </div>
          ) : instructorsQuery.isError ? (
            <p role="status" className="mt-8 border border-ink-900/10 bg-paper p-5 text-sm text-steel-600">
              تعذّر تحميل ملفات المدرّبين حالياً.
            </p>
          ) : instructorsQuery.data?.length ? (
            <div className="mt-9 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {instructorsQuery.data.map((instructor) => (
                <InstructorProfileCard key={instructor.id} instructor={instructor} />
              ))}
            </div>
          ) : (
            <p className="mt-8 border border-ink-900/10 bg-paper p-5 text-sm leading-7 text-steel-600">
              لم تُنشر ملفات المدرّبين بعد. ستظهر هنا الملفات التي يراجعها فريق الأكاديمية ويربطها بدورات منشورة.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
