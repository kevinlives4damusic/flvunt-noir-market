import React, { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import { CartContext } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import ProductQuickView from './ProductQuickView';
import LikeButton from './LikeButton';

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
        <div className="aspect-square overflow-hidden bg-flvunt-lightgrey mb-3 relative rounded-xl border border-white/20 shadow-md">
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
          <div className="absolute inset-0 transition-opacity duration-300 flex items-end justify-center opacity-0 group-hover:opacity-100">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex gap-2 mb-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Button 
                className="flvunt-button backdrop-blur-md bg-white/70 hover:bg-white/90 text-black border border-white/40"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                ADD TO BAG
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white/70 hover:bg-black hover:text-white rounded-md h-10 w-10 border-white/40 backdrop-blur-md"
                onClick={() => setQuickViewOpen(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Like button */}
          <div className="absolute top-2 right-2">
            <LikeButton productId={id} />
          </div>

          {/* Labels */}
          {isNew && (
            <span className="absolute top-2 left-2 bg-white/70 backdrop-blur-md text-black px-2 py-1 text-xs rounded-md border border-white/40">
              NEW
            </span>
          )}
          
          {isSale && (
            <span className="absolute top-2 left-2 bg-red-500/80 backdrop-blur-md text-white px-2 py-1 text-xs rounded-md border border-white/30">
              SALE
            </span>
          )}
        </div>

        {/* Product info */}
        <div className="rounded-xl border border-white/20 bg-white/60 backdrop-blur-md p-3 shadow-sm">
          <p className="text-xs text-gray-700 mb-1">{designer}</p>
          <h3 className="font-medium mb-1 text-sm">{name}</h3>
          <div className="flex gap-2 items-baseline">
            {isSale ? (
              <>
                <p className="text-red-600 text-sm font-semibold">{salePrice}</p>
                <p className="text-gray-500 text-xs line-through">{price}</p>
              </>
            ) : (
              <p className="text-sm font-medium">{price}</p>
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
