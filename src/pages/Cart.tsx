import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Trash, Plus, Minus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartContext } from '@/context/CartContext';

interface CartItemProps {
  item: {
    id: string | number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    size: string;
  };
  onRemove: (id: string | number, size: string) => void;
  onUpdateQuantity: (id: string | number, size: string, newQuantity: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove, onUpdateQuantity }) => {
  return (
    <div className="flex flex-col sm:flex-row py-6 border-b">
      <div className="w-full sm:w-1/4 aspect-square mb-4 sm:mb-0">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover bg-gray-100"
        />
      </div>
      <div className="sm:pl-6 flex flex-col flex-1 justify-between">
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">{item.name}</h3>
            <p className="text-gray-600 text-sm mt-1">Size: {item.size}</p>
          </div>
          <button 
            onClick={() => onRemove(item.id, item.size)} 
            className="text-gray-500 hover:text-black"
          >
            <Trash className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-between items-end">
          <div className="flex border border-gray-300">
            <button 
              className="px-3 py-1 border-r border-gray-300"
              onClick={() => onUpdateQuantity(item.id, item.size, Math.max(1, item.quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-1 flex items-center justify-center min-w-[40px]">
              {item.quantity}
            </span>
            <button 
              className="px-3 py-1 border-l border-gray-300"
              onClick={() => onUpdateQuantity(item.id, item.size, item.quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="text-lg font-medium">R {(item.price * item.quantity).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const { items, removeFromCart, updateQuantity, isAuthenticated } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleRemove = (id: string | number, size: string) => {
    removeFromCart(id, size);
    toast.success('Item removed from cart');
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-12 flvunt-container">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue shopping
          </Link>
          <h1 className="mt-4 text-3xl font-light tracking-wider">SHOPPING BAG</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-gray-500 mb-2">Your cart is empty</p>
                <p className="text-gray-400 mb-8">Add some items to your cart to see them here</p>
                <Button asChild className="flvunt-button">
                  <Link to="/shirts">SHOP NOW</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {items.map((item) => (
                  <CartItem 
                    key={`${item.id}-${item.size}`}
                    item={item}
                    onRemove={handleRemove}
                    onUpdateQuantity={updateQuantity}
                  />
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="lg:w-80">
              <div className="sticky top-24">
                <div className="bg-gray-50 p-6">
                  <h2 className="text-lg font-medium mb-4">Order Summary</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>R {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>
                  <div className="border-t my-4"></div>
                  <Button 
                    className="flvunt-button w-full" 
                    onClick={() => navigate('/checkout')}
                  >
                    PROCEED TO CHECKOUT
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
