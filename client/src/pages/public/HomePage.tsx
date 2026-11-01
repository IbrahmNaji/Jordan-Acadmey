import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Car,
  Check,
  ChevronDown,
  Package,
  Wrench,
} from 'lucide-react';
import PageMeta from '../../components/public/PageMeta';
import SectionHeading from '../../components/public/SectionHeading';
import { contact, site, toWhatsAppLink } from '../../content/site';

const companyLines = [
  {
    icon: BookOpen,
    href: '/courses',
    title: 'الأكاديمية',
    status: 'متاح',
    text: 'تصفح المسارات التدريبية واطلب معلومات عن الدورات والدفعات.',
  },
  {
    icon: Car,
    href: '/marketplace',
    title: 'بيع وشراء المركبات',
    status: 'عروض واستفسارات',
    text: 'تصفح المركبات المتاحة أو تواصل معنا لعرض مركبتك للبيع.',
  },
  {
    icon: Wrench,
    href: '/workshop',
    title: 'الكراج',
    status: 'خدمات الكراج',
    text: 'استفسر عن الفحص والصيانة والخدمات الفنية للمركبات.',
  },
  {
    icon: Package,
    href: '/spare-parts',
    title: 'قطع الغيار',
    status: 'طلبات قطع الغيار',
    text: 'اطلب القطعة المناسبة واستفسر عن توفرها وسعرها.',
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
          {companyLines.map(({ icon: Icon, href, title, status, text }) => (
            <Link
              key={href}
              to={href}
              className="group flex h-full flex-col border border-ink-900/10 bg-paper p-5 transition duration-200 hover:-translate-y-1 hover:border-flame-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flame-500"
            >
              <span className="flex h-11 w-11 items-center justify-center bg-flame-50 text-flame-700">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold text-ink-900">
                {title}
              </h3>
              <p className="mt-2 min-h-10 text-[11px] font-semibold text-flame-700">
                {status}
              </p>
              <p className="mt-1 flex-1 text-[12px] leading-6 text-steel-600">
                {text}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 font-display text-xs font-bold text-ink-900 transition-colors group-hover:text-flame-700">
                التفاصيل <ArrowLeft size={14} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <PageMeta
        title={site.name}
        description={site.description}
        image="/images/hero/hero-workshop.webp"
      />
      <Hero />
      <BusinessLinesSection />
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
            الأكاديمية · المركبات · الكراج · قطع الغيار
          </p>

          <h1 className="mt-6 animate-fade-up font-display text-[clamp(2.7rem,6.4vw,4.8rem)] font-black leading-[1.1] [animation-delay:120ms]">
            كل ما تحتاجه
            <br />
            <span className="text-flame-500">في عالم السيارات.</span>
          </h1>

          <p className="mt-6 max-w-xl animate-fade-up text-[15px] leading-8 text-steel-300 [animation-delay:240ms] sm:text-base">
            تدريب مهني، بيع وشراء مركبات، خدمات الكراج، وقطع غيار. أربعة أقسام
            متكاملة تحت منصة واحدة، اختر منها ما تبحث عنه.
          </p>

          <div className="mt-9 flex animate-fade-up flex-wrap gap-3 [animation-delay:360ms]">
            <a href="#business-lines" className="btn-flame">
              استكشف أقسامنا
              <ArrowLeft size={17} aria-hidden="true" />
            </a>
            <Link to="/contact" className="btn-outline-light">
              تحدث معنا
            </Link>
          </div>

          <ul className="mt-12 flex animate-fade-up flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/10 pt-6 text-[12px] text-steel-300 [animation-delay:480ms]">
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
