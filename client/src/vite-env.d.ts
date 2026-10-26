/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ACADEMY_PHONE?: string;
  readonly VITE_ACADEMY_WHATSAPP?: string;
  readonly VITE_ACADEMY_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
