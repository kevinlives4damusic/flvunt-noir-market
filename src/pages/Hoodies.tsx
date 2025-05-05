import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

const Hoodies = () => {
  // Hoodie data with specific prices
  const getHoodiePrice = (index: number): number => {
    if (index < 3) return 900; // image1-3
    return 450; // image4
  };

  const hoodies = Array.from({ length: 4 }, (_, i) => ({
    id: String(i + 1),
    name: `VETEMENTS PAR FLVUNT® HOODIE`,
    price: getHoodiePrice(i),
    description: "Premium quality apparel by FLVUNT",
    image_url: `/images/hoodies/image${i + 1}.jpg`
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-12 flvunt-container">
        <h1 className="text-3xl font-light tracking-wider mb-8">HOODIES</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hoodies.map((product) => (
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

export default Hoodies;
