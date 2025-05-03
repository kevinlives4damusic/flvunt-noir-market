import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createYocoCheckout, verifyYocoWebhookSignature } from './src/lib/yoco.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_BASE_URL || 'http://localhost:8080';

// Validate required environment variables
if (!process.env.YOCO_SECRET_KEY) {
  console.error('Error: YOCO_SECRET_KEY is required but not set in environment variables');
  process.exit(1);
}

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/create-yoco-checkout', async (req, res) => {
  try {
    const { amountInCents, currency, successUrl, cancelUrl, failureUrl, metadata } = req.body;
    if (typeof amountInCents !== 'number' || amountInCents <= 0) {
      return res.status(400).json({ error: 'Invalid amountInCents' });
    }
    const result = await createYocoCheckout(
      amountInCents,
      currency,
      successUrl,
      cancelUrl,
      failureUrl,
      metadata
    );
    if (!result.success) {
      console.error('Yoco checkout creation failed:', result.error);
      return res.status(500).json({ error: result.error?.message || 'Checkout creation failed' });
    }
    return res.json({ redirectUrl: result.data.redirectUrl });
  } catch (err) {
    console.error('Error in /api/create-yoco-checkout:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Webhook endpoint - verifies Yoco signature
app.post('/api/webhook', express.raw({ type: '*/*' }), (req, res) => {
  const signature = req.headers['x-yoco-signature'];
  const payload = req.body.toString();
  if (typeof signature === 'string' && verifyYocoWebhookSignature(signature, payload)) {
    console.log('Verified Yoco webhook:', payload);
    res.sendStatus(200);
  } else {
    console.warn('Yoco webhook verification failed');
    res.sendStatus(400);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Accepting requests from: ${clientOrigin}`);
});
