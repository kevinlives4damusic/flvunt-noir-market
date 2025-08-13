import admin from 'firebase-admin';

let db = null;
export const getDb = () => {
  if (db) return db;
  try {
    if (!admin.apps.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
      } else {
        admin.initializeApp();
      }
    }
    db = admin.firestore();
  } catch (e) {
    console.warn('Firestore admin not initialized');
    db = null;
  }
  return db;
};

export const verifyAuthIfRequired = async (event) => {
  if (process.env.REQUIRE_AUTH !== 'true') return { ok: true };
  try {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    const token = (authHeader || '').startsWith('Bearer ')
      ? (authHeader || '').slice('Bearer '.length).trim()
      : null;
    if (!token) return { ok: false, error: 'Unauthorized' };
    const decoded = await admin.auth().verifyIdToken(token);
    return { ok: true, decoded };
  } catch {
    return { ok: false, error: 'Invalid token' };
  }
};

export const logPaymentEvent = async (dbInstance, event) => {
  if (!dbInstance) return;
  const payload = {
    created_at: new Date().toISOString(),
    ...event,
  };
  try {
    await dbInstance.collection('payment_events').add(payload);
  } catch (err) {
    console.warn('Failed to log payment event', err);
  }
};

export const json = (statusCode, body, origin = '*') => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
  },
  body: JSON.stringify(body),
});

export const isAdmin = (decodedToken) => {
  if (!decodedToken) return false;
  if (decodedToken.admin === true) return true;
  const envList = process.env.ADMIN_UIDS || '';
  if (!envList) return false;
  const allowed = envList.split(',').map((s) => s.trim()).filter(Boolean);
  return allowed.includes(decodedToken.uid);
};

