import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const PaymentCancel: React.FC = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-grow flex flex-col items-center justify-center p-6 flvunt-container">
      <h1 className="text-3xl font-semibold mb-4">Payment Cancelled</h1>
      <p className="mb-6">Your payment was not completed. You can try again.</p>
      <Button asChild>
        <Link to="/checkout">Return to Checkout</Link>
      </Button>
    </main>
    <Footer />
  </div>
);

export default PaymentCancel;
