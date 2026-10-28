import { Link } from 'react-router-dom';
import { ArrowLeft, UserRound } from 'lucide-react';
import type { PublicInstructor } from '../../types/public';

interface InstructorProfileCardProps {
  instructor: PublicInstructor;
  compact?: boolean;
  currentCourseSlug?: string;
}

export default function InstructorProfileCard({
  instructor,
  compact = false,
  currentCourseSlug,
}: InstructorProfileCardProps) {
  const profileImage =
    instructor.id === '5e797948-8ef8-437c-b7ac-8d01a002395d'
      ? '/images/instructors/omar-mustafa.webp'
      : null;
  const otherCourses = instructor.courses.filter(
    (course) => course.slug !== currentCourseSlug,
  );

  return (
    <article
      className={`overflow-hidden border border-ink-900/10 bg-white ${compact ? 'grid sm:grid-cols-[180px_1fr]' : 'flex h-full flex-col'}`}
      dir="rtl"
    >
      {profileImage ? (
        <img
          src={profileImage}
          alt={`المهندس عمر مصطفى، مهندس تكنولوجيا مركبات`}
          className={`w-full object-cover object-[center_32%] ${compact ? 'h-full min-h-[180px]' : 'aspect-[4/3]'}`}
        />
      ) : (
        <div
          className={`flex flex-col items-center justify-center bg-ink-900 text-paper ${compact ? 'min-h-[180px] p-5' : 'aspect-[4/3] p-6'}`}
          role="img"
          aria-label={`صورة تعريفية مؤقتة للمدرّب ${instructor.fullName}`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-flame-400">
            <UserRound size={32} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <span className="mt-3 text-center text-[11px] text-steel-300">
            الصورة المعتمدة قيد الإضافة
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-lg font-extrabold text-ink-900">
          {instructor.fullName}
        </h3>
        {instructor.specialty && (
          <p className="mt-1 text-sm font-semibold text-flame-700">
            {instructor.specialty}
          </p>
        )}
        <p className="mt-3 text-[13px] leading-7 text-steel-600">
          {instructor.bio || 'نبذة الخبرة قيد الإضافة.'}
        </p>

        <div className="mt-4 border-t border-ink-900/10 pt-4">
          <h4 className="text-xs font-bold text-ink-900">
            الدورات المرتبطة
          </h4>
          {instructor.courses.length ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {instructor.courses.map((course) => (
                <li key={course.slug}>
                  <Link
                    to={`/courses/${course.slug}`}
                    className="inline-flex min-h-8 items-center border border-ink-900/10 px-2.5 text-[11px] text-steel-700 transition-colors hover:border-flame-500 hover:text-flame-700"
                  >
                    {course.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-steel-500">
              لا توجد دورات منشورة مرتبطة حالياً.
            </p>
          )}
        </div>

        <Link
          to={otherCourses.length ? `/courses/${otherCourses[0].slug}` : '/courses'}
          className="mt-auto inline-flex items-center gap-2 pt-5 font-display text-xs font-bold text-ink-900 transition-colors hover:text-flame-700"
        >
          تعرّف على الدورات
          <ArrowLeft size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
