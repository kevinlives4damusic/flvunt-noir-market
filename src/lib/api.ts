import axios from 'axios';

// Determine the API base URL based on environment
const isProduction = import.meta.env.PROD;
const apiBaseUrl = isProduction 
  ? '/.netlify/functions'  // When deployed to GitHub Pages with Netlify Functions
  : '/api';               // Local development with Express server

// Create an axios instance for API calls
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
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
  metadata?: Record<string, any>
) => {
  try {
    const response = await apiClient.post('/create-yoco-checkout', {
      amountInCents,
      currency,
      successUrl,
      cancelUrl,
      failureUrl,
      metadata
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
