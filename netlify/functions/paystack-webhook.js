import crypto from 'crypto';
import { getDb, json, logPaymentEvent } from './_shared.js';

export const handler = async (event) => {
  const allowOrigin = process.env.CLIENT_BASE_URL || event.headers?.origin || '*';
  if (event.httpMethod === 'OPTIONS') return json(204, {}, allowOrigin);
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, allowOrigin);

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return json(500, { error: 'Paystack not configured' }, allowOrigin);

  const signature = event.headers['x-paystack-signature'] || event.headers['X-Paystack-Signature'];
  if (!signature) return json(401, { error: 'Signature missing' }, allowOrigin);

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : (event.body || '');

  const computed = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  if (computed !== signature) return json(401, { error: 'Invalid signature' }, allowOrigin);

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json(400, { error: 'Invalid JSON' }, allowOrigin);
  }

  const db = getDb();
  if (!db) return json(503, { error: 'Database not available' }, allowOrigin);

  try {
    const eventType = payload.event || '';
    const data = payload.data || {};
    const reference = data.reference || data.reference_code || null;
    const meta = data.metadata || {};
    const paymentId = meta.paymentId || null;
    const orderId = meta.orderId || null;

    if (!paymentId && !reference) {
      return json(400, { error: 'Missing reference/paymentId' }, allowOrigin);
    }

    let paymentRef = null;
    if (paymentId) {
      paymentRef = db.collection('payments').doc(String(paymentId));
    } else if (reference) {
      const snap = await db.collection('payments').where('provider_payment_id', '==', reference).limit(1).get();
      if (!snap.empty) paymentRef = snap.docs[0].ref;
    }
    if (!paymentRef) return json(404, { error: 'Payment not found' }, allowOrigin);

    let newStatus = 'processing';
    let errorMessage = null;
    
    // Handle various Paystack event types
    if (eventType === 'charge.success' || eventType === 'charge.successful' || data.status === 'success') {
      newStatus = 'succeeded';
    } else if (eventType === 'charge.failed' || eventType === 'charge.failure' || data.status === 'failed') {
      newStatus = 'failed';
      errorMessage = data.gateway_response || data.message || 'Payment failed';
    } else if (eventType === 'charge.pending' || data.status === 'pending') {
      newStatus = 'pending';
    } else if (eventType === 'charge.refunded' || data.status === 'refunded') {
      newStatus = 'refunded';
    }

    await paymentRef.set({
      status: newStatus,
      provider_payment_id: reference || null,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
      metadata: { ...(meta || {}) },
    }, { merge: true });

    if (newStatus === 'succeeded' && orderId) {
      const orderRef = db.collection('orders').doc(String(orderId));
      const orderSnap = await orderRef.get();
      if (orderSnap.exists) {
        await orderRef.set({ status: 'paid', updated_at: new Date().toISOString() }, { merge: true });
      }
    }

    await logPaymentEvent(db, { type: 'webhook', provider: 'paystack', paymentId: paymentId || null, reference, status: newStatus });

    return json(200, { success: true }, allowOrigin);
  } catch (err) {
    console.error('Paystack webhook error:', err);
    return json(500, { error: 'Server error' }, allowOrigin);
  }
};
