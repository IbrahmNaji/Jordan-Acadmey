// Read-only production user inventory. This script selects only email and role.
// DATABASE_URL must be explicitly provided by the caller and point to Render.

function getRenderDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error('DATABASE_URL must be provided in the process environment.');
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('DATABASE_URL is invalid.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    !hostname.endsWith('.render.com')
  ) {
    throw new Error('Refusing query: DATABASE_URL must use a Render host.');
  }

  return value;
}

async function main() {
  const databaseUrl = getRenderDatabaseUrl();
  const hostname = new URL(process.env.DATABASE_URL!).hostname;
  const expectedDatabaseName = process.env.EXPECTED_RENDER_DB_NAME?.trim();
  const expectedHostname = process.env.EXPECTED_RENDER_DB_HOST?.trim().toLowerCase();

  // Dynamic import ensures Prisma only initializes after the caller-provided URL
  // has been validated. The URL is never printed.
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  try {
    await prisma.$connect();
    const databaseRows = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT current_database() AS name
    `;
    const databaseName = databaseRows[0]?.name;
    const count = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { email: true, role: true },
      orderBy: { email: 'asc' },
    });

    console.log(`Database name: ${databaseName ?? 'unavailable'}`);
    console.log(`Database host: ${hostname}`);
    console.log(`User count: ${count}`);
    for (const user of users) {
      console.log(`${user.email}\t${user.role}`);
    }

    const warnings: string[] = [];
    let hasMismatch = false;
    if (!expectedDatabaseName) {
      warnings.push(
        'EXPECTED_RENDER_DB_NAME is unset; database name was not verified against Render settings.',
      );
    } else if (databaseName !== expectedDatabaseName) {
      hasMismatch = true;
      warnings.push('Database name does not match EXPECTED_RENDER_DB_NAME.');
    }

    if (!expectedHostname) {
      warnings.push(
        'EXPECTED_RENDER_DB_HOST is unset; host was not verified against Render settings.',
      );
    } else if (hostname.toLowerCase() !== expectedHostname) {
      hasMismatch = true;
      warnings.push('Database host does not match EXPECTED_RENDER_DB_HOST.');
    }

    if (hasMismatch) {
      console.log('Target check: MISMATCH.');
    } else if (warnings.length > 0) {
      console.log('Target check: INCOMPLETE.');
    } else {
      console.log('Target check: MATCH.');
    }
    for (const warning of warnings) {
      console.warn(`Warning: ${warning}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  // Avoid printing Prisma errors, which can contain connection details.
  console.error('Read-only user listing failed. No connection details were logged.');
  process.exitCode = 1;
});
