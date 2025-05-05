
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts"

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const yocoWebhookSecret = Deno.env.get('YOCO_WEBHOOK_SECRET') || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Verify the webhook signature from Yoco
 */
const verifyYocoSignature = (payload: string, signature: string, secret: string): boolean => {
  if (!secret || !signature) return false;
  
  try {
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const message = encoder.encode(payload);
    
    // Create HMAC with SHA-256
    const hmacKey = crypto.subtle.importKey(
      "raw", key, { name: "HMAC", hash: "SHA-256" }, 
      false, ["sign", "verify"]
    );
    
    // Generate signature
    const generatedSignature = crypto.subtle.sign(
      { name: "HMAC" }, 
      hmacKey, 
      message
    );
    
    // Convert to hex
    const hashArray = new Uint8Array(generatedSignature);
    const hashHex = Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return hashHex === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

/**
 * Map Yoco payment status to our internal status
 */
const mapYocoStatus = (yocoStatus: string): string => {
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

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read and parse the webhook payload
    const payload = await req.text();
    const signature = req.headers.get('x-yoco-signature') || '';
    const paymentData = JSON.parse(payload);
    
    // Log webhook event for debugging
    console.log('Received Yoco webhook:', {
      event: paymentData.type,
      checkoutId: paymentData.checkout_id,
      status: paymentData.status
    });
    
    // Verify webhook signature if secret is available
    if (yocoWebhookSecret && !await verifyYocoSignature(payload, signature, yocoWebhookSecret)) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get orderId from metadata
    const orderId = paymentData.metadata?.orderId;
    if (!orderId) {
      console.error('Missing orderId in webhook data');
      return new Response(
        JSON.stringify({ error: 'Missing order information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find payment by checkout ID
    const { data: payments, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('checkout_id', paymentData.checkout_id);
      
    if (findError || !payments || payments.length === 0) {
      console.error('Payment not found for checkout ID:', paymentData.checkout_id);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const payment = payments[0];
    
    // Update payment status
    const status = mapYocoStatus(paymentData.status);
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status,
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
      return new Response(
        JSON.stringify({ error: 'Failed to update payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If payment was successful, update order status to paid
    if (status === 'succeeded') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_id: payment.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
        
      if (orderError) {
        console.error('Error updating order after successful payment:', orderError);
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, status }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
