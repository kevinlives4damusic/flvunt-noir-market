import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Check, CreditCard, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartContext } from '@/context/CartContext';
import BackToTop from '@/components/BackToTop';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { createOrder } from '@/lib/orderService';
import { PaymentProcessor } from '@/components/checkout/PaymentProcessor';
import { PaymentVerification } from '@/components/checkout/PaymentVerification';
// Payment provider integration removed
import { v4 as uuidv4 } from 'uuid';
import { getSavedPaymentMethods, createPayment } from '@/lib/payment-service';
import { CreditCardInput } from '@/components/checkout/CreditCardInput';
import { useBeforeUnload } from '../hooks/use-before-unload';

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
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderAmountCents, setOrderAmountCents] = useState<number | null>(null);
  const [saveCard, setSaveCard] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [formIsValid, setFormIsValid] = useState(false);
  const [savedMethods, setSavedMethods] = useState<{ method_id: string; brand: string; last4: string }[]>([]);
  const [useSavedMethod, setUseSavedMethod] = useState<string | null>(null);

  // Add leave page warning
  useBeforeUnload(
    processing,
    'Are you sure you want to leave? Your payment is still being processed.'
  );

  // Check if we're returning from a payment provider
  const isVerifying = searchParams.has('paymentId') || searchParams.has('reference') || searchParams.has('status');

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

  // Load saved payment methods for the user
  useEffect(() => {
    const load = async () => {
      try {
        const methods = await getSavedPaymentMethods();
        setSavedMethods(methods as any);
        if (methods.length > 0) setUseSavedMethod(methods[0].method_id);
      } catch (e) {
        // ignore
      }
    };
    void load();
  }, []);

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
          metadata: { name: item.name, image: item.image }
        })),
        amount_cents: Math.round(total * 100),
        currency: 'ZAR',
        metadata: {
          customer_email: 'thamsanxamudau@gmail.com'
        }
      };
      const result = await createOrder(orderData);
      if (result.success && result.data) {
        setOrderId(result.data.id);
        if ((result.data as any).amount_cents != null) setOrderAmountCents((result.data as any).amount_cents);
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

  const handleCardDetailsChange = (values: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    nameOnCard: string;
    isValid: boolean;
  }) => {
    setCardNumber(values.cardNumber);
    setExpiryDate(values.expiryDate);
    setCvv(values.cvv);
    setNameOnCard(values.nameOnCard);
    setFormIsValid(values.isValid);
  };

  const handlePayment = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const newOrderId = await createNewOrder();
      if (!newOrderId) {
        setProcessing(false);
        return;
      }
      if (paymentMethod !== 'card') {
        toast.error('Unsupported payment method');
        setProcessing(false);
        return;
      }
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/payment-success?orderId=${newOrderId}`;
      const cancelUrl = `${baseUrl}/payment-cancel?orderId=${newOrderId}`;
      const failureUrl = `${baseUrl}/payment-failure?orderId=${newOrderId}`;

      const idKeyStorage = `payment:idempotency:${newOrderId}`;
      let idemKey: string | undefined;
      try {
        const stored = window.localStorage.getItem(idKeyStorage);
        idemKey = stored || uuidv4();
        if (!stored) window.localStorage.setItem(idKeyStorage, idemKey);
      } catch {}

      const amountToChargeCents = orderAmountCents ?? Math.round(total * 100);
      const result = await createPayment({
        orderId: newOrderId,
        amountInCents: amountToChargeCents,
        currency: 'ZAR',
        successUrl,
        cancelUrl,
        failureUrl,
        saveCard,
        metadata: { orderId: newOrderId },
        idempotencyKey: idemKey,
      });

      if (!result.success || !result.redirectUrl) {
        throw new Error(result.error ? (typeof result.error === 'string' ? result.error : (result.error as any).message) : 'Payment creation failed');
      }

      window.location.href = result.redirectUrl;
    } catch (error) {
      console.error('Payment processing error:', error);
      handlePaymentError(error instanceof Error ? error.message : 'Payment processing failed');
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
                  id="card" 
                  name="Credit/Debit Card"
                  icon={<CreditCard className="h-5 w-5" />}
                  selected={paymentMethod === 'card'}
                  onSelect={() => setPaymentMethod('card')}
                />
              </div>
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
              {paymentMethod === 'card' && (
                <div className="space-y-4 animate-fade-in">
                  {savedMethods.length > 0 && (
                    <div className="border rounded-md p-3 bg-gray-50">
                      <p className="text-sm font-medium mb-2">Use a saved card</p>
                      <div className="space-y-2">
                        {savedMethods.map((m) => (
                          <label key={m.method_id} className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="savedMethod"
                              checked={useSavedMethod === m.method_id}
                              onChange={() => setUseSavedMethod(m.method_id)}
                            />
                            <span className="capitalize">{m.brand}</span>
                            <span>•••• {m.last4}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        className="mt-3 text-xs underline"
                        onClick={() => setUseSavedMethod(null)}
                        type="button"
                      >
                        Use a different card
                      </button>
                    </div>
                  )}
                  {!useSavedMethod && (
                    <CreditCardInput onChange={handleCardDetailsChange} />
                  )}
                  <button 
                    className={`w-full py-3 rounded font-medium transition-colors ${
                      (useSavedMethod ? true : formIsValid) 
                        ? 'bg-black text-white hover:bg-gray-800' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={handlePayment}
                    disabled={processing || (!useSavedMethod && !formIsValid)}
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
                      'Pay R ' + total.toFixed(2)
                    )}
                  </button>
                </div>
              )}
              <div className="flex flex-col items-center mt-6">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
                  <Shield className="h-4 w-4" />
                  <span>Payment secured by 256-bit encryption</span>
                </div>
                <div className="mt-4 text-center border-t pt-4 w-full">
                  <p className="text-sm text-gray-500 mb-2">Secure payments by</p>
                  <div className="flex justify-center items-center">
                    <span className="text-sm">Paystack</span>
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
                     All transactions are secure and encrypted. Card details are processed by our payment provider.
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
