import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import clsx from 'clsx';

export interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
  span?: string;
}

const spanClass: Record<string, string> = {
  wide: 'col-span-2',
  tall: 'row-span-2',
  normal: '',
};

export default function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(
    () => setIndex((current) => (current === null ? 0 : (current + 1) % images.length)),
    [images.length],
  );
  const previous = useCallback(
    () =>
      setIndex((current) =>
        current === null
          ? 0
          : (current - 1 + images.length) % images.length,
      ),
    [images.length],
  );

  useEffect(() => {
    if (index === null) return;
    document.body.classList.add('is-locked');
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') next();
      if (event.key === 'ArrowRight') previous();
      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onKeyDown);
      openerRef.current?.focus();
    };
  }, [index, close, next, previous]);

  const current = index === null ? null : images[index];

  return (
    <>
      <div
        className={clsx(
          'grid auto-rows-[150px] grid-flow-dense grid-cols-2 gap-3 sm:auto-rows-[190px] sm:gap-4',
          images.length % 4 === 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
        )}
      >
        {images.map((image, imageIndex) => (
          <button
            key={image.src}
            type="button"
            onClick={(event) => {
              openerRef.current = event.currentTarget;
              setIndex(imageIndex);
            }}
            aria-label={`عرض الصورة: ${image.caption}`}
            className={clsx(
              'group relative overflow-hidden bg-ink-800 text-right focus-visible:ring-2 focus-visible:ring-flame-500 focus-visible:ring-offset-2',
              spanClass[image.span ?? 'normal'],
            )}
          >
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              decoding="async"
              width={1400}
              height={1000}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-transparent"
            />
            <span className="absolute bottom-0 right-0 left-0 flex items-center justify-between gap-2 p-3 text-[11px] font-medium text-paper sm:p-4 sm:text-xs">
              {image.caption}
              <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-white/30 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                <ChevronLeft size={13} aria-hidden="true" />
              </span>
            </span>
          </button>
        ))}
      </div>

      {current &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="معرض الصور"
            className="fixed inset-0 z-[70] flex flex-col bg-ink-950/95 backdrop-blur-sm"
            onClick={close}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <p className="text-xs tabular-nums text-steel-300" aria-live="polite">
                {(index ?? 0) + 1} / {images.length}
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="إغلاق معرض الصور"
                className="flex h-10 w-10 items-center justify-center border border-white/20 text-paper transition hover:border-flame-500 hover:text-flame-400"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div
              className="relative flex min-h-0 flex-1 items-center justify-center p-4 sm:p-10"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={next}
                aria-label="الصورة التالية"
                className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center border border-white/20 bg-ink-950/60 text-paper transition hover:border-flame-500 hover:text-flame-400 sm:right-6"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>

              <figure className="flex max-h-full max-w-5xl flex-col items-center">
                <img
                  src={current.src}
                  alt={current.alt}
                  className="max-h-[65vh] w-auto max-w-full object-contain sm:max-h-[72vh]"
                />
                <figcaption className="mt-4 text-center text-xs text-steel-300">
                  {current.caption}
                </figcaption>
              </figure>

              <button
                type="button"
                onClick={previous}
                aria-label="الصورة السابقة"
                className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center border border-white/20 bg-ink-950/60 text-paper transition hover:border-flame-500 hover:text-flame-400 sm:left-6"
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
