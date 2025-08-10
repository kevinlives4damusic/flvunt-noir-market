import { initiateYocoCheckout } from './yoco';
import { PaymentError, PaymentErrorCode, createPaymentError } from './payment-errors';
import { v4 as uuidv4 } from 'uuid';
import { PaymentStatus, isValidTransition, getTransitionDescription } from './payment-status';
import { auth, db } from './firebase';
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';

export type LocalPaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded' | 'partially_refunded';

export interface CreatePaymentParams {
  orderId: string;
  amountInCents: number;
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
  failureUrl?: string;
  saveCard?: boolean;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amountInCents: number;
  currency: string;
  status: LocalPaymentStatus;
  paymentProvider: string;
  providerPaymentId: string | null;
  checkoutId: string | null;
  checkoutUrl: string | null;
  errorMessage: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

const checkIdempotency = async (idempotencyKey: string): Promise<Payment | null> => {
  const q = query(collection(db(), 'payments'), where('metadata.idempotencyKey', '==', idempotencyKey));
  const snap = await getDocs(q as any);
  if (snap.empty) return null;
  return mapPaymentFromDb({ id: snap.docs[0].id, ...(snap.docs[0].data() as Record<string, unknown>) });
};

export const createPayment = async ({
  orderId,
  amountInCents,
  currency = 'ZAR',
  successUrl,
  cancelUrl,
  failureUrl,
  saveCard = false,
  metadata = {},
  idempotencyKey = uuidv4()
}: CreatePaymentParams): Promise<{ success: boolean; payment?: Payment; error?: PaymentError; redirectUrl?: string }> => {
  try {
    const user = auth().currentUser;
    if (!user) {
      return {
        success: false,
        error: createPaymentError(
          PaymentErrorCode.AUTHENTICATION_REQUIRED,
          'User must be authenticated to make payments'
        )
      };
    }

    const existingPayment = await checkIdempotency(idempotencyKey);
    if (existingPayment) {
      if (!['succeeded', 'failed', 'canceled'].includes(existingPayment.status)) {
        return { success: true, payment: existingPayment, redirectUrl: existingPayment.checkoutUrl };
      }
      idempotencyKey = uuidv4();
    }

    const nowIso = new Date().toISOString();
    const paymentDoc = await addDoc(collection(db(), 'payments'), {
      order_id: orderId,
      user_id: user.uid,
      amount_cents: amountInCents,
      currency,
      status: 'pending',
      payment_provider: 'yoco',
      provider_payment_id: null,
      checkout_id: null,
      checkout_url: null,
      error_message: null,
      metadata: { ...metadata, idempotencyKey },
      created_at: nowIso,
      updated_at: nowIso,
    });

    const checkoutResult = await initiateYocoCheckout(
      amountInCents,
      currency,
      successUrl,
      cancelUrl,
      failureUrl,
      { ...metadata, paymentId: paymentDoc.id, orderId, idempotencyKey },
      saveCard
    );

    if (!checkoutResult.success) {
      await updateDoc(doc(db(), 'payments', paymentDoc.id), {
        status: 'failed',
        error_message: checkoutResult.error?.message ?? 'Checkout failed',
        updated_at: new Date().toISOString(),
      });
      return {
        success: false,
        payment: await getPaymentById(paymentDoc.id) ?? undefined,
        error: createPaymentError(
          PaymentErrorCode.CHECKOUT_FAILED,
          checkoutResult.error?.message || 'Failed to create checkout',
          (checkoutResult.error as any)?.detail
        )
      };
    }

    await updateDoc(doc(db(), 'payments', paymentDoc.id), {
      checkout_id: checkoutResult.data?.checkoutId ?? null,
      checkout_url: checkoutResult.data?.redirectUrl ?? null,
      updated_at: new Date().toISOString(),
    });

    const updated = await getPaymentById(paymentDoc.id);
    return { success: true, payment: updated!, redirectUrl: checkoutResult.data?.redirectUrl };
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

export const getPaymentById = async (paymentId: string): Promise<Payment | null> => {
  const snap = await getDoc(doc(db(), 'payments', paymentId));
  if (!snap.exists()) return null;
  return mapPaymentFromDb({ id: snap.id, ...(snap.data() as Record<string, unknown>) });
};

export const getPaymentsByOrderId = async (orderId: string): Promise<Payment[]> => {
  const q = query(collection(db(), 'payments'), where('order_id', '==', orderId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapPaymentFromDb({ id: d.id, ...(d.data() as Record<string, unknown>) }));
};

export const verifyPayment = async (paymentId: string): Promise<{ success: boolean; payment?: Payment; error?: PaymentError }> => {
  try {
    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return { success: false, error: createPaymentError(PaymentErrorCode.PAYMENT_VERIFICATION_FAILED, 'Payment not found', `No payment found with ID ${paymentId}`) };
    }
    if (['succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded'].includes(payment.status)) {
      return { success: payment.status === 'succeeded', payment };
    }
    return { success: payment.status === 'succeeded', payment };
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

export const updateOrderAfterSuccessfulPayment = async (
  orderId: string, 
  paymentId: string
): Promise<boolean> => {
  try {
    await updateDoc(doc(db(), 'orders', orderId), {
      status: 'paid',
      payment_id: paymentId,
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error updating order after payment:', error);
    return false;
  }
};

export interface SavedPaymentMethod {
  method_id: string;
  provider: 'yoco';
  brand: string;
  last4: string;
  created_at: string;
}

export const getSavedPaymentMethods = async (): Promise<SavedPaymentMethod[]> => {
  const user = auth().currentUser;
  if (!user) return [];
  const snap = await getDocs(collection(db(), 'users', user.uid, 'payment_methods'));
  return snap.docs.map((d) => ({ method_id: d.id, ...(d.data() as any) }));
};

const mapPaymentFromDb = (dbPayment: any): Payment => ({
  id: dbPayment.id,
  orderId: dbPayment.order_id,
  amountInCents: dbPayment.amount_cents,
  currency: dbPayment.currency,
  status: dbPayment.status as LocalPaymentStatus,
  paymentProvider: dbPayment.payment_provider,
  providerPaymentId: dbPayment.provider_payment_id ?? null,
  checkoutId: dbPayment.checkout_id ?? null,
  checkoutUrl: dbPayment.checkout_url ?? null,
  errorMessage: dbPayment.error_message ?? null,
  metadata: dbPayment.metadata ?? null,
  createdAt: dbPayment.created_at,
  updatedAt: dbPayment.updated_at
});

const updatePaymentStatus = async (
  paymentId: string,
  newStatus: PaymentStatus,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: PaymentError }> => {
  try {
    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return { success: false, error: createPaymentError(PaymentErrorCode.PAYMENT_NOT_FOUND, 'Payment not found', `No payment found with ID ${paymentId}`) };
    }

    if (!isValidTransition(payment.status, newStatus)) {
      return {
        success: false,
        error: createPaymentError(
          PaymentErrorCode.INVALID_STATUS_TRANSITION,
          'Invalid status transition',
          getTransitionDescription(payment.status, newStatus)
        )
      };
    }

    await updateDoc(doc(db(), 'payments', paymentId), {
      status: newStatus,
      metadata: { ...(payment.metadata || {}), ...metadata },
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    return {
      success: false,
      error: createPaymentError(
        PaymentErrorCode.UPDATE_FAILED,
        'Failed to update payment status',
        error instanceof Error ? error.message : 'Unknown error'
      )
    };
  }
};
