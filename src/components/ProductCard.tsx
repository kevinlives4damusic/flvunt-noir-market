import React, { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import { CartContext } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import ProductQuickView from './ProductQuickView';

interface ProductCardProps {
  id: string;
  name: string;
  designer: string;
  price: string;
  imageUrl: string;
  isNew?: boolean;
  isSale?: boolean;
  salePrice?: string;
  description?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  designer,
  price,
  imageUrl,
  isNew = false,
  isSale = false,
  salePrice,
  description
}) => {
  const { addToCart, isAuthenticated } = useContext(CartContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedSize) {
      setQuickViewOpen(true);
      return;
    }
    
    addToCart({
      id,
      name,
      price: parseFloat(price.replace('R ', '')),
      image: imageUrl,
      size: selectedSize
    });

    toast.success('Added to cart', { 
      description: `${name} has been added to your cart` 
    });
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    toast.success('Added to wishlist');
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <>
      <div className="group relative">
        {/* Image container */}
        <div className="aspect-square overflow-hidden bg-flvunt-lightgrey mb-3 relative">
          {isLoading && (
            <Skeleton className="absolute inset-0 z-10" />
          )}
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onLoad={handleImageLoad}
            style={{ opacity: isLoading ? 0 : 1 }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300 flex items-end justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2 mb-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Button 
                className="flvunt-button"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                ADD TO BAG
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white hover:bg-flvunt-black hover:text-white rounded-none h-10 w-10 border-white"
                onClick={() => setQuickViewOpen(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Wishlist button */}
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute top-2 right-2 bg-white hover:bg-flvunt-black hover:text-white rounded-full h-8 w-8"
            onClick={handleWishlist}
          >
            <Heart className="h-4 w-4" />
          </Button>

          {/* Labels */}
          {isNew && (
            <span className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-xs">
              NEW
            </span>
          )}
          
          {isSale && (
            <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs">
              SALE
            </span>
          )}
        </div>

        {/* Product info */}
        <div>
          <p className="text-xs text-gray-600 mb-1">{designer}</p>
          <h3 className="font-medium mb-1 text-sm">{name}</h3>
          <div className="flex gap-2">
            {isSale ? (
              <>
                <p className="text-red-500 text-sm font-medium">{salePrice}</p>
                <p className="text-gray-400 text-sm line-through">{price}</p>
              </>
            ) : (
              <p className="text-sm">{price}</p>
            )}
          </div>
        </div>
      </div>

      <ProductQuickView 
        product={quickViewOpen ? {
          id,
          name,
          price: parseFloat(price.replace('R ', '')),
          image_url: imageUrl,
          description
        } : null}
        open={quickViewOpen}
        onOpenChange={(isOpen) => {
          setQuickViewOpen(isOpen);
          if (!isOpen) setSelectedSize(null);
        }}
      />
    </>
  );
};

export default ProductCard;
