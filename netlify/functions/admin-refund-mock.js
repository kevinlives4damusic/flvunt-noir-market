import { getDb, verifyAuthIfRequired, json, isAdmin, logPaymentEvent } from './_shared.js';

export const handler = async (event) => {
  const allowOrigin = process.env.CLIENT_BASE_URL || '*';
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': allowOrigin, 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, allowOrigin);

  const authResult = await verifyAuthIfRequired(event);
  if (!authResult.ok) return json(401, { error: authResult.error }, allowOrigin);
  if (!isAdmin(authResult.decoded)) return json(403, { error: 'Forbidden' }, allowOrigin);

  const db = getDb();
  if (!db) return json(500, { error: 'Database unavailable' }, allowOrigin);

  const { paymentId, partial = false } = JSON.parse(event.body || '{}');
  if (!paymentId) return json(400, { error: 'paymentId required' }, allowOrigin);

  try {
    const ref = db.collection('payments').doc(paymentId);
    const snap = await ref.get();
    if (!snap.exists) return json(404, { error: 'Payment not found' }, allowOrigin);

    const newStatus = partial ? 'partially_refunded' : 'refunded';
    await ref.set({ status: newStatus, updated_at: new Date().toISOString() }, { merge: true });
    await logPaymentEvent(db, {
      type: 'refund',
      provider: 'polar',
      paymentId,
      status: newStatus,
    });

    return json(200, { success: true, status: newStatus }, allowOrigin);
  } catch (e) {
    return json(500, { error: e?.message || 'Refund failed' }, allowOrigin);
  }
};



