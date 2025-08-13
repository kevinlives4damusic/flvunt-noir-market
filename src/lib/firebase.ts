import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics, logEvent as firebaseLogEvent } from 'firebase/analytics';
import { getAuth, type Auth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: 'AIzaSyBJJXf9lvqTLMTA8JY-KV2PJ0ed-1zS1LU',
  authDomain: 'flvunt-f8765.firebaseapp.com',
  projectId: 'flvunt-f8765',
  storageBucket: 'flvunt-f8765.firebasestorage.app',
  messagingSenderId: '801071424735',
  appId: '1:801071424735:web:f920b48114a1f7322df56a',
  measurementId: 'G-YJCRWLMTEE',
};

let appInstance: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export async function initFirebase(): Promise<{ app: FirebaseApp; analytics: Analytics | null; auth: Auth; db: Firestore }> {
  if (!appInstance) {
    appInstance = initializeApp(firebaseConfig);
  }
  if (!authInstance) {
    authInstance = getAuth(appInstance);
  }
  if (!dbInstance) {
    // Force long polling to avoid WebChannel 400s behind restrictive proxies/CDNs
    dbInstance = initializeFirestore(appInstance, {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    } as any);
  }
  if (!analyticsInstance && typeof window !== 'undefined' && (await isSupported())) {
    analyticsInstance = getAnalytics(appInstance);
  }
  return { app: appInstance, analytics: analyticsInstance, auth: authInstance, db: dbInstance };
}

export const googleProvider = new GoogleAuthProvider();

export function getAnalyticsOrNull(): Analytics | null {
  return analyticsInstance;
}

export async function ensureAnalytics(): Promise<Analytics | null> {
  if (!analyticsInstance) {
    await initFirebase();
  }
  return analyticsInstance;
}

export async function logAnalyticsEvent(eventName: string, params?: Record<string, any>): Promise<void> {
  try {
    const analytics = await ensureAnalytics();
    if (analytics) {
      firebaseLogEvent(analytics, eventName as any, params);
    }
  } catch {
    // no-op if analytics is unsupported
  }
}

// Lazy accessors
export function app(): FirebaseApp {
  if (!appInstance) throw new Error('Firebase app not initialized');
  return appInstance;
}
export function auth(): Auth {
  if (!authInstance) throw new Error('Firebase auth not initialized');
  return authInstance;
}
export function db(): Firestore {
  if (!dbInstance) throw new Error('Firebase firestore not initialized');
  return dbInstance;
}

// Initialize on module load (safe, guarded)
void initFirebase();
