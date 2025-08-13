import axios from 'axios';
import { auth } from './firebase';

const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Create an axios instance for API calls
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000,
});

// Attach Firebase ID token if present
apiClient.interceptors.request.use(async (config) => {
  try {
    const user = auth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      // Axios types require AxiosHeaders; set via set method when available
      if ((config.headers as any)?.set) {
        (config.headers as any).set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` } as any;
      }
    }
  } catch {
    // ignore
  }
  return config;
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

export const getPaymentStatus = async (paymentId: string) => {
  try {
    const response = await apiClient.get(`/payments/${encodeURIComponent(paymentId)}`);
    return { success: true, data: response.data } as const;
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return {
      success: false,
      error: axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Unknown error'
    } as const;
  }
};

export const createOrderServer = async (
  items: Array<{ product_id: string; quantity: number }>,
  currency: string = 'ZAR',
  metadata?: Record<string, any>
) => {
  try {
    const response = await apiClient.post('/orders', { items, currency, metadata });
    return { success: true, data: response.data } as const;
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Unknown error'
    } as const;
  }
};

export default apiClient;

// Admin helpers
export const adminList = async (type: 'orders' | 'payments', params?: { status?: string; id?: string; limit?: number }) => {
  const search = new URLSearchParams();
  if (type) search.set('type', type);
  if (params?.status) search.set('status', params.status);
  if (params?.id) search.set('id', params.id);
  if (params?.limit) search.set('limit', String(params.limit));
  const res = await apiClient.get(`/admin-list?${search.toString()}`);
  return res.data as { data: any[] };
};

export const adminRefundMock = async (paymentId: string, partial?: boolean) => {
  const res = await apiClient.post('/admin-refund-mock', { paymentId, partial: !!partial });
  return res.data as { success: boolean; status: string };
};

export const adminReplay = async (checkoutId: string) => {
  const res = await apiClient.post('/admin-replay', { checkout_id: checkoutId });
  return res.data as { success: boolean; status: string };
};
