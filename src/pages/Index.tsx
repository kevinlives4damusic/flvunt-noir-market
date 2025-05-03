
import React from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturedProducts from '@/components/FeaturedProducts';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <FeaturedProducts />
        <div className="py-16 flvunt-container text-center">
          <h2 className="text-3xl font-light mb-6">Authentic Streetwear</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            FLVUNT offers bold streetwear pieces that define urban culture.
            Our designs emphasize authentic expression, premium quality, and street-inspired
            aesthetics that stand out in the crowd.
          </p>
        </div>
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
