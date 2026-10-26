import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../middleware/errorHandler';

export const MONEY_MAX = 1_000_000_000;

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'المعرّف يجب أن يحتوي أحرفاً لاتينية صغيرة وأرقاماً وشرطات فقط',
  );

export const courseTypeEnum = z.enum([
  'MECHANICS',
  'ELECTRICAL',
  'DIAGNOSTICS',
  'HYBRID',
]);

export const courseStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const deliveryModeEnum = z.enum(['ONSITE', 'ONLINE', 'HYBRID']);
export const batchStatusEnum = z.enum([
  'PLANNED',
  'OPEN',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
]);

export function entityId(raw: unknown, notFoundCode: string) {
  const parsed = z.string().uuid().safeParse(raw);
  if (!parsed.success) throw new AppError(404, notFoundCode);
  return parsed.data;
}

export function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/** Parses a YYYY-MM-DD value as a UTC date, rejecting impossible dates. */
export function parseDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError(400, 'INVALID_DATE');
  }
  return date;
}
