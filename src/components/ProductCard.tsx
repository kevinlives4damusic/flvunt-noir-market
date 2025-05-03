
import React, { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { CartContext } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  name: string;
  designer: string;
  price: string;
  imageUrl: string;
  isNew?: boolean;
  isSale?: boolean;
  salePrice?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  designer,
  price,
  imageUrl,
  isNew = false,
  isSale = false,
  salePrice
}) => {
  const { addToCart, isAuthenticated } = useContext(CartContext);
  const navigate = useNavigate();
  
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    addToCart({
      id,
      name,
      price: parseFloat(price.replace('R ', '')),
      image: imageUrl
    });
  };

  return (
    <div className="group relative">
      {/* Image container */}
      <div className="aspect-square overflow-hidden bg-flvunt-lightgrey mb-3">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300 flex items-end justify-center opacity-0 group-hover:opacity-100">
          <Button 
            className="flvunt-button mb-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
            onClick={handleAddToCart}
          >
            ADD TO BAG
          </Button>
        </div>

        {/* Wishlist button */}
        <Button 
          variant="outline" 
          size="icon" 
          className="absolute top-2 right-2 bg-white hover:bg-flvunt-black hover:text-white rounded-full h-8 w-8"
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
  );
};

export default ProductCard;
