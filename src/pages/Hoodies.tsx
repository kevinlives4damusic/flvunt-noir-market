import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

const Hoodies = () => {
  // Mock data for 4 hoodies
  const hoodies = Array.from({ length: 4 }, (_, i) => ({
    id: String(i + 1),
    name: `FLVUNT Essential Hoodie ${i + 1}`,
    price: 599.99,
    description: "Premium quality street style hoodie with modern design.",
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
