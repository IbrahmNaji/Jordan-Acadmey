# واجهة الويب

## الإعداد

انسخ `.env.example` إلى `.env`، ثم اضبط:

- `VITE_API_URL`: عنوان API متضمناً `/api`.
- `VITE_SITE_URL`: أصل الموقع العام. استخدم عنوان HTTPS الفعلي في الإنتاج. عند تركه فارغاً لا تُنشأ خريطة موقع ولا عناوين canonical، وتظهر ملاحظة أثناء البناء.
- `VITE_ACADEMY_PHONE` و`VITE_ACADEMY_WHATSAPP` و`VITE_ACADEMY_EMAIL` و`VITE_ACADEMY_INSTAGRAM`: بيانات التواصل المركزية. لا تضع أسراراً هنا؛ قيم Vite العامة تُضمّن في ملفات الواجهة.
- `VITE_CURRENCY_LABEL`: تسمية العملة الظاهرة في الواجهة.

ثبّت الحزم بـ`npm ci` ثم شغّل `npm run dev`.

## البناء والفحوصات

- `npm run build` يشغّل TypeScript وVite ثم ينشئ `dist/robots.txt`. إذا كان `VITE_SITE_URL` صالحاً ويستخدم HTTPS، ينشئ أيضاً `dist/sitemap.xml` بالمسارات العامة الثابتة.
- `npm run lint` يفحص `src` فقط.
- `npm run preview` يعرض نسخة البناء محلياً.

الموقع تطبيق SPA؛ تحديث العنوان وبيانات Open Graph وcanonical يجري في المتصفح. هذا لا يضيف SSR أو prerendering. خريطة الموقع الحالية لا تتضمن صفحات الدورات الفردية المنشأة ديناميكياً.