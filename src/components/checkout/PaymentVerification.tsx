import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle, ShoppingBag } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { verifyPayment, getPaymentsByOrderId, updateOrderAfterSuccessfulPayment } from '@/lib/payment-service';
import { handlePaymentError } from '@/lib/payment-errors';

interface PaymentVerificationProps {
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  redirectPath?: string;
}

export const PaymentVerification: React.FC<PaymentVerificationProps> = ({
  onSuccess,
  onError,
  redirectPath = '/account/orders'
}) => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');
  const checkoutId = searchParams.get('id'); // Yoco sometimes returns this
  const status = searchParams.get('status'); // Yoco sometimes returns this
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      if (!orderId) {
        setError('Order information is missing. Please check your order history.');
        setIsLoading(false);
        if (onError) onError('Missing order information');
        return;
      }

      try {
        console.log('Verifying payment with params:', { orderId, paymentId, checkoutId, status });
        
        // If we have a specific payment ID, verify that payment
        if (paymentId) {
          const result = await verifyPayment(paymentId);
          
          if (!result.success) {
            const errorMessage = result.error ? handlePaymentError(result.error) : 'Payment verification failed';
            setError(errorMessage);
            if (onError) onError(errorMessage);
          } else {
            // Ensure order is updated to paid
            if (result.payment?.status === 'succeeded') {
              await updateOrderAfterSuccessfulPayment(orderId, paymentId);
            }
            setSuccess(true);
            if (onSuccess) onSuccess(paymentId);
          }
        } 
        // Check if we have status from Yoco redirect
        else if (status === 'complete' && checkoutId) {
          // Find payment by checkout ID from our payments table
          const payments = await getPaymentsByOrderId(orderId);
          const payment = payments.find(p => p.checkoutId === checkoutId);
          
          if (payment) {
            // Update order if payment was successful and not already done
            if (payment.status === 'succeeded') {
              await updateOrderAfterSuccessfulPayment(orderId, payment.id);
              setSuccess(true);
              if (onSuccess) onSuccess(payment.id);
            } else {
              setError('Payment is still processing. Please check your order status later.');
              if (onError) onError('Payment still processing');
            }
          } else {
            setError('Payment information not found. Please contact customer support.');
            if (onError) onError('Payment not found');
          }
        }
        // Otherwise, get all payments for this order and check for a successful one
        else {
          const payments = await getPaymentsByOrderId(orderId);
          
          const successfulPayment = payments.find(p => p.status === 'succeeded');
          
          if (successfulPayment) {
            // Ensure order is updated to paid
            await updateOrderAfterSuccessfulPayment(orderId, successfulPayment.id);
            setSuccess(true);
            if (onSuccess) onSuccess(successfulPayment.id);
          } else if (payments.length > 0) {
            // If we have payments but none are successful, show appropriate message
            const latestPayment = payments[0]; // Assuming sorted by created_at desc
            
            if (['failed', 'canceled'].includes(latestPayment.status)) {
              setError(`Payment ${latestPayment.status}. Please try again.`);
            } else {
              setError('Your payment is still being processed. Please check your order history for updates.');
            }
            
            if (onError) onError(`Payment status: ${latestPayment.status}`);
          } else {
            setError('No payment found for this order. Please try again.');
            if (onError) onError('No payment found');
          }
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        if (onError) onError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    verifyPaymentStatus();
  }, [orderId, paymentId, checkoutId, status, onSuccess, onError]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{success ? 'Payment Successful' : 'Verifying Payment'}</CardTitle>
        <CardDescription>
          {success 
            ? 'Your payment has been processed successfully' 
            : 'Please wait while we verify your payment'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p>Verifying your payment...</p>
          </div>
        )}
        
        {error && !isLoading && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Verification Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && !isLoading && (
          <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Payment Successful</AlertTitle>
            <AlertDescription>
              Thank you for your purchase! Your order has been confirmed and is being processed.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        {success && (
          <Button 
            className="w-full" 
            onClick={() => navigate('/payment-success?orderId=' + orderId)}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            View Your Order
          </Button>
        )}
        
        {error && !isLoading && (
          <>
            <Button 
              variant="default" 
              className="w-full" 
              onClick={() => navigate(`/checkout?orderId=${orderId}`)}
            >
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate(redirectPath)}
            >
              View Your Orders
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};
