import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

const Shirts = () => {
  // Shirt data with specific prices
  const getShirtPrice = (index: number): number => {
    if (index < 3) return 800; // image1-3
    if (index < 5) return 500; // image4-5
    if (index === 5 || index === 8) return 350; // image6&9
    if (index === 6 || index === 7) return 400; // image7-8
    if (index === 9) return 450; // image10
    return 450; // image11-13 (for future expansion)
  };

  const getShirtName = (index: number): string => {
    if (index < 3) return 'Graphic T-Shirt "Spray Tag"';
    if (index === 3) return 'FLVUNT Graphic T-Shirt "Eagle"';
    if (index === 4) return 'Masque de ski 2.0';
    if (index === 5 || index === 8) return 'FLVUNT Plain Print T';
    if (index === 6 || index === 7) return 'Masque de ski';
    return 'FLVUNT Graphic T-Shirt'; // image10-13
  };

  const shirts = Array.from({ length: 13 }, (_, i) => ({
    id: String(i + 1),
    name: getShirtName(i),
    price: getShirtPrice(i),
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
