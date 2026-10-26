import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Phone } from 'lucide-react';
import PageMeta from '../../components/public/PageMeta';
import PageHero from '../../components/public/PageHero';
import FAQAccordion from '../../components/public/FAQAccordion';
import {
  contact,
  faqs,
  site,
  toWhatsAppLink,
} from '../../content/site';

export default function FaqPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <PageMeta
        title="الأسئلة الشائعة"
        description="إجابات عن أسئلة الخبرة السابقة، التدريب العملي، المواعيد والرسوم، الشهادات، والموقع في دمشق."
      />
      <PageHero
        compact
        eyebrow="الأسئلة الشائعة"
        title="إجابات واضحة، قبل أي قرار."
        description="جمعنا أكثر ما يُسأل عنه. إن لم تجد إجابتك، أرسل سؤالك وسنوضح التفاصيل التي تخص حالتك."
        breadcrumb={[{ label: 'الأسئلة الشائعة' }]}
      />

      <section className="bg-paper py-14 lg:py-20">
        <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-8">
            <div className="border border-ink-900/10 bg-white px-6 py-2 sm:px-8">
              <FAQAccordion items={faqs} defaultOpen={0} />
            </div>
            <p className="mt-4 text-[11px] leading-6 text-steel-600">
              {site.imagesNotice}
            </p>
          </div>

          <aside className="lg:col-span-4">
            <div className="relative overflow-hidden bg-ink-900 p-6 text-paper sm:p-7 lg:sticky lg:top-28">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-grid-dark opacity-30"
                style={{ backgroundSize: '48px 48px' }}
              />
              <div className="relative">
                <p className="eyebrow text-flame-400">لم تجد الإجابة؟</p>
                <h2 className="mt-3 font-display text-xl font-extrabold leading-8">
                  اسأل عن حالتك تحديداً.
                </h2>
                <p className="mt-3 text-[12px] leading-7 text-steel-400">
                  الخبرة السابقة والمسار الذي تريده يغيّران الإجابة. أرسل
                  تفاصيلك وسنعود إليك بما يناسبك.
                </p>
                <Link to="/contact" className="btn-flame mt-5 w-full">
                  أرسل استفسارك
                  <ArrowLeft size={15} aria-hidden="true" />
                </Link>

                {(contact.phone || contact.whatsapp || contact.email) && (
                  <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-2 text-xs text-steel-300 transition-colors hover:text-paper"
                      >
                        <Phone
                          size={13}
                          className="text-flame-500"
                          aria-hidden="true"
                        />
                        <span dir="ltr">{contact.phone}</span>
                      </a>
                    )}
                    {contact.whatsapp && (
                      <a
                        href={toWhatsAppLink(
                          contact.whatsapp,
                          'مرحباً، لدي سؤال عن دورات الأكاديمية.',
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-steel-300 transition-colors hover:text-paper"
                      >
                        <MessageCircle
                          size={13}
                          className="text-flame-500"
                          aria-hidden="true"
                        />
                        واتساب
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-xs text-steel-300 transition-colors hover:text-paper"
                      >
                        <Mail
                          size={13}
                          className="text-flame-500"
                          aria-hidden="true"
                        />
                        <span dir="ltr">{contact.email}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
