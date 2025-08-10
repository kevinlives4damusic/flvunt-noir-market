export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded'
  | 'partially_refunded';

export type PaymentTransition = {
  from: PaymentStatus;
  to: PaymentStatus;
  allowed: boolean;
  requiresAuth?: boolean;
  description?: string;
};

const statusTransitions: PaymentTransition[] = [
  { from: 'pending', to: 'processing', allowed: true, description: 'Payment is being processed' },
  { from: 'pending', to: 'succeeded', allowed: true, description: 'Payment completed successfully' },
  { from: 'pending', to: 'failed', allowed: true, description: 'Payment failed' },
  { from: 'pending', to: 'canceled', allowed: true, description: 'Payment was canceled' },
  
  { from: 'processing', to: 'succeeded', allowed: true, description: 'Payment completed successfully' },
  { from: 'processing', to: 'failed', allowed: true, description: 'Payment processing failed' },
  { from: 'processing', to: 'canceled', allowed: false, description: 'Cannot cancel a processing payment' },
  
  { from: 'succeeded', to: 'refunded', allowed: true, requiresAuth: true, description: 'Payment was refunded' },
  { from: 'succeeded', to: 'partially_refunded', allowed: true, requiresAuth: true, description: 'Payment was partially refunded' },
  
  { from: 'failed', to: 'pending', allowed: true, description: 'Retrying failed payment' },
  
  { from: 'refunded', to: 'partially_refunded', allowed: false, description: 'Cannot partially refund a fully refunded payment' },
  { from: 'partially_refunded', to: 'refunded', allowed: true, requiresAuth: true, description: 'Remaining amount was refunded' },
];

export const isValidTransition = (from: PaymentStatus, to: PaymentStatus): boolean => {
  const transition = statusTransitions.find(t => t.from === from && t.to === to);
  return transition ? transition.allowed : false;
};

export const getTransitionDescription = (from: PaymentStatus, to: PaymentStatus): string => {
  const transition = statusTransitions.find(t => t.from === from && t.to === to);
  return transition?.description || 'Invalid status transition';
};

export const requiresAuthForTransition = (from: PaymentStatus, to: PaymentStatus): boolean => {
  const transition = statusTransitions.find(t => t.from === from && t.to === to);
  return transition?.requiresAuth || false;
};

export const isFinalState = (status: PaymentStatus): boolean => {
  return ['succeeded', 'refunded', 'partially_refunded'].includes(status);
};