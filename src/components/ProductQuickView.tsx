
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogHeader,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CartContext } from '@/context/CartContext';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, X } from 'lucide-react';

interface ProductQuickViewProps {
  product: {
    id: string | number;
    name: string;
    price: number;
    image_url: string;
    description?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductQuickView: React.FC<ProductQuickViewProps> = ({ product, open, onOpenChange }) => {
  const { addToCart, isAuthenticated } = useContext(CartContext);
  const navigate = useNavigate();

  if (!product) return null;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full bg-white/90 p-1 text-gray-500 hover:text-gray-800 z-10"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="bg-gray-100 aspect-square">
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-normal">{product.name}</DialogTitle>
              <p className="text-lg font-medium mt-2">R {product.price.toFixed(2)}</p>
            </DialogHeader>
            
            <div className="mt-4 flex-grow">
              <p className="text-gray-600 text-sm">
                {product.description || "This premium FLVUNT product combines style and comfort, designed for those who appreciate quality streetwear with a modern edge."}
              </p>
              
              <div className="mt-6">
                <h4 className="font-medium text-sm mb-2">Size</h4>
                <div className="flex gap-2">
                  {['S', 'M', 'L', 'XL'].map((size) => (
                    <button 
                      key={size}
                      className="w-10 h-10 border border-gray-300 flex items-center justify-center hover:border-black transition-colors"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button 
                onClick={handleAddToCart} 
                className="flvunt-button w-full"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Add to Bag
              </Button>
              <Button variant="outline" className="flvunt-button-outline w-full">
                <Heart className="mr-2 h-4 w-4" />
                Wishlist
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQuickView;
