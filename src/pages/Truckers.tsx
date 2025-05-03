import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartContext } from '@/context/CartContext';

// Example trucker hat products for demonstration
const truckerProducts = [
  {
    id: 1,
    name: 'Classic Black Trucker Hat',
    price: 300,
    image: '/images/image9.jpg'
  },
  {
    id: 2,
    name: 'Logo Embroidered Trucker Hat',
    price: 300,
    image: '/images/image9.jpg'
  },
  {
    id: 3,
    name: 'Vintage Wash Trucker Hat',
    price: 300,
    image: '/images/image9.jpg'
  }
];

const Truckers = () => {
  const { addToCart } = useContext(CartContext);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-12 flvunt-container">
        <h1 className="text-3xl font-light tracking-wider mb-8">TRUCKERS</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {truckerProducts.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-64 object-cover" />
              <div className="p-4">
                <h2 className="text-lg font-medium">{product.name}</h2>
                <p className="text-gray-600">R {product.price.toFixed(2)}</p>
                <Button 
                  className="flvunt-button w-full mt-4" 
                  onClick={() => addToCart(product)}
                >
                  ADD TO CART
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Truckers; 