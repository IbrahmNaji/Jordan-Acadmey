/**
 * ينقل محتوى الدورات الثابت (src/content/courses.ts) إلى قاعدة البيانات.
 *
 * التشغيل الافتراضي تجريبي فقط (dry-run). للتطبيق:
 *   npx ts-node prisma/seed-courses.ts --apply
 *
 * السكربت قابل لإعادة التشغيل: لا يعدّل دورة موجودة مسبقاً (حتى لا يطمس
 * تعديلات الإدارة)، وينشئ فقط الدورات المفقودة بحالة PUBLISHED.
 * لا يضيف أسعاراً أو مدربين أو بيانات غير موجودة في المحتوى الأصلي.
 */
import { PrismaClient } from '@prisma/client';
import { publicCourses } from '../src/content/courses';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  console.log(
    apply
      ? '🌱 Seeding public courses (apply mode)...'
      : '🔎 Dry run — no writes. Add --apply to create missing courses.',
  );

  let created = 0;
  let existing = 0;

  for (const course of publicCourses) {
    const found = await prisma.course.findUnique({
      where: { slug: course.slug },
      select: { id: true, title: true, status: true },
    });

    if (found) {
      existing += 1;
      console.log(
        `↷ exists (${found.status}): ${course.slug} — ${found.title}`,
      );
      continue;
    }

    console.log(
      `${apply ? '✓ creating' : '• would create'}: ${course.slug} — ${course.title}`,
    );
    if (!apply) continue;

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
    created += 1;
  }

  console.log(
    `\nDone. created=${created}, existing=${existing}, total=${publicCourses.length}${
      apply ? '' : ' (dry run)'
    }`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
