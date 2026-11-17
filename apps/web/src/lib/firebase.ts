import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

const env = import.meta.env;

/** True when no real Firebase project is configured — the app runs against the local Auth emulator. */
export const usingEmulator = env.VITE_USE_EMULATORS === 'true' || !env.VITE_FIREBASE_API_KEY;

export const firebaseApp = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-zdoda.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'demo-zdoda',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(firebaseApp);

if (usingEmulator) {
  const host = env.VITE_AUTH_EMULATOR_URL || `http://${location.hostname}:9099`;
  connectAuthEmulator(auth, host, { disableWarnings: true });
}

export const googleSignInEnabled = env.VITE_ENABLE_GOOGLE_SIGNIN !== 'false';
export const showDemoLogin = usingEmulator || env.VITE_SHOW_DEMO_LOGIN === 'true';
