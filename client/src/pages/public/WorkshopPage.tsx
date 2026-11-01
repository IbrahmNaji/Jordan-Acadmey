import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Info,
  SearchCheck,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import PageMeta from '../../components/public/PageMeta';
import PageHero from '../../components/public/PageHero';
import SectionHeading from '../../components/public/SectionHeading';
import Reveal from '../../components/public/Reveal';
import GalleryLightbox from '../../components/public/GalleryLightbox';
import { practicalPoints, site } from '../../content/site';
import BusinessRequestForm from '../../components/public/BusinessRequestForm';

const workshopServices = [
  {
    icon: ShieldCheck,
    title: 'الكفالات',
    text: 'استفسر عن الكفالات المتاحة للخدمة أو القطعة، ونوضح نطاقها وشروطها قبل اعتمادها.',
  },
  {
    icon: BadgeCheck,
    title: 'خدمات ما بعد البيع',
    text: 'متابعة استفساراتك وطلبات الدعم بعد إتمام الخدمة أو شراء القطعة، وفق ما تم الاتفاق عليه.',
  },
  {
    icon: SearchCheck,
    title: 'فحص المركبات',
    text: 'استقبال طلبات فحص المركبات وتوضيح نطاق الفحص وموعده قبل تأكيد الطلب.',
  },
  {
    icon: Wrench,
    title: 'صيانة ميكانيكية وكهربائية وهايبرد',
    text: 'استقبل طلب صيانة للأعطال الميكانيكية أو الكهربائية أو أنظمة المركبات الهجينة، ويُراجع الفريق الحالة قبل تحديد نطاق العمل.',
  },
];

const approach = [
  {
    number: '01',
    title: 'تبدأ من السؤال',
    text: 'قبل استخدام الأداة، نحدد ما الذي نبحث عنه ولماذا. الفحص بلا هدف يتحول إلى تبديل قطع.',
  },
  {
    number: '02',
    title: 'تقيس وتتحقق',
    text: 'كل خطوة مرتبطة بقياس أو ملاحظة قابلة للتحقق، حتى تصبح النتيجة قابلة للنقاش لا للتخمين.',
  },
  {
    number: '03',
    title: 'تراجع النتيجة',
    text: 'بعد كل تطبيق نعيد قراءة ما حدث، ونربط العَرَض بالسبب وبالمنظومة التي أنتجته.',
  },
];

const workshopGallery = [
  {
    src: '/images/gallery/scanner.webp',
    alt: 'جهاز فحص إلكتروني أثناء تشخيص سيارة',
    caption: 'قراءة بيانات التشخيص',
  },
  {
    src: '/images/gallery/lift.webp',
    alt: 'سيارة مرفوعة على رافعة داخل ورشة صيانة',
    caption: 'الفحص تحت السيارة',
  },
  {
    src: '/images/gallery/tools.webp',
    alt: 'أدوات ورشة سيارات مرتبة على طاولة عمل',
    caption: 'أدوات القياس والفحص',
  },
];

export default function WorkshopPage() {
  return (
    <>
      <PageMeta
        title="الكراج وبيئة التدريب"
        description="كيف يبدو التدريب العملي في الأكاديمية: فهم السؤال، القياس والتحقق، وربط النتيجة بسبب العطل."
        image="/images/workshop/workshop-wide.webp"
      />
      <PageHero
        eyebrow="الكراج"
        title="مكان يتعلّم فيه الفهم قبل الأدوات."
        description="التدريب العملي وخدمات الكراج يجمعهما الفحص والقياس والتحقق؛ ونوضح نطاق كل خدمة قبل اعتمادها."
        image="/images/workshop/workshop-wide.webp"
        breadcrumb={[{ label: 'الكراج' }]}
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/courses" className="btn-flame">
            استكشف المسارات
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          <Link to="/contact" className="btn-outline-light">
            استفسر عن الكراج
          </Link>
        </div>
      </PageHero>

      <section
        className="border-b border-ink-900/10 bg-white py-14 sm:py-18"
        aria-labelledby="workshop-services-title"
      >
        <div className="shell">
          <SectionHeading
            eyebrow="خدمات نقدمها"
            title={<span id="workshop-services-title">خدمات الكراج</span>}
            description="اطلب فحص المركبة أو استفسر عن الكفالات والصيانة الميكانيكية والكهربائية والهايبرد وخدمات ما بعد البيع."
          />
          <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {workshopServices.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="h-full border border-ink-900/10 bg-paper p-5 sm:p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center bg-flame-50 text-flame-700">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-ink-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-steel-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper py-16 lg:py-24">
        <div className="shell">
          <SectionHeading
            eyebrow="منهج التدريب العملي"
            title={
              <>
                التدريب ليس عرضاً.
                <br />
                <span className="text-steel-600">إنه قرار تتخذه بيدك.</span>
              </>
            }
            description="نقسم كل تطبيق إلى ثلاث مراحل واضحة. التكرار عليها يبني عادة تشخيصية تنفعك خارج قاعة التدريب أيضاً."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {approach.map((item, index) => (
              <Reveal key={item.number} delay={index * 80}>
                <div className="h-full border border-ink-900/10 bg-white p-6">
                  <span className="font-display text-xs font-bold tabular-nums text-flame-700">
                    {item.number}
                  </span>
                  <h2 className="mt-4 font-display text-lg font-bold text-ink-900">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-[13px] leading-7 text-steel-600">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative">
            <div
              aria-hidden="true"
              className="absolute -left-4 -top-4 h-full w-full border border-flame-500/40"
            />
            <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
              <img
                src="/images/workshop/practical-training.webp"
                alt="تدريب عملي على مكوّنات السيارة"
                loading="lazy"
                decoding="async"
                width={1600}
                height={1200}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-3 text-[11px] text-steel-600">صورة توضيحية.</p>
          </Reveal>

          <div>
            <p className="eyebrow">ما تتدرب عليه</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.3] text-ink-900 sm:text-4xl">
              مهارة تُبنى بالتكرار،
              <br />
              <span className="text-steel-600">لا بالمشاهدة.</span>
            </h2>
            <p className="mt-5 text-[14px] leading-8 text-steel-600">
              التطبيق يبدأ بسيطاً ثم يزداد عمقاً. تتعامل مع مكوّنات السيارة،
              تقرأ القياسات، وتناقش الاحتمالات قبل أن تصل إلى القرار.
            </p>
            <ul className="mt-6 space-y-3.5">
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
            <div className="mt-8 flex items-start gap-3 border border-ink-900/10 bg-paper p-4">
              <Wrench
                size={18}
                className="mt-0.5 shrink-0 text-flame-700"
                aria-hidden="true"
              />
              <p className="text-[12px] leading-7 text-steel-600">
                تفاصيل الأدوات والمواعيد تختلف حسب المسار والدفعة. اطلب
                المعلومات الحالية عند التواصل بدل الاعتماد على أرقام غير مؤكدة.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink-900 py-16 text-paper lg:py-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-grid-dark opacity-30"
          style={{ backgroundSize: '56px 56px' }}
        />
        <div className="shell relative">
          <div className="grid items-start gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-flame-400">السلامة</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-[1.3] sm:text-4xl">
                السلامة ليست ملاحظة جانبية.
              </h2>
              <p className="mt-5 text-[14px] leading-8 text-steel-400">
                التعامل مع أنظمة السيارة، وخصوصاً الهايبرد، يتطلب احترام
                إجراءات محددة. نعلّم ما يجب فعله، وما يجب التوقف عنده، قبل أي
                تطبيق عملي.
              </p>
            </div>
            <div className="lg:col-span-7">
              <div className="border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center bg-flame-500 text-white">
                    <ShieldCheck size={20} aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-bold">
                    قبل التعامل مع أي منظومة
                  </h3>
                </div>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    'فهم المنظومة ومخاطرها قبل لمسها',
                    'استخدام أدوات الحماية المناسبة',
                    'عدم تجاوز خطوات العزل أو الفحص',
                    'السؤال عند عدم التأكد بدل التجربة',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 border border-white/10 p-3 text-[12px] leading-6 text-steel-300"
                    >
                      <Check
                        size={13}
                        className="mt-1 shrink-0 text-flame-300"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/courses/hybrid"
                  className="mt-5 inline-flex items-center gap-2 font-display text-xs font-bold text-flame-400 transition-colors hover:text-flame-300"
                >
                  اطّلع على مسار الهايبرد
                  <ArrowLeft size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper py-16 lg:py-24">
        <div className="shell">
          <SectionHeading
            eyebrow="لقطات من بيئة التدريب"
            title="تفاصيل تصنع سياق التدريب العملي."
            description="أدوات، رافعة، وجهاز فحص. الصور توضيحية لبيئة تدريب السيارات وليست للمنشأة الفعلية."
            action={
              <Link
                to="/contact"
                className="hidden items-center gap-2 border-b border-ink-900/30 pb-1 font-display text-xs font-bold text-ink-900 transition-colors hover:border-flame-500 hover:text-flame-700 sm:inline-flex"
              >
                اسأل عن الكراج
                <ArrowLeft size={15} aria-hidden="true" />
              </Link>
            }
          />
          <Reveal className="mt-8">
            <GalleryLightbox images={workshopGallery} />
          </Reveal>
          <p className="mt-5 flex items-start gap-2 text-[11px] leading-6 text-steel-600">
            <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            {site.imagesNotice}
          </p>
        </div>
      </section>

      <section className="border-t border-ink-900/10 bg-white py-14">
        <div className="shell flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink-900">
              هل تريد رؤية الطريقة قبل القرار؟
            </h2>
            <p className="mt-1 text-[13px] leading-7 text-steel-600">
              أرسل استفسارك واسأل عن تفاصيل التدريب والدفعة القادمة.
            </p>
          </div>
          <Link to="/contact" className="btn-flame shrink-0">
            اطلب معلومات
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <BusinessRequestForm kind="workshop" />
    </>
  );
}
