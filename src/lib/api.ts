import axios from 'axios';

// Dynamically set the API base URL based on environment
const apiBaseUrl = process.env.NODE_ENV === 'production' 
  ? '/.netlify/functions'  // Use Netlify Functions in production
  : '/api';               // Use local Express server in development

console.log('API Base URL:', apiBaseUrl, 'Environment:', process.env.NODE_ENV);

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
