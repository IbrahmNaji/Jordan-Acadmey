import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpLeft,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';
import PageMeta from '../../components/public/PageMeta';
import SectionHeading from '../../components/public/SectionHeading';
import Reveal from '../../components/public/Reveal';
import CourseCard from '../../components/public/CourseCard';
import FAQAccordion from '../../components/public/FAQAccordion';
import GalleryLightbox from '../../components/public/GalleryLightbox';
import {
  CourseGridSkeleton,
  EmptyState,
  ErrorState,
} from '../../components/public/StateBlocks';
import { usePublicCourses } from '../../hooks/usePublic';
import {
  contact,
  faqs,
  features,
  gallery,
  practicalPoints,
  registrationSteps,
  site,
  tracks,
} from '../../content/site';

export default function HomePage() {
  return (
    <>
      <PageMeta
        title={site.name}
        description={site.description}
        image="/images/hero/hero-workshop.webp"
      />
      <Hero />
      <TracksSection />
      <PracticalSection />
      <WhySection />
      <FeaturedCourses />
      <GallerySection />
      <StepsSection />
      <FaqTeaser />
      <FinalCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 text-paper">
      <img
        src="/images/hero/hero-workshop.webp"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover object-center opacity-60 animate-slow-zoom"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-l from-ink-950 via-ink-950/85 to-ink-950/25"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/30"
      />

      <div className="shell relative flex min-h-[640px] flex-col justify-center pb-20 pt-20 lg:min-h-[calc(100svh-108px)] lg:py-28">
        <div className="max-w-3xl">
          <p className="eyebrow animate-fade-up text-flame-400">
            تدريب سيارات عملي · دمشق
          </p>

          <h1 className="mt-6 animate-fade-up font-display text-[clamp(2.7rem,6.4vw,4.8rem)] font-black leading-[1.1] [animation-delay:120ms]">
            المهارة تُبنى
            <br />
            <span className="text-flame-500">داخل الورشة.</span>
          </h1>

          <p className="mt-6 max-w-xl animate-fade-up text-[15px] leading-8 text-steel-300 [animation-delay:240ms] sm:text-base">
            مسارات تدريبية عملية في ميكانيك السيارات وكهربائها وأنظمة التشخيص
            والهايبرد. تبدأ من الأساسيات، وتصل بك إلى الفحص والتشخيص بثقة.
          </p>

          <div className="mt-9 flex animate-fade-up flex-wrap gap-3 [animation-delay:360ms]">
            <Link to="/courses" className="btn-flame">
              استكشف المسارات
              <ArrowLeft size={17} aria-hidden="true" />
            </Link>
            <Link to="/contact" className="btn-outline-light">
              تحدث معنا
            </Link>
          </div>

          <ul className="mt-12 flex animate-fade-up flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/10 pt-6 text-[12px] text-steel-300 [animation-delay:480ms]">
            {[
              'أربعة مسارات تخصصية',
              'تدريب عملي داخل سياق الورشة',
              'استفسار دون أي التزام',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check
                  size={14}
                  className="text-flame-500"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-hidden="true"
          className="absolute bottom-10 left-8 hidden items-center gap-3 text-[10px] text-steel-500 xl:flex"
        >
          <span className="block h-10 w-px bg-steel-600" />
          <span className="[writing-mode:vertical-rl]">مرّر للأسفل</span>
          <ChevronDown size={14} className="animate-bounce" />
        </div>
      </div>
    </section>
  );
}

function TracksSection() {
  return (
    <section className="bg-paper py-20 lg:py-28">
      <div className="shell">
        <SectionHeading
          eyebrow="المسارات التدريبية"
          title={
            <>
              أربعة مسارات.
              <br />
              <span className="text-steel-600">اختر نقطة بدايتك.</span>
            </>
          }
          description="كل مسار يركّز على منظومة مختلفة في السيارة، ويجمع بين شرح المبدأ والتطبيق العملي. يمكنك التقدّم على أكثر من مسار حسب هدفك."
          action={
            <Link
              to="/courses"
              className="hidden items-center gap-2 border-b border-ink-900/30 pb-1 font-display text-xs font-bold text-ink-900 transition-colors hover:border-flame-500 hover:text-flame-700 sm:inline-flex"
            >
              جميع المسارات
              <ArrowLeft size={15} aria-hidden="true" />
            </Link>
          }
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tracks.map((track, index) => (
            <Reveal key={track.slug} delay={index * 70}>
              <Link
                to={`/courses/${track.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden bg-ink-800 text-paper"
              >
                <img
                  src={track.image}
                  alt={track.imageAlt}
                  loading="lazy"
                  decoding="async"
                  width={900}
                  height={1200}
                  className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.05] group-hover:opacity-100"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/35 to-ink-950/5"
                />
                <span className="absolute right-4 top-4 font-display text-xs font-bold tabular-nums text-paper/70">
                  {track.number}
                </span>
                <span className="absolute bottom-0 right-0 left-0 block p-5">
                  <span className="flex items-center justify-between gap-2 font-display text-lg font-extrabold leading-snug">
                    {track.title}
                    <ArrowUpLeft
                      size={17}
                      aria-hidden="true"
                      className="shrink-0 text-flame-500 transition-transform duration-300 group-hover:-translate-y-1 group-hover:-translate-x-1"
                    />
                  </span>
                  <span className="mt-2 block max-h-0 overflow-hidden text-[12px] leading-6 text-steel-300 opacity-0 transition-all duration-300 group-hover:max-h-20 group-hover:opacity-100">
                    {track.summary}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PracticalSection() {
  return (
    <section className="overflow-hidden bg-white py-20 lg:py-28">
      <div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow">التدريب العملي</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.3] text-ink-900 sm:text-4xl">
            لا تكتفِ بمشاهدة الإصلاح.
            <br />
            <span className="text-steel-600">افهمه ثم نفّذه.</span>
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-8 text-steel-600">
            يرتكز التدريب على التطبيق المباشر في سياق الورشة: تفحص، تقيس،
            وتناقش النتيجة قبل الانتقال إلى الخطوة التالية. الشرح النظري موجود،
            لكنه في خدمة ما تفعله بيدك.
          </p>

          <ul className="mt-7 space-y-3.5">
            {practicalPoints.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-flame-50 text-flame-700">
                  <Check size={13} aria-hidden="true" />
                </span>
                <span className="text-[13px] leading-7 text-ink-800">
                  {point}
                </span>
              </li>
            ))}
          </ul>

          <Link
            to="/workshop"
            className="mt-8 inline-flex items-center gap-2 border-b border-ink-900/30 pb-1 font-display text-xs font-bold text-ink-900 transition-colors hover:border-flame-500 hover:text-flame-700"
          >
            تعرّف على الورشة
            <ArrowLeft size={15} aria-hidden="true" />
          </Link>
        </div>

        <Reveal className="relative">
          <div
            aria-hidden="true"
            className="absolute -right-4 -top-4 h-full w-full border border-flame-500/40"
          />
          <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
            <img
              src="/images/workshop/practical-training.webp"
              alt="تدريب عملي على مكوّنات السيارة داخل الورشة"
              loading="lazy"
              decoding="async"
              width={1600}
              height={1200}
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent"
            />
            <p className="absolute bottom-4 right-4 left-4 flex items-center justify-between gap-3 border-t border-white/25 pt-3 font-display text-xs font-bold text-paper">
              <span>من الفهم إلى الفحص</span>
              <span className="text-flame-400">داخل الورشة</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="relative overflow-hidden bg-ink-900 py-20 text-paper lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30"
        style={{ backgroundSize: '56px 56px' }}
      />
      <div className="shell relative">
        <SectionHeading
          onDark
          eyebrow="لماذا هذا الأسلوب"
          title={
            <>
              لا نبيعك دورة.
              <br />
              <span className="text-steel-400">نبني معك طريقة تفكير.</span>
            </>
          }
          description="الفرق بين من يحفظ خطوات ومن يفهم النظام يظهر عند أول عطل غير متوقع. لذلك نبني التدريب حول المبدأ والتشخيص والتكرار العملي."
        />

        <div className="mt-12 grid grid-cols-1 gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
          {features.map((feature, index) => (
            <Reveal
              key={feature.number}
              delay={index * 70}
              className="group bg-ink-900 p-6 transition-colors duration-300 hover:bg-ink-800 sm:p-8"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-xs font-bold tabular-nums text-flame-500">
                  {feature.number}
                </span>
                <ArrowUpLeft
                  size={16}
                  aria-hidden="true"
                  className="text-steel-600 transition-colors group-hover:text-flame-400"
                />
              </div>
              <h3 className="mt-8 font-display text-lg font-bold text-paper">
                {feature.title}
              </h3>
              <p className="mt-2 max-w-md text-[13px] leading-7 text-steel-400">
                {feature.text}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCourses() {
  const coursesQuery = usePublicCourses();
  const items = coursesQuery.data ?? [];
  const featured = items.filter((course) => course.featured);
  const shown = (featured.length > 0 ? featured : items).slice(0, 3);

  return (
    <section className="bg-paper py-20 lg:py-28">
      <div className="shell">
        <SectionHeading
          eyebrow="من داخل الأكاديمية"
          title="مسارات مبنية على ما يحدث في الورشة."
          description="تفاصيل كل مسار محفوظة وقابلة للتحديث من نظام الإدارة. المواعيد والرسوم تُؤكَّد عند التواصل."
          action={
            <Link
              to="/courses"
              className="hidden items-center gap-2 border-b border-ink-900/30 pb-1 font-display text-xs font-bold text-ink-900 transition-colors hover:border-flame-500 hover:text-flame-700 sm:inline-flex"
            >
              عرض جميع الدورات
              <ArrowLeft size={15} aria-hidden="true" />
            </Link>
          }
        />

        <div className="mt-10">
          {coursesQuery.isLoading ? (
            <CourseGridSkeleton count={3} />
          ) : coursesQuery.isError ? (
            <ErrorState
              title="تعذّر تحميل الدورات"
              message="لم نتمكن من الوصول إلى بيانات المسارات الآن. تحقق من الاتصال أو أعد المحاولة."
              onRetry={() => coursesQuery.refetch()}
            />
          ) : shown.length === 0 ? (
            <EmptyState
              title="لا توجد مسارات معروضة حالياً"
              message="سيتم نشر المسارات التدريبية قريباً. يمكنك إرسال استفسارك وسنوافيك بالتفاصيل المتاحة."
              action={
                <Link to="/contact" className="btn-flame">
                  أرسل استفسارك
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((course, index) => (
                <Reveal key={course.slug} delay={index * 80}>
                  <CourseCard course={course} />
                </Reveal>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 sm:hidden">
          <Link
            to="/courses"
            className="flex items-center justify-center gap-2 border border-ink-900/20 px-5 py-3 font-display text-xs font-bold text-ink-900"
          >
            عرض جميع الدورات
            <ArrowLeft size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  return (
    <section className="relative overflow-hidden bg-ink-950 py-20 text-paper lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-dark opacity-20"
        style={{ backgroundSize: '56px 56px' }}
      />
      <div className="shell relative">
        <SectionHeading
          onDark
          eyebrow="لقطات من بيئة التدريب"
          title="الورشة هي الفصل الدراسي."
          description="أدوات، محركات، رافعات وأجهزة فحص. هذه لقطات توضيحية لبيئة تدريب السيارات، وليست صوراً للمنشأة الفعلية."
        />
        <Reveal className="mt-10">
          <GalleryLightbox images={gallery} />
        </Reveal>
        <p className="mt-5 flex items-start gap-2 text-[11px] leading-6 text-steel-500">
          <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          {site.imagesNotice}
        </p>
      </div>
    </section>
  );
}

function StepsSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="shell">
        <SectionHeading
          eyebrow="طريقة الانضمام"
          title="من الاستفسار إلى الدفعة، بأربع خطوات."
          description="لا نطلب منك قراراً في أول رسالة. نبدأ بفهم هدفك، ثم نوضح التفاصيل المتاحة قبل التسجيل."
          action={
            <Link to="/contact" className="btn-outline-ink hidden sm:inline-flex">
              ابدأ باستفسار
              <ArrowLeft size={16} aria-hidden="true" />
            </Link>
          }
        />

        <ol className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {registrationSteps.map((step, index) => (
            <Reveal key={step.number} delay={index * 70}>
              <li className="relative border-t border-ink-900/15 pt-6">
                <span
                  aria-hidden="true"
                  className="absolute -top-[5px] right-0 h-[9px] w-[9px] bg-flame-500"
                />
                <span className="font-display text-xs font-bold tabular-nums text-flame-700">
                  {step.number}
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-ink-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-7 text-steel-600">
                  {step.text}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>

        <div className="mt-10 sm:hidden">
          <Link to="/contact" className="btn-flame w-full">
            ابدأ باستفسار
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FaqTeaser() {
  return (
    <section className="bg-paper py-20 lg:py-28">
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">قبل أن تسأل</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.3] text-ink-900 sm:text-4xl">
              أسئلة نسمعها
              <br />
              <span className="text-steel-600">قبل كل دفعة.</span>
            </h2>
            <p className="mt-5 max-w-md text-[14px] leading-8 text-steel-600">
              لم تجد إجابتك؟ أرسل سؤالك عبر النموذج، وسنعود إليك بالتفاصيل
              الدقيقة بدل التخمين.
            </p>
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center gap-2 border-b border-ink-900/30 pb-1 font-display text-xs font-bold text-ink-900 transition-colors hover:border-flame-500 hover:text-flame-700"
            >
              اسأل الأكاديمية
              <ArrowLeft size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="lg:col-span-7">
          <FAQAccordion items={faqs.slice(0, 4)} />
          <Link
            to="/faq"
            className="mt-6 inline-flex items-center gap-2 font-display text-xs font-bold text-steel-600 transition-colors hover:text-flame-700"
          >
            جميع الأسئلة الشائعة
            <ArrowLeft size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 text-paper">
      <img
        src="/images/cta-engine.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-l from-ink-950 via-ink-950/90 to-ink-950/50"
      />
      <div className="shell relative py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow text-flame-400">الخطوة التالية</p>
          <h2 className="mt-4 text-balance text-3xl font-extrabold leading-[1.25] sm:text-4xl lg:text-5xl">
            جاهز تبدأ من الأساس الصحيح؟
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-8 text-steel-300">
            أخبرنا بالمسار الذي يهمك وطريقة التواصل المناسبة لك. سنناقش معك
            نقطة البداية والتفاصيل المتاحة قبل أي قرار.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact" className="btn-flame">
              اطلب معلومات
              <ArrowLeft size={17} aria-hidden="true" />
            </Link>
            <Link to="/courses" className="btn-outline-light">
              استكشف الدورات
            </Link>
          </div>
          {contact.phone && (
            <p className="mt-6 text-xs text-steel-400">
              أو اتصل على{' '}
              <a
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                className="font-semibold text-paper underline decoration-flame-500 underline-offset-4"
                dir="ltr"
              >
                {contact.phone}
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
