import { supabase } from './supabase';
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
    const { error } = await supabase
      .from('payment_events')
      .insert({
        ...event,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging payment event:', error);
    }
  } catch (error) {
    console.error('Error in logPaymentEvent:', error);
  }
};

/**
 * Get payment events for a specific payment
 */
export const getPaymentEvents = async (paymentId: string): Promise<PaymentEvent[]> => {
  const { data, error } = await supabase
    .from('payment_events')
    .select('*')
    .eq('paymentId', paymentId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching payment events:', error);
    return [];
  }

  return data || [];
};

/**
 * Get payment error rate for monitoring
 */
export const getPaymentErrorRate = async (
  startDate: Date,
  endDate: Date = new Date()
): Promise<number> => {
  const { data: errors, error: errorCountError } = await supabase
    .from('payment_events')
    .select('count', { count: 'exact', head: true })
    .eq('type', 'error')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  const { data: total, error: totalCountError } = await supabase
    .from('payments')
    .select('count', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (errorCountError || totalCountError) {
    console.error('Error calculating error rate:', errorCountError || totalCountError);
    return 0;
  }

  const errorCount = errors?.[0]?.count || 0;
  const totalCount = total?.[0]?.count || 1; // Avoid division by zero

  return (errorCount / totalCount) * 100;
};