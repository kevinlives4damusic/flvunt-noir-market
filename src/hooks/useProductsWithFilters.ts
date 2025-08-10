import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Product } from "./useProducts";
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  designers?: string[];
  sizes?: string[];
  inStock?: boolean;
  searchQuery?: string;
}

export function useProductsWithFilters(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async (): Promise<Product[]> => {
      try {
        let qRef = collection(db(), 'products');
        const constraints: any[] = [];
        if (filters.category) constraints.push(where('category', '==', filters.category));
        if (filters.inStock !== undefined) constraints.push(where('in_stock', '==', !!filters.inStock));
        // Firestore cannot do advanced OR text search; we'll post-filter below
        const q = constraints.length > 0 ? query(qRef, ...constraints, orderBy('created_at', 'desc')) : query(qRef, orderBy('created_at', 'desc'));
        const snap = await getDocs(q);
        let items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Product[];

        // Client-side filters for price, designers, sizes, and search
        if (filters.minPrice !== undefined) items = items.filter(p => p.price >= filters.minPrice!);
        if (filters.maxPrice !== undefined) items = items.filter(p => p.price <= filters.maxPrice!);
        if (filters.designers && filters.designers.length > 0) items = items.filter(p => filters.designers!.includes(p.designer));
        if (filters.sizes && filters.sizes.length > 0) items = items.filter(p => p.available_sizes?.some(s => filters.sizes!.includes(s)));
        if (filters.searchQuery) {
          const ql = filters.searchQuery.toLowerCase();
          items = items.filter(p => (
            (p.name || '').toLowerCase().includes(ql) ||
            (p.description || '').toLowerCase().includes(ql)
          ));
        }

        return items;
      } catch (error) {
        toast("Error loading products");
        console.error("Error fetching products with filters:", error);
        return [];
      }
    },
  });
}
