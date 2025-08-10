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
  if (cleaned.length < 13 || cleaned.length > 16) return false;

  // Luhn algorithm validation
  let sum = 0;
  let isEven = false;
  
  // Loop through values starting from the rightmost
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i));

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

export const getCardType = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.match(/^4/)) return 'visa';
  if (cleaned.match(/^5[1-5]/)) return 'mastercard';
  if (cleaned.match(/^3[47]/)) return 'amex';
  if (cleaned.match(/^6/)) return 'discover';
  return 'unknown';
};

export const validateExpiryDate = (expiryDate: string): { isValid: boolean; error?: string } => {
  const [month, year] = expiryDate.split('/').map(Number);
  if (!month || !year) return { isValid: false, error: 'Invalid format' };
  
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  
  if (month < 1 || month > 12) return { isValid: false, error: 'Invalid month' };
  if (year < currentYear) return { isValid: false, error: 'Card has expired' };
  if (year === currentYear && month < currentMonth) return { isValid: false, error: 'Card has expired' };
  
  return { isValid: true };
};

export const validateCVV = (cvv: string, cardType: string = 'unknown'): { isValid: boolean; error?: string } => {
  const cleaned = cvv.replace(/\D/g, '');
  const requiredLength = cardType === 'amex' ? 4 : 3;
  
  if (cleaned.length !== requiredLength) {
    return { 
      isValid: false, 
      error: `CVV must be ${requiredLength} digits${cardType === 'amex' ? ' for American Express' : ''}`
    };
  }
  
  return { isValid: true };
};