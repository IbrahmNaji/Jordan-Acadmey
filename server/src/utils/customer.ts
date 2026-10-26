import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface PersonInput {
  fullName: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
}

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Creates a customer from intake data. Deliberately never matches against
 * existing customers: records are only merged through an explicit,
 * reviewed action so similar names are never treated as the same person.
 */
export async function createCustomerForPerson(
  input: PersonInput,
  db: Db,
) {
  const phone = input.phone?.trim() || null;
  const whatsapp = input.whatsapp?.trim() || null;
  const email = input.email?.trim().toLowerCase() || null;

  const contacts: Array<{
    type: 'PHONE' | 'WHATSAPP' | 'EMAIL';
    value: string;
    isPrimary: boolean;
  }> = [];
  if (phone) contacts.push({ type: 'PHONE', value: phone, isPrimary: true });
  if (whatsapp && whatsapp !== phone) {
    contacts.push({ type: 'WHATSAPP', value: whatsapp, isPrimary: !phone });
  }
  if (email) contacts.push({ type: 'EMAIL', value: email, isPrimary: false });

  return db.customer.create({
    data: {
      fullName: input.fullName.trim(),
      phone,
      email,
      city: input.city?.trim() || null,
      contacts: { create: contacts },
    },
  });
}
