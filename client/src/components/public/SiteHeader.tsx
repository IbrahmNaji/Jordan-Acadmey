import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import BrandMark from './BrandMark';
import {
  contact,
  mainNavigation,
  site,
  toWhatsAppLink,
} from '../../content/site';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('is-locked');
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <>
      <div className="hidden border-b border-white/10 bg-ink-950 md:block">
        <div className="shell flex h-9 items-center justify-between text-[11px] text-steel-400">
          <div className="flex items-center gap-5">
            <a
              href={site.mapUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`افتح موقعنا على الخريطة: ${site.location}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-paper"
            >
              <MapPin size={12} aria-hidden="true" className="text-flame-300" />
              {site.location}
            </a>
            {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-paper"
              >
                <Phone size={12} aria-hidden="true" className="text-flame-300" />
                <span dir="ltr" className="tabular-nums">
                  {contact.phone}
                </span>
              </a>
            )}
            {contact.instagram && (
              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="إنستغرام الأكاديمية"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-paper"
              >
                <Camera
                  size={12}
                  aria-hidden="true"
                  className="text-flame-300"
                />
                <span dir="ltr">@academicjordan</span>
              </a>
            )}
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-paper"
          >
            استفسارات عن خدماتنا
            <ArrowLeft size={12} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/95 backdrop-blur-md">
        <div className="shell flex h-[72px] items-center justify-between gap-4">
          <Link to="/" aria-label={`${site.name} — الصفحة الرئيسية`}>
            <BrandMark onDark />
          </Link>

          <nav
            aria-label="التنقل الرئيسي"
            className="hidden items-center gap-0.5 lg:flex"
          >
            {mainNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'relative px-3 py-2 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'text-paper'
                      : 'text-steel-300 hover:text-paper',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={clsx(
                        'absolute bottom-0 right-3 left-3 h-[2px] origin-right bg-flame-500 transition-transform duration-300',
                        isActive ? 'scale-x-100' : 'scale-x-0',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/contact"
              className="hidden min-h-[42px] items-center gap-2 border border-flame-500 bg-flame-500 px-5 font-display text-xs font-bold text-white transition-colors hover:bg-transparent hover:text-flame-400 sm:inline-flex"
            >
              تواصل معنا
              <ArrowLeft size={14} aria-hidden="true" />
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="public-mobile-navigation"
              aria-label="فتح قائمة التنقل"
              className="flex h-11 w-11 items-center justify-center border border-white/15 text-paper transition-colors hover:border-flame-500 hover:text-flame-400 lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          id="public-mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="قائمة التنقل"
          className="fixed inset-0 z-50 flex flex-col bg-ink-950 lg:hidden"
        >
          <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
            <Link
              to="/"
              onClick={closeMenu}
              aria-label={`${site.name} — الصفحة الرئيسية`}
            >
              <BrandMark onDark />
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeMenu}
              aria-label="إغلاق قائمة التنقل"
              className="flex h-11 w-11 items-center justify-center border border-white/15 text-paper transition-colors hover:border-flame-500 hover:text-flame-400"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
            <nav aria-label="التنقل الرئيسي للجوال">
              <ul className="space-y-1">
                {mainNavigation.map((item, index) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center justify-between border-b border-white/[0.07] py-4 font-display text-lg font-bold transition-colors',
                          isActive
                            ? 'text-flame-400'
                            : 'text-paper hover:text-flame-400',
                        )
                      }
                    >
                      <span>{item.label}</span>
                      <span
                        aria-hidden="true"
                        className="font-sans text-[10px] font-medium tracking-widest text-steel-600"
                      >
                        0{index + 1}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-10 space-y-3 text-sm text-steel-300">
              <a
                href={site.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-paper"
              >
                <MapPin size={15} className="text-flame-300" aria-hidden="true" />
                {site.location}
              </a>
              {contact.phone && (
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2 transition-colors hover:text-paper"
                >
                  <Phone size={15} className="text-flame-300" aria-hidden="true" />
                  <span dir="ltr" className="tabular-nums">
                    {contact.phone}
                  </span>
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 transition-colors hover:text-paper"
                >
                  <Mail size={15} className="text-flame-300" aria-hidden="true" />
                  <span dir="ltr">{contact.email}</span>
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
                  className="flex items-center gap-2 transition-colors hover:text-paper"
                >
                  <MessageCircle
                    size={15}
                    className="text-flame-300"
                    aria-hidden="true"
                  />
                  واتساب
                </a>
              )}
              {contact.instagram && (
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-paper"
                >
                  <Camera
                    size={15}
                    className="text-flame-300"
                    aria-hidden="true"
                  />
                  <span>انستغرام</span>
                  <span dir="ltr" className="tabular-nums">
                    @academicjordan
                  </span>
                </a>
              )}
              {!contact.phone && !contact.email && !contact.whatsapp && (
                <p className="text-xs leading-6 text-steel-500">
                  نستقبل استفساراتك عبر نموذج التواصل، وسيتم الرد عليك وفقاً
                  لطريقة التواصل التي تختارها.
                </p>
              )}
            </div>

            <Link
              to="/contact"
              onClick={closeMenu}
              className="btn-flame mt-8 w-full"
            >
              اطلب استشارة
              <ArrowLeft size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
