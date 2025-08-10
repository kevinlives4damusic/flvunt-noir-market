
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

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ["products", category],
    queryFn: async (): Promise<Product[]> => {
      try {
        let qRef = collection(db(), 'products');
        let q = category ? query(qRef, where('category', '==', category)) : qRef;
        const snap = await getDocs(q as any);
        const products = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Product[];
        return products;
      } catch (error) {
        toast("Error loading products");
        console.error("Error fetching products:", error);
        return [];
      }
    },
  });
}
