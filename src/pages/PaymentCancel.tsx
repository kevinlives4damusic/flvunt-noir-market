import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { updateOrderStatus } from '@/lib/orderService';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const updateOrder = async () => {
      if (orderId) {
        await updateOrderStatus(orderId, 'cancelled');
      }
    };
    updateOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-gray-500" />
          </div>
          <h1 className="text-2xl font-medium mb-4">Payment Cancelled</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Your payment has been cancelled. Your order will be saved and you can try again when you're ready.
          </p>
          <div className="space-x-4">
            <Link 
              to="/payment"
              className="inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Try Again
            </Link>
            <Link 
              to="/products"
              className="inline-block border border-gray-300 px-6 py-2 rounded-md hover:border-gray-400 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentCancel;
