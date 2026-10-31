// Interactive local/DBA utility: resets an ADMIN password.
// The password is read with echo disabled, never printed, and never logged.
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { passwordSchema } from '../src/utils/validation';

const prisma = new PrismaClient();
const DEFAULT_EMAIL = 'admin@academy.local';
const ALLOWED_ROLES = new Set(['ADMIN']);
let currentStage = 'startup';

function reportSafeError(error: unknown): void {
  const candidate =
    error && typeof error === 'object'
      ? (error as { name?: unknown; code?: unknown; errorCode?: unknown })
      : undefined;
  const allowedNames = new Set([
    'Error',
    'TypeError',
    'PrismaClientInitializationError',
    'PrismaClientKnownRequestError',
    'PrismaClientUnknownRequestError',
    'PrismaClientValidationError',
    'PrismaClientRustPanicError',
  ]);
  const name =
    typeof candidate?.name === 'string' && allowedNames.has(candidate.name)
      ? candidate.name
      : 'UnknownError';
  const code = [candidate?.code, candidate?.errorCode].find(
    (value): value is string => typeof value === 'string' && /^P\d{4}$/.test(value),
  );

  console.error(
    `Diagnostic failure at ${currentStage}: ${name}${code ? ` (${code})` : ''}. ` +
      'Raw error details were suppressed to protect credentials.',
  );
}

function readSecret(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    process.stdout.write(question);
    let value = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = (chunk: string) => {
      const text = chunk
        .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
        .replace(/\x1b./g, '');
      for (const char of text) {
        if (char === '\r' || char === '\n') {
          cleanup();
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u0003') {
          cleanup();
          process.stdout.write('\n');
          reject(new Error('CANCELLED'));
          return;
        }
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    };

    const cleanup = () => {
      stdin.off('data', onData);
      stdin.setRawMode(wasRaw ?? false);
      stdin.pause();
    };
    stdin.on('data', onData);
  });
}

async function promptHiddenPair(
  email: string,
): Promise<{ password: string; confirmation: string }> {
  const password = await readSecret(`New password for ${email}: `);
  const confirmation = await readSecret('Confirm password: ');
  return { password, confirmation };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      'Usage: npm run db:reset-admin-password [-- email]\n' +
        `Default email: ${DEFAULT_EMAIL}. Only ADMIN accounts are accepted.\n` +
        'Read-only check: npm run db:reset-admin-password -- --diagnose [email]',
    );
    return;
  }

  const diagnoseOnly = args.includes('--diagnose');
  const email = (args.find((arg) => arg !== '--' && arg !== '--diagnose') ?? DEFAULT_EMAIL)
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Invalid email address.');
    process.exitCode = 1;
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error(
      'DATABASE_URL is not set in this process. No database connection was attempted.',
    );
    process.exitCode = 1;
    return;
  }

  if (diagnoseOnly) {
    let renderHost = false;
    try {
      renderHost = new URL(process.env.DATABASE_URL).hostname
        .toLowerCase()
        .endsWith('.render.com');
    } catch {
      // Do not print or otherwise expose the configured connection string.
    }
    console.log(
      `Configured database target: ${renderHost ? 'Render host' : 'not identified as a Render host'}.`,
    );
    currentStage = 'database connection';
    await prisma.$connect();
    currentStage = 'read-only account lookup';
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true, isActive: true },
    });
    console.log('Database connection: successful.');
    console.log(`Account ${email}: ${user ? 'exists' : 'not found'}.`);
    if (user) {
      console.log(`Role: ${user.role}; active: ${user.isActive ? 'yes' : 'no'}.`);
    }
    return;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error(
      'Interactive terminal required. No database changes were made.',
    );
    process.exitCode = 1;
    return;
  }

  currentStage = 'account lookup';
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, isActive: true },
  });
  if (!user) {
    console.error(`No account found for ${email}. Seed the database first.`);
    process.exitCode = 1;
    return;
  }
  if (!ALLOWED_ROLES.has(user.role)) {
    console.error(
      `Refusing to reset a password for role ${user.role}; only ADMIN accounts are accepted.`,
    );
    process.exitCode = 1;
    return;
  }

  currentStage = 'hidden password prompt';
  const { password, confirmation } = await promptHiddenPair(email);
  if (password !== confirmation) {
    console.error('Passwords do not match. Nothing changed.');
    process.exitCode = 1;
    return;
  }
  currentStage = 'password validation';
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    console.error(
      `Password rejected: ${parsed.error.issues.map((issue) => issue.message).join('؛ ')}. Nothing changed.`,
    );
    process.exitCode = 1;
    return;
  }

  currentStage = 'password hashing';
  const passwordHash = await bcrypt.hash(password, 12);
  currentStage = 'password update';
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  console.log(`Password updated for ${email}.`);
  if (!user.isActive) {
    console.warn(
      'Note: this account is deactivated. Activate it from user administration before logging in.',
    );
  }
}

main()
  .catch((error) => {
    if (error instanceof Error && error.message === 'CANCELLED') {
      console.error('Cancelled. Nothing changed.');
    } else {
      // Database/client errors can contain connection details; never log raw errors.
      reportSafeError(error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
