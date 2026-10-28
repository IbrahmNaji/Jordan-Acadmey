import { ArrowLeft, BadgeCheck, ClipboardList, SearchCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/public/PageHero';
import PageMeta from '../../components/public/PageMeta';
import BusinessRequestForm from '../../components/public/BusinessRequestForm';

const steps = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'أرسل تفاصيل القطعة',
    text: 'اذكر اسم القطعة ورقمها إن توفر، ومعلومات المركبة اللازمة لفهم طلبك.',
  },
  {
    number: '02',
    icon: SearchCheck,
    title: 'نراجع خيارات التوريد',
    text: 'تُراجع الطلبات للبحث عن عروض موردين؛ ولا نعد بتوفر قطعة قبل التحقق من عرض فعلي.',
  },
  {
    number: '03',
    icon: BadgeCheck,
    title: 'اطّلع وقرّر',
    text: 'تُعرض تفاصيل السعر والتوفر والمدة المتوقعة عند تأكيدها، وتبقى موافقتك مطلوبة قبل متابعة الطلب.',
  },
];

export default function SparePartsPage() {
  return (
    <>
      <PageMeta
        title="طلب قطع غيار"
        description="أرسل استفساراً عن قطعة غيار لمركبتك. التوفر والسعر وموعد التوريد لا يُؤكد أي منها قبل الحصول على عرض فعلي."
      />
      <PageHero
        eyebrow="طلب وتوريد حسب الطلب"
        title={
          <>
            ابحث عن القطعة{' '}
            <span className="text-flame-400">المناسبة لمركبتك</span>
          </>
        }
        description="نوفر لك إمكانية تأمين مختلف قطع غيار السيارات، مهما كان نوعها أو موديلها، ونعمل على البحث عن القطعة المناسبة لسيارتك وتوفيرها حسب الطلب والتوافر."
        breadcrumb={[{ label: 'قطع الغيار' }]}
      >
        <Link to="/contact" className="btn-flame">
          تواصل معنا <ArrowLeft size={16} aria-hidden="true" />
        </Link>
      </PageHero>

      <section className="shell py-14 sm:py-20" aria-labelledby="parts-process">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">كيف تتم المتابعة؟</p>
          <h2
            id="parts-process"
            className="mt-3 font-display text-2xl font-extrabold sm:text-3xl"
          >
            من الاستفسار إلى عرض واضح
          </h2>
          <p className="mt-3 text-sm leading-7 text-steel-600">
            يمكنك إرسال الطلب من النموذج أدناه. تسجيل الطلب لا ينشئ طلب شراء ولا يؤكد توفر القطعة أو السعر.
          </p>
        </div>

        <ol className="mx-auto mt-9 grid max-w-5xl gap-4 md:grid-cols-3">
          {steps.map(({ number, icon: Icon, title, text }) => (
            <li key={number} className="border border-ink-900/10 bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center bg-flame-50 text-flame-700">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="font-display text-xs font-bold tracking-widest text-steel-500">
                  {number}
                </span>
              </div>
              <h3 className="mt-5 font-display text-base font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-steel-600">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <Link to="/contact" className="btn-outline-ink">
            تواصل مع الفريق <ArrowLeft size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <BusinessRequestForm kind="parts" />
    </>
  );
}
