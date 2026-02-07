
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url: string;
  category: string;
  designer: string;
  available_sizes: string[];
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

import { localProducts, getLocalProduct, getLocalProductsByCategory } from '@/data/products';

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ["products", category],
    queryFn: async (): Promise<Product[]> => {
      try {
        let qRef = collection(db(), 'products');
        let q = category ? query(qRef, where('category', '==', category)) : qRef;
        const snap = await getDocs(q as any);
        
        if (snap.empty) {
            // Fallback to local data if firestore is empty
            return category ? getLocalProductsByCategory(category) : localProducts;
        }

        const products = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Product[];
        return products;
      } catch (error) {
        console.warn("Error fetching products from Firestore, using local fallback", error);
        return category ? getLocalProductsByCategory(category) : localProducts;
      }
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async (): Promise<Product | null> => {
      if (!id) return null;
      try {
        const docRef = await import('firebase/firestore').then(m => m.doc(db(), 'products', id));
        const docSnap = await import('firebase/firestore').then(m => m.getDoc(docRef));
        
        if (docSnap.exists()) {
          return { id: docSnap.id, ...(docSnap.data() as any) } as Product;
        }
        
        // Fallback to local data if not found in Firestore
        return getLocalProduct(id) || null;
      } catch (error) {
        console.warn("Error fetching product from Firestore, using local fallback", error);
        return getLocalProduct(id) || null;
      }
    },
    enabled: !!id,
  });
}
