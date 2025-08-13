import { getDb, verifyAuthIfRequired, json } from './_shared.js';

const toCents = (value) => Math.round(Number(value || 0) * 100);

export const handler = async (event) => {
  const allowOrigin = process.env.CLIENT_BASE_URL || event.headers?.origin || '*';
  if (event.httpMethod === 'OPTIONS') return json(204, {}, allowOrigin);
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, allowOrigin);

  const authResult = await verifyAuthIfRequired(event);
  if (!authResult.ok) return json(401, { error: authResult.error }, allowOrigin);

  const db = getDb();
  if (!db) return json(503, { error: 'Database not available' }, allowOrigin);

  try {
    const { items = [], currency = 'ZAR', metadata = {} } = JSON.parse(event.body || '{}');
    if (!Array.isArray(items) || items.length === 0) return json(400, { error: 'Items required' }, allowOrigin);

    // Fetch product catalog entries and compute totals
    const productIds = Array.from(new Set(items.map((i) => i.product_id || i.productId).filter(Boolean)));
    if (productIds.length !== items.length) {
      return json(400, { error: 'Each item must include product_id' }, allowOrigin);
    }

    const productsSnap = await Promise.all(productIds.map((id) => db.collection('products').doc(id).get()));
    const productMap = new Map();
    for (const s of productsSnap) {
      if (!s.exists) return json(400, { error: `Product not found: ${s.id}` }, allowOrigin);
      productMap.set(s.id, { id: s.id, ...s.data() });
    }

    const orderItems = items.map((i) => {
      const pid = i.product_id || i.productId;
      const product = productMap.get(pid);
      const unitCents = product.price_cents != null ? Number(product.price_cents) : toCents(product.price);
      const qty = Math.max(1, Number(i.quantity || 1));
      return {
        product_id: pid,
        quantity: qty,
        price_cents: unitCents,
      };
    });

    const amount_cents = orderItems.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);

    const nowIso = new Date().toISOString();
    const orderDoc = await db.collection('orders').add({
      user_id: authResult.decoded?.uid || null,
      order_number: `FLV-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      amount_cents,
      currency,
      metadata,
      status: 'pending',
      created_at: nowIso,
      updated_at: nowIso,
    });

    const itemsCol = db.collection('orders').doc(orderDoc.id).collection('order_items');
    await Promise.all(orderItems.map((it) => itemsCol.add({ ...it, created_at: nowIso })));

    return json(200, {
      id: orderDoc.id,
      user_id: authResult.decoded?.uid || null,
      order_number: `FLV-${Date.now().toString().slice(-6)}000`,
      amount_cents,
      currency,
      metadata,
      status: 'pending',
      items: orderItems,
    }, allowOrigin);
  } catch (err) {
    console.error('Create order error:', err);
    return json(500, { error: 'Server error' }, allowOrigin);
  }
};


