
import { supabase } from './supabase';
import { PaymentError, PaymentErrorCode, createPaymentError } from './payment-errors';
import apiClient from './api';
import { toast } from 'sonner';

// Use the API client from lib/api.ts for consistent error handling
const createCheckoutUrl = '/api/create-yoco-checkout';

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
    console.log('Initiating Yoco checkout with params:', { amountInCents, currency, successUrl, cancelUrl, failureUrl });
    
    const paymentData = {
      amountInCents,
      currency,
      successUrl,
      cancelUrl, 
      failureUrl,
      metadata,
      saveCard
    };
    
    let response;
    let errorOccurred = false;
    
    // First try to use the server.js endpoint
    try {
      console.log('Attempting to use server.js endpoint...');
      response = await fetch(`${window.location.origin}/api/create-yoco-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        console.warn(`Server responded with status: ${response.status}`);
        errorOccurred = true;
      }
    } catch (serverError) {
      // Log the error but try Netlify function as fallback
      console.warn('Error with server.js:', serverError);
      errorOccurred = true;
    }
    
    // If server.js failed, fallback to Netlify function
    if (errorOccurred || !response) {
      console.log('Falling back to Netlify function...');
      response = await fetch('/.netlify/functions/create-yoco-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || `HTTP Error: ${response.status}` };
        }
        
        console.error('Yoco checkout error from Netlify function:', errorData);
        return {
          success: false,
          error: {
            message: errorData.error || 'Failed to create checkout session',
            detail: `HTTP Status: ${response.status}`
          }
        };
      }
    }
    
    if (!response) {
      return {
        success: false,
        error: {
          message: 'All payment endpoints failed',
          detail: 'Both server.js and Netlify function attempts failed'
        }
      };
    }
    
    try {
      const data = await response.json();
      console.log('Checkout response:', data);
      
      if (!data.redirectUrl) {
        return {
          success: false,
          error: {
            message: 'Invalid checkout response',
            detail: 'Response did not contain redirect URL'
          }
        };
      }
      
      return {
        success: true,
        data: {
          redirectUrl: data.redirectUrl,
          checkoutId: data.checkoutId
        }
      };
    } catch (parseError) {
      console.error('Error parsing response:', parseError, 'Response text:', await response.text());
      return {
        success: false,
        error: {
          message: 'Failed to parse checkout response',
          detail: parseError instanceof Error ? parseError.message : 'Unknown error'
        }
      };
    }
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
    console.log('Verifying payment with checkout ID:', checkoutId);
    
    // Query our database for the payment record
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('checkout_id', checkoutId);
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    if (!payments || payments.length === 0) {
      console.warn('No payment found for checkout ID:', checkoutId);
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
    console.log('Found payment:', payment);
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
