import admin from 'firebase-admin';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getDb, logPaymentEvent } from './_shared.js';

const db = getDb();

const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET;

// Simple in-memory rate limiter (best-effort, not durable across cold starts)
const rateLimitState = new Map();
const isRateLimited = (key, limit, windowMs) => {
  const now = Date.now();
  const entry = rateLimitState.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  rateLimitState.set(key, entry);
  return entry.count > limit;
};

const getClientIp = (headers) => {
  const nfIp = headers?.['x-nf-client-connection-ip'];
  if (nfIp) return nfIp;
  const xff = headers?.['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return headers?.['client-ip'] || 'unknown';
};

const bufferFromEventBody = (event) => {
  if (!event || !event.body) return Buffer.from('');
  return event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body, 'utf8');
};

const constantTimeEqual = (a, b) => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
};

const verifyHmacIfPresent = (event, secret) => {
  if (!secret) return false;
  const rawBody = bufferFromEventBody(event);
  const headerSig = event.headers?.['x-polar-signature'] || event.headers?.['X-Polar-Signature'] || event.headers?.['x-polar-hmac'];
  if (!headerSig) return false;

  // Try to extract the signature value from common formats
  let provided = String(headerSig).trim();
  if (provided.includes(',')) {
    // e.g., t=timestamp,v1=signature
    const parts = provided.split(',').map(p => p.trim());
    const v1 = parts.find(p => p.startsWith('v1='));
    if (v1) provided = v1.slice(3);
  }
  if (provided.startsWith('sha256=')) {
    provided = provided.slice('sha256='.length);
  }

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return constantTimeEqual(provided, expected);
};

const mapPolarStatusToLocal = (status) => {
  switch (status) {
    case 'succeeded':
    case 'paid':
      return 'succeeded';
    case 'failed':
      return 'failed';
    case 'canceled':
    case 'cancelled':
      return 'canceled';
    case 'processing':
      return 'processing';
    case 'refunded':
      return 'refunded';
    default:
      return 'pending';
  }
};

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.CLIENT_BASE_URL || event.headers?.origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    // Basic rate-limit to protect endpoint (per ip)
    const ip = getClientIp(event.headers || {});
    if (isRateLimited(`webhook:${ip}`, 120, 60_000)) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too Many Requests' }) };
    }

    // Verify HMAC signature if provided, otherwise allow shared-secret header fallback
    if (WEBHOOK_SECRET) {
      const hmacOk = verifyHmacIfPresent(event, WEBHOOK_SECRET);
      const sharedOk = (() => {
        const provided = event.headers?.['x-webhook-secret'] || event.headers?.['X-Webhook-Secret'];
        return provided && provided === WEBHOOK_SECRET;
      })();
      if (!hmacOk && !sharedOk) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
    }

    const payload = JSON.parse(event.body || '{}');
    const type = payload.type || payload.event || null;
    const data = payload.data || payload.checkout || payload;

    const checkoutId = data?.id || data?.checkout_id || null;
    const orderId = data?.metadata?.orderId || null;
    const localStatus = mapPolarStatusToLocal(data?.status || (type?.includes('succeeded') ? 'succeeded' : undefined));

    if (db && checkoutId) {
      const snap = await db.collection('payments').where('checkout_id', '==', checkoutId).limit(1).get();
      if (!snap.empty) {
        const paymentRef = snap.docs[0].ref;
        await paymentRef.update({
          status: localStatus,
          provider_payment_id: data?.payment_id || data?.id || null,
          updated_at: new Date().toISOString(),
          metadata: { ...(snap.docs[0].data().metadata || {}), polarWebhookData: data },
          payment_provider: 'polar'
        });

        const paymentData = snap.docs[0].data();
        const relatedOrderId = paymentData.order_id || orderId;
        if (localStatus === 'succeeded' && relatedOrderId) {
          await db.collection('orders').doc(relatedOrderId).set({
            status: 'paid',
            payment_id: snap.docs[0].id,
            updated_at: new Date().toISOString(),
          }, { merge: true });
        }

        await logPaymentEvent(db, {
          type: 'webhook',
          provider: 'polar',
          paymentId: snap.docs[0].id,
          checkoutId,
          orderId: relatedOrderId || orderId,
          status: localStatus,
        });
      }
    }

    if (db && localStatus === 'succeeded' && orderId) {
      await db.collection('orders').doc(orderId).set({
        status: 'paid',
        updated_at: new Date().toISOString(),
      }, { merge: true });
      await logPaymentEvent(db, {
        type: 'order_updated',
        provider: 'polar',
        orderId,
        status: 'paid',
      });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (error) {
    console.error('Polar webhook error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};


