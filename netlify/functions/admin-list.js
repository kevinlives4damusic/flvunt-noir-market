import { getDb, verifyAuthIfRequired, json, isAdmin } from './_shared.js';

export const handler = async (event) => {
  const allowOrigin = process.env.CLIENT_BASE_URL || event.headers?.origin || '*';
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': allowOrigin, 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } };
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' }, allowOrigin);

  const authResult = await verifyAuthIfRequired(event);
  if (!authResult.ok) return json(401, { error: authResult.error }, allowOrigin);
  if (!isAdmin(authResult.decoded)) return json(403, { error: 'Forbidden' }, allowOrigin);

  const db = getDb();
  if (!db) return json(500, { error: 'Database unavailable' }, allowOrigin);

  const url = new URL(event.rawUrl || `http://localhost${event.path}${event.rawQuery ? '?' + event.rawQuery : ''}`);
  const type = url.searchParams.get('type') || 'payments';
  const status = url.searchParams.get('status');
  const limitParam = Number(url.searchParams.get('limit') || '50');
  const searchId = url.searchParams.get('id');

  try {
    let col = type === 'orders' ? 'orders' : 'payments';
    let q = db.collection(col).orderBy('created_at', 'desc');
    if (status) q = q.where('status', '==', status);
    if (searchId) {
      // Direct fetch by ID when provided
      const snap = await db.collection(col).doc(searchId).get();
      if (!snap.exists) return json(200, { data: [] }, allowOrigin);
      return json(200, { data: [{ id: snap.id, ...snap.data() }] }, allowOrigin);
    }
    const snap = await q.limit(limitParam).get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return json(200, { data }, allowOrigin);
  } catch (e) {
    return json(500, { error: e?.message || 'Query failed' }, allowOrigin);
  }
};



