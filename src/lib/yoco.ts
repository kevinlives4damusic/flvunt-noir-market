import axios from 'axios';
import { createCheckout } from './api';

// In the browser context, we only need the public key
const yocoPublicKey = import.meta.env.VITE_YOCO_PUBLIC_KEY;

if (!yocoPublicKey) {
  console.warn('Yoco Public Key is not defined in environment variables.');
}

interface YocoCheckoutResponse {
  success: boolean;
  data?: {
    checkoutId?: string;
    redirectUrl?: string;
  };
  error?: {
    message: string;
  };
}

/**
 * Client-side function to initiate Yoco checkout through our serverless function
 */
export const initiateYocoCheckout = async (
  amountInCents: number,
  currency: string = 'ZAR',
  successUrl?: string,
  cancelUrl?: string,
  failureUrl?: string,
  metadata?: Record<string, any>
): Promise<YocoCheckoutResponse> => {
  // Validate minimum amount for ZAR
  if (currency === 'ZAR' && amountInCents < 200) {
    return {
      success: false,
      error: { message: 'Yoco requires a minimum amount of R2.00 (200 cents).' }
    };
  }

  try {
    // Call our serverless function via the API client
    const result = await createCheckout(
      amountInCents,
      currency,
      successUrl,
      cancelUrl,
      failureUrl,
      metadata
    );

    if (!result.success) {
      return { 
        success: false, 
        error: { 
          message: typeof result.error === 'string' 
            ? result.error 
            : 'Failed to create checkout' 
        } 
      };
    }

    return {
      success: true,
      data: {
        redirectUrl: result.data.redirectUrl
      }
    };
  } catch (error) {
    console.error('Error initiating Yoco checkout:', error);
    return { 
      success: false, 
      error: { 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      } 
    };
  }
};

/**
 * Get the Yoco public key for client-side operations
 */
export const getYocoPublicKey = () => yocoPublicKey;

// Note: The webhook signature verification is now handled in the serverless function