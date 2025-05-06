
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getOrder, updateOrderStatus } from '@/lib/orderService';
import { initiateYocoCheckout } from '@/lib/yoco';
import { toast } from 'sonner';

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const [retrying, setRetrying] = useState(false);
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const updateOrder = async () => {
      if (orderId) {
        try {
          await updateOrderStatus(orderId, 'failed');
          console.log('Order status updated to failed');
        } catch (error) {
          console.error('Error updating order status:', error);
        }
      }
    };
    updateOrder();
  }, [orderId]);

  const handleRetry = async () => {
    if (!orderId) {
      toast.error('Error', {
        description: 'Cannot retry payment: Order ID not found'
      });
      return;
    }

    setRetrying(true);
    try {
      const result = await getOrder(orderId);
      if (!result.success || !result.data) {
        throw new Error('Failed to fetch order details');
      }

      const order = result.data;
      const baseUrl = window.location.origin;
      
      const checkoutResult = await initiateYocoCheckout(
        order.amount_cents,
        order.currency,
        `${baseUrl}/payment-success?orderId=${orderId}`,
        `${baseUrl}/payment-cancel?orderId=${orderId}`,
        `${baseUrl}/payment-failure?orderId=${orderId}`,
        {
          orderId,
          isRetry: true,
          previousFailure: true
        }
      );

      if (!checkoutResult.success) {
        // Safely handle error which could be a string or an object with a message property
        const errorMessage = typeof checkoutResult.error === 'string' 
          ? checkoutResult.error 
          : checkoutResult.error?.message || 'Failed to initiate payment';
        
        throw new Error(errorMessage);
      }

      // Update order status to pending before redirect
      await updateOrderStatus(orderId, 'pending');
      
      // Redirect to Yoco checkout
      window.location.href = checkoutResult.data?.redirectUrl || '';
      
    } catch (error) {
      setRetrying(false);
      toast.error(
        'Retry Failed',
        { description: error instanceof Error ? error.message : 'Failed to retry payment' }
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-medium mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            We were unable to process your payment. You can try again or choose a different payment method.
          </p>
          <div className="space-x-4">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {retrying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Retrying...
                </span>
              ) : (
                'Try Again'
              )}
            </button>
            <Link 
              to="/contact"
              className="inline-block border border-gray-300 px-6 py-2 rounded-md hover:border-gray-400 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentFailure;
