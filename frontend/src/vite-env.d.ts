/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "1" to always use the in-browser mock API, even if a real backend is up. */
  readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
