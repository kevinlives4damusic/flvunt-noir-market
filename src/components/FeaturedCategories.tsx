
import React from 'react';
import { Button } from '@/components/ui/button';

interface CategoryCardProps {
  title: string;
  imageUrl: string;
  link: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, imageUrl, link }) => {
  return (
    <div className="relative group overflow-hidden">
      <div className="aspect-[3/4] overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center bg-white/80 px-6 py-4 backdrop-blur-sm">
          <h3 className="text-xl font-medium mb-3">{title}</h3>
          <Button className="flvunt-button-outline">SHOP NOW</Button>
        </div>
      </div>
    </div>
  );
};

const FeaturedCategories: React.FC = () => {
  const categories = [
    {
      title: "WOMEN'S COLLECTION",
      imageUrl: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      link: "/women"
    },
    {
      title: "MEN'S COLLECTION",
      imageUrl: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      link: "/men"
    },
    {
      title: "ACCESSORIES",
      imageUrl: "https://images.unsplash.com/photo-1527576539890-dfa815648363?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      link: "/accessories"
    }
  ];

  return (
    <section className="py-16 bg-flvunt-lightgrey">
      <div className="flvunt-container">
        <h2 className="text-3xl font-light mb-12 text-center">Shop Categories</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <CategoryCard 
              key={index}
              title={category.title}
              imageUrl={category.imageUrl}
              link={category.link}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
