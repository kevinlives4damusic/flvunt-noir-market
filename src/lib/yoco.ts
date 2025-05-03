import axios from 'axios';

// Ensure environment variables are correctly handled by Vite
// You might need to prefix them with VITE_ in your .env file (e.g., VITE_YOCO_SECRET_KEY)
// See: https://vitejs.dev/guide/env-and-mode.html
const yocoSecretKey = import.meta.env.VITE_YOCO_SECRET_KEY;
const yocoPublicKey = import.meta.env.VITE_YOCO_PUBLIC_KEY; // Public key might be used client-side

// Correct Base URL from Yoco Documentation
const yocoApiBaseUrl = 'https://payments.yoco.com/api';

if (!yocoSecretKey) {
  console.error('Yoco Secret Key (VITE_YOCO_SECRET_KEY) is not defined in environment variables.');
  // In a real app, you might want to throw an error here to prevent startup
}

// Create an axios instance pre-configured for Yoco API calls
const yocoApiClient = axios.create({
  baseURL: yocoApiBaseUrl,
  headers: {
    'Authorization': `Bearer ${yocoSecretKey}`, // Correct auth method confirmed by docs
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased timeout slightly
});

// --- Yoco API Functions ---

/**
 * Creates a Yoco Checkout session.
 * This should be called from your backend server.
 * See: https://developer.yoco.com/online/api-reference/checkout/payments/accept-payments/
 *
 * @param amountInCents The amount to charge in cents (must be >= 200 for ZAR).
 * @param currency The currency code (e.g., 'ZAR').
 * @param successUrl Optional URL to redirect to on success.
 * @param cancelUrl Optional URL to redirect to on cancellation.
 * @param failureUrl Optional URL to redirect to on failure.
 * @param metadata Optional metadata object.
 * @returns An object containing the checkout ID and redirect URL, or an error.
 */
export const createYocoCheckout = async (
  amountInCents: number,
  currency: string = 'ZAR', // Default to ZAR as per docs
  successUrl?: string,
  cancelUrl?: string,
  failureUrl?: string,
  metadata?: Record<string, any>
) => {
  // Yoco requires amounts >= R2.00 (200 cents) for ZAR
  if (currency === 'ZAR' && amountInCents < 200) {
    const errorMsg = 'Yoco requires a minimum amount of R2.00 (200 cents).';
    console.error(errorMsg);
    return { success: false, error: { message: errorMsg } };
  }

  const checkoutEndpoint = '/checkouts'; // Correct endpoint from docs

  const payload: any = {
    amount: amountInCents,
    currency: currency,
  };

  // Add optional parameters if provided
  if (successUrl) payload.successUrl = successUrl;
  if (cancelUrl) payload.cancelUrl = cancelUrl;
  if (failureUrl) payload.failureUrl = failureUrl;
  if (metadata) payload.metadata = metadata;

  console.log('Attempting to create Yoco checkout with payload:', payload);

  try {
    // Note: Secret key must be defined for this call to authenticate
    if (!yocoSecretKey) throw new Error('Yoco secret key is missing.');

    const response = await yocoApiClient.post(checkoutEndpoint, payload);

    console.log('Yoco Checkout API Response:', response.data);

    if (response.data && response.data.id && response.data.redirectUrl) {
      return {
        success: true,
        data: {
          checkoutId: response.data.id,
          redirectUrl: response.data.redirectUrl,
        },
      };
    } else {
      throw new Error('Invalid response structure from Yoco Checkout API');
    }
  } catch (error) {
    let errorMsg = 'Unknown Yoco API error';
    if (axios.isAxiosError(error)) {
      errorMsg = error.response?.data?.message || error.message;
      console.error('Yoco Checkout API Error:', error.response?.status, error.response?.data || error.message);
    } else if (error instanceof Error) {
        errorMsg = error.message;
        console.error('Yoco Checkout Non-API Error:', errorMsg);
    } else {
        console.error('Unknown Yoco Checkout Error:', error);
    }

    return { success: false, error: { message: errorMsg } };
  }
};

// Public key might still be needed if using Yoco's inline/popup JS on the frontend
// But for the redirect flow, it's primarily backend driven.
export const getYocoPublicKey = () => yocoPublicKey;

// Placeholder for webhook verification - Implementation needed separately
export const verifyYocoWebhookSignature = (/* signature: string, payload: string | Buffer */) => {
    // TODO: Implement webhook signature verification using the secret key
    // See Yoco documentation for webhook security
    console.warn('Webhook verification not implemented!');
    return true; // Placeholder - MUST BE IMPLEMENTED SECURELY
}; 