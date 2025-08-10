import * as dotenv from 'dotenv';
import crypto from 'crypto';
import admin from 'firebase-admin';

dotenv.config();

const YOCO_WEBHOOK_SECRET = process.env.YOCO_WEBHOOK_SECRET;

// Initialize Firebase Admin (service account via env var GOOGLE_APPLICATION_CREDENTIALS or env-based config)
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
  } catch (e) {
    console.error('Failed to initialize Firebase Admin SDK', e);
  }
}

const db = admin.firestore();

const verifyYocoSignature = (payload, signature, secret) => {
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

const mapYocoStatus = (yocoStatus) => {
  switch (yocoStatus) {
    case 'succeeded':
      return 'succeeded';
    case 'failed':
      return 'failed';
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

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const payload = event.body;
    const signature = event.headers['x-yoco-signature'];
    const paymentData = JSON.parse(payload);

    console.log('Received Yoco webhook:', {
      event: paymentData.type,
      checkoutId: paymentData.checkout_id,
      status: paymentData.status
    });

    if (YOCO_WEBHOOK_SECRET && !verifyYocoSignature(payload, signature, YOCO_WEBHOOK_SECRET)) {
      console.error('Invalid webhook signature');
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

    const checkoutId = paymentData.checkout_id;
    const newStatus = mapYocoStatus(paymentData.status);

    // Find payment by checkout ID
    const paymentsRef = db.collection('payments');
    const paymentsSnap = await paymentsRef.where('checkout_id', '==', checkoutId).limit(1).get();

    if (paymentsSnap.empty) {
      console.warn('Payment not found for checkout ID:', checkoutId);
      return { statusCode: 200, body: JSON.stringify({ message: 'No matching payment, acknowledged' }) };
    }

    const paymentDoc = paymentsSnap.docs[0];
    const payment = paymentDoc.data();

    await paymentDoc.ref.update({
      status: newStatus,
      provider_payment_id: paymentData.payment_id ?? null,
      updated_at: new Date().toISOString(),
      metadata: { ...(payment.metadata || {}), yocoWebhookData: paymentData }
    });

    // Save a placeholder payment method for the user if requested
    const saveCard = payment.metadata?.saveCard || paymentData.metadata?.saveCard;
    const userId = payment.metadata?.userId || paymentData.metadata?.userId;
    if (newStatus === 'succeeded' && saveCard && userId) {
      const methodId = `yoco_token_${String(checkoutId || '').slice(-8)}`;
      const brand = paymentData.card_brand || paymentData.metadata?.brand || 'card';
      const last4 = paymentData.last4 || paymentData.metadata?.lastFour || '0000';
      await db.collection('users').doc(userId).collection('payment_methods').doc(methodId).set({
        provider: 'yoco',
        method_id: methodId,
        brand,
        last4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { merge: true });
    }

    // Update order if successful
    if (newStatus === 'succeeded' && payment.order_id) {
      const orderRef = db.collection('orders').doc(payment.order_id);
      await orderRef.update({
        status: 'paid',
        payment_id: paymentDoc.id,
        updated_at: new Date().toISOString(),
      });
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
