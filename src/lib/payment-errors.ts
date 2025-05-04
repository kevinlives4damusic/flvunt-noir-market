/**
 * Comprehensive error handling for the payment system
 */

export enum PaymentErrorCode {
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  CHECKOUT_FAILED = 'CHECKOUT_FAILED',
  API_ERROR = 'API_ERROR',
  PAYMENT_CREATION_FAILED = 'PAYMENT_CREATION_FAILED',
  PAYMENT_VERIFICATION_FAILED = 'PAYMENT_VERIFICATION_FAILED',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',
  WEBHOOK_VERIFICATION_FAILED = 'WEBHOOK_VERIFICATION_FAILED',
  IDEMPOTENCY_VIOLATION = 'IDEMPOTENCY_VIOLATION'
}

export interface PaymentError {
  code: PaymentErrorCode;
  message: string;
  detail?: string;
  originalError?: any;
}

/**
 * Creates a structured payment error object
 */
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

/**
 * Returns a user-friendly error message based on the error code
 */
export const getUserFriendlyErrorMessage = (error: PaymentError): string => {
  switch (error.code) {
    case PaymentErrorCode.INVALID_AMOUNT:
      return 'The payment amount is invalid. Please try again.';
    case PaymentErrorCode.AUTHENTICATION_REQUIRED:
      return 'You must be logged in to make a payment.';
    case PaymentErrorCode.CHECKOUT_FAILED:
      return 'We couldn\'t create your payment. Please try again later.';
    case PaymentErrorCode.API_ERROR:
      return 'There was a problem connecting to our payment provider. Please try again later.';
    case PaymentErrorCode.PAYMENT_CREATION_FAILED:
      return 'We couldn\'t process your payment. Please try again or contact support.';
    case PaymentErrorCode.PAYMENT_VERIFICATION_FAILED:
      return 'We couldn\'t verify your payment. If you believe this is an error, please contact support.';
    case PaymentErrorCode.ORDER_NOT_FOUND:
      return 'The order was not found. Please try again or contact support.';
    case PaymentErrorCode.PAYMENT_NOT_FOUND:
      return 'The payment was not found. Please try again or contact support.';
    case PaymentErrorCode.WEBHOOK_VERIFICATION_FAILED:
      return 'Payment verification failed. Please contact support if your payment was successful but not reflected.';
    case PaymentErrorCode.IDEMPOTENCY_VIOLATION:
      return 'This payment request has already been processed. Please check your order history.';
    default:
      return 'An error occurred while processing your payment. Please try again or contact support.';
  }
};

/**
 * Logs a payment error with appropriate severity
 */
export const logPaymentError = (error: PaymentError): void => {
  const errorMessage = `Payment error [${error.code}]: ${error.message}`;
  const errorDetails = error.detail ? `Details: ${error.detail}` : '';
  
  // Log to console for now, but this could be extended to log to a monitoring service
  console.error(errorMessage, errorDetails, error.originalError);
  
  // Different handling based on error severity
  switch (error.code) {
    case PaymentErrorCode.API_ERROR:
    case PaymentErrorCode.PAYMENT_CREATION_FAILED:
    case PaymentErrorCode.WEBHOOK_VERIFICATION_FAILED:
      // These are critical errors that should be monitored
      // TODO: Send to monitoring service
      break;
    default:
      // Less critical errors
      break;
  }
};

/**
 * Handles a payment error by logging it and returning a user-friendly message
 */
export const handlePaymentError = (error: PaymentError): string => {
  logPaymentError(error);
  return getUserFriendlyErrorMessage(error);
};
