import { OrderItem } from './orderService';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'paypal';
  icon: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaymentMetadata {
  orderId: string;
  customerName: string;
  orderItems?: OrderItem[];
  [key: string]: any;
}

export const SUPPORTED_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    type: 'card',
    icon: 'credit-card'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    type: 'paypal',
    icon: 'paypal-logo.png'
  }
];

export const PAYMENT_ERROR_CODES = {
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  CARD_DECLINED: 'CARD_DECLINED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  EXPIRED_CARD: 'EXPIRED_CARD',
  INVALID_CARD: 'INVALID_CARD',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

export const getErrorMessage = (code: keyof typeof PAYMENT_ERROR_CODES): string => {
  const messages: Record<string, string> = {
    INVALID_AMOUNT: 'The payment amount is invalid',
    CARD_DECLINED: 'Your card was declined. Please try another card',
    INSUFFICIENT_FUNDS: 'Insufficient funds on your card',
    EXPIRED_CARD: 'Your card has expired',
    INVALID_CARD: 'Invalid card details provided',
    PROCESSING_ERROR: 'Error processing your payment',
    NETWORK_ERROR: 'Network error occurred. Please try again'
  };
  
  return messages[code] || 'An unknown error occurred';
};

export const formatAmount = (amount: number, currency: string = 'ZAR'): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency
  }).format(amount);
};

export const validateCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\D/g, '');
  return cleaned.length >= 13 && cleaned.length <= 16;
};

export const validateExpiryDate = (expiryDate: string): boolean => {
  const [month, year] = expiryDate.split('/').map(Number);
  if (!month || !year) return false;
  
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  
  return (
    month >= 1 && 
    month <= 12 && 
    year >= currentYear && 
    (year > currentYear || month >= currentMonth)
  );
};

export const validateCVV = (cvv: string): boolean => {
  const cleaned = cvv.replace(/\D/g, '');
  return cleaned.length >= 3 && cleaned.length <= 4;
};