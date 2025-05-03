
import React from 'react';
import ProductCard from './ProductCard';
import { useProducts, Product } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';

const FeaturedProducts: React.FC = () => {
  const { data: products, isLoading } = useProducts("shirts");

  const renderProductSkeleton = () => (
    <>
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className="flex flex-col gap-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </>
  );

  return (
    <section className="py-16">
      <div className="flvunt-container">
        <h2 className="text-3xl font-light mb-4 text-center">New Arrivals</h2>
        <p className="text-sm text-gray-600 mb-12 text-center">Discover our latest collection</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {isLoading ? renderProductSkeleton() : (
            products?.map(product => (
              <ProductCard 
                key={product.id}
                id={product.id}
                name={product.name}
                designer="FLVUNT BASICS"
                price={`R ${product.price.toFixed(2)}`}
                imageUrl={product.image_url}
                isNew={true}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
