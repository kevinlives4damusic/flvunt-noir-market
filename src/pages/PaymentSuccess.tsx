import React, { useEffect, useContext, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartContext } from '@/context/CartContext';
import { getOrder } from '@/lib/orderService';

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
  const orderId = searchParams.get('orderId');

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
