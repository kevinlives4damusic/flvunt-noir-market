import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
}

const Likes = () => {
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Load liked products from localStorage
    const likedIds = JSON.parse(localStorage.getItem('likedProducts') || '{}');
    
    // Get all products data
    const allProducts = [
      // Shirts
      ...Array.from({ length: 13 }, (_, i) => ({
        id: String(i + 1),
        name: i < 3 ? 'Graphic T-Shirt "Spray Tag"' :
              i === 3 ? 'FLVUNT Graphic T-Shirt "Eagle"' :
              i === 4 ? 'Masque de ski 2.0' :
              i === 5 || i === 8 ? 'FLVUNT Plain Print T' :
              i === 6 || i === 7 ? 'Masque de ski' :
              'FLVUNT Graphic T-Shirt',
        price: i < 3 ? 800 :
               i === 3 ? 500 :
               i === 5 || i === 8 ? 350 :
               i === 6 || i === 7 ? 400 :
               450,
        description: "Premium quality apparel by FLVUNT",
        image_url: `/images/shirts/image${i + 1}.jpg`
      })),
      // Hoodies
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `hoodie-${i + 1}`,
        name: 'VETEMENTS PAR FLVUNT® HOODIE',
        price: i < 3 ? 900 : 450,
        description: "Premium quality apparel by FLVUNT",
        image_url: `/images/hoodies/image${i + 1}.jpg`
      }))
    ];

    // Filter only liked products
    const liked = allProducts.filter(product => likedIds[product.id]);
    setLikedProducts(liked);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="flvunt-container">
          <h1 className="text-3xl font-light mb-8">Favorites</h1>
          {likedProducts.length === 0 ? (
            <p className="text-gray-600">No favorites yet. Start adding some!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  designer="VETEMENTS PAR FLVUNT®"
                  price={`R ${product.price.toFixed(2)}`}
                  imageUrl={product.image_url}
                  description={product.description}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Likes;
