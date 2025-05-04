import axios from 'axios';

const apiBaseUrl = '/.netlify/functions';  // Always use Netlify Functions

// Create an axios instance for API calls
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000,
});

// API functions for Yoco checkout
export const createCheckout = async (
  amountInCents: number,
  currency: string = 'ZAR',
  successUrl?: string,
  cancelUrl?: string,
  failureUrl?: string,
  metadata?: Record<string, any>,
  saveCard: boolean = false
) => {
  try {
    const response = await apiClient.post('/create-yoco-checkout', {
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
      data: response.data
    };
  } catch (error) {
    console.error('Error creating checkout:', error);
    return {
      success: false,
      error: axios.isAxiosError(error) 
        ? error.response?.data?.error || error.message
        : 'Unknown error'
    };
  }
};

export default apiClient;
