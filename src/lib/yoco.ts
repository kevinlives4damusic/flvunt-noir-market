import axios from 'axios';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

// Use import.meta.env for Vite client-side env vars, process.env for server-side
const isServer = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

if (isServer) {
  dotenv.config();
}

const yocoSecretKey = isServer ? process.env.YOCO_SECRET_KEY : import.meta.env.VITE_YOCO_SECRET_KEY;
const yocoPublicKey = isServer ? process.env.YOCO_PUBLIC_KEY : import.meta.env.VITE_YOCO_PUBLIC_KEY;

// Correct Base URL from Yoco Documentation
const yocoApiBaseUrl = 'https://payments.yoco.com/api';

if (!yocoSecretKey && isServer) {
  throw new Error('Yoco Secret Key (YOCO_SECRET_KEY) is not defined in environment variables.');
}

if (!yocoPublicKey) {
  console.warn('Yoco Public Key is not defined in environment variables.');
}

// Create an axios instance pre-configured for Yoco API calls
const yocoApiClient = axios.create({
  baseURL: yocoApiBaseUrl,
  headers: {
    'Authorization': `Bearer ${yocoSecretKey}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

interface YocoCheckoutResponse {
  success: boolean;
  data?: {
    checkoutId: string;
    redirectUrl: string;
  };
  error?: {
    message: string;
  };
}

export const createYocoCheckout = async (
  amountInCents: number,
  currency: string = 'ZAR',
  successUrl?: string,
  cancelUrl?: string,
  failureUrl?: string,
  metadata?: Record<string, any>
): Promise<YocoCheckoutResponse> => {
  if (!isServer) {
    return {
      success: false,
      error: { message: 'createYocoCheckout must be called from the server' }
    };
  }

  if (currency === 'ZAR' && amountInCents < 200) {
    return {
      success: false,
      error: { message: 'Yoco requires a minimum amount of R2.00 (200 cents).' }
    };
  }

  const payload = {
    amount: amountInCents,
    currency,
    ...(successUrl && { successUrl }),
    ...(cancelUrl && { cancelUrl }),
    ...(failureUrl && { failureUrl }),
    ...(metadata && { metadata })
  };

  try {
    const response = await yocoApiClient.post('/checkouts', payload);

    if (response.data && response.data.id && response.data.redirectUrl) {
      return {
        success: true,
        data: {
          checkoutId: response.data.id,
          redirectUrl: response.data.redirectUrl,
        },
      };
    }
    
    throw new Error('Invalid response structure from Yoco Checkout API');
  } catch (error) {
    let errorMsg = 'Unknown Yoco API error';
    if (axios.isAxiosError(error)) {
      errorMsg = error.response?.data?.message || error.message;
      console.error('Yoco Checkout API Error:', error.response?.status, error.response?.data || error.message);
    } else if (error instanceof Error) {
      errorMsg = error.message;
      console.error('Yoco Checkout Non-API Error:', errorMsg);
    }

    return { success: false, error: { message: errorMsg } };
  }
};

export const getYocoPublicKey = () => yocoPublicKey;

export const verifyYocoWebhookSignature = (signature: string, payload: string): boolean => {
  if (!yocoSecretKey) {
    console.error('Cannot verify webhook: YOCO_SECRET_KEY missing.');
    return false;
  }
  
  try {
    const expected = crypto.createHmac('sha1', yocoSecretKey).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch (error) {
    console.error('Error verifying Yoco webhook signature:', error);
    return false;
  }
};