import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import PageMeta from '../../components/public/PageMeta';
import PageHero from '../../components/public/PageHero';
import InquiryForm from '../../components/public/InquiryForm';
import { contact, site, toWhatsAppLink } from '../../content/site';

export default function ContactPage() {
  const hasDirectContact = Boolean(
    contact.phone || contact.whatsapp || contact.email,
  );

  return (
    <>
      <PageMeta
        title="تواصل معنا"
        description="أرسل استفسارك عن دورات الأكاديمية، واختر طريقة التواصل التي تناسبك: هاتف أو واتساب أو بريد إلكتروني."
        image="/images/workshop/practical-training.webp"
      />
      <PageHero
        compact
        eyebrow="تواصل معنا"
        title="سؤالك يستحق إجابة واضحة."
        description="أخبرنا بالمسار الذي يهمك وطريقة التواصل المناسبة لك. سنعود إليك بالتفاصيل المتاحة، دون التزام منك."
        breadcrumb={[{ label: 'تواصل معنا' }]}
      />

      <section className="bg-paper py-14 lg:py-20">
        <div className="shell grid gap-8 lg:grid-cols-12 lg:gap-10">
          <aside className="lg:col-span-5">
            <div className="relative overflow-hidden bg-ink-900 p-6 text-paper sm:p-8">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-grid-dark opacity-30"
                style={{ backgroundSize: '48px 48px' }}
              />
              <div className="relative">
                <p className="eyebrow text-flame-400">بيانات التواصل</p>
                <h2 className="mt-3 font-display text-2xl font-extrabold leading-9">
                  نستقبل استفسارك
                  <br />
                  بالطريقة التي تفضلها.
                </h2>
                <p className="mt-4 text-[13px] leading-7 text-steel-400">
                  إن كانت وسيلة تواصل مباشرة متاحة، ستجدها أدناه. وإلا فاستخدم
                  النموذج، وسنعتمد على الطريقة التي تختارها للرد.
                </p>

                <div className="mt-7 space-y-3">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-3 border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-flame-500/60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-flame-500 text-ink-950">
                        <Phone size={16} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-[11px] text-steel-500">
                          الهاتف
                        </span>
                        <span
                          dir="ltr"
                          className="mt-0.5 block text-sm font-semibold tabular-nums"
                        >
                          {contact.phone}
                        </span>
                      </span>
                    </a>
                  )}

                  {contact.whatsapp && (
                    <a
                      href={toWhatsAppLink(
                        contact.whatsapp,
                        'مرحباً، أرغب بالاستفسار عن دورات الأكاديمية.',
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-flame-500/60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-flame-500 text-ink-950">
                        <MessageCircle size={16} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-[11px] text-steel-500">
                          واتساب
                        </span>
                        <span
                          dir="ltr"
                          className="mt-0.5 block text-sm font-semibold tabular-nums"
                        >
                          {contact.whatsapp}
                        </span>
                      </span>
                    </a>
                  )}

                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-3 border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-flame-500/60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-flame-500 text-ink-950">
                        <Mail size={16} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] text-steel-500">
                          البريد الإلكتروني
                        </span>
                        <span
                          dir="ltr"
                          className="mt-0.5 block truncate text-sm font-semibold"
                        >
                          {contact.email}
                        </span>
                      </span>
                    </a>
                  )}

                  <div className="flex items-center gap-3 border border-white/10 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/15 text-flame-400">
                      <MapPin size={16} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-[11px] text-steel-500">
                        الموقع
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold">
                        {site.location}
                      </span>
                    </span>
                  </div>
                </div>

                {!hasDirectContact && (
                  <p className="mt-4 border border-white/10 bg-white/[0.03] p-3.5 text-[11px] leading-6 text-steel-400">
                    لم تُضف أرقام تواصل مباشرة إلى الموقع بعد. أرسل النموذج
                    وسيتواصل معك الفريق بالطريقة التي تختارها.
                  </p>
                )}

                <div className="mt-6 flex items-start gap-2.5 border-t border-white/10 pt-5 text-[11px] leading-6 text-steel-500">
                  <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-flame-500"
                    aria-hidden="true"
                  />
                  بياناتك تُستخدم للتواصل بخصوص استفسارك فقط. اطّلع على{' '}
                  <Link
                    to="/privacy"
                    className="text-steel-300 underline underline-offset-4 hover:text-paper"
                  >
                    سياسة الخصوصية
                  </Link>
                  .
                </div>
              </div>
            </div>

            <div className="mt-4 border border-ink-900/10 bg-white p-5">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-flame-700" aria-hidden="true" />
                <h2 className="font-display text-sm font-bold text-ink-900">
                  قبل أن ترسل
                </h2>
              </div>
              <ul className="mt-3 space-y-2 text-[12px] leading-6 text-steel-600">
                <li>اذكر خبرتك السابقة إن وجدت، فهي تساعد في تحديد البداية.</li>
                <li>
                  حدّد طريقة التواصل المفضلة بدقة حتى يصلك الرد بالشكل المناسب.
                </li>
                <li>تفاصيل المواعيد والرسوم تُؤكَّد عند التواصل.</li>
              </ul>
            </div>
          </aside>

          <div className="lg:col-span-7">
            <InquiryForm />
          </div>
        </div>
      </section>

      <section className="border-t border-ink-900/10 bg-white py-10">
        <div className="shell flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-base font-bold text-ink-900">
              لديك سؤال سريع قبل التواصل؟
            </h2>
            <p className="mt-1 text-[12px] leading-6 text-steel-600">
              قد تجد الجواب في صفحة الأسئلة الشائعة.
            </p>
          </div>
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 border border-ink-900/15 px-4 py-2.5 font-display text-xs font-bold text-ink-900 transition-colors hover:border-flame-500 hover:text-flame-700"
          >
            الأسئلة الشائعة
            <ArrowLeft size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
