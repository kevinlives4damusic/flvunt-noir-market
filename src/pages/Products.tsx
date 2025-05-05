
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ProductFilter from '@/components/ProductFilter';
import { useProductsWithFilters } from '@/hooks/useProductsWithFilters';
import BackToTop from '@/components/BackToTop';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  
  const { products, loading, error } = useProductsWithFilters(category, sortBy);

  const handleCategoryChange = (newCategory: string) => {
    if (newCategory === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', newCategory);
    }
    setSearchParams(searchParams);
  };

  const handleSortChange = (newSort: string) => {
    searchParams.set('sort', newSort);
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-8 flvunt-container">
        <h1 className="text-3xl font-light tracking-wider mb-8">PRODUCTS</h1>
        
        <ProductFilter 
          currentCategory={category || 'all'} 
          currentSort={sortBy}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
        />
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">Error loading products. Please try again later.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                designer="FLVUNT"
                price={`R ${Number(product.price).toFixed(2)}`}
                imageUrl={product.image_url || '/images/placeholder.jpg'}
                description={product.description || ''}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Products;
