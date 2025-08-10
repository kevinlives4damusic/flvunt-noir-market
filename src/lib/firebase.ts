import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics, logEvent as firebaseLogEvent } from 'firebase/analytics';
import { getAuth, type Auth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: 'AIzaSyCKUymW9WFOQiXfq0BQnv7d1muHpoxV8Dc',
  authDomain: 'lvnt-159f3.firebaseapp.com',
  projectId: 'lvnt-159f3',
  storageBucket: 'lvnt-159f3.firebasestorage.app',
  messagingSenderId: '515324294893',
  appId: '1:515324294893:web:5e6e13ac18d6803c1f3ee4',
  measurementId: 'G-SNPLP52EVV',
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
    // Prefer transports that avoid WebChannel 400s in some networks/proxies
    dbInstance = initializeFirestore(appInstance, {
      // Try long polling first (most reliable across restrictive networks)
      experimentalForceLongPolling: true,
      // Use Fetch-based streams instead of XHR when available
      useFetchStreams: true,
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
