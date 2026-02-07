import axios from 'axios';
import { getDb, verifyAuthIfRequired, json, logPaymentEvent } from './_shared.js';

export const handler = async (event) => {
  const allowOrigin = process.env.CLIENT_BASE_URL || event.headers?.origin || '*';
  if (event.httpMethod === 'OPTIONS') return json(204, {}, allowOrigin);
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, allowOrigin);

  const authResult = await verifyAuthIfRequired(event);
  if (!authResult.ok) return json(401, { error: authResult.error }, allowOrigin);

  const db = getDb();
  if (!db) return json(503, { error: 'Database not available' }, allowOrigin);

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || '';
  if (!PAYSTACK_SECRET_KEY) return json(500, { error: 'Paystack not configured' }, allowOrigin);

  try {
    const {
      orderId,
      amountInCents,
      currency = 'ZAR',
      successUrl,
      cancelUrl,
      failureUrl,
      metadata = {},
      idempotencyKey,
      saveCard = false,
    } = JSON.parse(event.body || '{}');

    if (!orderId) return json(400, { error: 'orderId required' }, allowOrigin);
    const amount = Number(amountInCents);
    if (!amount || amount <= 0) return json(400, { error: 'Valid amountInCents required' }, allowOrigin);

    const userEmail = authResult.decoded?.email || metadata.customer_email;
    if (!userEmail) return json(400, { error: 'Customer email required' }, allowOrigin);

    const nowIso = new Date().toISOString();
    const paymentRef = await db.collection('payments').add({
      order_id: orderId,
      user_id: authResult.decoded?.uid || null,
      amount_cents: amount,
      currency,
      status: 'pending',
      payment_provider: 'paystack',
      provider_payment_id: null,
      checkout_id: null,
      checkout_url: null,
      error_message: null,
      metadata: { ...metadata, idempotencyKey, saveCard },
      created_at: nowIso,
      updated_at: nowIso,
    });

    // Build a stable reference; include idempotency if provided
    const reference = idempotencyKey || `${paymentRef.id}-${Date.now()}`;

    // Ensure success URL includes paymentId for client-side verification
    const baseSuccess = successUrl || (CLIENT_BASE_URL ? `${CLIENT_BASE_URL}/payment-success?orderId=${encodeURIComponent(orderId)}` : undefined);
    const urlHasQuery = baseSuccess && baseSuccess.includes('?');
    const callback_url = baseSuccess
      ? `${baseSuccess}${urlHasQuery ? '&' : '?'}paymentId=${encodeURIComponent(paymentRef.id)}`
      : undefined;

    const initPayload = {
      amount: amount, // cents for ZAR
      email: userEmail,
      currency,
      reference,
      callback_url,
      metadata: {
        ...metadata,
        paymentId: paymentRef.id,
        orderId,
        userId: authResult.decoded?.uid || null,
        saveCard,
        cancelUrl: cancelUrl || null,
        failureUrl: failureUrl || null,
      },
    };

    const initRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      initPayload,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );

    const data = initRes.data?.data || initRes.data || {};
    const authorization_url = data.authorization_url;
    const access_code = data.access_code || null;
    const paystack_reference = data.reference || reference;

    if (!authorization_url) {
      throw new Error('Paystack did not return authorization URL');
    }

    await paymentRef.update({
      status: 'processing',
      provider_payment_id: paystack_reference,
      checkout_id: access_code,
      checkout_url: authorization_url,
      updated_at: new Date().toISOString(),
    });

    await logPaymentEvent(db, {
      type: 'init',
      provider: 'paystack',
      paymentId: paymentRef.id,
      orderId,
      reference: paystack_reference,
    });

    return json(200, {
      success: true,
      redirectUrl: authorization_url,
      paymentId: paymentRef.id,
      checkoutId: access_code,
    }, allowOrigin);
  } catch (err) {
    console.error('Paystack init error:', err?.response?.data || err.message);
    try {
      const body = JSON.parse(event.body || '{}');
      const orderId = body?.orderId;
      const db2 = getDb();
      if (db2 && orderId) {
        const snap = await db2.collection('payments').where('order_id', '==', orderId).orderBy('created_at', 'desc').limit(1).get();
        if (!snap.empty) {
          await snap.docs[0].ref.set({ status: 'failed', error_message: err?.response?.data?.message || err.message, updated_at: new Date().toISOString() }, { merge: true });
        }
      }
    } catch {}
    return json(500, { success: false, error: 'Failed to initialize Paystack transaction' }, allowOrigin);
  }
};
