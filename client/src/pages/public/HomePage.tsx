import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Car,
  Check,
  ChevronDown,
  Cpu,
  Gauge,
  Images,
  Package,
  ScanLine,
  Wrench,
  Zap,
} from 'lucide-react';
import PageMeta from '../../components/public/PageMeta';
import SectionHeading from '../../components/public/SectionHeading';
import CourseCard from '../../components/public/CourseCard';
import Reveal from '../../components/public/Reveal';
import GalleryLightbox from '../../components/public/GalleryLightbox';
import { usePublicCourses } from '../../hooks/usePublic';
import type { PublicCourse } from '../../types/public';
import { contact, site, toWhatsAppLink } from '../../content/site';

const companyLines = [
  {
    icon: BookOpen,
    href: '/courses',
    title: 'الأكاديمية',
    status: 'متاح',
    text: 'تصفح المسارات التدريبية واطلب معلومات عن الدورات والدفعات.',
    image: '/images/courses/mechanics.webp',
  },
  {
    icon: Car,
    href: '/marketplace',
    title: 'بيع وشراء المركبات',
    status: 'عروض واستفسارات',
    text: 'تصفح المركبات المتاحة أو تواصل معنا لعرض مركبتك للبيع.',
    image: '/images/gallery/lift.webp',
  },
  {
    icon: Wrench,
    href: '/workshop',
    title: 'الكراج',
    status: 'خدمات الكراج',
    text: 'استفسر عن الفحص والصيانة والخدمات الفنية للمركبات.',
    image: '/images/gallery/scanner.webp',
  },
  {
    icon: Package,
    href: '/spare-parts',
    title: 'قطع الغيار',
    status: 'طلبات قطع الغيار',
    text: 'اطلب القطعة المناسبة واستفسر عن توفرها وسعرها.',
    image: '/images/gallery/engine.webp',
  },
];

function BusinessLinesSection() {
  return (
    <section
      className="border-y border-ink-900/10 bg-white py-14 sm:py-18"
      id="business-lines"
      aria-labelledby="business-lines-title"
    >
      <div className="shell">
        <SectionHeading
          eyebrow="خدمات السيارات"
          title={
            <span id="business-lines-title">منصة واحدة، ومسارات واضحة.</span>
          }
          description="تصفح خدماتنا في التدريب، بيع وشراء المركبات، صيانة السيارات، وقطع الغيار. اختر القسم الذي يناسبك للتواصل أو معرفة التفاصيل."
        />
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {companyLines.map(({ icon: Icon, href, title, status, text, image }, index) => (
            <Link
              key={href}
              to={href}
              className="public-card group flex h-full flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-ink-800">
                <img src={image} alt="" aria-hidden="true" loading="lazy" decoding="async" width={720} height={450} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />
                <span className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-ink-950/55 text-flame-300 backdrop-blur"><Icon size={20} aria-hidden="true" /></span>
                <span className="absolute bottom-3 left-4 font-display text-[10px] font-bold tracking-[.2em] text-white/70">0{index + 1}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-base font-bold text-ink-900 transition-colors group-hover:text-flame-700">
                {title}
              </h3>
              <p className="mt-2 text-[11px] font-bold text-flame-700">
                {status}
              </p>
              <p className="mt-2 flex-1 text-[13px] leading-7 text-steel-600">
                {text}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 border-t border-ink-900/10 pt-4 font-display text-xs font-bold text-ink-900 transition-colors group-hover:text-flame-700">
                التفاصيل <ArrowLeft size={14} aria-hidden="true" />
              </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const coursesQuery = usePublicCourses();
  return (
    <>
      <PageMeta
        title={site.name}
        description={site.description}
        image="/images/hero/hero-workshop.webp"
      />
      <Hero />
      <BusinessLinesSection />
      <FeaturedCourses courses={coursesQuery.data ?? []} loading={coursesQuery.isLoading} />
      <TechnicalApproach />
      <WorkshopGallery />
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

      <div className="shell relative grid min-h-[650px] items-center gap-12 pb-16 pt-16 lg:min-h-[calc(100svh-108px)] lg:grid-cols-[1fr_.72fr] lg:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow motion-enter text-flame-300">
            الأكاديمية · المركبات · الكراج · قطع الغيار
          </p>

          <h1 className="mt-6 motion-enter font-display text-[clamp(2.7rem,6.4vw,4.8rem)] font-black leading-[1.1] [animation-delay:120ms]">
            معرفة تقنية
            <br />
            <span className="text-flame-300">تصنع فرقاً على الطريق.</span>
          </h1>

          <p className="mt-6 max-w-xl motion-enter text-[15px] leading-8 text-steel-300 [animation-delay:240ms] sm:text-base">
            تعلم ميكانيك السيارات وتشخيص أعطالها وتقنيات الهايبرد، مع خدمات فنية ومركبات وقطع غيار في وجهة واحدة.
          </p>

          <div className="mt-9 flex motion-enter flex-wrap gap-3 [animation-delay:360ms]">
            <Link to="/courses" className="btn-flame">
              اكتشف الدورات
              <ArrowLeft size={17} aria-hidden="true" />
            </Link>
            <a href="#business-lines" className="btn-outline-light">
              استكشف الخدمات
            </a>
          </div>

          <ul className="mt-12 flex motion-enter flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/10 pt-6 text-[12px] text-steel-300 [animation-delay:480ms]">
            {[
              'أكاديمية تدريب سيارات',
              'بيع وشراء مركبات',
              'الكراج وقطع الغيار',
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

        <div className="motion-enter relative mx-auto w-full max-w-md [animation-delay:260ms] lg:mx-0 lg:mr-auto">
          <div className="absolute -inset-4 rounded-[2rem] border border-white/10" />
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-ink-900/80 p-3 shadow-2xl backdrop-blur">
            <img src="/images/workshop/practical-training.webp" alt="تدريب عملي على أنظمة المركبات" loading="lazy" decoding="async" width={900} height={1100} className="aspect-[4/4.5] w-full rounded-xl object-cover" />
            <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/10 bg-ink-950/90 p-4 backdrop-blur-md sm:p-5">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-flame-500 text-ink-950"><ScanLine size={20}/></span><div><p className="text-[10px] font-bold tracking-[.18em] text-flame-300">تدريب تطبيقي</p><p className="mt-1 text-sm font-bold text-white">من الفحص إلى فهم العطل</p></div></div>
            </div>
          </div>
          <div className="absolute -right-5 top-8 hidden items-center gap-3 rounded-xl border border-white/10 bg-ink-900/95 px-4 py-3 shadow-xl sm:flex"><Gauge className="text-flame-300" size={18}/><span className="text-xs font-semibold text-white">تعلم تقني بخطوات واضحة</span></div>
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

function FeaturedCourses({ courses, loading }: { courses: PublicCourse[]; loading: boolean }) {
  const featured = courses.slice(0, 3);
  return (
    <section className="bg-paper py-16 sm:py-20 lg:py-24" aria-labelledby="featured-courses-title">
      <div className="shell">
        <SectionHeading
          eyebrow="مسارات تقنية"
          title={<span id="featured-courses-title">تعلّم الأنظمة التي تحرّك السيارة.</span>}
          description="من أساسيات الميكانيك إلى أنظمة الكهرباء والتشخيص والهايبرد؛ اختر مساراً يناسب هدفك واطلب تفاصيله."
          action={<Link to="/courses" className="btn-outline-ink">كل الدورات <ArrowLeft size={15}/></Link>}
        />
        {loading ? (
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2].map((item)=><div key={item} className="aspect-[16/10] animate-pulse rounded-2xl bg-white ring-1 ring-ink-900/10"/>)}</div>
        ) : featured.length ? (
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featured.map((course,index)=><Reveal key={course.slug} delay={index*80}><CourseCard course={course}/></Reveal>)}</div>
        ) : (
          <div className="mt-9 rounded-2xl border border-ink-900/10 bg-white p-7 text-sm leading-7 text-steel-600 shadow-sm">تعرّف على المسارات المتاحة وتواصل معنا لمعرفة تفاصيل الدورات والدفعات.</div>
        )}
      </div>
    </section>
  );
}

const learningPillars = [
  { icon: Wrench, title: 'ميكانيك المركبات', text: 'فهم الأنظمة الميكانيكية ومبادئ الصيانة العملية.' },
  { icon: Zap, title: 'الكهرباء والإلكترونيات', text: 'قراءة الدوائر والتعامل مع أنظمة التحكم والمكونات.' },
  { icon: ScanLine, title: 'تشخيص الأعطال', text: 'ربط الأعراض بالقياسات وبيانات الفحص للوصول إلى سبب العطل.' },
  { icon: Cpu, title: 'تقنيات الهايبرد', text: 'التعرّف إلى بنية المركبات الهجينة وأنظمتها عالية الجهد.' },
];

function TechnicalApproach() {
  return (
    <section className="dark-panel py-16 text-paper sm:py-20 lg:py-24" aria-labelledby="technical-approach-title">
      <div className="shell relative">
        <SectionHeading
          eyebrow="تعلّم بفهم"
          title={<span id="technical-approach-title">مهارة فنية تبدأ من السؤال الصحيح.</span>}
          description="نهج عملي يربط بين النظرية والقياس والتجربة، ويمنح المتدرب طريقة منظمة لفهم أنظمة المركبة."
          onDark
          action={<Link to="/about" className="btn-outline-light">عن الأكاديمية <ArrowLeft size={15}/></Link>}
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {learningPillars.map(({icon:Icon,title,text},index)=><Reveal key={title} delay={index*70}><article className="group h-full rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-flame-400/50 hover:bg-white/[0.07] sm:p-6"><div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-flame-500/10 text-flame-300 ring-1 ring-flame-300/15"><Icon size={20}/></span><span className="font-display text-xs font-bold tracking-[.2em] text-white/30">0{index+1}</span></div><h3 className="mt-5 font-display text-base font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-steel-400">{text}</p></article></Reveal>)}
        </div>
      </div>
    </section>
  );
}

const galleryImages = [
  { src: '/images/gallery/scanner.webp', alt: 'جهاز تشخيص إلكتروني للمركبات', caption: 'أجهزة الفحص والتشخيص', span: 'wide' },
  { src: '/images/gallery/lift.webp', alt: 'مركبة على رافعة للصيانة والفحص', caption: 'الفحص أسفل المركبة' },
  { src: '/images/workshop/practical-training.webp', alt: 'تدريب تطبيقي على أنظمة السيارات', caption: 'تدريب تطبيقي' },
  { src: '/images/gallery/tools.webp', alt: 'أدوات قياس وصيانة للسيارات', caption: 'أدوات العمل والقياس' },
];

function WorkshopGallery() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24" aria-labelledby="workshop-gallery-title">
      <div className="shell">
        <SectionHeading
          eyebrow="بيئة العمل والتعلّم"
          title={<span id="workshop-gallery-title">التقنية تُفهم عندما تراها وتجرّبها.</span>}
          description="مشاهد توضيحية من مواد المشروع لأجهزة الفحص وبيئة التدريب والأدوات المستخدمة."
          action={<Link to="/workshop" className="btn-outline-ink">استكشف خدمات الكراج <ArrowLeft size={15}/></Link>}
        />
        <Reveal className="mt-9"><GalleryLightbox images={galleryImages}/></Reveal>
        <p className="mt-4 flex items-center gap-2 text-[11px] text-steel-500"><Images size={14}/> الصور المعروضة توضيحية لبيئة تدريب السيارات.</p>
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
            كيف نساعدك في عالم السيارات؟
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-8 text-steel-300">
            أخبرنا إن كنت تبحث عن تدريب، أو مركبة، أو خدمة للكراج، أو قطعة غيار.
            فريقنا يساعدك في الوصول إلى القسم المناسب.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact" className="btn-flame">
              اطلب معلومات
              <ArrowLeft size={17} aria-hidden="true" />
            </Link>
            <Link to="/marketplace" className="btn-outline-light">
              بيع وشراء المركبات
            </Link>
          </div>
          {contact.phone && (
            <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-steel-400">
              <span>
                أو اتصل على{' '}
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="font-semibold text-paper underline decoration-flame-500 underline-offset-4"
                  dir="ltr"
                >
                  {contact.phone}
                </a>
              </span>
              {contact.whatsapp && (
                <a
                  href={toWhatsAppLink(
                    contact.whatsapp,
                    'مرحباً، أود الاستفسار عن خدمات السيارات.',
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-paper underline decoration-flame-500 underline-offset-4"
                >
                  واتساب
                </a>
              )}
              {contact.instagram && (
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-paper underline decoration-flame-500 underline-offset-4"
                >
                  انستغرام
                </a>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
