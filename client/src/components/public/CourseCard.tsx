import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import type { PublicCourse } from '../../types/public';

export default function CourseCard({ course }: { course: PublicCourse }) {
  return (
    <article className="public-card group flex h-full flex-col">
      <Link to={`/courses/${course.slug}`} className="relative aspect-[16/10] overflow-hidden bg-ink-800" aria-label={`عرض تفاصيل ${course.title}`}>
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
          <span className="absolute bottom-3 right-3 inline-flex items-center rounded-md border border-white/10 bg-ink-950/85 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-flame-300 backdrop-blur">
            {course.shortTitle}
          </span>
      </Link>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="font-display text-xl font-extrabold text-ink-900 transition-colors group-hover:text-flame-600">
            {course.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-[13px] leading-7 text-steel-600">
            {course.summary}
          </p>

          <ul className="mt-4 flex flex-wrap gap-1.5">
            {course.focus.slice(0, 2).map((topic) => (
              <li key={topic} className="inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-[11px] text-steel-600">
                <Check size={12} className="text-flame-600" aria-hidden="true"/>
                {topic}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/10 pt-4">
            <Link to={`/courses/${course.slug}`} className="inline-flex min-h-10 items-center gap-2 font-display text-xs font-bold text-ink-900 transition-colors group-hover:text-flame-700">عرض التفاصيل <ArrowLeft size={15} aria-hidden="true" className="text-flame-600 transition-transform duration-300 group-hover:-translate-x-1"/></Link>
            <Link to="/contact" className="inline-flex min-h-10 items-center rounded-lg bg-ink-900 px-3 text-[11px] font-bold text-white transition-colors hover:bg-flame-500 hover:text-white">استفسر عن الدورة</Link>
          </div>
        </div>
    </article>
  );
}
