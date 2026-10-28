import {
  ArrowLeft,
  BadgeCheck,
  ClipboardCheck,
  Handshake,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/public/PageHero';
import PageMeta from '../../components/public/PageMeta';
import VehicleListings from '../../components/public/VehicleListings';

const safeguards = [
  {
    icon: ShieldCheck,
    title: 'بيانات ملكية واضحة',
    text: 'نتحقق من بيانات المركبة وملكيتها قبل استكمال إجراءات البيع والشراء.',
  },
  {
    icon: ClipboardCheck,
    title: 'مراجعة قبل العرض',
    text: 'نراجع تفاصيل المركبة قبل عرضها أو مشاركة معلوماتها مع المهتمين.',
  },
  {
    icon: BadgeCheck,
    title: 'حالة موثّقة',
    text: 'لا نصف المركبة بأنها مفحوصة إلا عند وجود سجل فحص حقيقي مرتبط بها.',
  },
  {
    icon: Handshake,
    title: 'إجراءات بيع وشراء',
    text: 'نتابع طلبات شراء المركبات وعرضها للبيع، ونوضح حالة كل مركبة وتفاصيلها قبل الاتفاق.',
  },
];

export default function MarketplacePage() {
  return (
    <>
      <PageMeta
        title="بيع وشراء المركبات"
        description="تصفح المركبات المعروضة للبيع أو تواصل معنا لطلب شراء مركبة أو عرض مركبتك للبيع."
      />
      <PageHero
        eyebrow="بيع وشراء المركبات"
        title={
          <>
            بيع وشراء المركبات{' '}
            <span className="text-flame-400">بوضوح وثقة</span>
          </>
        }
        description="تصفح المركبات المتاحة للبيع، أو تواصل معنا لطلب شراء مركبة أو عرض مركبتك للبيع. تظهر تفاصيل السعر والحالة والملكية لكل مركبة قبل الاتفاق."
        breadcrumb={[{ label: 'بيع وشراء المركبات' }]}
      >
        <Link to="/contact" className="btn-flame">
          طلب شراء أو عرض مركبة للبيع
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
      </PageHero>

      <VehicleListings />
      <section
        className="border-y border-ink-900/10 bg-white py-14 sm:py-20"
        aria-labelledby="vehicle-sales-steps"
      >
        <div className="shell">
          <p className="eyebrow">خطوات موثّقة</p>
          <h2
            id="vehicle-sales-steps"
            className="mt-3 font-display text-2xl font-extrabold sm:text-3xl"
          >
            خطوات واضحة لبيع وشراء المركبات
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {safeguards.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="border border-ink-900/10 bg-paper p-5"
              >
                <span className="flex h-11 w-11 items-center justify-center bg-flame-50 text-flame-700">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-steel-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
