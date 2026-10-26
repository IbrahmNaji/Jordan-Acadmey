import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { PublicCourse } from '../../types/public';

export default function CourseCard({ course }: { course: PublicCourse }) {
  return (
    <article className="group h-full">
      <Link
        to={`/courses/${course.slug}`}
        className="flex h-full flex-col border border-ink-900/10 bg-white transition duration-300 hover:border-flame-500/60 hover:shadow-lift"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-ink-800">
          <img
            src={course.image}
            alt={course.imageAlt}
            loading="lazy"
            decoding="async"
            width={1200}
            height={750}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent"
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center bg-ink-950/80 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-flame-400 backdrop-blur">
            {course.shortTitle}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="font-display text-xl font-extrabold text-ink-900 transition-colors group-hover:text-flame-600">
            {course.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-[13px] leading-7 text-steel-600">
            {course.summary}
          </p>

          <ul className="mt-4 flex flex-wrap gap-1.5">
            {course.focus.slice(0, 2).map((topic) => (
              <li
                key={topic}
                className="border border-ink-900/10 px-2 py-1 text-[11px] text-steel-600"
              >
                {topic}
              </li>
            ))}
          </ul>

          <span className="mt-5 flex items-center gap-2 border-t border-ink-900/10 pt-4 font-display text-xs font-bold text-ink-900">
            تفاصيل المسار
            <ArrowLeft
              size={15}
              aria-hidden="true"
              className="text-flame-500 transition-transform duration-300 group-hover:-translate-x-1"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}
