
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_BASE_URL || 'http://localhost:8080';

// Validate required environment variables
if (!process.env.YOCO_SECRET_KEY) {
  console.error('Warning: YOCO_SECRET_KEY is not set in environment variables, using default test key');
}

// Use the environment variable or default test key
const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY || 'sk_test_73ff60ff3mgAG1b03714801a36a5';
const YOCO_API_URL = 'https://online.yoco.com/v1/checkout/';

// Allow CORS for development
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Yoco checkout endpoint
app.post('/api/create-yoco-checkout', async (req, res) => {
  try {
    const { amountInCents, currency = 'ZAR', successUrl, cancelUrl, failureUrl, metadata, saveCard = false } = req.body;
    
    // Validate required fields
    if (typeof amountInCents !== 'number' || amountInCents < 200) {
      return res.status(400).json({ 
        error: 'Invalid amount. Minimum amount is R2.00 (200 cents)' 
      });
    }

    // Log request details for debugging (excluding sensitive data)
    console.log('Creating Yoco checkout for amount:', amountInCents, currency);

    // Include idempotency key to prevent duplicate charges
    const idempotencyKey = metadata?.idempotencyKey || 
      `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    // Create checkout session with Yoco API
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

// Webhook endpoint for Yoco
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
  
  // Verify webhook signature
  const hmac = crypto.createHmac('sha256', webhookSecret);
  const digest = hmac.update(payload).digest('hex');
  
  if (signature === digest) {
    console.log('Verified Yoco webhook:', payload);
    // TODO: Update payment status in database
    return res.sendStatus(200);
  } else {
    console.warn('Yoco webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// For any GET request, send index.html (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Accepting requests from: ${clientOrigin}`);
});
