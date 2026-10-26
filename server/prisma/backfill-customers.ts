/**
 * Links legacy leads (created before Customer existed) to customer records.
 * One customer is created per lead; leads are never merged automatically.
 * Idempotent: only leads with a null customerId are processed.
 *
 *   npx ts-node prisma/backfill-customers.ts            # dry run
 *   npx ts-node prisma/backfill-customers.ts --apply    # write changes
 */
import { PrismaClient } from '@prisma/client';
import { createCustomerForPerson } from '../src/utils/customer';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const leads = await prisma.lead.findMany({
    where: { customerId: null },
    select: {
      id: true,
      fullName: true,
      phone: true,
      whatsapp: true,
      email: true,
      city: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(
    `${leads.length} lead(s) without a customer record. Mode: ${
      apply ? 'APPLY' : 'DRY RUN'
    }`,
  );

  let created = 0;
  for (const lead of leads) {
    if (!apply) {
      console.log(`would link lead ${lead.id}`);
      continue;
    }
    await prisma.$transaction(async (tx) => {
      const customer = await createCustomerForPerson(
        {
          fullName: lead.fullName,
          phone: lead.phone,
          whatsapp: lead.whatsapp,
          email: lead.email,
          city: lead.city,
        },
        tx,
      );
      await tx.lead.update({
        where: { id: lead.id },
        data: { customerId: customer.id },
      });
    });
    created += 1;
  }

  if (apply) {
    const remaining = await prisma.lead.count({ where: { customerId: null } });
    console.log(`linked ${created} lead(s); ${remaining} still unlinked`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
