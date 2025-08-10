import axios from 'axios';

const apiBaseUrl = '/api';

// Create an axios instance for API calls
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000,
});

// API function for Polar checkout
export const createPolarCheckout = async (
  amountInCents: number,
  currency: string = 'ZAR',
  successUrl?: string,
  cancelUrl?: string,
  failureUrl?: string,
  metadata?: Record<string, any>,
  saveCard: boolean = false
) => {
  try {
    const response = await apiClient.post('/create-polar-checkout', {
      amountInCents,
      currency,
      successUrl,
      cancelUrl,
      failureUrl,
      metadata,
      saveCard
    });

    return {
      success: true,
      data: response.data as { redirectUrl: string; checkoutId: string; paymentId?: string }
    };
  } catch (error) {
    console.error('Error creating Polar checkout:', error);
    return {
      success: false,
      error: axios.isAxiosError(error) 
        ? error.response?.data?.error || error.message
        : 'Unknown error'
    };
  }
};

export default apiClient;
