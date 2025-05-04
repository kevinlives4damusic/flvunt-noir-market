import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables for Supabase');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const verifyYocoSignature = (signature, payload) => {
  // TODO: Implement Yoco signature verification
  return true; // For now, we'll trust all webhooks in development
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const signature = event.headers['x-yoco-signature'];
    const payload = JSON.parse(event.body);
    
    if (!verifyYocoSignature(signature, event.body)) {
      console.warn('Yoco webhook verification failed');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    const { type, data } = payload;
    const orderId = data?.metadata?.orderId;

    if (!orderId) {
      console.warn('No order ID in webhook payload');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing order ID' }),
      };
    }

    let newStatus;
    switch (type) {
      case 'payment.succeeded':
        newStatus = 'paid';
        break;
      case 'payment.failed':
        newStatus = 'failed';
        break;
      case 'payment.cancelled':
        newStatus = 'cancelled';
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Webhook received but no action taken' }),
        };
    }

    // Update order status in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        payment_id: data.id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update order status' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Webhook processed successfully' }),
    };
  } catch (err) {
    console.error('Error in webhook handler:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
};
