import React, { useEffect, useRef } from 'react';
import '@/styles/fonts.css';
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
        <div ref={newArrivalsRef}>
          <FeaturedProducts />
        </div>
        <HeroSection />
        <div className="py-16 flvunt-container text-center">
          <h2 className="text-3xl font-bold mb-6 spray-font">
            flvunt apparel - Go againts normal
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Pretoria, South Africa 🇿🇦
          </p>
          <a href="https://wa.me/c/27682073121" className="text-gray-600 hover:text-black mt-4 inline-block">
            Contact Us
          </a>
        </div>
        <Newsletter />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Index;
