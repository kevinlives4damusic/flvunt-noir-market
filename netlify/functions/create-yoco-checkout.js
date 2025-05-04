import { createYocoCheckout } from '../../src/lib/yoco';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.YOCO_SECRET_KEY) {
  console.error('Error: YOCO_SECRET_KEY is required but not set in environment variables');
}

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { amountInCents, currency, successUrl, cancelUrl, failureUrl, metadata } = JSON.parse(event.body);
    
    if (typeof amountInCents !== 'number' || amountInCents <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid amountInCents' }),
      };
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
      return {
        statusCode: 500,
        body: JSON.stringify({ error: result.error?.message || 'Checkout creation failed' }),
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ redirectUrl: result.data.redirectUrl }),
    };
  } catch (err) {
    console.error('Error in create-yoco-checkout:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
};
