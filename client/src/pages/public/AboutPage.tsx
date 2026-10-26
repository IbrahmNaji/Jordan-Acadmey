import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Quote } from 'lucide-react';
import PageMeta from '../../components/public/PageMeta';
import PageHero from '../../components/public/PageHero';
import SectionHeading from '../../components/public/SectionHeading';
import Reveal from '../../components/public/Reveal';
import { aboutValues, site, tracks } from '../../content/site';

export default function AboutPage() {
  return (
    <>
      <PageMeta
        title="عن الأكاديمية"
        description="أكاديمية تدريب سيارات في دمشق، تجمع بين فهم المبدأ والتطبيق العملي في الميكانيك والكهرباء والتشخيص والهايبرد."
        image="/images/workshop/practical-training.webp"
      />
      <PageHero
        eyebrow="عن الأكاديمية"
        title="أكاديمية تبدأ من الورشة."
        description="نعلّم ميكانيك السيارات وكهرباءها وتشخيص أعطالها وأنظمة الهايبرد، بمنهج يضع الفهم والتطبيق قبل الحفظ."
        image="/images/workshop/practical-training.webp"
        breadcrumb={[{ label: 'عن الأكاديمية' }]}
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/courses" className="btn-flame">
            تعرّف على المسارات
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          <Link to="/contact" className="btn-outline-light">
            تواصل معنا
          </Link>
        </div>
      </PageHero>

      <section className="bg-paper py-16 lg:py-24">
        <div className="shell grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow">الفكرة التي نبني عليها</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.3] text-ink-900 sm:text-4xl">
              السيارة منظومة مترابطة.
              <br />
              <span className="text-steel-600">لذلك نعلّمها كمنظومة.</span>
            </h2>
            <div className="mt-6 space-y-4 text-[15px] leading-8 text-steel-600">
              <p>
                كثير من التدريب يقدّم السيارة كخطوات منفصلة: قطعة، إجراء،
                ونتيجة محفوظة. لكن العطل الحقيقي لا يحترم هذه الحدود؛ يظهر في
                نظام وينتج عن سبب في نظام آخر.
              </p>
              <p>
                في الأكاديمية نبدأ من المبدأ: كيف تعمل المنظومة؟ ما الذي
                تقيسه؟ ولماذا؟ ثم ننتقل إلى التطبيق والفحص. هدفنا أن يفهم
                المتدرب سبب كل خطوة، لا أن يكررها فقط.
              </p>
              <p>
                لهذا تتوزع مساراتنا على أربع منظومات أساسية: الميكانيك،
                الكهرباء، التشخيص، والهايبرد. يمكنك اختيار مسار واحد أو بناء
                مسار أوسع حسب هدفك وخبرتك.
              </p>
            </div>
          </div>

          <Reveal className="lg:col-span-5">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -right-4 -top-4 h-full w-full border border-flame-500/40"
              />
              <div className="relative aspect-[4/5] overflow-hidden bg-ink-800">
                <img
                  src="/images/workshop/workshop-wide.webp"
                  alt="بيئة تدريب سيارات داخل ورشة"
                  loading="lazy"
                  decoding="async"
                  width={1920}
                  height={1280}
                  className="h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent"
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-steel-600">
              صورة توضيحية لبيئة تدريب سيارات.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink-900 py-16 text-paper lg:py-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-grid-dark opacity-30"
          style={{ backgroundSize: '56px 56px' }}
        />
        <div className="shell relative">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-flame-400">ما نحاول الالتزام به</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-[1.3] sm:text-4xl">
                ثلاثة مبادئ
                <br />
                <span className="text-steel-400">لا تتنازل عنها الورشة.</span>
              </h2>
            </div>
            <div className="lg:col-span-7">
              <div className="space-y-px border-y border-white/10">
                {aboutValues.map((value, index) => (
                  <Reveal key={value.title} delay={index * 70}>
                    <div className="grid gap-3 border-b border-white/10 py-6 sm:grid-cols-12 sm:gap-6 last:border-b-0">
                      <span className="font-display text-xs font-bold tabular-nums text-flame-500 sm:col-span-1">
                        0{index + 1}
                      </span>
                      <h3 className="font-display text-lg font-bold sm:col-span-3">
                        {value.title}
                      </h3>
                      <p className="text-[13px] leading-7 text-steel-400 sm:col-span-8">
                        {value.text}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="shell grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow">الموقع والمسارات</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.3] text-ink-900 sm:text-4xl">
              في دمشق،
              <br />
              <span className="text-steel-600">وحول السيارة.</span>
            </h2>
            <p className="mt-5 max-w-xl text-[14px] leading-8 text-steel-600">
              تقع الأكاديمية في دمشق، سوريا، وتقدّم مسارات في أربع منظومات.
              للتفاصيل الدقيقة حول الموقع أو الدفعة القادمة، تواصل معنا وسنوضح
              المتاح.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 border border-ink-900/10 bg-paper px-4 py-2 text-xs text-ink-800">
              <MapPin size={14} className="text-flame-700" aria-hidden="true" />
              {site.location}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {tracks.map((track) => (
                <Link
                  key={track.slug}
                  to={`/courses/${track.slug}`}
                  className="inline-flex items-center gap-1.5 border border-ink-900/15 px-3 py-2 text-[11px] font-semibold text-ink-800 transition-colors hover:border-flame-500 hover:text-flame-700"
                >
                  {track.title}
                </Link>
              ))}
            </div>

            <div className="mt-8">
              <Link to="/contact" className="btn-flame">
                ابدأ الحوار
                <ArrowLeft size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative border border-ink-900/10 bg-paper p-7 sm:p-9">
              <Quote
                size={34}
                className="text-flame-500"
                aria-hidden="true"
              />
              <blockquote className="mt-5 font-display text-xl font-bold leading-9 text-ink-900">
                «التدريب الجيد يترك عندك طريقة للتفكير، لا قائمة خطوات تحفظها.»
              </blockquote>
              <p className="mt-5 border-t border-ink-900/10 pt-4 text-[11px] leading-6 text-steel-600">
                مبدأ نعتمده في بناء المسارات وطريقة التدريب.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper py-14">
        <div className="shell">
          <SectionHeading
            eyebrow="هل لديك سؤال؟"
            title="لا تحتاج قراراً كاملاً لتبدأ."
            description="أرسل استفسارك ببيانات بسيطة، وسنناقش معك نقطة البداية والمسار الأنسب."
            action={
              <Link to="/contact" className="btn-flame">
                تواصل مع الأكاديمية
                <ArrowLeft size={16} aria-hidden="true" />
              </Link>
            }
          />
        </div>
      </section>
    </>
  );
}
