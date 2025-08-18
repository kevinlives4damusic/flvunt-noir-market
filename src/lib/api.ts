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

// Placeholder API for checkout (no provider configured)
export const createCheckout = async (
  _amountInCents: number,
  _currency: string = 'ZAR',
  _successUrl?: string,
  _cancelUrl?: string,
  _failureUrl?: string,
  _metadata?: Record<string, any>,
  _saveCard: boolean = false
) => {
  return {
    success: false,
    error: 'Payment provider not configured'
  } as const;
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

// Paystack
export const createPaystackCheckout = async (
  orderId: string,
  amountInCents: number,
  currency: string,
  successUrl?: string,
  cancelUrl?: string,
  failureUrl?: string,
  metadata?: Record<string, any>,
  idempotencyKey?: string,
  saveCard?: boolean,
) => {
  try {
    const res = await apiClient.post('/paystack-init', {
      orderId,
      amountInCents,
      currency,
      successUrl,
      cancelUrl,
      failureUrl,
      metadata,
      idempotencyKey,
      saveCard: !!saveCard,
    });
    return { success: true, data: res.data as { redirectUrl: string; paymentId: string; checkoutId?: string } } as const;
  } catch (error) {
    console.error('Error creating Paystack checkout:', error);
    return {
      success: false,
      error: axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Unknown error'
    } as const;
  }
};
