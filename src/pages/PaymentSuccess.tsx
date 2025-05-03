import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const PaymentSuccess: React.FC = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-grow flex flex-col items-center justify-center p-6 flvunt-container">
      <h1 className="text-3xl font-semibold mb-4">Payment Successful</h1>
      <p className="mb-6">Thank you for your purchase! Your order has been placed.</p>
      <Button asChild>
        <Link to="/">Return to Home</Link>
      </Button>
    </main>
    <Footer />
  </div>
);

export default PaymentSuccess;
