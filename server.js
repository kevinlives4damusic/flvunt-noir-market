import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Import handlers from Netlify functions
import { handler as ordersHandler } from './netlify/functions/orders.js';
import { handler as paystackInitHandler } from './netlify/functions/paystack-init.js';
import { handler as paystackWebhookHandler } from './netlify/functions/paystack-webhook.js';
import { handler as paymentsHandler } from './netlify/functions/payments.js';
import { handler as refundPaymentHandler } from './netlify/functions/refund-payment.js';
import { handler as adminListHandler } from './netlify/functions/admin-list.js';
import { handler as adminReplayHandler } from './netlify/functions/admin-replay.js';
import { handler as adminRefundMockHandler } from './netlify/functions/admin-refund-mock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_BASE_URL || 'http://localhost:5173';

app.use(cors({ origin: clientOrigin }));

// Handle raw body for webhook
app.use('/api/paystack-webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Adapter to convert Express req to Netlify event
const netlifyAdapter = (handler) => async (req, res) => {
  try {
    const event = {
      httpMethod: req.method,
      headers: req.headers,
      path: req.path,
      // Netlify functions expect body as string, but Express parses it to JSON if headers allow.
      // We need to handle both cases.
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
      isBase64Encoded: false, // simplified
      rawUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      rawQuery: req.url.split('?')[1] || '',
    };
    
    // For webhook, we might need the raw buffer if signature verification fails with parsed JSON
    if (req.originalUrl.includes('webhook') && Buffer.isBuffer(req.body)) {
       event.body = req.body.toString('utf8');
       event.isBase64Encoded = false; 
    }

    const response = await handler(event);
    
    // Convert Netlify response to Express response
    if (response.headers) {
      Object.keys(response.headers).forEach(key => {
        res.setHeader(key, response.headers[key]);
      });
    }
    
    res.status(response.statusCode).send(response.body);
  } catch (error) {
    console.error('Function adapter error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register routes
app.all('/api/orders', netlifyAdapter(ordersHandler));
app.all('/api/paystack-init', netlifyAdapter(paystackInitHandler));
app.all('/api/paystack-webhook', netlifyAdapter(paystackWebhookHandler));
app.all('/api/payments/:id', (req, res, next) => {
    // Netlify functions extract ID from path manually usually, 
    // but our payments.js expects the last part of path to be ID.
    // The adapter preserves the path, so it should work.
    netlifyAdapter(paymentsHandler)(req, res, next);
});
app.all('/api/refund-payment', netlifyAdapter(refundPaymentHandler));

// Admin routes
app.all('/api/admin-list', netlifyAdapter(adminListHandler));
app.all('/api/admin-replay', netlifyAdapter(adminReplayHandler));
app.all('/api/admin-refund-mock', netlifyAdapter(adminRefundMockHandler));

// Legacy endpoints returning 410
app.post('/api/create-yoco-checkout', (_req, res) => {
  return res.status(410).json({ error: 'Legacy Yoco checkout disabled.' });
});

app.post('/api/webhook', (_req, res) => {
  return res.status(410).json({ error: 'Legacy Yoco webhook disabled.' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Accepting requests from: ${clientOrigin}`);
  console.log(`Local backend ready. Proxies from Vite configured to this port.`);
});
