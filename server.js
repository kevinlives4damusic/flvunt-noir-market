import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto';

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
    const { amountInCents, currency = 'ZAR', successUrl, cancelUrl, failureUrl, metadata } = req.body;
    
    // Validate required fields
    if (typeof amountInCents !== 'number' || amountInCents < 200) {
      return res.status(400).json({ 
        error: 'Invalid amount. Minimum amount is R2.00 (200 cents)' 
      });
    }

    // Get Yoco API key from environment variables
    const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
    if (!YOCO_SECRET_KEY) {
      console.error('YOCO_SECRET_KEY is not set in environment variables');
      return res.status(500).json({ error: 'Payment service configuration error' });
    }

    // Log request details for debugging (excluding sensitive data)
    console.log('Creating Yoco checkout for amount:', amountInCents, currency);

    // Create checkout session with Yoco API
    try {
      const response = await axios.post(
        'https://online.yoco.com/v1/checkout/',
        {
          amount: amountInCents,
          currency,
          success_url: successUrl,
          cancel_url: cancelUrl,
          failure_url: failureUrl,
          metadata
        },
        {
          headers: {
            'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Return the checkout URL to the client
      return res.status(200).json({
        redirectUrl: response.data.url,
        checkoutId: response.data.id
      });
    } catch (yocoError) {
      // Handle Yoco API errors
      console.error('Yoco API error:', yocoError.response?.data || yocoError.message);
      
      return res.status(yocoError.response?.status || 500).json({ 
        error: yocoError.response?.data?.message || 'Payment service error' 
      });
    }
  } catch (err) {
    console.error('Error in /api/create-yoco-checkout:', err);
    return res.status(500).json({ error: 'Server error' });
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Accepting requests from: ${clientOrigin}`);
});
