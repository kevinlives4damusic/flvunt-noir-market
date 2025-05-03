
import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartContext } from '@/context/CartContext';

const Payment = () => {
  const { isAuthenticated, items } = useContext(CartContext);
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 4.99;
  const total = subtotal + shipping;

  useEffect(() => {
    if (!isAuthenticated) {
      toast('Please log in to proceed with payment', {
        description: 'You need to be logged in to complete your purchase'
      });
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handlePayment = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    toast('Payment initiated', {
      description: "This is a demo. Payment processing requires backend integration."
    });
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-12 flvunt-container">
        <div className="mb-8">
          <Link to="/checkout" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to checkout
          </Link>
          <h1 className="mt-4 text-3xl font-light tracking-wider">PAYMENT</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-medium mb-4">Payment Options</h2>
              <div className="flex items-center justify-center mb-6">
                <img src="/yoco-logo.png" alt="YOCO" className="h-12" />
              </div>
              <p className="text-gray-600 mb-4">Select your preferred payment method.</p>
              <Button onClick={handlePayment} className="flvunt-button w-full">
                PAY NOW
              </Button>
            </div>
          </div>
          <div className="w-full lg:w-96 bg-gray-50 p-6">
            <h2 className="text-xl font-medium mb-6">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p>R {subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Shipping</p>
                <p>R {shipping.toFixed(2)}</p>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between font-medium text-lg">
                <p>Total</p>
                <p>R {total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Payment;
