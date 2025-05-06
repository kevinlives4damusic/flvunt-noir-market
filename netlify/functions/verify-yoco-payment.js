
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

// Get Yoco API key from environment variables
const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
const YOCO_API_BASE = 'https://online.yoco.com/v1';

// Headers required for Yoco API calls
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${YOCO_SECRET_KEY}`
};

exports.handler = async function(event, context) {
  // Set up CORS headers for browser requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Only accept POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { checkoutId } = requestBody;
    
    if (!checkoutId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing checkout ID' })
      };
    }
    
    if (!YOCO_SECRET_KEY) {
      console.error('Yoco secret key is not set in environment variables');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Payment provider configuration error' })
      };
    }

    // Call Yoco API to get checkout status
    console.log(`Verifying Yoco checkout with ID: ${checkoutId}`);
    
    const response = await fetch(
      `${YOCO_API_BASE}/checkouts/${checkoutId}`,
      { 
        method: 'GET',
        headers
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error from Yoco API:', data);
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: data.message || 'Error verifying payment',
          status: 'failed' 
        })
      };
    }
    
    // Map Yoco status to our status format
    let status;
    if (data.status === 'paid') {
      status = 'succeeded';
    } else if (data.status === 'cancelled') {
      status = 'canceled';
    } else if (data.status === 'failed') {
      status = 'failed';  
    } else {
      status = 'processing';
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: status === 'succeeded',
        status,
        checkoutId,
        paymentId: data.payments && data.payments[0] ? data.payments[0].id : null,
        metadata: data.metadata || {}
      })
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to verify payment',
        message: error.message,
        status: 'failed'
      })
    };
  }
};
