
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createPayment } from '@/lib/payment-service';
import { handlePaymentError } from '@/lib/payment-errors';
import { supabase } from '@/lib/supabase';

interface PaymentProcessorProps {
  orderId: string;
  amount: number; // in cents
  currency?: string;
  saveCard?: boolean;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  orderId,
  amount,
  currency = 'ZAR',
  saveCard = false,
  onSuccess,
  onCancel,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get the current URL for success/cancel/failure redirects
  const baseUrl = window.location.origin;
  const successUrl = `${baseUrl}/payment-success?orderId=${orderId}`;
  const cancelUrl = `${baseUrl}/payment-cancel?orderId=${orderId}`;
  const failureUrl = `${baseUrl}/payment-failure?orderId=${orderId}`;

  const handlePaymentInitiation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to make a payment.');
        setIsLoading(false);
        if (onError) onError('Authentication required');
        return;
      }
      
      // Create payment and initiate checkout
      const result = await createPayment({
        orderId,
        amountInCents: amount,
        currency,
        successUrl,
        cancelUrl, 
        failureUrl,
        saveCard, // Pass the saveCard option
        metadata: {
          userEmail: user.email,
          createdAt: new Date().toISOString()
        }
      });
      
      if (!result.success || !result.redirectUrl) {
        const errorMessage = result.error ? handlePaymentError(result.error) : 'Failed to initiate payment';
        setError(errorMessage);
        if (onError) onError(errorMessage);
      } else {
        console.log('Payment initiated, redirecting to:', result.redirectUrl);
        // Redirect to Yoco checkout
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>
          Secure payment powered by Yoco
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">Order Total:</span>
            <span className="font-bold">{currency} {(amount / 100).toFixed(2)}</span>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">
              You'll be redirected to our secure payment provider to complete your purchase.
            </p>
            
            <div className="flex items-center justify-center mt-4 bg-black p-3 rounded">
              <img 
                src="/images/yoco-logo-white.svg" 
                alt="Yoco Secure Payments" 
                className="h-8"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/lovable-uploads/697e0904-5b34-4da2-8456-8191cae847a8.png';
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          className="w-full bg-black hover:bg-gray-800" 
          onClick={handlePaymentInitiation}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Pay {currency} {(amount / 100).toFixed(2)}
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => {
            if (onCancel) onCancel();
            else navigate(-1);
          }}
          disabled={isLoading}
        >
          Cancel
        </Button>
        
        <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
          <Lock className="h-3 w-3 mr-1" /> 
          Payments secured by 256-bit encryption
        </div>
      </CardFooter>
    </Card>
  );
};
