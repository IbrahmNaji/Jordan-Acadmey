const env = import.meta.env;

export const site = {
  url: (env.VITE_SITE_URL ?? '').trim(),
  name: 'الأكاديمية الأردنية',
  descriptor: 'خدمات السيارات المتكاملة',
  tagline: 'التدريب، المركبات، الورشة، وقطع الغيار.',
  description:
    'منصة متكاملة للأكاديمية وبيع وشراء المركبات وخدمات الورشة وقطع الغيار في دمشق، سوريا.',
  location: 'دمشق، سوريا',
  mapUrl: 'https://maps.app.goo.gl/jDhUP8HbYkFkGgHY6',
  imagesNotice:
    'الصور المعروضة توضيحية لبيئة تدريب سيارات، وليست صوراً للمنشأة الفعلية.',
};

const DEFAULT_PHONE = '+963 985 387 388';
const DEFAULT_WHATSAPP = '963985387388';
const DEFAULT_INSTAGRAM = 'https://www.instagram.com/academicjordan/';

export const contact = {
  phone: (env.VITE_ACADEMY_PHONE || '').trim() || DEFAULT_PHONE,
  whatsapp: (env.VITE_ACADEMY_WHATSAPP || '').trim() || DEFAULT_WHATSAPP,
  email: (env.VITE_ACADEMY_EMAIL ?? '').trim(),
  instagram: (env.VITE_ACADEMY_INSTAGRAM || '').trim() || DEFAULT_INSTAGRAM,
  location: site.location,
};

export function toWhatsAppLink(rawNumber: string, message?: string) {
  const digits = rawNumber.replace(/[^\d]/g, '');
  if (!digits) return '';
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${query}`;
}

export const mainNavigation = [
  { to: '/', label: 'الرئيسية' },
  { to: '/courses', label: 'الأكاديمية' },
  { to: '/courses#instructors', label: 'مدرّبونا' },
  { to: '/marketplace', label: 'بيع وشراء المركبات' },
  { to: '/workshop', label: 'الورشة' },
  { to: '/spare-parts', label: 'قطع الغيار' },
];

export const tracks = [
  {
    slug: 'mechanics',
    number: '01',
    title: 'ميكانيك السيارات',
    summary: 'المحرك وناقل الحركة وأنظمة التشغيل الأساسية، من الفهم إلى التطبيق.',
    image: '/images/courses/mechanics.webp',
    imageAlt: 'تدريب على مكوّنات محرك السيارة',
  },
  {
    slug: 'electrical',
    number: '02',
    title: 'كهرباء السيارات',
    summary: 'الدوائر الكهربائية والبطارية والشحن وأعطال التيار في السيارة.',
    image: '/images/courses/electrical.webp',
    imageAlt: 'فحص دارة كهربائية في سيارة',
  },
  {
    slug: 'diagnostics',
    number: '03',
    title: 'تشخيص الأعطال',
    summary: 'قراءة البيانات وتتبّع الأعطال بأدوات التشخيص خطوة بخطوة.',
    image: '/images/courses/diagnostics.webp',
    imageAlt: 'جهاز تشخيص أعطال متصل بلوحة سيارة',
  },
  {
    slug: 'hybrid',
    number: '04',
    title: 'أنظمة الهايبرد',
    summary: 'مبادئ منظومات الهايبرد ومتطلبات السلامة عند التعامل معها.',
    image: '/images/courses/hybrid.webp',
    imageAlt: 'مكوّنات منظومة هايبرد داخل سيارة',
  },
];

export const features = [
  {
    number: '01',
    title: 'التطبيق قبل الحفظ',
    text: 'تتعلم عبر الفحص والقياس والتكرار على مكوّنات السيارة، لا بالاكتفاء بالمشاهدة.',
  },
  {
    number: '02',
    title: 'مسار متدرّج',
    text: 'تبدأ من المفاهيم الأساسية وتنتقل خطوة بخطوة نحو الأعطال المركّبة والتشخيص.',
  },
  {
    number: '03',
    title: 'تفكير تشخيصي',
    text: 'نركّز على الوصول إلى سبب العطل وفهم منطق الأنظمة، لا على الاستبدال العشوائي للقطع.',
  },
  {
    number: '04',
    title: 'سياق الورشة',
    text: 'أدوات، قياسات، وقرارات عملية تحاكي طريقة العمل اليومي داخل ورشة السيارات.',
  },
];

export const practicalPoints = [
  'تطبيق مباشر على مكوّنات السيارة أثناء التدريب',
  'قراءة وقياس وفحص لكل خطوة قبل الانتقال للتالية',
  'مناقشة أعطال واقعية وربطها بسببها لا بعرضها فقط',
  'ربط التقنية المستخدمة بسبب وجودها في السيارة',
];

export const registrationSteps = [
  {
    number: '01',
    title: 'أرسل استفسارك',
    text: 'عبّئ نموذج التواصل باسمك ورقمك والمسار الذي يهمك.',
  },
  {
    number: '02',
    title: 'نتواصل معك',
    text: 'نناقش خبرتك السابقة والمسار الأنسب لهدفك.',
  },
  {
    number: '03',
    title: 'نحدد نقطة البداية',
    text: 'نوضح محتوى المسار والتفاصيل المتاحة قبل اتخاذ القرار.',
  },
  {
    number: '04',
    title: 'استكمال التسجيل',
    text: 'عند الجاهزية، نستكمل إجراءات الانضمام إلى الدفعة.',
  },
];

export const gallery = [
  {
    src: '/images/gallery/lift.webp',
    alt: 'سيارة مرفوعة على رافعة داخل ورشة صيانة',
    caption: 'الفحص تحت السيارة وعلى الرافعة',
    span: 'wide',
  },
  {
    src: '/images/gallery/engine.webp',
    alt: 'عمل على محرك سيارة داخل ورشة',
    caption: 'التعامل مع المحرك ومكوّناته',
    span: 'tall',
  },
  {
    src: '/images/gallery/scanner.webp',
    alt: 'جهاز فحص إلكتروني أثناء تشخيص سيارة',
    caption: 'قراءة بيانات التشخيص',
    span: 'normal',
  },
  {
    src: '/images/gallery/tools.webp',
    alt: 'أدوات ورشة سيارات مرتبة على طاولة عمل',
    caption: 'أدوات القياس والفحص',
    span: 'normal',
  },
  {
    src: '/images/workshop/practical-training.webp',
    alt: 'تدريب عملي على مكوّنات السيارة',
    caption: 'التعلّم بالتطبيق المباشر',
    span: 'normal',
  },
];

export const faqs = [
  {
    question: 'هل أحتاج إلى خبرة سابقة للانضمام؟',
    answer:
      'يعتمد ذلك على المسار ومستواك الحالي. اذكر خبرتك في نموذج الاستفسار، وسنساعدك في تحديد نقطة البداية المناسبة بدلاً من افتراض مستوى موحّد للجميع.',
  },
  {
    question: 'هل التدريب عملي أم نظري؟',
    answer:
      'يرتكز التدريب على التطبيق العملي داخل سياق الورشة، إلى جانب الشرح النظري اللازم لفهم سبب كل خطوة ونتيجتها.',
  },
  {
    question: 'ما المواعيد والرسوم وتفاصيل الدفعات؟',
    answer:
      'تتغيّر تفاصيل المواعيد والرسوم حسب المسار والدفعة، لذلك لا نعرض أرقاماً ثابتة على الموقع. أرسل استفسارك وسنزوّدك بالتفاصيل الحالية عند التواصل.',
  },
  {
    question: 'هل أحصل على شهادة عند إتمام التدريب؟',
    answer:
      'يمكنك سؤال فريق الأكاديمية عند التواصل عن متطلبات إتمام المسار وأي وثائق مرتبطة به، حتى تحصل على إجابة دقيقة تخصّ المسار الذي اخترته.',
  },
  {
    question: 'أين تقع الأكاديمية؟',
    answer:
      'الأكاديمية في دمشق، سوريا. يمكنك طلب الموقع التفصيلي وطريقة الوصول عند التواصل معنا.',
  },
  {
    question: 'كيف يتم الرد على الاستفسار؟',
    answer:
      'حسب طريقة التواصل التي تختارها في النموذج: اتصال هاتفي أو واتساب أو بريد إلكتروني. اختر الطريقة الأنسب لك ولن نطلب منك معلومات لا تحتاجها.',
  },
  {
    question: 'ما الذي يحدث لبياناتي بعد إرسال النموذج؟',
    answer:
      'تُستخدم بياناتك للتواصل معك بخصوص استفسارك فقط، وتُحفظ في نظام إدارة الأكاديمية. يمكنك قراءة التفاصيل في سياسة الخصوصية.',
  },
];

export const aboutValues = [
  {
    title: 'الوضوح',
    text: 'نشرح ما نقدّمه وما لا نقدّمه، ونحدّد التفاصيل عند التواصل بدل الوعود المفتوحة.',
  },
  {
    title: 'المهارة أولاً',
    text: 'الهدف أن تخرج بيد تعرف كيف تفحص وتقيس وتصل إلى السبب، لا بمعلومات نظرية فقط.',
  },
  {
    title: 'السلامة',
    text: 'التعامل مع السيارات، وخصوصاً أنظمة الهايبرد، يتطلب احترام إجراءات السلامة في كل خطوة.',
  },
];

export const contactMethods = [
  {
    value: 'PHONE',
    label: 'اتصال هاتفي',
    hint: 'مناسب للمناقشة المباشرة',
  },
  {
    value: 'WHATSAPP',
    label: 'واتساب',
    hint: 'رسالة سريعة ومتابعة',
  },
  {
    value: 'EMAIL',
    label: 'بريد إلكتروني',
    hint: 'للتفاصيل المكتوبة',
  },
] as const;
