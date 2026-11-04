import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  CircleHelp,
  Check,
  ChevronLeft,
  Clock3,
  Images,
  Info,
  MapPin,
  MessageCircle,
  Play,
  Wrench,
} from 'lucide-react';
import PageMeta from '../../components/public/PageMeta';
import CourseCard from '../../components/public/CourseCard';
import InquiryForm from '../../components/public/InquiryForm';
import Reveal from '../../components/public/Reveal';
import { Spinner } from '../../components/public/StateBlocks';
import { usePublicCourse } from '../../hooks/usePublic';
import { site } from '../../content/site';
import InstructorProfileCard from '../../components/public/InstructorProfileCard';
import { contact, toWhatsAppLink } from '../../content/site';
import { resolveMediaUrl } from '../../api/media';

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const courseQuery = usePublicCourse(slug);
  const [formVisible, setFormVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    if (!courseQuery.data) return;
    const form = document.getElementById('inquiry');
    const footer = document.querySelector('footer');
    const formObserver = form
      ? new IntersectionObserver(
          ([entry]) => setFormVisible(entry.isIntersecting),
          { threshold: 0.08 },
        )
      : null;
    const footerObserver = footer
      ? new IntersectionObserver(
          ([entry]) => setFooterVisible(entry.isIntersecting),
          { threshold: 0.05 },
        )
      : null;
    if (form && formObserver) formObserver.observe(form);
    if (footer && footerObserver) footerObserver.observe(footer);

    return () => {
      formObserver?.disconnect();
      footerObserver?.disconnect();
    };
  }, [courseQuery.data]);

  if (courseQuery.isLoading) {
    return (
      <>
        <PageMeta title="جارٍ تحميل المسار" />
        <div className="bg-paper py-24">
          <Spinner label="جارٍ تحميل تفاصيل المسار..." />
        </div>
      </>
    );
  }

  if (courseQuery.isError || !courseQuery.data) {
    return (
      <>
        <PageMeta title="المسار غير متاح" />
        <section className="bg-paper py-20">
          <div className="shell max-w-2xl text-center">
            <p className="eyebrow justify-center">تعذّر العرض</p>
            <h1 className="mt-4 text-3xl font-extrabold text-ink-900">
              هذا المسار غير متاح حالياً
            </h1>
            <p className="mt-4 text-sm leading-8 text-steel-600">
              قد يكون الرابط قديماً أو حدث خطأ في تحميل البيانات. يمكنك العودة
              إلى قائمة المسارات أو التواصل معنا للاستفسار عن المسار الذي تريده.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/courses" className="btn-flame">
                العودة إلى الدورات
                <ArrowLeft size={16} aria-hidden="true" />
              </Link>
              <Link to="/contact" className="btn-outline-ink">
                تواصل معنا
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  const course = courseQuery.data;
  const showMobileBar = course.registrationOpen !== false && !formVisible && !footerVisible;

  return (
    <div className="bg-paper pb-16 md:pb-0">
      <PageMeta
        title={course.title}
        description={course.summary}
        image={course.image}
      />

      <section className="relative isolate overflow-hidden bg-ink-950 pb-16 pt-8 text-paper lg:pb-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid-dark opacity-25"
          style={{ backgroundSize: '56px 56px' }}
        />
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-l from-transparent to-flame-500/[0.06]"
        />

        <div className="shell relative">
          <nav aria-label="مسار التنقل" className="mb-10">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-steel-400">
              <li>
                <Link to="/" className="transition-colors hover:text-flame-400">
                  الرئيسية
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <ChevronLeft size={13} aria-hidden="true" className="text-steel-600" />
                <Link
                  to="/courses"
                  className="transition-colors hover:text-flame-400"
                >
                  الدورات
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <ChevronLeft size={13} aria-hidden="true" className="text-steel-600" />
                <span aria-current="page" className="text-paper">
                  {course.title}
                </span>
              </li>
            </ol>
          </nav>

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="animate-fade-up">
              <p className="eyebrow text-flame-400">
                مسار تدريبي · {course.shortTitle}
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.2] sm:text-5xl">
                {course.title}
              </h1>
              {course.titleEnglish && <p className="mt-3 font-display text-sm text-steel-400" dir="ltr">{course.titleEnglish}</p>}
              <p className="mt-4 font-display text-lg font-semibold text-flame-300">
                {course.tagline}
              </p>
              <p className="mt-4 max-w-xl text-[15px] leading-8 text-steel-300">
                {course.summary}
              </p>

              <ul className="mt-7 flex flex-wrap gap-2">
                <li className="inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 text-[11px] text-steel-300">
                  <Wrench size={13} className="text-flame-300" aria-hidden="true" />
                  {course.deliveryMode === 'ONSITE' ? 'حضوري' : course.deliveryMode === 'ONLINE' ? 'أونلاين' : 'هجين'}
                </li>
                <li className="inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 text-[11px] text-steel-300">
                  <MapPin size={13} className="text-flame-300" aria-hidden="true" />
                  {course.location || site.location}
                </li>
                {course.duration && <li className="inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 text-[11px] text-steel-300"><Clock3 size={13} className="text-flame-300" aria-hidden="true" />{course.duration}</li>}
                <li className="inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 text-[11px] text-steel-300">
                  <MessageCircle
                    size={13}
                    className="text-flame-300"
                    aria-hidden="true"
                  />
                  استفسار مباشر
                </li>
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                {course.registrationOpen !== false ? <a href="#inquiry" className="btn-flame">سجل الآن <ArrowDown size={16} aria-hidden="true" /></a> : <span className="border border-amber-300/50 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-200">التسجيل مغلق حالياً</span>}
                {contact.whatsapp && <a href={toWhatsAppLink(contact.whatsapp, `مرحباً، أستفسر عن ${course.title}`)} target="_blank" rel="noreferrer" className="btn-outline-light"><MessageCircle size={15}/> واتساب</a>}
                <Link to="/courses" className="btn-outline-light">
                  كل المسارات
                </Link>
              </div>
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -bottom-4 -left-4 h-full w-full border border-flame-500/40"
              />
              <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
                <img
                  src={resolveMediaUrl(course.image)}
                  alt={course.imageAlt}
                  fetchPriority="high"
                  width={1200}
                  height={900}
                  className="h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent"
                />
                <p className="absolute bottom-4 right-4 border border-white/20 bg-ink-950/70 px-3 py-1.5 font-display text-[11px] font-bold text-paper backdrop-blur">
                  {course.shortTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {course.contentSections?.length ? <section className="bg-white py-14 lg:py-18" aria-label="تفاصيل البرنامج"><div className="shell grid gap-5 md:grid-cols-2">{course.contentSections.map((section, index) => <article key={`${section.title}-${index}`} className="border border-ink-900/10 bg-paper/60 p-6 sm:p-7"><p className="font-display text-xs font-bold text-flame-700">{String(index + 1).padStart(2, '0')}</p><h2 className="mt-2 text-xl font-extrabold text-ink-900">{section.title}</h2>{section.body && <p className="mt-3 whitespace-pre-line text-sm leading-8 text-steel-600">{section.body}</p>}{section.items?.length ? <ul className="mt-4 space-y-2">{section.items.map((item) => <li key={item} className="flex gap-2 text-sm leading-7 text-ink-800"><Check size={16} className="mt-1 shrink-0 text-flame-600"/>{item}</li>)}</ul> : null}</article>)}</div></section> : null}

      {(course.gallery?.length || course.videos?.length) ? <section className="bg-ink-950 py-14 text-paper lg:py-18"><div className="shell"><p className="eyebrow text-flame-300"><Images size={14}/> بيئة التدريب</p><h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">صور ومقاطع من الأكاديمية</h2><p className="mt-3 text-xs leading-6 text-steel-400">الصور التوضيحية لا تمثل بالضرورة موقع الأكاديمية الفعلي.</p>{course.gallery?.length ? <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{course.gallery.map((path, index) => <a key={`${path}-${index}`} href={resolveMediaUrl(path)} target="_blank" rel="noreferrer" className="group aspect-[4/3] overflow-hidden bg-ink-800"><img src={resolveMediaUrl(path)} alt={`${course.title} - صورة ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/></a>)}</div> : null}{course.videos?.length ? <div className="mt-7 grid gap-3 sm:grid-cols-2">{course.videos.map((video, index) => <a key={`${video}-${index}`} href={video} target="_blank" rel="noreferrer" className="flex min-h-20 items-center gap-3 border border-white/15 p-4 transition hover:border-flame-400"><span className="flex h-10 w-10 items-center justify-center bg-flame-500"><Play size={17}/></span><span className="break-all text-sm">مشاهدة فيديو التدريب {index + 1}</span></a>)}</div> : null}</div></section> : null}

      {course.instructor && (
        <section
          className="border-t border-ink-900/10 bg-white py-12 lg:py-16"
          aria-labelledby="course-instructor-title"
        >
          <div className="shell">
            <p className="eyebrow">فريق التدريب</p>
            <h2
              id="course-instructor-title"
              className="mb-6 mt-3 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl"
            >
              مدرّس الدورة
            </h2>
            <div className="max-w-3xl">
              <InstructorProfileCard
                instructor={course.instructor}
                compact
                currentCourseSlug={course.slug}
              />
            </div>
          </div>
        </section>
      )}

      <section className="bg-paper py-16 lg:py-20">
        <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-10 lg:col-span-8">
            <div>
              <p className="eyebrow">عن المسار</p>
              <h2 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">
                ماذا ستتعلّم؟ وكيف؟
              </h2>
              <div className="mt-5 space-y-4 text-[15px] leading-8 text-steel-600">
                {course.description.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="border border-ink-900/10 bg-white p-6 sm:p-8">
              <h2 className="font-display text-xl font-extrabold text-ink-900">
                محاور يركز عليها المسار
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {course.focus.map((topic) => (
                  <li
                    key={topic}
                    className="flex items-start gap-3 border border-ink-900/[0.07] bg-paper/60 p-3.5"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-flame-50 text-flame-700">
                      <Check size={13} aria-hidden="true" />
                    </span>
                    <span className="text-[13px] leading-6 text-ink-800">
                      {topic}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-ink-900/10 bg-white p-6">
                <div className="flex items-center gap-2 text-flame-700">
                  <Wrench size={17} aria-hidden="true" />
                  <h2 className="font-display text-sm font-bold">طريقة التدريب</h2>
                </div>
                <p className="mt-3 text-[13px] leading-7 text-steel-600">
                  {course.format}
                </p>
              </div>
              <div className="border border-ink-900/10 bg-white p-6">
                <div className="flex items-center gap-2 text-flame-700">
                  <Info size={17} aria-hidden="true" />
                  <h2 className="font-display text-sm font-bold">
                    الدفعات والتفاصيل
                  </h2>
                </div>
                <p className="mt-3 text-[13px] leading-7 text-steel-600">
                  {course.note}
                </p>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="border border-ink-900/10 bg-white p-6 lg:sticky lg:top-28">
              <p className="eyebrow">هل يناسبك؟</p>
              <h2 className="mt-3 font-display text-xl font-extrabold leading-8 text-ink-900">
                اطلب المعلومات قبل أن تقرر.
              </h2>
              <p className="mt-3 text-[13px] leading-7 text-steel-600">
                أرسل بياناتك وسنوضح نقطة البداية والتفاصيل المتاحة. لا حاجة
                لأي التزام عند الاستفسار.
              </p>

              <dl className="mt-5 space-y-3 border-y border-ink-900/10 py-4 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-steel-600">المسار</dt>
                  <dd className="font-semibold text-ink-900">
                    {course.shortTitle}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-steel-600">طريقة التدريب</dt>
                  <dd className="font-semibold text-ink-900">{course.deliveryMode === 'ONSITE' ? 'حضوري (نظري وعملي)' : course.deliveryMode === 'ONLINE' ? 'أونلاين' : 'هجين'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-steel-600">الموقع</dt>
                  <dd className="font-semibold text-ink-900">{course.location || site.location}</dd>
                </div>
                {course.duration && <div className="flex items-center justify-between gap-3"><dt className="text-steel-600">المدة</dt><dd className="font-semibold text-ink-900">{course.duration}</dd></div>}
                {course.price != null && <div className="flex items-center justify-between gap-3"><dt className="text-steel-600">السعر</dt><dd className="font-display text-lg font-extrabold text-flame-700">{Number(course.price).toLocaleString('en-US')} {course.currency || 'USD'}</dd></div>}
                <div className="flex items-center justify-between gap-3"><dt className="text-steel-600">التسجيل</dt><dd className={course.registrationOpen === false ? 'font-semibold text-amber-700' : 'font-semibold text-green-700'}>{course.registrationOpen === false ? 'مغلق' : 'مفتوح'}</dd></div>
              </dl>

              {course.registrationOpen !== false && <a href="#inquiry" className="btn-flame mt-5 w-full">سجل الآن <ArrowDown size={16} aria-hidden="true" /></a>}
              {contact.whatsapp && <a href={toWhatsAppLink(contact.whatsapp, `مرحباً، أود الاستفسار عن ${course.title}`)} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-2 border border-green-600/30 bg-green-50 px-4 py-3 font-display text-xs font-bold text-green-800"><MessageCircle size={15}/> تواصل عبر WhatsApp</a>}
              <Link
                to="/contact"
                className="mt-3 flex items-center justify-center gap-2 border border-ink-900/15 px-4 py-3 font-display text-xs font-bold text-ink-900 transition-colors hover:border-ink-900"
              >
                خيارات التواصل
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
              <p className="mt-4 text-[11px] leading-6 text-steel-600">
                إرسال النموذج لا يُعد تسجيلاً نهائياً.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {course.registrationOpen !== false && <section id="inquiry" className="scroll-mt-28 bg-white py-16 lg:py-20">
        <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <p className="eyebrow">الخطوة التالية</p>
            <h2 className="mt-3 text-2xl font-extrabold leading-[1.35] text-ink-900 sm:text-3xl">
              استفسارك بداية الحوار،
              <br />
              <span className="text-steel-600">وليس قراراً نهائياً.</span>
            </h2>
            <p className="mt-5 text-[14px] leading-8 text-steel-600">
              اختر طريقة التواصل التي تناسبك. سنناقش خبرتك السابقة، ما يغطيه
              المسار، والتفاصيل المتاحة للدفعة القادمة.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'لا نطلب رسوماً أو التزاماً لإرسال الاستفسار.',
                'بياناتك تُستخدم للتواصل بخصوص استفسارك فقط.',
                'يمكنك تحديد مسارك، أو ترك الخيار لنا.',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-[13px] leading-7 text-ink-800"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-flame-50 text-flame-700">
                    <Check size={13} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-start gap-2 text-[11px] leading-6 text-steel-600">
              <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              {site.imagesNotice}
            </p>
          </div>
          <div className="lg:col-span-7">
            <InquiryForm
              defaultCourseSlug={course.slug}
              defaultCourseTitle={course.title}
            />
          </div>
        </div>
      </section>}

      {course.faqs?.length ? <section className="bg-paper py-14 lg:py-18"><div className="shell max-w-4xl"><p className="eyebrow"><CircleHelp size={14}/> أسئلة شائعة</p><h2 className="mt-3 text-2xl font-extrabold text-ink-900">إجابات قبل التسجيل</h2><div className="mt-6 divide-y divide-ink-900/10 border-y border-ink-900/10 bg-white">{course.faqs.map((faq, index) => <details key={`${faq.question}-${index}`} className="group p-5"><summary className="cursor-pointer list-none font-bold text-ink-900 marker:hidden">{faq.question}</summary><p className="mt-3 text-sm leading-7 text-steel-600">{faq.answer}</p></details>)}</div></div></section> : null}

      {course.related.length > 0 && (
        <section className="bg-paper py-16 lg:py-20">
          <div className="shell">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">مسارات أخرى</p>
                <h2 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">
                  قد يناسبك أيضاً
                </h2>
              </div>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 border-b border-ink-900/30 pb-1 font-display text-xs font-bold text-ink-900 transition-colors hover:border-flame-500 hover:text-flame-700"
              >
                كل المسارات
                <ArrowLeft size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {course.related.map((related, index) => (
                <Reveal key={related.slug} delay={index * 70}>
                  <CourseCard course={related} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {showMobileBar && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink-950/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] text-steel-400">مسار</p>
              <p className="truncate font-display text-xs font-bold text-paper">
                {course.shortTitle}
              </p>
            </div>
            <a
              href="#inquiry"
              className="inline-flex min-h-[44px] shrink-0 items-center gap-2 bg-flame-500 px-4 font-display text-xs font-bold text-white"
            >
              اطلب معلومات
              <ArrowDown size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
