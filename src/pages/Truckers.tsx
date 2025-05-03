
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
        
        {isLoading ? (
          <p className="text-gray-500 text-center py-10">Loading products...</p>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Products would render here if there were any */}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500 mb-2">No trucker hats available</p>
            <p className="text-gray-400">Check back soon for our new trucker hat collection</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Truckers;
