
import React from 'react';
import ProductCard from './ProductCard';

const FeaturedProducts: React.FC = () => {
  const featuredProducts = [
    {
      id: "1",
      name: "Oversized Cotton Hoodie",
      designer: "FLVUNT BASICS",
      price: "€129.00",
      imageUrl: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      isNew: true
    },
    {
      id: "2",
      name: "Relaxed Fit T-Shirt",
      designer: "FLVUNT STUDIO",
      price: "€79.00",
      imageUrl: "https://images.unsplash.com/photo-1583744946564-b52d01e2e08a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      isNew: true
    },
    {
      id: "3",
      name: "Wide Leg Trousers",
      designer: "FLVUNT ATELIER",
      price: "€159.00",
      salePrice: "€99.00",
      imageUrl: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      isSale: true
    },
    {
      id: "4",
      name: "Structured Blazer",
      designer: "FLVUNT TAILORED",
      price: "€249.00",
      imageUrl: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    }
  ];

  return (
    <section className="py-16">
      <div className="flvunt-container">
        <h2 className="text-3xl font-light mb-4 text-center">New Arrivals</h2>
        <p className="text-sm text-gray-600 mb-12 text-center">Discover our latest collection</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map(product => (
            <ProductCard 
              key={product.id}
              id={product.id}
              name={product.name}
              designer={product.designer}
              price={product.price}
              imageUrl={product.imageUrl}
              isNew={product.isNew}
              isSale={product.isSale}
              salePrice={product.salePrice}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
