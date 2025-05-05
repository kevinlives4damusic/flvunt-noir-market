
import React, { useEffect, useContext, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, Package, Truck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartContext } from '@/context/CartContext';
import { getOrder } from '@/lib/orderService';
import { Button } from '@/components/ui/button';

interface OrderItem {
  product_id: string;
  quantity: number;
  price_cents: number;
  metadata?: {
    name: string;
    image: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  amount_cents: number;
  currency: string;
  items: OrderItem[];
}

const PaymentSuccess = () => {
  const { clearCart } = useContext(CartContext);
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTracking, setShowTracking] = useState(false);
  const orderId = searchParams.get('orderId');

  // Calculate estimated delivery dates (3-5 days from now)
  const today = new Date();
  const earliestDelivery = new Date(today);
  earliestDelivery.setDate(today.getDate() + 3);
  const latestDelivery = new Date(today);
  latestDelivery.setDate(today.getDate() + 5);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-ZA', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    });
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const result = await getOrder(orderId);
        if (result.success && result.data) {
          setOrder(result.data as Order);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    clearCart();
    fetchOrder();
  }, [clearCart, orderId]);

  const toggleTracking = () => {
    setShowTracking(!showTracking);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-medium mb-4">Payment Successful!</h1>
          
          {order ? (
            <div className="mb-8">
              <p className="text-gray-600 mb-4">
                Thank you for your purchase. Your order #{order.order_number} has been confirmed 
                and will be processed shortly.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h2 className="text-lg font-medium mb-4">Order Summary</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      {item.metadata?.image && (
                        <img 
                          src={item.metadata.image} 
                          alt={item.metadata?.name || 'Product'} 
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-medium">{item.metadata?.name || 'Product'}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-sm">R {(item.price_cents / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>R {(order.amount_cents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={toggleTracking} 
                variant="outline"
                className="mb-6 flex items-center gap-2 mx-auto"
                size="lg"
              >
                <Truck className="h-5 w-5" />
                {showTracking ? 'Hide Tracking Information' : 'Track Order'}
              </Button>
              
              {showTracking && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                  <h3 className="text-lg font-medium mb-4 flex items-center justify-center gap-2">
                    <Package className="h-5 w-5" />
                    Delivery Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium">Order Confirmed</p>
                        <p className="text-sm text-gray-600">{new Date().toLocaleDateString('en-ZA')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium">Processing</p>
                        <p className="text-sm text-gray-600">Your order is being processed</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium">Estimated Delivery</p>
                        <p className="text-sm text-gray-600">
                          Between {formatDate(earliestDelivery)} and {formatDate(latestDelivery)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-6">
                You will receive an email confirmation with your order details shortly.
              </p>
            </div>
          ) : (
            <p className="text-gray-600 mb-8">
              Thank you for your purchase. Your order has been confirmed and will be processed shortly.
            </p>
          )}
          
          <div className="space-x-4">
            <Link 
              to="/products"
              className="inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Continue Shopping
            </Link>
            <Link 
              to="/contact"
              className="inline-block border border-gray-300 px-6 py-2 rounded-md hover:border-gray-400 transition-colors"
            >
              Need Help?
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
