import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Example order summary for demonstration
const orderSummary = {
  subtotal: 229.97,
  shipping: 4.99,
  total: 234.96
};

const Checkout = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Order submitted",
      description: "This is a demo. Order submission requires backend integration."
    });
  };

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
                  <Input id="firstName" type="text" required className="mt-1" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <Input id="lastName" type="text" required className="mt-1" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <Input id="email" type="email" required className="mt-1" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                  <Input id="phone" type="tel" required className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                  <Input id="address" type="text" required className="mt-1" />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                  <Input id="city" type="text" required className="mt-1" />
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <Input id="postalCode" type="text" required className="mt-1" />
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
                <p>R {orderSummary.subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Shipping</p>
                <p>R {orderSummary.shipping.toFixed(2)}</p>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between font-medium text-lg">
                <p>Total</p>
                <p>R {orderSummary.total.toFixed(2)}</p>
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