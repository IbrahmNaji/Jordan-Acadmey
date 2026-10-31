import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';

export class AdminBootstrapConflictError extends Error {
  constructor() {
    super('Admin bootstrap is no longer available.');
    this.name = 'AdminBootstrapConflictError';
  }
}

export async function createAdminInEmptyDatabase(
  tx: Prisma.TransactionClient,
  email: string,
  passwordHash: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await tx.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existingUser) throw new AdminBootstrapConflictError();

  const userCount = await tx.user.count();
  if (userCount !== 0) throw new AdminBootstrapConflictError();

  return tx.user.create({
    data: {
      email: normalizedEmail,
      fullName: 'مدير النظام',
      role: 'ADMIN',
      passwordHash,
    },
    select: { email: true, role: true },
  });
}

export async function bootstrapAdminAccount(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    return await prisma.$transaction(
      (tx) => createAdminInEmptyDatabase(tx, email, passwordHash),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof AdminBootstrapConflictError) throw error;

    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined;
    if (code === 'P2002' || code === 'P2034') {
      throw new AdminBootstrapConflictError();
    }
    throw error;
  }
}
