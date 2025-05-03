
import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Check, CreditCard, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartContext } from '@/context/CartContext';
import BackToTop from '@/components/BackToTop';
import { toastWithProgress } from '@/components/ui/toast-with-progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const PaymentMethod = ({ 
  id, 
  name, 
  icon, 
  selected, 
  onSelect 
}: { 
  id: string; 
  name: string; 
  icon: React.ReactNode; 
  selected: boolean; 
  onSelect: () => void; 
}) => (
  <div 
    className={`border p-4 cursor-pointer transition-all ${selected ? 'border-black' : 'border-gray-200 hover:border-gray-400'}`}
    onClick={onSelect}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{name}</span>
      </div>
      {selected && <Check className="h-5 w-5 text-green-600" />}
    </div>
  </div>
);

const Payment = () => {
  const { isAuthenticated, items } = useContext(CartContext);
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);

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
    
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      toastWithProgress({
        message: 'Payment successful!',
        description: "Your order has been placed and will be processed shortly."
      });
      
      // Redirect after successful payment
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }, 1500);
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
              <h2 className="text-xl font-medium mb-6">Payment Options</h2>
              
              <div className="space-y-3 mb-6">
                <PaymentMethod 
                  id="card" 
                  name="Credit/Debit Card" 
                  icon={<CreditCard className="h-5 w-5" />} 
                  selected={paymentMethod === 'card'} 
                  onSelect={() => setPaymentMethod('card')} 
                />
                
                <PaymentMethod 
                  id="paypal" 
                  name="PayPal" 
                  icon={<img src="/yoco-logo.png" alt="PayPal" className="h-5" />} 
                  selected={paymentMethod === 'paypal'} 
                  onSelect={() => setPaymentMethod('paypal')} 
                />
              </div>
              
              {paymentMethod === 'card' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm mb-1">Card Number</label>
                    <input 
                      type="text" 
                      placeholder="1234 5678 9012 3456" 
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm mb-1">Expiry Date</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm mb-1">CVV</label>
                      <input 
                        type="text" 
                        placeholder="123" 
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Name on Card</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-8">
                <Button 
                  onClick={handlePayment} 
                  className="flvunt-button w-full relative"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="animate-pulse">Processing...</span>
                      <span className="ml-2 inline-block animate-spin">⟳</span>
                    </>
                  ) : (
                    <>PAY NOW</>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Payment secured by 256-bit encryption</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Collapsible>
                <CollapsibleTrigger className="text-sm text-gray-600 hover:underline flex items-center">
                  <span>Payment & Security Information</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 border-t mt-4 text-sm text-gray-600">
                  <p className="mb-2">
                    All transactions are secure and encrypted. We never store your credit card information.
                  </p>
                  <p>
                    For more information, please read our <a href="#" className="underline">Privacy Policy</a> and <a href="#" className="underline">Terms of Service</a>.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
          
          <div className="w-full lg:w-96">
            <div className="bg-gray-50 p-6 sticky top-24">
              <h2 className="text-xl font-medium mb-6">Order Summary</h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto hide-scrollbar border-b pb-4 mb-4">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="h-16 w-16 bg-gray-100 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-sm">R {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
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
              <p className="mt-4 text-sm text-gray-500">
                By completing your purchase, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Payment;
