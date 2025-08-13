import axios from 'axios';
import admin from 'firebase-admin';
import { getDb, verifyAuthIfRequired, logPaymentEvent, json } from './_shared.js';

const POLAR_API_BASE = 'https://api.polar.sh/v1';

// Support either a direct API key or OAuth Client Credentials
const POLAR_API_KEY = process.env.POLAR_API_KEY || null;
const POLAR_CLIENT_ID = process.env.POLAR_CLIENT_ID || null;
const POLAR_CLIENT_SECRET = process.env.POLAR_CLIENT_SECRET || null;

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getPolarAccessToken() {
  if (POLAR_API_KEY) return POLAR_API_KEY;
  if (!POLAR_CLIENT_ID || !POLAR_CLIENT_SECRET) {
    throw new Error('Polar credentials missing: set either POLAR_API_KEY or POLAR_CLIENT_ID and POLAR_CLIENT_SECRET');
  }
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt - 60_000) {
    return cachedToken;
  }
  // OAuth2 Client Credentials flow
  const tokenUrl = 'https://api.polar.sh/oauth2/token';
  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const basic = Buffer.from(`${POLAR_CLIENT_ID}:${POLAR_CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(tokenUrl, body.toString(), {
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const accessToken = res.data?.access_token;
  const expiresIn = Number(res.data?.expires_in || 3600) * 1000;
  if (!accessToken) throw new Error('Failed to obtain Polar access token');
  cachedToken = accessToken;
  cachedTokenExpiresAt = Date.now() + expiresIn;
  return accessToken;
}

let db = null;
try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } else {
      // Allow default credentials if available (e.g., local emulator or Netlify Build env)
      admin.initializeApp();
    }
  }
  db = admin.firestore();
} catch (e) {
  // Firestore not available; proceed without persistence on server
  console.warn('Firestore admin not initialized; proceeding without server-side persistence');
}

export const handler = async (event) => {
  const allowOrigin = process.env.CLIENT_BASE_URL || '*';
  const headers = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    // Optional: require Firebase auth
    const authResult = await verifyAuthIfRequired(event);
    if (!authResult.ok) return json(401, { error: authResult.error }, allowOrigin);
    const { amountInCents, currency = 'ZAR', successUrl, cancelUrl, failureUrl, metadata = {}, saveCard = false } = JSON.parse(event.body || '{}');

    if (!amountInCents || amountInCents < 200) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    // Idempotency: if metadata.idempotencyKey present, reuse existing non-final payment
    const idempotencyKey = metadata?.idempotencyKey || null;
    if (db && idempotencyKey) {
      try {
        const snap = await db
          .collection('payments')
          .where('metadata.idempotencyKey', '==', idempotencyKey)
          .limit(1)
          .get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          const data = doc.data();
          const final = new Set(['succeeded', 'failed', 'canceled', 'refunded']);
          if (!final.has(data.status)) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                checkoutId: data.checkout_id || null,
                redirectUrl: data.checkout_url || null,
                paymentId: doc.id,
                reused: true,
              })
            };
          }
        }
      } catch (e) {
        console.warn('Idempotency check failed:', e);
      }
    }

    // Create checkout in Polar
    const accessToken = await getPolarAccessToken();
    const createRes = await axios.post(
      `${POLAR_API_BASE}/checkouts`,
      {
        amount: amountInCents,
        currency,
        success_url: successUrl,
        cancel_url: cancelUrl || failureUrl,
        metadata: { ...metadata, saveCard },
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    const checkoutId = createRes.data?.id || createRes.data?.checkout?.id;
    const redirectUrl = createRes.data?.url || createRes.data?.checkout?.url;

    const nowIso = new Date().toISOString();
    let createdPaymentId = metadata?.paymentId || null;
    if (db) {
      try {
        if (metadata?.paymentId) {
          await db.collection('payments').doc(metadata.paymentId).set({
            checkout_id: checkoutId,
            checkout_url: redirectUrl,
            payment_provider: 'polar',
            updated_at: nowIso,
            metadata: { ...metadata, saveCard },
          }, { merge: true });
        } else {
          const docRef = await db.collection('payments').add({
            order_id: metadata.orderId || null,
            amount_cents: amountInCents,
            currency,
            status: 'pending',
            payment_provider: 'polar',
            provider_payment_id: null,
            checkout_id: checkoutId,
            checkout_url: redirectUrl,
            error_message: null,
            metadata: { ...metadata, saveCard },
            created_at: nowIso,
            updated_at: nowIso,
          });
          createdPaymentId = docRef.id;
        }
      } catch (err) {
        console.warn('Firestore write failed for Polar checkout:', err);
      }
    }

    // Log event
    await logPaymentEvent(db, {
      type: 'checkout_created',
      provider: 'polar',
      paymentId: createdPaymentId,
      checkoutId,
      orderId: metadata?.orderId || null,
      amount_cents: amountInCents,
      currency,
      status: 'pending',
    });

    return { statusCode: 200, headers, body: JSON.stringify({ checkoutId, redirectUrl, paymentId: createdPaymentId }) };
  } catch (error) {
    console.error('Polar checkout error:', error.response?.data || error);
    return { statusCode: error.response?.status || 500, headers, body: JSON.stringify({ error: error.response?.data?.message || 'Payment service error' }) };
  }
};


