import { verifyYocoWebhookSignature } from '../../src/lib/yoco';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const signature = event.headers['x-yoco-signature'];
    const payload = event.body;
    
    if (typeof signature === 'string' && verifyYocoWebhookSignature(signature, payload)) {
      console.log('Verified Yoco webhook:', payload);
      return {
        statusCode: 200,
        body: 'OK',
      };
    } else {
      console.warn('Yoco webhook verification failed');
      return {
        statusCode: 400,
        body: 'Invalid signature',
      };
    }
  } catch (err) {
    console.error('Error in webhook handler:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
};
