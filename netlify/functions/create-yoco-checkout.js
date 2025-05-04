import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const YOCO_API_URL = 'https://online.yoco.com/v1/checkout/';
const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;

if (!YOCO_SECRET_KEY) {
  throw new Error('YOCO_SECRET_KEY is not set in environment variables');
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { 
      amountInCents, 
      currency = 'ZAR',
      successUrl,
      cancelUrl,
      failureUrl,
      metadata 
    } = JSON.parse(event.body);

    // Validate required fields
    if (!amountInCents || amountInCents < 200) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid amount. Minimum amount is R2.00 (200 cents)' 
        }),
      };
    }

    // Create checkout session with Yoco
    const response = await axios.post(
      YOCO_API_URL,
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        redirectUrl: response.data.url,
        checkoutId: response.data.id
      }),
    };
  } catch (error) {
    console.error('Error creating Yoco checkout:', error.response?.data || error);

    // Handle Yoco API errors
    if (error.response?.data) {
      return {
        statusCode: error.response.status,
        headers,
        body: JSON.stringify({ error: error.response.data.message || 'Payment service error' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
