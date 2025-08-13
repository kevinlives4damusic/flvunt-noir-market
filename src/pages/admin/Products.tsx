import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const ProductsAdmin: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-10 flvunt-container">
        <h1 className="text-2xl font-medium">Products Admin</h1>
        <p className="text-gray-600 mt-2">Coming soon.</p>
      </div>
      <Footer />
    </div>
  );
};

export default ProductsAdmin;


