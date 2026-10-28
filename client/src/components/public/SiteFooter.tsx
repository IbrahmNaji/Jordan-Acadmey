import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  MapPin,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import BrandMark from './BrandMark';
import {
  contact,
  mainNavigation,
  site,
  toWhatsAppLink,
  tracks,
} from '../../content/site';

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const hasDirectContact = Boolean(
    contact.phone || contact.email || contact.whatsapp,
  );

  return (
    <footer className="relative overflow-hidden bg-ink-950 text-paper">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-grid-dark opacity-25"
        style={{ backgroundSize: '56px 56px' }}
      />
      <div className="shell relative">
        <div className="grid gap-12 py-14 lg:grid-cols-12 lg:gap-8 lg:py-16">
          <div className="lg:col-span-5">
            <BrandMark onDark />
            <p className="mt-6 max-w-md text-sm leading-8 text-steel-400">
              {site.description}
            </p>
            <a
              href={site.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-xs text-steel-400 transition-colors hover:text-paper"
            >
              <MapPin size={14} className="text-flame-500" aria-hidden="true" />
              {site.location}
            </a>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.12em] text-steel-500">
              الموقع
            </h2>
            <ul className="mt-5 space-y-3">
              {mainNavigation.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-[13px] text-steel-300 transition-colors hover:text-flame-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.12em] text-steel-500">
              المسارات
            </h2>
            <ul className="mt-5 space-y-3">
              {tracks.map((track) => (
                <li key={track.slug}>
                  <Link
                    to={`/courses/${track.slug}`}
                    className="text-[13px] text-steel-300 transition-colors hover:text-flame-400"
                  >
                    {track.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.12em] text-steel-500">
              تواصل معنا
            </h2>
            <div className="mt-5 space-y-3">
              {contact.phone && (
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2 text-[13px] text-steel-300 transition-colors hover:text-flame-400"
                >
                  <Phone size={14} className="text-flame-500" aria-hidden="true" />
                  <span dir="ltr" className="tabular-nums">
                    {contact.phone}
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
                  className="flex items-center gap-2 text-[13px] text-steel-300 transition-colors hover:text-flame-400"
                >
                  <MessageCircle
                    size={14}
                    className="text-flame-500"
                    aria-hidden="true"
                  />
                  واتساب الأكاديمية
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 text-[13px] text-steel-300 transition-colors hover:text-flame-400"
                >
                  <Mail size={14} className="text-flame-500" aria-hidden="true" />
                  <span dir="ltr">{contact.email}</span>
                </a>
              )}
              {contact.instagram && (
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-[13px] text-steel-300 transition-colors hover:text-flame-400"
                >
                  <Camera
                    size={14}
                    className="text-flame-500"
                    aria-hidden="true"
                  />
                  <span>انستغرام</span>
                  <span dir="ltr">@academicjordan</span>
                </a>
              )}
              {!hasDirectContact && (
                <p className="text-[13px] leading-7 text-steel-400">
                  أرسل استفسارك عبر النموذج، واختر طريقة التواصل التي تناسبك.
                </p>
              )}
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 pt-1 font-display text-xs font-bold text-paper transition-colors hover:text-flame-400"
              >
                نموذج التواصل
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col gap-4 text-[11px] text-steel-500 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p>
                © {year} {site.name}. جميع الحقوق محفوظة.
              </p>
              <p className="flex items-start gap-1.5 leading-6">
                <ShieldCheck
                  size={12}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {site.imagesNotice}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link to="/privacy" className="transition-colors hover:text-paper">
                سياسة الخصوصية
              </Link>
              <Link to="/terms" className="transition-colors hover:text-paper">
                شروط الاستخدام
              </Link>
              <Link
                to="/admin/login"
                className="text-steel-400 transition-colors hover:text-flame-400"
              >
                دخول الإدارة
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
