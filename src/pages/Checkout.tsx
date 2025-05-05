
import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartContext } from '@/context/CartContext';

interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

const Checkout = () => {
  const { isAuthenticated, items } = useContext(CartContext);
  const navigate = useNavigate();

  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 4.99;
  const total = subtotal + shipping;

  // Load saved shipping details for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      const savedDetails = localStorage.getItem('userShippingDetails');
      if (savedDetails) {
        try {
          setShippingDetails(JSON.parse(savedDetails));
        } catch (error) {
          console.error('Error parsing saved shipping details:', error);
        }
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast('Please log in to checkout', {
        description: 'You need to be logged in to complete your purchase'
      });
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setShippingDetails(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Save shipping details to localStorage for future use
    if (isAuthenticated) {
      localStorage.setItem('userShippingDetails', JSON.stringify(shippingDetails));
    }
    
    navigate('/payment');
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-12 flvunt-container">
        <div className="mb-8">
          <Link to="/cart" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to cart
          </Link>
          <h1 className="mt-4 text-3xl font-light tracking-wider">CHECKOUT</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-medium mb-4">Shipping Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                  <Input 
                    id="firstName" 
                    type="text" 
                    required 
                    className="mt-1" 
                    value={shippingDetails.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <Input 
                    id="lastName" 
                    type="text" 
                    required 
                    className="mt-1" 
                    value={shippingDetails.lastName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    className="mt-1" 
                    value={shippingDetails.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    required 
                    className="mt-1" 
                    value={shippingDetails.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                  <Input 
                    id="address" 
                    type="text" 
                    required 
                    className="mt-1" 
                    value={shippingDetails.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                  <Input 
                    id="city" 
                    type="text" 
                    required 
                    className="mt-1" 
                    value={shippingDetails.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <Input 
                    id="postalCode" 
                    type="text" 
                    required 
                    className="mt-1" 
                    value={shippingDetails.postalCode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <Button type="submit" className="flvunt-button w-full">
                PROCEED TO PAYMENT
              </Button>
            </form>
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

export default Checkout;
