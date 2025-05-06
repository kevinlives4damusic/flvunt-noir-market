
import { toast } from 'sonner';

// Define types for payment response
export type YocoResponse = {
  success: boolean;
  data?: {
    redirectUrl: string;
    checkoutId: string;
  };
  error?: string | { message: string; detail?: string };
};

export interface InitiatePaymentArgs {
  amountInCents: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
  metadata: Record<string, any>;
}

// Function to call the server-side endpoint for creating a Yoco checkout
export const initiateYocoCheckout = async (
  amountInCents: number,
  currency: string = 'ZAR',
  successUrl: string,
  cancelUrl: string,
  failureUrl: string,
  metadata: Record<string, any> = {},
  saveCard: boolean = false // Optional parameter
): Promise<YocoResponse> => {
  console.log('Initiating Yoco checkout with amount:', amountInCents);
  
  try {
    // First try to use the local server.js implementation
    const response = await fetchWithFallback(
      '/api/create-yoco-checkout',
      {
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
          saveCard, // Pass the saveCard option to the API
        }),
      }
    );

    // Check if the response is valid
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Yoco checkout error response:', errorData);
      let errorMessage = 'Payment service unavailable';
      
      try {
        // Try to parse as JSON if possible
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch (e) {
        // If not valid JSON, use text as is
        errorMessage = errorData || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Yoco checkout created successfully:', data);

    if (!data.redirectUrl) {
      throw new Error('Payment service returned invalid response');
    }

    return {
      success: true,
      data: {
        redirectUrl: data.redirectUrl,
        checkoutId: data.checkoutId || '',
      },
    };
  } catch (error) {
    console.error('Error initiating Yoco checkout:', error);
    toast.error('Payment initialization failed', {
      description: error instanceof Error ? error.message : 'Unable to connect to payment service'
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Function to verify a Yoco payment status
export const verifyYocoPayment = async (checkoutId: string): Promise<{
  success: boolean;
  status?: 'succeeded' | 'failed' | 'canceled' | 'processing';
  error?: {
    message: string;
    detail?: string;
  };
}> => {
  try {
    console.log('Verifying Yoco payment with checkout ID:', checkoutId);
    
    const response = await fetchWithFallback(
      '/api/verify-yoco-payment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ checkoutId }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Yoco verification error response:', errorData);
      let errorMessage = 'Payment verification failed';
      
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch (e) {
        errorMessage = errorData || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Yoco payment verification result:', data);
    
    return {
      success: data.status === 'succeeded',
      status: data.status,
      error: data.error ? { message: data.error } : undefined
    };
  } catch (error) {
    console.error('Error verifying Yoco payment:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown verification error',
        detail: 'An error occurred while verifying the payment status'
      }
    };
  }
};

// Utility function that tries different API endpoints
const fetchWithFallback = async (url: string, options: RequestInit): Promise<Response> => {
  // List of URLs to try in order
  const urlsToTry = [
    url, // First try the direct URL
    `${window.location.origin}/api/create-yoco-checkout`, // Then try with origin
    `https://api.netlify.com/.netlify/functions/create-yoco-checkout`, // Finally try Netlify functions
  ];
  
  let lastError;
  
  // Try each URL in sequence
  for (const currentUrl of urlsToTry) {
    try {
      console.log(`Trying API endpoint: ${currentUrl}`);
      const response = await fetch(currentUrl, options);
      
      // If we get any response (even an error), return it
      if (response) {
        console.log(`Got response from ${currentUrl} with status ${response.status}`);
        return response;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${currentUrl}:`, error);
      lastError = error;
    }
  }
  
  // If all attempts fail, throw the last error
  throw lastError || new Error('All payment API endpoints failed');
};
