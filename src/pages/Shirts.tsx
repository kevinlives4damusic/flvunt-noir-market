import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

const Shirts = () => {
  // Mock data for 9 shirts
  const shirts = Array.from({ length: 9 }, (_, i) => ({
    id: String(i + 1),
    name: `FLVUNT Classic Shirt ${i + 1}`,
    price: 399.99,
    description: "Premium quality street style shirt with modern design.",
    image_url: `/images/shirts/image${i + 1}.jpg`
  }));

  const renderProductSkeleton = () => (
    <>
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
          <Skeleton className="h-64 w-full" />
          <div className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-12 flvunt-container">
        <h1 className="text-3xl font-light tracking-wider mb-8">SHIRTS</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shirts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              designer="FLVUNT BASICS"
              price={`R ${product.price.toFixed(2)}`}
              imageUrl={product.image_url}
              description={product.description}
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shirts;
