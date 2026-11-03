/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_USE_EMULATORS?: string;
  readonly VITE_AUTH_EMULATOR_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENABLE_GOOGLE_SIGNIN?: string;
  readonly VITE_SHOW_DEMO_LOGIN?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
