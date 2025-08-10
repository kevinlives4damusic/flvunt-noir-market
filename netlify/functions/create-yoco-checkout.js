import axios from 'axios';
import * as dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

const YOCO_API_URL = 'https://online.yoco.com/v1/checkout/';
const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;

if (!YOCO_SECRET_KEY) {
  throw new Error('YOCO_SECRET_KEY is not set in environment variables');
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

export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { 
      amountInCents, 
      currency = 'ZAR',
      successUrl,
      cancelUrl,
      failureUrl,
      metadata = {},
      saveCard = false
    } = JSON.parse(event.body);

    // Validate required fields
    if (!amountInCents || amountInCents < 200) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid amount. Minimum amount is R2.00 (200 cents)' }) };
    }

    // Create checkout session with Yoco
    const response = await axios.post(
      YOCO_API_URL,
      {
        amount: amountInCents,
        currency,
        success_url: successUrl,
        cancel_url: cancelUrl,
        failure_url: failureUrl,
        metadata: { ...metadata, saveCard }
      },
      {
        headers: {
          'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const checkoutId = response.data.id;
    const redirectUrl = response.data.url;

    // Update existing payment if provided, otherwise create a new record as a fallback
    const nowIso = new Date().toISOString();
    const paymentIdFromClient = metadata?.paymentId;
    try {
      if (paymentIdFromClient) {
        await db.collection('payments').doc(paymentIdFromClient).set({
          checkout_id: checkoutId,
          checkout_url: redirectUrl,
          updated_at: nowIso,
          metadata: { ...metadata, saveCard },
        }, { merge: true });
      } else {
        await db.collection('payments').add({
          order_id: metadata.orderId || null,
          amount_cents: amountInCents,
          currency,
          status: 'pending',
          payment_provider: 'yoco',
          provider_payment_id: null,
          checkout_id: checkoutId,
          checkout_url: redirectUrl,
          error_message: null,
          metadata: { ...metadata, saveCard },
          created_at: nowIso,
          updated_at: nowIso,
        });
      }
    } catch (firestoreError) {
      // Log but do not fail the checkout creation – client will still receive the redirect URL
      console.warn('Firestore write failed during checkout creation:', firestoreError);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ redirectUrl, checkoutId }) };
  } catch (error) {
    console.error('Error creating Yoco checkout:', error.response?.data || error);

    if (error.response?.data) {
      return { statusCode: error.response.status, headers, body: JSON.stringify({ error: error.response.data.message || 'Payment service error' }) };
    }

    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
