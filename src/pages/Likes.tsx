import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useAuth } from '@/context/AuthContext';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
}

const Likes = () => {
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const loadLikes = async () => {
      try {
        let likedIds: string[] = [];
        if (user) {
          const likesSnap = await getDocs(collection(db(), 'users', user.uid, 'likes'));
          likedIds = likesSnap.docs.map(d => d.id);
        } else {
          const liked = JSON.parse(localStorage.getItem('likedProducts') || '{}');
          likedIds = Object.keys(liked).filter((k) => liked[k]);
        }

        if (likedIds.length === 0) {
          setLikedProducts([]);
          return;
        }

        // Fetch product details for liked IDs
        const products: Product[] = [];
        for (const id of likedIds) {
          const pSnap = await getDoc(doc(db(), 'products', id));
          if (pSnap.exists()) {
            const data = pSnap.data() as any;
            products.push({ id: pSnap.id, ...data });
          }
        }
        setLikedProducts(products);
      } catch (error) {
        console.error('Failed to load likes', error);
        setLikedProducts([]);
      }
    };
    void loadLikes();
  }, [user]);

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
