import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FeaturedProducts: React.FC = () => {
  const featuredProducts = [
    {
      id: '4',
      name: 'FLVUNT Graphic T-Shirt "Eagle"',
      price: 500,
      description: "Premium quality apparel by FLVUNT",
      image_url: '/images/shirts/image4.jpg'
    },
    {
      id: '1',
      name: 'Graphic T-Shirt "Spray Tag"',
      price: 800,
      description: "Premium quality apparel by FLVUNT",
      image_url: '/images/shirts/image1.jpg'
    },
    {
      id: '10',
      name: 'FLVUNT Graphic T-Shirt',
      price: 450,
      description: "Premium quality apparel by FLVUNT",
      image_url: '/images/shirts/image10.jpg'
    }
  ];
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      setMaxScroll(scrollRef.current.scrollWidth - scrollRef.current.clientWidth);
    }

    const handleResize = () => {
      if (scrollRef.current) {
        setMaxScroll(scrollRef.current.scrollWidth - scrollRef.current.clientWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount) 
        : Math.min(maxScroll, scrollPosition + scrollAmount);
      
      scrollRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth',
      });
      
      setScrollPosition(newPosition);
    }
  };

  return (
    <section className="py-16 relative">
      <div className="flvunt-container">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-light">New Arrivals</h2>
            <p className="text-sm text-gray-600 mt-1">VETEMENTS PAR FLVUNT®</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full" 
              onClick={() => scroll('left')}
              disabled={scrollPosition <= 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full" 
              onClick={() => scroll('right')}
              disabled={scrollPosition >= maxScroll}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex space-x-6 overflow-x-auto hide-scrollbar scroll-smooth pb-6"
        >
          {featuredProducts.map((product) => (
            <div 
              key={product.id} 
              className="min-w-[250px] md:min-w-[300px]"
            >
              <ProductCard 
                id={product.id}
                name={product.name}
                designer="VETEMENTS PAR FLVUNT®"
                price={`R ${product.price.toFixed(2)}`}
                imageUrl={product.image_url}
                isNew={true}
                description={product.description}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
