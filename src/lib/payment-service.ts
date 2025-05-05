
import { supabase } from './supabase';
import { initiateYocoCheckout, verifyYocoPayment } from './yoco';
import { PaymentError, PaymentErrorCode, createPaymentError } from './payment-errors';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded' | 'partially_refunded';

export interface CreatePaymentParams {
  orderId: string;
  amountInCents: number;
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
  failureUrl?: string;
  saveCard?: boolean;
  metadata?: Record<string, any>;
}

export interface Payment {
  id: string;
  orderId: string;
  amountInCents: number;
  currency: string;
  status: PaymentStatus;
  paymentProvider: string;
  providerPaymentId: string | null;
  checkoutId: string | null;
  checkoutUrl: string | null;
  errorMessage: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Creates a new payment record and initiates the Yoco checkout process
 */
export const createPayment = async ({
  orderId,
  amountInCents,
  currency = 'ZAR',
  successUrl,
  cancelUrl,
  failureUrl,
  saveCard = false,
  metadata = {}
}: CreatePaymentParams): Promise<{ success: boolean; payment?: Payment; error?: PaymentError; redirectUrl?: string }> => {
  try {
    // Generate a unique idempotency key to prevent duplicate payments
    const idempotencyKey = uuidv4();
    
    // Create payment record in database
    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount_cents: amountInCents,
        currency,
        status: 'pending',
        payment_provider: 'yoco',
        metadata: { ...metadata, idempotencyKey }
      })
      .select()
      .single();
      
    if (dbError) {
      console.error('Error creating payment record:', dbError);
      return {
        success: false,
        error: createPaymentError(
          PaymentErrorCode.PAYMENT_CREATION_FAILED,
          'Failed to create payment record',
          dbError.message,
          dbError
        )
      };
    }
    
    // Add payment ID to metadata for reference in webhook
    const enhancedMetadata = {
      ...metadata,
      paymentId: payment.id,
      orderId,
      idempotencyKey
    };

    // Initiate Yoco checkout
    const checkoutResult = await initiateYocoCheckout(
      amountInCents,
      currency,
      successUrl,
      cancelUrl,
      failureUrl,
      enhancedMetadata,
      saveCard
    );
    
    if (!checkoutResult.success) {
      // Update payment record with error
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          error_message: typeof checkoutResult.error === 'string' 
            ? checkoutResult.error 
            : checkoutResult.error?.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);
        
      return {
        success: false,
        payment: mapPaymentFromDb(payment),
        error: createPaymentError(
          PaymentErrorCode.CHECKOUT_FAILED,
          typeof checkoutResult.error === 'string'
            ? checkoutResult.error
            : checkoutResult.error?.message || 'Failed to create checkout',
          typeof checkoutResult.error === 'string'
            ? undefined
            : checkoutResult.error?.detail,
          checkoutResult.error
        )
      };
    }
    
    // Update payment with checkout info
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        checkout_id: checkoutResult.data?.checkoutId,
        checkout_url: checkoutResult.data?.redirectUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating payment with checkout info:', updateError);
      // Continue anyway since the checkout was created successfully
    }
    
    return {
      success: true,
      payment: mapPaymentFromDb(updatedPayment || payment),
      redirectUrl: checkoutResult.data?.redirectUrl
    };
  } catch (error) {
    console.error('Payment creation error:', error);
    return {
      success: false,
      error: createPaymentError(
        PaymentErrorCode.PAYMENT_CREATION_FAILED,
        error instanceof Error ? error.message : 'Unknown payment error',
        'An unexpected error occurred while creating the payment',
        error
      )
    };
  }
};

/**
 * Gets a payment by ID
 */
export const getPaymentById = async (paymentId: string): Promise<Payment | null> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();
    
  if (error || !data) {
    console.error('Error fetching payment:', error);
    return null;
  }
  
  return mapPaymentFromDb(data);
};

/**
 * Gets all payments for an order
 */
export const getPaymentsByOrderId = async (orderId: string): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching payments for order:', error);
    return [];
  }
  
  return (data || []).map(mapPaymentFromDb);
};

/**
 * Verifies a payment's status with Yoco
 * This should be called after a user returns from the Yoco checkout page
 */
export const verifyPayment = async (paymentId: string): Promise<{ success: boolean; payment?: Payment; error?: PaymentError }> => {
  try {
    // Get the payment from the database
    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return {
        success: false,
        error: createPaymentError(
          PaymentErrorCode.PAYMENT_VERIFICATION_FAILED,
          'Payment not found',
          `No payment found with ID ${paymentId}`
        )
      };
    }
    
    // If payment is already in a final state, return it
    if (['succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded'].includes(payment.status)) {
      return {
        success: payment.status === 'succeeded',
        payment
      };
    }
    
    // For pending payments with a checkout ID, verify with Yoco
    if (payment.checkoutId) {
      const verificationResult = await verifyYocoPayment(payment.checkoutId);
      if (verificationResult.success) {
        // Payment verification was successful, get updated payment
        const updatedPayment = await getPaymentById(payment.id);
        return {
          success: true,
          payment: updatedPayment || payment
        };
      }
      
      // Payment verification failed but we already have the payment record
      return {
        success: false,
        payment,
        error: verificationResult.error
      };
    }
    
    return {
      success: payment.status === 'succeeded',
      payment
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: createPaymentError(
        PaymentErrorCode.PAYMENT_VERIFICATION_FAILED,
        error instanceof Error ? error.message : 'Unknown verification error',
        'An unexpected error occurred while verifying the payment',
        error
      )
    };
  }
};

/**
 * Updates an order's status based on a successful payment
 */
export const updateOrderAfterSuccessfulPayment = async (
  orderId: string, 
  paymentId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_id: paymentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (error) {
      console.error('Error updating order after payment:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating order after payment:', error);
    return false;
  }
};

/**
 * Maps a database payment record to the Payment interface
 */
const mapPaymentFromDb = (dbPayment: any): Payment => ({
  id: dbPayment.id,
  orderId: dbPayment.order_id,
  amountInCents: dbPayment.amount_cents,
  currency: dbPayment.currency,
  status: dbPayment.status as PaymentStatus,
  paymentProvider: dbPayment.payment_provider,
  providerPaymentId: dbPayment.provider_payment_id,
  checkoutId: dbPayment.checkout_id,
  checkoutUrl: dbPayment.checkout_url,
  errorMessage: dbPayment.error_message,
  metadata: dbPayment.metadata,
  createdAt: dbPayment.created_at,
  updatedAt: dbPayment.updated_at
});
