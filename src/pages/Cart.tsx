import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Trash, Plus, Minus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Example cart items for demonstration
const cartItems = [
  {
    id: 1,
    name: 'Black Oversized T-Shirt',
    price: 49.99,
    quantity: 1,
    image: '/lovable-uploads/dc882ecd-e64c-4708-842e-fff34bdcd2e2.png'
  },
  {
    id: 2,
    name: 'Logo Hoodie - Limited Edition',
    price: 89.99,
    quantity: 2,
    image: '/lovable-uploads/dc882ecd-e64c-4708-842e-fff34bdcd2e2.png'
  }
];

const CartItem = ({ item, onRemove, onUpdateQuantity }: any) => {
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
            <p className="text-gray-600 text-sm mt-1">Size: M</p>
          </div>
          <button 
            onClick={() => onRemove(item.id)} 
            className="text-gray-500 hover:text-black"
          >
            <Trash className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-between items-end">
          <div className="flex border border-gray-300">
            <button 
              className="px-3 py-1 border-r border-gray-300"
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-1 flex items-center justify-center min-w-[40px]">
              {item.quantity}
            </span>
            <button 
              className="px-3 py-1 border-l border-gray-300"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
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
  const [items, setItems] = React.useState(cartItems);

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart."
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 4.99;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-12 flvunt-container">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue shopping
          </Link>
          <h1 className="mt-4 text-3xl font-light tracking-wider">YOUR CART</h1>
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <h2 className="text-xl mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Button asChild className="flvunt-button">
              <Link to="/">START SHOPPING</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1">
              {items.map(item => (
                <CartItem 
                  key={item.id} 
                  item={item} 
                  onRemove={removeItem} 
                  onUpdateQuantity={updateQuantity}
                />
              ))}
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
              
              <Button 
                className="flvunt-button w-full mt-6"
                onClick={() => toast({
                  title: "Checkout initiated",
                  description: "This is a demo. Checkout functionality requires backend integration."
                })}
              >
                CHECKOUT
              </Button>
              <Button 
                className="flvunt-button w-full mt-4"
                asChild
              >
                <Link to="/checkout">PROCEED TO CHECKOUT</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
