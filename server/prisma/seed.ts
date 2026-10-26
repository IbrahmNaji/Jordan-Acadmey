import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  const adminPass = await bcrypt.hash('Admin@12345', 10);
  const agentPass = await bcrypt.hash('Agent@12345', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@academy.local' },
    update: {},
    create: {
      email: 'admin@academy.local',
      passwordHash: adminPass,
      fullName: 'مدير النظام',
      role: 'ADMIN',
      phone: '0999000001',
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@academy.local' },
    update: {},
    create: {
      email: 'agent@academy.local',
      passwordHash: agentPass,
      fullName: 'موظف مبيعات',
      role: 'AGENT',
      phone: '0999000002',
    },
  });

  console.log(`✅ Admin: ${admin.email} / Admin@12345`);
  console.log(`✅ Agent: ${agent.email} / Agent@12345`);

  const sources = [
    { name: 'Facebook - Spring Ads', channel: 'FACEBOOK' as const },
    { name: 'Instagram - Reels', channel: 'INSTAGRAM' as const },
    { name: 'WhatsApp Direct', channel: 'WHATSAPP' as const },
    { name: 'Walk-in', channel: 'WALK_IN' as const },
    { name: 'Referral', channel: 'REFERRAL' as const },
    { name: 'Google Ads', channel: 'GOOGLE_ADS' as const },
  ];

  for (const s of sources) {
    await prisma.campaignSource.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }

  console.log(`✅ ${sources.length} campaign sources created`);

  const fbSource = await prisma.campaignSource.findFirst({
    where: { name: 'Facebook - Spring Ads' },
  });

  const sampleLeads = [
    { fullName: 'أحمد الخطيب', phone: '0932111111', interestedIn: 'MECHANICS' as const, status: 'NEW' as const },
    { fullName: 'سارة الحلبي', phone: '0932222222', interestedIn: 'HYBRID' as const, status: 'CONTACTED' as const },
    { fullName: 'محمد النجار', phone: '0932333333', interestedIn: 'DIAGNOSTICS' as const, status: 'INTERESTED' as const },
  ];

  for (const lead of sampleLeads) {
    await prisma.lead.create({
      data: { ...lead, sourceId: fbSource?.id, assignedToId: agent.id, city: 'دمشق' },
    });
  }

  console.log(`✅ ${sampleLeads.length} sample leads created`);
  console.log('🎉 Seed complete');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());