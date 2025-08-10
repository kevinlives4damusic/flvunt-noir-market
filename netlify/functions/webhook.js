import * as dotenv from 'dotenv';
import admin from 'firebase-admin';
import { verifyYocoSignature } from './utils';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  try { admin.initializeApp(); } catch {}
}
const db = admin.firestore();

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const mapYocoStatusToLocal = (status) => {
  switch (status) {
    case 'succeeded':
      return 'succeeded';
    case 'failed':
      return 'failed';
    case 'cancelled':
    case 'canceled':
      return 'canceled';
    case 'processing':
      return 'processing';
    case 'refunded':
      return 'refunded';
    case 'partially_refunded':
      return 'partially_refunded';
    default:
      return 'pending';
  }
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const signature = event.headers['x-yoco-signature'];
    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
    const payloadString = event.body;
    const payload = JSON.parse(payloadString);

    if (webhookSecret && !verifyYocoSignature(payloadString, signature, webhookSecret)) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

    // Support both payload shapes: { type, data } and flat payment payloads
    const eventType = payload.type || payload.event || null;
    const data = payload.data || payload;

    const checkoutId = data.checkout_id || data.checkoutId || null;
    const orderId = data.metadata?.orderId || null;
    const yocoStatus = data.status || (eventType?.includes('succeeded') ? 'succeeded' : null);
    const localStatus = mapYocoStatusToLocal(yocoStatus);

    // If we can locate payment by checkoutId, update it
    if (checkoutId) {
      const snap = await db.collection('payments').where('checkout_id', '==', checkoutId).limit(1).get();
      if (!snap.empty) {
        const paymentRef = snap.docs[0].ref;
        await paymentRef.update({
          status: localStatus,
          provider_payment_id: data.payment_id ?? data.id ?? null,
          updated_at: new Date().toISOString(),
          metadata: { ...(snap.docs[0].data().metadata || {}), yocoWebhookData: data }
        });

        // Also update related order to paid on success
        const paymentData = snap.docs[0].data();
        const relatedOrderId = paymentData.order_id || orderId;
        if (localStatus === 'succeeded' && relatedOrderId) {
          await db.collection('orders').doc(relatedOrderId).set({
            status: 'paid',
            payment_id: snap.docs[0].id,
            updated_at: new Date().toISOString(),
          }, { merge: true });
        }
      }
    }

    // If no checkoutId match but we have an orderId and success, still update order
    if (localStatus === 'succeeded' && orderId) {
      await db.collection('orders').doc(orderId).set({
        status: 'paid',
        updated_at: new Date().toISOString(),
      }, { merge: true });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (error) {
    console.error('Error in webhook:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
