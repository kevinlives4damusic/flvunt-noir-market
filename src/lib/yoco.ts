import { supabase } from './supabase';
import { PaymentError, PaymentErrorCode, createPaymentError } from './payment-errors';

// Local server API URL for creating Yoco checkout
const API_BASE_URL = 'http://localhost:5000';
const createCheckoutUrl = `${API_BASE_URL}/api/create-yoco-checkout`;

// Get Yoco public key from environment variables
const yocoPublicKey = import.meta.env.VITE_YOCO_PUBLIC_KEY;

export interface YocoCheckoutResponse {
  success: boolean;
  data?: {
    checkoutId?: string;
    redirectUrl?: string;
  };
  error?: {
    message: string;
    code?: string;
    detail?: string;
  } | string;
}

/**
 * Create a new Yoco checkout session
 */
export const initiateYocoCheckout = async (
  amountInCents: number,
  currency: string = 'ZAR',
  successUrl?: string,
  cancelUrl?: string,
  failureUrl?: string,
  metadata: Record<string, any> = {},
  saveCard: boolean = false
): Promise<YocoCheckoutResponse> => {
  try {
    console.log('Initiating Yoco checkout with:', { amountInCents, currency, metadata });
    
    const response = await fetch(createCheckoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amountInCents,
        currency,
        successUrl,
        cancelUrl, 
        failureUrl,
        metadata,
        saveCard
      }),
    });

    // Try to parse the response as JSON, with error handling
    let jsonResponse;
    try {
      jsonResponse = await response.json();
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      return {
        success: false,
        error: {
          message: 'Invalid response from payment service',
          detail: 'Could not parse server response'
        }
      };
    }

    if (!response.ok || !jsonResponse.success) {
      console.error('Checkout error:', jsonResponse);
      return {
        success: false,
        error: {
          message: jsonResponse.error || 'Failed to create checkout session',
          detail: `HTTP Status: ${response.status}`
        }
      };
    }

    // Store checkout info in Supabase
    if (metadata?.orderId) {
      await supabase.from('payments').insert({
        order_id: metadata.orderId,
        amount_cents: amountInCents,
        currency,
        status: 'pending',
        payment_provider: 'yoco',
        checkout_id: jsonResponse.checkoutId,
        checkout_url: jsonResponse.redirectUrl,
        metadata
      });
    }

    console.log('Checkout created successfully:', jsonResponse);
    return {
      success: true,
      data: {
        redirectUrl: jsonResponse.redirectUrl,
        checkoutId: jsonResponse.checkoutId
      }
    };
  } catch (error) {
    console.error('Error initiating Yoco checkout:', error);
    return {
      success: false,
      error: error instanceof Error ? 
        { message: error.message, detail: 'Client-side error' } : 
        { message: 'Unknown error creating checkout', detail: 'Network or server error' }
    };
  }
};

/**
 * Verify Yoco payment status
 * This should be called after a user returns from Yoco checkout page
 */
export const verifyYocoPayment = async (checkoutId: string): Promise<{
  success: boolean;
  status?: string;
  error?: PaymentError;
}> => {
  try {
    // Query our database for the payment record
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('checkout_id', checkoutId);
    
    if (error || !payments || payments.length === 0) {
      return {
        success: false,
        error: createPaymentError(
          PaymentErrorCode.PAYMENT_VERIFICATION_FAILED,
          'Payment not found',
          `No payment record found for checkout ID ${checkoutId}`
        )
      };
    }
    
    const payment = payments[0];
    const isSuccessful = payment.status === 'succeeded';
    
    return {
      success: isSuccessful,
      status: payment.status
    };
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: createPaymentError(
        PaymentErrorCode.PAYMENT_VERIFICATION_FAILED,
        error instanceof Error ? error.message : 'Failed to verify payment',
        'An unexpected error occurred'
      )
    };
  }
};
