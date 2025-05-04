import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface LikeButtonProps {
  productId: string;
  initialLiked?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = ({ productId, initialLiked = false }) => {
  const [isLiked, setIsLiked] = useState(initialLiked);

  useEffect(() => {
    // Load liked state from localStorage
    const likedProducts = JSON.parse(localStorage.getItem('likedProducts') || '{}');
    setIsLiked(!!likedProducts[productId]);
  }, [productId]);

  const handleLike = () => {
    const likedProducts = JSON.parse(localStorage.getItem('likedProducts') || '{}');
    
    if (isLiked) {
      delete likedProducts[productId];
      toast({
        description: 'Removed from favorites',
      });
    } else {
      likedProducts[productId] = true;
      toast({
        description: 'Added to favorites',
      });
    }
    
    localStorage.setItem('likedProducts', JSON.stringify(likedProducts));
    setIsLiked(!isLiked);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`rounded-full ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-600'}`}
      onClick={handleLike}
    >
      <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
    </Button>
  );
};

export default LikeButton;
