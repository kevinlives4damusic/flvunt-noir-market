
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, className }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images.length) return null;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="aspect-square overflow-hidden bg-gray-100 mb-4">
        <img 
          src={images[selectedIndex]} 
          alt="Product" 
          className="w-full h-full object-cover transition-transform duration-500"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {images.map((image, index) => (
          <button
            key={index}
            className={cn(
              "min-w-16 h-16 border-2 transition-all",
              selectedIndex === index ? "border-black" : "border-transparent opacity-70 hover:opacity-100"
            )}
            onClick={() => setSelectedIndex(index)}
          >
            <img 
              src={image} 
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
