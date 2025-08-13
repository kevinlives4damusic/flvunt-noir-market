import axios from 'axios';
import { getDb, verifyAuthIfRequired, json, isAdmin, logPaymentEvent } from './_shared.js';

const POLAR_API_BASE = 'https://api.polar.sh/v1';
const POLAR_API_KEY = process.env.POLAR_API_KEY || null;
const POLAR_CLIENT_ID = process.env.POLAR_CLIENT_ID || null;
const POLAR_CLIENT_SECRET = process.env.POLAR_CLIENT_SECRET || null;

let cachedToken = null;
let cachedTokenExpiresAt = 0;
async function getPolarAccessToken() {
  if (POLAR_API_KEY) return POLAR_API_KEY;
  if (!POLAR_CLIENT_ID || !POLAR_CLIENT_SECRET) return null;
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt - 60_000) return cachedToken;
  const tokenUrl = 'https://api.polar.sh/oauth2/token';
  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const basic = Buffer.from(`${POLAR_CLIENT_ID}:${POLAR_CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(tokenUrl, body.toString(), {
    headers: { 'Authorization': `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const accessToken = res.data?.access_token;
  const expiresIn = Number(res.data?.expires_in || 3600) * 1000;
  if (!accessToken) return null;
  cachedToken = accessToken;
  cachedTokenExpiresAt = Date.now() + expiresIn;
  return accessToken;
}

export const handler = async (event) => {
  const allowOrigin = process.env.CLIENT_BASE_URL || event.headers?.origin || '*';
  if (event.httpMethod === 'OPTIONS') return json(204, {}, allowOrigin);
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, allowOrigin);

  const authResult = await verifyAuthIfRequired(event);
  if (!authResult.ok) return json(401, { error: authResult.error }, allowOrigin);
  if (!isAdmin(authResult.decoded)) return json(403, { error: 'Admin required' }, allowOrigin);

  const db = getDb();
  if (!db) return json(503, { error: 'Database not available' }, allowOrigin);

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

    // Attempt provider refund if configured (best-effort)
    try {
      const accessToken = await getPolarAccessToken();
      if (accessToken && payment.provider_payment_id) {
        await axios.post(
          `${POLAR_API_BASE}/refunds`,
          {
            payment_id: payment.provider_payment_id,
            amount: refundAmount,
            reason: 'requested_by_customer',
          },
          { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
        );
      }
    } catch (err) {
      console.warn('Provider refund call failed; proceeding to mark refund locally', err.response?.data || err.message);
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

    // If fully refunded, mark order refunded
    if (payment.order_id) {
      await db.collection('orders').doc(payment.order_id).set({
        status: 'refunded',
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
    console.error('Refund error:', err);
    return json(500, { error: 'Server error' }, allowOrigin);
  }
};



