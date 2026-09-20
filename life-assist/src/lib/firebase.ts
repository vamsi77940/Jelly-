import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider, getToken, type AppCheck } from 'firebase/app-check';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let appCheck: AppCheck | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let analytics: Analytics | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
}

function isAppCheckConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID &&
      import.meta.env.VITE_RECAPTCHA_SITE_KEY
  );
}

function ensureInitialized(): void {
  if (app || !isFirebaseConfigured()) return;

  app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  });

  auth = getAuth(app);
  firestore = getFirestore(app);
  
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }

  if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY as string),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

export function getFirebaseApp(): FirebaseApp | null {
  ensureInitialized();
  return app;
}

export function getFirebaseAuth(): Auth | null {
  ensureInitialized();
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  ensureInitialized();
  return firestore;
}

export function getFirebaseAnalytics(): Analytics | null {
  ensureInitialized();
  return analytics;
}

/** Returns a fresh App Check token to attach to backend requests, or null if Firebase isn't configured. */
export async function getAppCheckToken(): Promise<string | null> {
  ensureInitialized();
  if (!appCheck) return null;
  try {
    const result = await getToken(appCheck, /* forceRefresh */ false);
    return result.token;
  } catch (err) {
    console.error('[firebase] failed to get App Check token', err);
    return null;
  }
}

export { isAppCheckConfigured as isSecureBackendConfigured };
