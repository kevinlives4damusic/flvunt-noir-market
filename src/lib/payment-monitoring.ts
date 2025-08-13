import { addDoc, collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { getCountFromServer } from 'firebase/firestore';
import { db } from './firebase';
import { PaymentError } from './payment-errors';
import { PaymentStatus } from './payment-status';

export interface PaymentEvent {
  id: string;
  paymentId: string;
  orderId: string;
  type: 'status_change' | 'error' | 'webhook' | 'verification';
  status?: PaymentStatus;
  previousStatus?: PaymentStatus;
  error?: PaymentError;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * Log a payment event to the monitoring system
 */
export const logPaymentEvent = async (event: Omit<PaymentEvent, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db(), 'payment_events'), {
      ...event,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging payment event:', error);
  }
};

/**
 * Get payment events for a specific payment
 */
export const getPaymentEvents = async (paymentId: string): Promise<PaymentEvent[]> => {
  try {
    const q = query(
      collection(db(), 'payment_events'),
      where('paymentId', '==', paymentId),
      orderBy('timestamp', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PaymentEvent[];
  } catch (error) {
    console.error('Error fetching payment events:', error);
    return [];
  }
};

/**
 * Get payment error rate for monitoring
 */
export const getPaymentErrorRate = async (
  startDate: Date,
  endDate: Date = new Date()
): Promise<number> => {
  try {
    const errorsQuery = query(
      collection(db(), 'payment_events'),
      where('type', '==', 'error'),
      where('timestamp', '>=', startDate.toISOString()),
      where('timestamp', '<=', endDate.toISOString()),
    );
    const totalQuery = query(
      collection(db(), 'payments'),
      where('created_at', '>=', startDate.toISOString()),
      where('created_at', '<=', endDate.toISOString()),
    );
    const [errorsCountSnap, totalCountSnap] = await Promise.all([
      getCountFromServer(errorsQuery),
      getCountFromServer(totalQuery),
    ]);
    const errorCount = errorsCountSnap.data().count || 0;
    const totalCount = totalCountSnap.data().count || 1; // avoid divide by zero
    return (errorCount / totalCount) * 100;
  } catch (error) {
    console.error('Error calculating error rate:', error);
    return 0;
  }
};