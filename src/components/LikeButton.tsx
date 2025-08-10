import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LikeButtonProps {
  productId: string;
  initialLiked?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = ({ productId, initialLiked = false }) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (user) {
        const ref = doc(db(), 'users', user.uid, 'likes', productId);
        const snap = await getDoc(ref);
        setIsLiked(snap.exists());
      } else {
        const likedProducts = JSON.parse(localStorage.getItem('likedProducts') || '{}');
        setIsLiked(!!likedProducts[productId]);
      }
    };
    void load();
  }, [productId, user]);

  const handleLike = async () => {
    try {
      if (user) {
        const ref = doc(db(), 'users', user.uid, 'likes', productId);
        if (isLiked) {
          await deleteDoc(ref);
          toast({ description: 'Removed from favorites' });
        } else {
          await setDoc(ref, { created_at: new Date().toISOString() });
          toast({ description: 'Added to favorites' });
        }
      } else {
        const likedProducts = JSON.parse(localStorage.getItem('likedProducts') || '{}');
        if (isLiked) {
          delete likedProducts[productId];
          toast({ description: 'Removed from favorites' });
        } else {
          likedProducts[productId] = true;
          toast({ description: 'Added to favorites' });
        }
        localStorage.setItem('likedProducts', JSON.stringify(likedProducts));
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Like toggle failed', error);
      toast({ description: 'Failed to update favorites' });
    }
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
