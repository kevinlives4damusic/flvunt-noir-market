import * as dotenv from 'dotenv';
import admin from 'firebase-admin';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';

dotenv.config();

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
const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET;

const mapPolarStatusToLocal = (status) => {
  switch (status) {
    case 'succeeded':
    case 'paid':
      return 'succeeded';
    case 'failed':
      return 'failed';
    case 'canceled':
    case 'cancelled':
      return 'canceled';
    case 'processing':
      return 'processing';
    case 'refunded':
      return 'refunded';
    default:
      return 'pending';
  }
};

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : Buffer.from(event.body || '', 'utf8');

    let verified;
    if (WEBHOOK_SECRET) {
      try {
        verified = validateEvent(rawBody, event.headers, WEBHOOK_SECRET);
      } catch (err) {
        if (err instanceof WebhookVerificationError) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
        }
        console.error('Webhook verification error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Verification failed' }) };
      }
    } else {
      verified = JSON.parse(rawBody.toString('utf8'));
    }

    const type = verified.type || verified.event || null;
    const data = verified.data || verified.checkout || verified;

    const checkoutId = data?.id || data?.checkout_id || null;
    const orderId = data?.metadata?.orderId || null;
    const localStatus = mapPolarStatusToLocal(data?.status || (type?.includes('succeeded') ? 'succeeded' : undefined));

    if (checkoutId) {
      const snap = await db.collection('payments').where('checkout_id', '==', checkoutId).limit(1).get();
      if (!snap.empty) {
        const paymentRef = snap.docs[0].ref;
        await paymentRef.update({
          status: localStatus,
          provider_payment_id: data?.payment_id || data?.id || null,
          updated_at: new Date().toISOString(),
          metadata: { ...(snap.docs[0].data().metadata || {}), polarWebhookData: data },
          payment_provider: 'polar'
        });

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

    if (localStatus === 'succeeded' && orderId) {
      await db.collection('orders').doc(orderId).set({
        status: 'paid',
        updated_at: new Date().toISOString(),
      }, { merge: true });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (error) {
    console.error('Polar webhook error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};


