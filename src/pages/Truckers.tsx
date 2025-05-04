
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useProducts } from '@/hooks/useProducts';

const Truckers = () => {
  const { data: products, isLoading } = useProducts("truckers");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-12 flvunt-container">
        <h1 className="text-3xl font-light tracking-wider mb-8">TRUCKERS</h1>
        
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <h2 className="text-4xl font-bold mb-4">COMING SOON</h2>
          <p className="text-xl text-gray-600 mb-6">Our Exclusive Trucker Collection</p>
          <div className="space-y-2">
            <p className="text-gray-500">Get ready for the ultimate street style statement</p>
            <p className="text-gray-500">Launching Summer 2025</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Truckers;
