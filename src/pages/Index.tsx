import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturedProducts from '@/components/FeaturedProducts';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

const Index = () => {
  const location = useLocation();
  const newArrivalsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if we should scroll to New Arrivals section
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('section') === 'new-arrivals') {
      newArrivalsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <div ref={newArrivalsRef}>
          <FeaturedProducts />
        </div>
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
      <BackToTop />
    </div>
  );
};

export default Index;
