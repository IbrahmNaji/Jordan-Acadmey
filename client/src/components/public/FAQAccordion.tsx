import { useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import clsx from 'clsx';

export interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQAccordion({
  items,
  defaultOpen = 0,
  onDark = false,
}: {
  items: FAQItem[];
  defaultOpen?: number | null;
  onDark?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const baseId = useId();

  return (
    <div
      className={clsx(
        'divide-y',
        onDark ? 'divide-white/10' : 'divide-ink-900/10',
      )}
    >
      {items.map((item, index) => {
        const expanded = open === index;
        const buttonId = `${baseId}-button-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : index)}
                className={clsx(
                  'flex w-full items-start justify-between gap-4 py-5 text-right font-display text-[15px] font-bold transition-colors sm:text-base',
                  onDark
                    ? 'text-paper hover:text-flame-400'
                    : 'text-ink-900 hover:text-flame-600',
                )}
              >
                <span>{item.question}</span>
                <span
                  className={clsx(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                    expanded
                      ? 'border-flame-500 bg-flame-500 text-ink-950'
                      : onDark
                        ? 'border-white/20 text-steel-300'
                        : 'border-ink-900/15 text-steel-600',
                  )}
                  aria-hidden="true"
                >
                  {expanded ? <Minus size={13} /> : <Plus size={13} />}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!expanded}
              className="pb-5 pl-10 pr-0"
            >
              <p
                className={clsx(
                  'text-sm leading-8',
                  onDark ? 'text-steel-400' : 'text-steel-600',
                )}
              >
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
