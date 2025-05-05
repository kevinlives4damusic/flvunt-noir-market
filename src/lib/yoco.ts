
import axios from 'axios';
import { createCheckout } from './api';
import { supabase } from './supabase';
import { PaymentErrorCode, createPaymentError, PaymentError } from './payment-errors';

// Get Yoco public key from environment variables
const yocoPublicKey = import.meta.env.VITE_YOCO_PUBLIC_KEY || 'pk_test_076a52e0R4velyDbbd24';

if (!yocoPublicKey) {
  console.warn('Yoco Public Key is not defined in environment variables.');
}

// Legacy interface kept for backward compatibility
export interface YocoError {
  message: string;
  code?: string;
  detail?: string;
}

// Use PaymentError from payment-errors.ts for new code

export interface YocoCheckoutResponse {
  success: boolean;
  data?: {
    checkoutId?: string;
    redirectUrl?: string;
  };
  error?: YocoError | PaymentError;
}

const MINIMUM_AMOUNT = {
  ZAR: 200, // R2.00 in cents
  USD: 50,  // $0.50 in cents
};

export const validateAmount = (amount: number, currency: string): PaymentError | null => {
  const minAmount = MINIMUM_AMOUNT[currency as keyof typeof MINIMUM_AMOUNT] || 50;
  if (amount < minAmount) {
    return createPaymentError(
      PaymentErrorCode.INVALID_AMOUNT,
      `Minimum amount for ${currency} is ${(minAmount / 100).toFixed(2)}`,
      `Amount must be at least ${(minAmount / 100).toFixed(2)} ${currency}`
    );
  }
  return null;
};

export const initiateYocoCheckout = async (
  amountInCents: number,
  currency: string = 'ZAR',
  successUrl?: string,
  cancelUrl?: string,
  failureUrl?: string,
  metadata?: Record<string, any>,
  saveCard: boolean = false
): Promise<YocoCheckoutResponse> => {
  try {
    // Validate amount first
    const amountError = validateAmount(amountInCents, currency);
    if (amountError) {
      return {
        success: false,
        error: amountError
      };
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: createPaymentError(
          PaymentErrorCode.AUTHENTICATION_REQUIRED,
          'User must be authenticated to make payments',
          'Authentication is required to process payments'
        )
      };
    }

    // Add user ID and timestamp to metadata for tracking
    const enrichedMetadata = {
      ...metadata,
      userId: user.id,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE || 'development'
    };

    console.log('Initiating Yoco checkout with amount:', amountInCents, currency);

    // Call our serverless function via the API client
    const result = await createCheckout(
      amountInCents,
      currency,
      successUrl,
      cancelUrl,
      failureUrl,
      enrichedMetadata
    );

    if (!result.success) {
      console.error('Checkout creation failed:', result.error);
      return {
        success: false,
        error: createPaymentError(
          PaymentErrorCode.CHECKOUT_FAILED,
          typeof result.error === 'string' ? result.error : 'Failed to create checkout',
          'The payment gateway could not create a checkout session'
        )
      };
    }

    console.log('Yoco checkout created successfully:', {
      checkoutId: result.data.checkoutId,
      hasRedirectUrl: !!result.data.redirectUrl
    });

    return {
      success: true,
      data: {
        checkoutId: result.data.checkoutId,
        redirectUrl: result.data.redirectUrl
      }
    };

  } catch (error) {
    console.error('Error initiating Yoco checkout:', error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error || error.message;
      return {
        success: false,
        error: createPaymentError(
          PaymentErrorCode.API_ERROR,
          errorMessage,
          error.response?.data?.detail,
          error
        )
      };
    }

    return {
      success: false,
      error: createPaymentError(
        PaymentErrorCode.CHECKOUT_FAILED,
        error instanceof Error ? error.message : 'Unknown error occurred',
        'An unexpected error occurred while creating the checkout',
        error
      )
    };
  }
};

export const getYocoPublicKey = () => yocoPublicKey;
