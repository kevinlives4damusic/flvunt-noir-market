
import { supabase } from './supabase';
import { PaymentError, PaymentErrorCode, createPaymentError } from './payment-errors';

// Netlify function URL for creating Yoco checkout
const createCheckoutUrl = '/.netlify/functions/create-yoco-checkout';

// Get Yoco public key from environment variables
const yocoPublicKey = import.meta.env.VITE_YOCO_PUBLIC_KEY || 'pk_test_076a52e0R4velyDbbd24';

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

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Yoco checkout error:', errorData);
      
      return {
        success: false,
        error: {
          message: errorData.error || 'Failed to create checkout session',
          detail: `HTTP Status: ${response.status}`
        }
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        redirectUrl: data.redirectUrl,
        checkoutId: data.checkoutId
      }
    };
  } catch (error) {
    console.error('Error initiating Yoco checkout:', error);
    
    return {
      success: false,
      error: error instanceof Error ? 
        { message: error.message, detail: 'Client-side error' } : 
        'Unknown error creating checkout'
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
