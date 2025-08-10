import axios from 'axios';
import * as dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

const POLAR_API_BASE = 'https://api.polar.sh/v1';
const POLAR_API_KEY = process.env.POLAR_API_KEY; // use provided oat key

if (!POLAR_API_KEY) {
  throw new Error('POLAR_API_KEY is not set in environment variables');
}

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } else {
      admin.initializeApp();
    }
  } catch {}
}
const db = admin.firestore();

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { amountInCents, currency = 'ZAR', successUrl, cancelUrl, failureUrl, metadata = {}, saveCard = false } = JSON.parse(event.body || '{}');

    if (!amountInCents || amountInCents < 200) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    // Build idempotency key from order + user/email when available
    const idempotencyKey = metadata?.idempotencyKey || `${metadata?.orderId || 'no-order'}:${metadata?.userId || metadata?.userEmail || 'anon'}:${amountInCents}:${currency}`;

    // Create checkout in Polar
    const createRes = await axios.post(
      `${POLAR_API_BASE}/checkouts`,
      {
        amount: amountInCents,
        currency,
        success_url: successUrl,
        cancel_url: cancelUrl || failureUrl,
        metadata: { ...metadata, saveCard },
      },
      { headers: { Authorization: `Bearer ${POLAR_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey } }
    );

    const checkoutId = createRes.data?.id || createRes.data?.checkout?.id;
    const redirectUrl = createRes.data?.url || createRes.data?.checkout?.url;

    const nowIso = new Date().toISOString();
    let createdPaymentId = metadata?.paymentId || null;
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
          metadata: { ...metadata, saveCard, idempotencyKey },
          created_at: nowIso,
          updated_at: nowIso,
        });
        createdPaymentId = docRef.id;
      }
    } catch (err) {
      console.warn('Firestore write failed for Polar checkout:', err);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ checkoutId, redirectUrl, paymentId: createdPaymentId }) };
  } catch (error) {
    console.error('Polar checkout error:', error.response?.data || error);
    return { statusCode: error.response?.status || 500, headers, body: JSON.stringify({ error: error.response?.data?.message || 'Payment service error' }) };
  }
};


