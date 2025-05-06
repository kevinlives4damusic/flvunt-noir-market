
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Get the current directory and file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration - ensure proper access
app.use(cors({
  origin: '*', // For development; restrict in production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));

// Parse JSON requests
app.use(express.json());

// Serve static files from the 'dist' directory
app.use(express.static('dist'));

// Verify dist directory exists in production
const checkDistDirectory = () => {
  if (process.env.NODE_ENV === 'production') {
    if (!fs.existsSync(path.join(__dirname, 'dist'))) {
      console.error('ERROR: dist directory does not exist. Build the app before starting the server in production mode.');
    } else {
      console.log('dist directory exists and will be served');
    }
  }
};

checkDistDirectory();

// API Routes
app.post('/api/create-yoco-checkout', async (req, res) => {
  console.log('Received request to create Yoco checkout:', req.body);
  
  // Use the environment variable or default test key
  const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY || 'sk_test_73ff60ff3mgAG1b03714801a36a5';
  const YOCO_API_URL = 'https://online.yoco.com/v1/checkout/';

  try {
    const { 
      amountInCents, 
      currency = 'ZAR',
      successUrl,
      cancelUrl,
      failureUrl,
      metadata,
      saveCard = false
    } = req.body;

    // Validate required fields
    if (!amountInCents || amountInCents < 200) {
      console.error('Invalid amount:', amountInCents);
      return res.status(400).json({ 
        error: 'Invalid amount. Minimum amount is R2.00 (200 cents)' 
      });
    }

    console.log('Creating Yoco checkout for amount:', amountInCents, currency);
    console.log('Success URL:', successUrl);
    console.log('Failure URL:', failureUrl);

    // Include idempotency key to prevent duplicate charges
    const idempotencyKey = metadata?.idempotencyKey || 
      `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    // Create checkout session with Yoco
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

    console.log('Yoco checkout created successfully:', {
      id: response.data.id,
      hasUrl: !!response.data.url
    });

    return res.status(200).json({
      redirectUrl: response.data.url,
      checkoutId: response.data.id
    });
  } catch (error) {
    console.error('Error creating Yoco checkout:', error.response?.data || error);

    // Handle Yoco API errors
    if (error.response?.data) {
      return res.status(error.response.status || 500).json({ 
        error: error.response.data.message || 'Payment service error' 
      });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    nodejs: process.version,
    env: process.env.NODE_ENV || 'development'
  });
});

// API debug info route
app.get('/api/info', (req, res) => {
  res.status(200).json({
    serverRunning: true,
    apiVersion: '1.0',
    environment: process.env.NODE_ENV || 'development',
    hasYocoKey: !!process.env.YOCO_SECRET_KEY
  });
});

// Handle React routing, return the main index.html for all routes
app.get('*', (req, res) => {
  console.log('Serving index.html for path:', req.path);
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log(`- POST /api/create-yoco-checkout`);
  console.log(`- GET /api/health`);
  console.log(`- GET /api/info`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
