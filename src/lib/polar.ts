import axios from 'axios';
import { auth } from './firebase';
import { PaymentErrorCode, createPaymentError, PaymentError } from './payment-errors';
import { createPolarCheckout } from './api';

export interface PolarCheckoutResponse {
  success: boolean;
  data?: {
    checkoutId?: string;
    redirectUrl?: string;
    paymentId?: string;
  };
  error?: PaymentError | { message: string; code?: string; detail?: string };
}

const MINIMUM_AMOUNT_BY_CURRENCY: Record<string, number> = {
  ZAR: 200,
  USD: 50,
};

export const validateAmount = (amount: number, currency: string): PaymentError | null => {
  const min = MINIMUM_AMOUNT_BY_CURRENCY[currency] ?? 50;
  if (amount < min) {
    return createPaymentError(
      PaymentErrorCode.INVALID_AMOUNT,
      `Minimum amount for ${currency} is ${(min / 100).toFixed(2)}`,
      `Amount must be at least ${(min / 100).toFixed(2)} ${currency}`
    );
  }
  return null;
};

export const initiatePolarCheckout = async (
  amountInCents: number,
  currency: string = 'ZAR',
  successUrl?: string,
  cancelUrl?: string,
  failureUrl?: string,
  metadata?: Record<string, any>,
  saveCard: boolean = false
): Promise<PolarCheckoutResponse> => {
  try {
    const amountError = validateAmount(amountInCents, currency);
    if (amountError) {
      return { success: false, error: amountError };
    }

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

    const enrichedMetadata = {
      ...metadata,
      userId: user.uid,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE || 'development',
    };

    const result = await createPolarCheckout(
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
        redirectUrl: result.data.redirectUrl,
        paymentId: result.data.paymentId,
      }
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.error || error.message;
      return {
        success: false,
        error: createPaymentError(PaymentErrorCode.API_ERROR, msg, error.response?.data?.detail, error)
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


