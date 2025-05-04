import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YOCO_WEBHOOK_SECRET = process.env.YOCO_WEBHOOK_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

if (!YOCO_WEBHOOK_SECRET) {
  console.warn('YOCO_WEBHOOK_SECRET is not set. Webhook signature verification will be skipped.');
}

// Initialize Supabase client with service role for admin privileges
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Verify the webhook signature from Yoco
 * @param {string} payload - The raw request body
 * @param {string} signature - The signature from the X-Yoco-Signature header
 * @param {string} secret - The webhook secret
 * @returns {boolean} - Whether the signature is valid
 */
const verifyYocoSignature = (payload, signature, secret) => {
  if (!secret || !signature) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
};

/**
 * Map Yoco payment status to our internal payment status
 */
const mapYocoStatus = (yocoStatus) => {
  switch (yocoStatus) {
    case 'succeeded':
      return 'succeeded';
    case 'failed':
      return 'failed';
    case 'canceled':
      return 'canceled';
    case 'processing':
      return 'processing';
    case 'refunded':
      return 'refunded';
    case 'partially_refunded':
      return 'partially_refunded';
    default:
      return 'pending';
  }
};

/**
 * Update payment record in database
 */
const updatePayment = async (checkoutId, paymentData) => {
  // Find payment by checkout ID
  const { data: payments, error: findError } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('checkout_id', checkoutId);
    
  if (findError || !payments || payments.length === 0) {
    console.error('Payment not found for checkout ID:', checkoutId);
    return { success: false, error: 'Payment not found' };
  }
  
  const payment = payments[0];
  
  // Update payment with new status and provider payment ID
  const { data, error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      status: mapYocoStatus(paymentData.status),
      provider_payment_id: paymentData.payment_id,
      updated_at: new Date().toISOString(),
      metadata: {
        ...payment.metadata,
        yocoWebhookData: paymentData
      }
    })
    .eq('id', payment.id)
    .select()
    .single();
    
  if (updateError) {
    console.error('Error updating payment:', updateError);
    return { success: false, error: updateError };
  }
  
  return { success: true, payment: data };
};

/**
 * Update order status after successful payment
 */
const updateOrderAfterPayment = async (orderId, paymentId, status) => {
  // Only update order if payment was successful
  if (status !== 'succeeded') return { success: true };
  
  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'paid',
      payment_id: paymentId,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);
    
  if (error) {
    console.error('Error updating order after payment:', error);
    return { success: false, error };
  }
  
  return { success: true };
};

export const handler = async (event, context) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    const payload = event.body;
    const signature = event.headers['x-yoco-signature'];
    const paymentData = JSON.parse(payload);
    
    // Log webhook event for debugging
    console.log('Received Yoco webhook:', {
      event: paymentData.type,
      checkoutId: paymentData.checkout_id,
      status: paymentData.status
    });
    
    // Verify webhook signature if secret is available
    if (YOCO_WEBHOOK_SECRET && !verifyYocoSignature(payload, signature, YOCO_WEBHOOK_SECRET)) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }
    
    // Process different webhook event types
    switch (paymentData.type) {
      case 'payment.succeeded':
      case 'payment.failed':
      case 'payment.canceled':
      case 'payment.processing':
      case 'payment.refunded':
      case 'payment.partially_refunded':
        // Update payment record
        const updateResult = await updatePayment(paymentData.checkout_id, paymentData);
        
        if (!updateResult.success) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: updateResult.error })
          };
        }
        
        // Update order if payment was successful
        if (updateResult.payment) {
          await updateOrderAfterPayment(
            updateResult.payment.order_id,
            updateResult.payment.id,
            updateResult.payment.status
          );
        }
        
        break;
        
      default:
        console.log('Unhandled webhook event type:', paymentData.type);
    }
    
    // Always return 200 to acknowledge receipt
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
