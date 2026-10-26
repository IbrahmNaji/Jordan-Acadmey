import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { publicCourses } from '../src/content/courses';

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';

async function ensureUser(input: {
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT';
  envPassword?: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true },
  });
  if (existing) {
    console.log(`↷ Existing user left unchanged: ${existing.email}`);
    return;
  }

  let password = input.envPassword;
  let generated = false;
  if (!password) {
    if (isProduction) {
      throw new Error(
        `Set SEED_ADMIN_PASSWORD (and SEED_ADMIN_EMAIL) before seeding in production.`,
      );
    }
    password = randomBytes(15).toString('base64url');
    generated = true;
  }

  await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await bcrypt.hash(password, 12),
      fullName: input.fullName,
      role: input.role,
    },
  });

  if (generated) {
    // One-time bootstrap output; not written to application logs.
    console.log(
      `\n⚠️  Created ${input.email} with a generated password (shown once):\n` +
        `    ${password}\n` +
        `    Change it immediately after first login.\n`,
    );
  } else {
    console.log(`✓ Created ${input.email}`);
  }
}

async function main() {
  console.log('🌱 Seeding base data...');

  const adminEmail =
    process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() ||
    'admin@academy.local';
  await ensureUser({
    email: adminEmail,
    fullName: 'مدير النظام',
    role: 'ADMIN',
    envPassword: process.env.SEED_ADMIN_PASSWORD,
  });

  const sources = [
    { name: 'Facebook - Spring Ads', channel: 'FACEBOOK' as const },
    { name: 'Instagram - Reels', channel: 'INSTAGRAM' as const },
    { name: 'WhatsApp Direct', channel: 'WHATSAPP' as const },
    { name: 'Walk-in', channel: 'WALK_IN' as const },
    { name: 'Referral', channel: 'REFERRAL' as const },
    { name: 'Google Ads', channel: 'GOOGLE_ADS' as const },
  ];

  for (const source of sources) {
    await prisma.campaignSource.upsert({
      where: { name: source.name },
      update: {},
      create: source,
    });
  }
  console.log(`✓ ${sources.length} campaign sources ensured`);

  let coursesCreated = 0;
  for (const course of publicCourses) {
    const exists = await prisma.course.findUnique({
      where: { slug: course.slug },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.course.create({
      data: {
        slug: course.slug,
        title: course.title,
        shortTitle: course.shortTitle,
        courseType: course.courseType,
        tagline: course.tagline,
        summary: course.summary,
        description: course.description,
        focus: course.focus,
        prerequisites: [],
        format: course.format,
        note: course.note,
        image: course.image,
        imageAlt: course.imageAlt,
        deliveryMode: 'ONSITE',
        price: null,
        currency: 'SYP',
        featured: course.featured,
        sortOrder: course.order,
        status: 'PUBLISHED',
      },
    });
    coursesCreated += 1;
  }
  console.log(
    `✓ published courses ensured (${coursesCreated} created, ${publicCourses.length} total)`,
  );

  if (process.env.SEED_SAMPLE_DATA === 'true') {
    if (isProduction) {
      throw new Error('SEED_SAMPLE_DATA is not allowed in production.');
    }
    const agentEmail = 'agent@academy.local';
    await ensureUser({
      email: agentEmail,
      fullName: 'موظف مبيعات',
      role: 'AGENT',
      envPassword: process.env.SEED_AGENT_PASSWORD,
    });
    const agent = await prisma.user.findUnique({
      where: { email: agentEmail },
      select: { id: true },
    });
    const source = await prisma.campaignSource.findFirst({
      where: { name: 'Facebook - Spring Ads' },
      select: { id: true },
    });
    const samples = [
      { fullName: 'أحمد الخطيب', phone: '0932111111', interestedIn: 'MECHANICS' as const, status: 'NEW' as const },
      { fullName: 'سارة الحلبي', phone: '0932222222', interestedIn: 'HYBRID' as const, status: 'CONTACTED' as const },
      { fullName: 'محمد النجار', phone: '0932333333', interestedIn: 'DIAGNOSTICS' as const, status: 'INTERESTED' as const },
    ];
    for (const sample of samples) {
      const exists = await prisma.lead.findFirst({
        where: { phone: sample.phone },
        select: { id: true },
      });
      if (exists) continue;
      await prisma.lead.create({
        data: {
          ...sample,
          city: 'دمشق',
          sourceId: source?.id,
          assignedToId: agent?.id,
        },
      });
    }
    console.log(`✓ Sample data ensured (${samples.length} leads max)`);
  }

  console.log('🎉 Seed complete');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
