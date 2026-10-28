/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_ACADEMY_PHONE?: string;
  readonly VITE_ACADEMY_WHATSAPP?: string;
  readonly VITE_ACADEMY_EMAIL?: string;
  readonly VITE_ACADEMY_INSTAGRAM?: string;
  readonly VITE_CURRENCY_LABEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
