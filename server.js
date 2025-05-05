import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_BASE_URL || 'http://localhost:8080';

// Enable CORS with proper configuration
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Yoco API configuration
const YOCO_API_URL = 'https://online.yoco.com/v1/checkout/';
const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;

if (!YOCO_SECRET_KEY) {
  console.error('Error: YOCO_SECRET_KEY not found in environment variables');
  console.log('Available environment variables:', Object.keys(process.env));
  process.exit(1);
}

// Create Yoco checkout endpoint
app.post('/api/create-yoco-checkout', async (req, res) => {
  try {
    const { 
      amountInCents, 
      currency = 'ZAR', 
      successUrl, 
      cancelUrl, 
      failureUrl, 
      metadata = {},
      saveCard = false 
    } = req.body;

    console.log('Received checkout request:', {
      amountInCents,
      currency,
      metadata,
      urls: { successUrl, cancelUrl, failureUrl }
    });

    if (!amountInCents || amountInCents < 200) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid amount. Minimum amount is R2.00 (200 cents)' 
      });
    }

    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    try {
      const response = await axios.post(
        YOCO_API_URL,
        {
          amount: amountInCents,
          currency,
          success_url: successUrl,
          cancel_url: cancelUrl,
          failure_url: failureUrl,
          metadata,
          save_card: saveCard
        },
        {
          headers: {
            'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          }
        }
      );

      console.log('Yoco checkout created:', {
        id: response.data.id,
        hasUrl: !!response.data.url
      });

      return res.json({
        success: true,
        redirectUrl: response.data.url,
        checkoutId: response.data.id
      });
    } catch (yocoError) {
      console.error('Yoco API error:', yocoError.response?.data || yocoError);
      return res.status(yocoError.response?.status || 500).json({
        success: false,
        error: yocoError.response?.data?.message || 'Payment service error'
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

/**
 * Verify the webhook signature from Yoco
 */
const verifyYocoSignature = (payload, signature, secret) => {
  if (!secret || !signature) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

// Webhook endpoint - verifies Yoco signature
app.post('/api/webhook', express.raw({ type: '*/*' }), (req, res) => {
  const signature = req.headers['x-yoco-signature'];
  const payload = req.body.toString();
  const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('YOCO_WEBHOOK_SECRET not set, skipping signature verification');
    // Process the webhook anyway in development
    console.log('Received Yoco webhook:', payload);
    return res.sendStatus(200);
  }
  
  if (typeof signature === 'string' && verifyYocoSignature(payload, signature, webhookSecret)) {
    console.log('Verified Yoco webhook:', payload);
    
    // TODO: Update payment status in database
    // This would typically call a function to update the payment status
    // based on the webhook payload
    
    return res.sendStatus(200);
  } else {
    console.warn('Yoco webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('CORS enabled for:', ['http://localhost:8080', 'http://localhost:5173']);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    port,
    clientOrigin
  });
});
