import axios from 'axios';
import { getDb, verifyAuthIfRequired, json, isAdmin, logPaymentEvent } from './_shared.js';

export const handler = async (event) => {
  const allowOrigin = process.env.CLIENT_BASE_URL || event.headers?.origin || '*';
  if (event.httpMethod === 'OPTIONS') return json(204, {}, allowOrigin);
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, allowOrigin);


  const authResult = await verifyAuthIfRequired(event);
  if (!authResult.ok) return json(401, { error: authResult.error }, allowOrigin);
  if (!isAdmin(authResult.decoded)) return json(403, { error: 'Admin required' }, allowOrigin);

  const db = getDb();
  if (!db) return json(503, { error: 'Database not available' }, allowOrigin);

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) return json(500, { error: 'Paystack not configured' }, allowOrigin);

  try {
    const { paymentId, amountInCents } = JSON.parse(event.body || '{}');
    if (!paymentId) return json(400, { error: 'paymentId required' }, allowOrigin);

    const ref = db.collection('payments').doc(paymentId);
    const snap = await ref.get();
    if (!snap.exists) return json(404, { error: 'Payment not found' }, allowOrigin);
    const payment = { id: snap.id, ...snap.data() };

    const currentStatus = payment.status;
    if (!['succeeded', 'partially_refunded'].includes(currentStatus)) {
      return json(400, { error: 'Refund not allowed for current status' }, allowOrigin);
    }

    const total = Number(payment.amount_cents) || 0;
    const alreadyRefunded = Number(payment.refunded_amount_cents || 0);
    const remaining = Math.max(total - alreadyRefunded, 0);

    let refundAmount = remaining;
    if (amountInCents !== undefined && amountInCents !== null) {
      if (amountInCents <= 0) return json(400, { error: 'Invalid refund amount' }, allowOrigin);
      if (amountInCents > remaining) return json(400, { error: 'Amount exceeds remaining refundable' }, allowOrigin);
      refundAmount = amountInCents;
    }

    // Call Paystack refund API if reference is present
    if (payment.provider_payment_id) {
      await axios.post(
        'https://api.paystack.co/refund',
        { transaction: payment.provider_payment_id, amount: refundAmount },
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
      );
    }

    const newRefunded = alreadyRefunded + refundAmount;
    const newStatus = newRefunded >= total ? 'refunded' : 'partially_refunded';

    await ref.set({
      status: newStatus,
      refunded_amount_cents: newRefunded,
      metadata: {
        ...(payment.metadata || {}),
        refunds: [
          ...((payment.metadata?.refunds) || []),
          { amount_cents: refundAmount, at: new Date().toISOString() }
        ],
      },
      updated_at: new Date().toISOString(),
    }, { merge: true });

    if (payment.order_id) {
      await db.collection('orders').doc(payment.order_id).set({
        status: newStatus === 'refunded' ? 'refunded' : 'paid',
        updated_at: new Date().toISOString(),
      }, { merge: true });
    }

    await logPaymentEvent(db, {
      type: 'refund',
      paymentId,
      amount_cents: refundAmount,
      status: newStatus,
    });

    return json(200, { success: true, status: newStatus, refundedAmountInCents: newRefunded }, allowOrigin);

  } catch (err) {
    console.error('Refund error:', err?.response?.data || err.message);
    return json(500, { error: 'Server error' }, allowOrigin);
  }
};



