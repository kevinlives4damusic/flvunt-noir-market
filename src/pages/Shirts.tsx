
import React, { useContext } from 'react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartContext } from '@/context/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';

const Shirts = () => {
  const { addToCart } = useContext(CartContext);
  const { data: products, isLoading } = useProducts("shirts");

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
          {isLoading ? renderProductSkeleton() : (
            products?.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <img src={product.image_url} alt={product.name} className="w-full h-64 object-cover" />
                <div className="p-4">
                  <h2 className="text-lg font-medium">{product.name}</h2>
                  <p className="text-gray-600">R {product.price.toFixed(2)}</p>
                  <Button 
                    className="flvunt-button w-full mt-4" 
                    onClick={() => addToCart({
                      id: Number(product.id),
                      name: product.name,
                      price: product.price,
                      image: product.image_url
                    })}
                  >
                    ADD TO CART
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shirts;
