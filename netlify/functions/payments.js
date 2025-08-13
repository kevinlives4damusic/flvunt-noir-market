import admin from 'firebase-admin';
import { getDb, verifyAuthIfRequired, json, isAdmin } from './_shared.js';

export const handler = async (event) => {
  const allowOrigin = process.env.CLIENT_BASE_URL || event.headers?.origin || '*';
  const db = getDb();
  if (event.httpMethod === 'OPTIONS') return json(204, {}, allowOrigin);
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' }, allowOrigin);

  const authResult = await verifyAuthIfRequired(event);
  if (!authResult.ok) return json(401, { error: authResult.error }, allowOrigin);

  const parts = (event.path || '').split('/').filter(Boolean);
  // Expected: /.netlify/functions/payments/:id  -> parts ends with ['.netlify','functions','payments',':id'] or '/api/payments/:id' via redirect
  const id = parts[parts.length - 1];
  if (!id || id === 'payments') return json(400, { error: 'Payment id required' }, allowOrigin);

  try {
    if (!db) return json(503, { error: 'Database not available' }, allowOrigin);
    const snap = await db.collection('payments').doc(id).get();
    if (!snap.exists) return json(404, { error: 'Not found' }, allowOrigin);
    const payment = { id: snap.id, ...snap.data() };

    // AuthZ: owner or admin
    if (process.env.REQUIRE_AUTH === 'true') {
      const uid = authResult.decoded?.uid;
      if (!isAdmin(authResult.decoded) && payment.user_id && payment.user_id !== uid) {
        return json(403, { error: 'Forbidden' }, allowOrigin);
      }
    }

    return json(200, {
      id: payment.id,
      orderId: payment.order_id || null,
      amountInCents: payment.amount_cents,
      currency: payment.currency,
      status: payment.status,
      paymentProvider: payment.payment_provider,
      providerPaymentId: payment.provider_payment_id || null,
      checkoutId: payment.checkout_id || null,
      checkoutUrl: payment.checkout_url || null,
      errorMessage: payment.error_message || null,
      metadata: payment.metadata || null,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    }, allowOrigin);
  } catch (err) {
    console.error('Get payment error:', err);
    return json(500, { error: 'Server error' }, allowOrigin);
  }
};


