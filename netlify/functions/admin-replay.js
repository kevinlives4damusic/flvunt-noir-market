import axios from 'axios';
import { getDb, verifyAuthIfRequired, json, isAdmin, logPaymentEvent } from './_shared.js';

const POLAR_API_BASE = 'https://api.polar.sh/v1';

export const handler = async (event) => {
  const allowOrigin = process.env.CLIENT_BASE_URL || event.headers?.origin || '*';
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': allowOrigin, 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, allowOrigin);

  const authResult = await verifyAuthIfRequired(event);
  if (!authResult.ok) return json(401, { error: authResult.error }, allowOrigin);
  if (!isAdmin(authResult.decoded)) return json(403, { error: 'Forbidden' }, allowOrigin);

  const db = getDb();
  if (!db) return json(500, { error: 'Database unavailable' }, allowOrigin);

  const { checkout_id } = JSON.parse(event.body || '{}');
  if (!checkout_id) return json(400, { error: 'checkout_id required' }, allowOrigin);

  try {
    // Query Polar for checkout status (assumes API allows it)
    const apiKey = process.env.POLAR_API_KEY;
    const res = await axios.get(`${POLAR_API_BASE}/checkouts/${encodeURIComponent(checkout_id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const data = res.data || {};
    const status = data.status || data.checkout?.status || 'pending';

    // Update payment by checkout_id
    const snap = await db.collection('payments').where('checkout_id', '==', checkout_id).limit(1).get();
    if (snap.empty) return json(404, { error: 'Local payment not found' }, allowOrigin);
    const ref = snap.docs[0].ref;
    await ref.set({ status, updated_at: new Date().toISOString() }, { merge: true });
    await logPaymentEvent(db, { type: 'replay', provider: 'polar', paymentId: snap.docs[0].id, checkoutId: checkout_id, status });

    return json(200, { success: true, status }, allowOrigin);
  } catch (e) {
    return json(500, { error: e?.message || 'Replay failed' }, allowOrigin);
  }
};



