import type { DecimalLike } from '../types';

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const AR_MONTHS = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
];

const AR_MONTHS_SHORT = [
  'ك2',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'ت1',
  'ت2',
  'ك1',
];

export function toNumber(value: DecimalLike | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNumber(value: number | DecimalLike): string {
  return numberFormatter.format(typeof value === 'number' ? value : toNumber(value));
}

export function formatMoney(value: DecimalLike | null | undefined): string {
  return `${numberFormatter.format(toNumber(value))} ل.س`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ar-SY-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ar-SY-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** key بصيغة YYYY-MM */
export function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const name = AR_MONTHS[(month ?? 1) - 1] ?? key;
  return `${name} ${year}`;
}

export function formatMonthShort(key: string): string {
  const [, month] = key.split('-').map(Number);
  return AR_MONTHS_SHORT[(month ?? 1) - 1] ?? key;
}
