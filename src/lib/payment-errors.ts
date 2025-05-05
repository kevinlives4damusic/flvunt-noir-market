
export enum PaymentErrorCode {
  PAYMENT_CREATION_FAILED = 'PAYMENT_CREATION_FAILED',
  CHECKOUT_FAILED = 'CHECKOUT_FAILED',
  PAYMENT_VERIFICATION_FAILED = 'PAYMENT_VERIFICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  CARD_DECLINED = 'CARD_DECLINED',
  EXPIRED_CARD = 'EXPIRED_CARD',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  CARD_ERROR = 'CARD_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface PaymentError {
  code: PaymentErrorCode;
  message: string;
  detail?: string;
  originalError?: any;
}

export const createPaymentError = (
  code: PaymentErrorCode,
  message: string,
  detail?: string,
  originalError?: any
): PaymentError => ({
  code,
  message,
  detail,
  originalError
});

export const handlePaymentError = (error: PaymentError | string): string => {
  if (typeof error === 'string') {
    return error;
  }

  // User-friendly error messages based on error code
  switch (error.code) {
    case PaymentErrorCode.PAYMENT_CREATION_FAILED:
      return 'We couldn\'t create your payment. Please try again.';
      
    case PaymentErrorCode.CHECKOUT_FAILED:
      return 'Checkout initialization failed. Please try again.';
      
    case PaymentErrorCode.PAYMENT_VERIFICATION_FAILED:
      return 'We couldn\'t verify your payment. Please contact customer support.';
      
    case PaymentErrorCode.NETWORK_ERROR:
      return 'Network error. Please check your connection and try again.';
      
    case PaymentErrorCode.INVALID_AMOUNT:
      return 'Invalid payment amount. Please contact customer support.';
      
    case PaymentErrorCode.CARD_DECLINED:
      return 'Your card was declined. Please try another card.';
      
    case PaymentErrorCode.EXPIRED_CARD:
      return 'Your card has expired. Please try another card.';
      
    case PaymentErrorCode.INSUFFICIENT_FUNDS:
      return 'Insufficient funds. Please try another card.';
      
    case PaymentErrorCode.CARD_ERROR:
      return 'There was an error processing your card. Please try again.';
      
    case PaymentErrorCode.SERVER_ERROR:
      return 'Server error. Please try again later.';
      
    default:
      return error.message || 'An unexpected error occurred with your payment.';
  }
};
