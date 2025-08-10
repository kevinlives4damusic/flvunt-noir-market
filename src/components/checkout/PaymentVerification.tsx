import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
// Polar checkout verification can be handled by our DB status only
import { verifyPayment } from '@/lib/payment-service';

interface PaymentVerificationProps {
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export const PaymentVerification: React.FC<PaymentVerificationProps> = ({
  onSuccess,
  onError
}) => {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const checkoutId = searchParams.get('checkout_id');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      if (!checkoutId || !paymentId) {
        setIsVerifying(false);
        if (onError) onError('Missing payment information');
        return;
      }

      try {
        // Verify using our backend record only (Polar webhook updates it)
        const result = await verifyPayment(paymentId);
        if (!result.success) {
          throw new Error(result.error?.message || 'Payment verification failed');
        }

        setIsVerifying(false);
        if (onSuccess) onSuccess(paymentId);
      } catch (error) {
        console.error('Payment verification error:', error);
        setIsVerifying(false);
        if (onError) onError(error instanceof Error ? error.message : 'Payment verification failed');
      }
    };

    verifyPaymentStatus();
  }, [checkoutId, paymentId, onSuccess, onError]);

  if (!isVerifying) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <p className="mt-4 text-gray-600">Verifying your payment...</p>
    </div>
  );
};
