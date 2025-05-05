
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Product } from "./useProducts";

export function useProductsWithFilters(category?: string, sortBy: string = 'newest') {
  return useQuery({
    queryKey: ["products", { category, sortBy }],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from("products")
        .select("*");
      
      // Apply category filter
      if (category && category !== 'all') {
        query = query.eq("category", category);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'name-asc':
          query = query.order('name', { ascending: true });
          break;
        case 'name-desc':
          query = query.order('name', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Error loading products");
        console.error("Error fetching products:", error);
        return [];
      }

      return data || [];
    },
  });
}
