import axios from 'axios';
import { createCheckout } from './api';
import { auth } from './firebase';
import { PaymentErrorCode, createPaymentError, PaymentError } from './payment-errors';

const yocoPublicKey = import.meta.env.VITE_YOCO_PUBLIC_KEY;
const YOCO_API_BASE = 'https://online.yoco.com/v1';

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
    paymentId?: string;
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
    const user = auth().currentUser;
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
      userId: user.uid,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE || 'development'
    };

    // Call our serverless function via the API client
    const result = await createCheckout(
      amountInCents,
      currency,
      successUrl,
      cancelUrl,
      failureUrl,
      enrichedMetadata,
      saveCard
    );

    if (!result.success) {
      return {
        success: false,
        error: createPaymentError(
          PaymentErrorCode.CHECKOUT_FAILED,
          typeof result.error === 'string' ? result.error : 'Failed to create checkout',
          'The payment gateway could not create a checkout session'
        )
      };
    }

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

export const verifyYocoPayment = async (checkoutId: string): Promise<{ 
  success: boolean; 
  status?: string; 
  error?: PaymentError;
}> => {
  try {
    const response = await axios.get(
      `${YOCO_API_BASE}/checkouts/${checkoutId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${yocoPublicKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      status: response.data.status
    };
  } catch (error) {
    console.error('Error verifying Yoco payment:', error);
    return {
      success: false,
      error: createPaymentError(
        PaymentErrorCode.PAYMENT_VERIFICATION_FAILED,
        error instanceof Error ? error.message : 'Failed to verify payment',
        'Could not verify payment status with Yoco'
      )
    };
  }
};

export const getYocoPublicKey = () => yocoPublicKey;