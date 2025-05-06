import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Check, CreditCard, Shield, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartContext } from '@/context/CartContext';
import BackToTop from '@/components/BackToTop';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { createOrder } from '@/lib/orderService';
import { PaymentProcessor } from '@/components/checkout/PaymentProcessor';
import { PaymentVerification } from '@/components/checkout/PaymentVerification';
import { initiateYocoCheckout } from '@/lib/yoco';

// Payment method option component
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
  const { isAuthenticated, items, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState('yoco');
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [saveCard, setSaveCard] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Check if we're returning from a payment provider
  const isVerifying = searchParams.has('payment_id') || searchParams.has('status');

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

  // Create a new order in the database
  const createNewOrder = async () => {
    try {
      setProcessing(true);
      
      // Generate a unique order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      
      // Create the order in the database
      const orderData = {
        orderNumber,
        items: items.map(item => ({
          product_id: item.id.toString(),
          quantity: item.quantity,
          price_cents: Math.round(item.price * 100),
          metadata: {
            name: item.name,
            image: item.image
          }
        })),
        amount_cents: Math.round(total * 100),
        currency: 'ZAR',
        metadata: {
          customer_email: 'customer@example.com' // This would come from user profile
        }
      };
      
      const result = await createOrder(orderData);
      
      if (result.success && result.data) {
        setOrderId(result.data.id);
        return result.data.id;
      } else {
        throw new Error(result.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
      setProcessing(false);
      return null;
    }
  };
  
  // Handle successful payment
  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentSuccess(true);
    toast.success('Payment successful!');
    clearCart();
    navigate(`/payment-success?orderId=${orderId}&paymentId=${paymentId}`);
  };
  
  // Handle payment error
  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    toast.error(`Payment failed: ${error}`);
    setProcessing(false);
    if (orderId) {
      navigate(`/payment-failure?orderId=${orderId}`);
    }
  };
  
  // Handle payment cancellation
  const handlePaymentCancel = () => {
    setProcessing(false);
    toast('Payment cancelled');
    if (orderId) {
      navigate(`/payment-cancel?orderId=${orderId}`);
    }
  };
  
  // Format card number with spaces after every 4 digits
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // Format expiry date as MM/YY
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2)}`;
    } else {
      return v;
    }
  };
  
  // Handle card number input change
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };
  
  // Handle expiry date input change
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatExpiryDate(e.target.value);
    setExpiryDate(formattedValue);
  };
  
  // Handle CVV input change
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvv(value);
  };
  
  // Handle name on card input change
  const handleNameOnCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameOnCard(e.target.value);
  };
  
  // Handle payment initiation
  const handlePayment = async () => {
    if (processing) return;
    
    // Reset previous errors
    setPaymentError(null);
    
    // Basic validation
    if (!cardNumber || !expiryDate || !cvv || !nameOnCard) {
      toast.error('Please fill in all card details');
      return;
    }
    
    // Set processing state
    setProcessing(true);
    
    try {
      // Create a new order first
      const newOrderId = await createNewOrder();
      if (!newOrderId) {
        setProcessing(false);
        return;
      }
      
      // For non-Yoco payment methods, you would implement different logic here
      if (paymentMethod !== 'yoco') {
        toast.error('Only Yoco payments are supported at this time');
        setProcessing(false);
        return;
      }
      
      // Set up URLs for payment flow
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/#/payment-success?orderId=${newOrderId}`;
      const cancelUrl = `${baseUrl}/#/payment-cancel?orderId=${newOrderId}`;
      const failureUrl = `${baseUrl}/#/payment-failure?orderId=${newOrderId}`;
      
      // Process the payment directly with Yoco
      try {
        console.log('Setting up payment with base URL:', baseUrl);
        
        // Create metadata with card and order details
        const metadata = {
          orderId: newOrderId,
          cardDetails: {
            last4: cardNumber.replace(/\s/g, '').slice(-4),
            expiryMonth: expiryDate.split('/')[0],
            expiryYear: `20${expiryDate.split('/')[1]}`,
            nameOnCard
          }
        };
        
        // Initiate Yoco checkout directly
        const result = await initiateYocoCheckout(
          Math.round(total * 100),  // amount in cents
          'ZAR',                    // currency
          successUrl,               // success URL
          cancelUrl,                // cancel URL
          failureUrl,               // failure URL
          metadata,                 // metadata
          saveCard                  // save card option
        );
        
        if (!result.success || !result.data?.redirectUrl) {
          const errorMessage = typeof result.error === 'string' 
            ? result.error 
            : (result.error?.message || 'Payment creation failed');
          
          throw new Error(errorMessage);
        }
        
        console.log('Payment initiated successfully, redirecting to:', result.data.redirectUrl);
        
        // Redirect to the Yoco checkout page
        window.location.href = result.data.redirectUrl;
      } catch (error) {
        console.error('Payment processing error:', error);
        handlePaymentError(error instanceof Error ? error.message : 'Payment processing failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('An error occurred during payment processing');
      setProcessing(false);
    }
  };

  // Show verification component if we're verifying a payment
  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow py-12 flvunt-container">
          <PaymentVerification 
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
        <Footer />
        <BackToTop />
      </div>
    );
  }

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
                  id="yoco" 
                  name="Credit/Debit Card" 
                  icon={<CreditCard className="h-5 w-5" />} 
                  selected={paymentMethod === 'yoco'} 
                  onSelect={() => setPaymentMethod('yoco')} 
                />
              </div>
              
              <div className="flex items-center justify-center mt-6 bg-black p-4 rounded">
                <img 
                  src="/lovable-uploads/697e0904-5b34-4da2-8456-8191cae847a8.png" 
                  alt="Yoco Payment Provider" 
                  className="h-10"
                />
              </div>
              
              {/* Display payment error if any */}
              {paymentError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  <p className="font-medium">Payment Error:</p>
                  <p>{paymentError}</p>
                </div>
              )}
              
              {/* Save card information checkbox */}
              <div className="mt-6 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveCard"
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                />
                <label htmlFor="saveCard" className="text-sm text-gray-700">
                  Save my card for future purchases
                </label>
              </div>
              
              {paymentMethod === 'yoco' && (
                <div className="space-y-4 animate-fade-in mt-6">
                  {/* Credit Card Input Fields */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        className="w-full p-2 border border-gray-300 rounded"
                        maxLength={19}
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          id="expiryDate"
                          placeholder="MM/YY"
                          className="w-full p-2 border border-gray-300 rounded"
                          maxLength={5}
                          value={expiryDate}
                          onChange={handleExpiryDateChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="text"
                          id="cvv"
                          placeholder="123"
                          className="w-full p-2 border border-gray-300 rounded"
                          maxLength={4}
                          value={cvv}
                          onChange={handleCvvChange}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="nameOnCard" className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                      <input
                        type="text"
                        id="nameOnCard"
                        placeholder="John Doe"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={nameOnCard}
                        onChange={handleNameOnCardChange}
                      />
                    </div>
                  </div>
                  
                  <button 
                    className="w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition-colors flex items-center justify-center"
                    onClick={handlePayment}
                    disabled={processing}
                  >
                    {processing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Pay R {total.toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              )}
              
              <div className="flex flex-col items-center mt-6">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
                  <Shield className="h-4 w-4" />
                  <span>Payment secured by 256-bit encryption</span>
                </div>
                
                {/* Payment method logos */}
                <div className="mt-4 text-center border-t pt-4 w-full">
                  <p className="text-sm text-gray-500 mb-2">We accept</p>
                  <div className="flex justify-center gap-3 items-center">
                    <span className="font-medium text-sm">Visa</span>
                    <span className="font-medium text-sm">Mastercard</span>
                    <span className="font-medium text-sm">American Express</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Your card details are securely processed and protected by 256-bit encryption
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Collapsible>
                <CollapsibleTrigger className="text-sm text-gray-600 hover:underline flex items-center">
                  <span>Payment & Security Information</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 border-t mt-4 text-sm text-gray-600">
                  <p className="mb-2">
                    All transactions are secure and encrypted. Card details are processed by Yoco, a trusted payment provider.
                  </p>
                  <p className="mb-2">
                    We accept Visa, Mastercard, American Express, and Diners Club cards.
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
