import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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
  const paymentId = searchParams.get('paymentId');
  const reference = searchParams.get('reference');

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      if (!paymentId && !reference) {
        setIsVerifying(false);
        if (onError) onError('Missing payment information');
        return;
      }

      try {
        const idToVerify = paymentId || reference!;
        const result = await verifyPayment(idToVerify);
        if (!result.success || !result.payment) {
          throw new Error(result.error?.message || 'Payment verification failed');
        }
        setIsVerifying(false);
        if (onSuccess) onSuccess(result.payment.id);
      } catch (error) {
        console.error('Payment verification error:', error);
        setIsVerifying(false);
        if (onError) onError(error instanceof Error ? error.message : 'Payment verification failed');
      }
    };

    verifyPaymentStatus();
  }, [paymentId, reference, onSuccess, onError]);

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
