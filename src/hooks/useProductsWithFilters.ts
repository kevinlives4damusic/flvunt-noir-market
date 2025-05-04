import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Product } from "./useProducts";

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
      let query = supabase
        .from("products")
        .select("*");
      
      // Apply category filter
      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      // Apply price range filters
      if (filters.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice);
      }
      
      if (filters.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice);
      }

      // Apply designer filter
      if (filters.designers && filters.designers.length > 0) {
        query = query.in("designer", filters.designers);
      }

      // Apply size filter using contains operator for the available_sizes array
      if (filters.sizes && filters.sizes.length > 0) {
        // For each size, we need to check if it's in the available_sizes array
        // This creates a complex OR condition for each size
        const sizeConditions = filters.sizes.map(size => 
          `available_sizes::text LIKE '%${size}%'`
        );
        
        query = query.or(sizeConditions.join(","));
      }

      // Apply in-stock filter
      if (filters.inStock !== undefined) {
        query = query.eq("in_stock", filters.inStock);
      }

      // Apply search query filter
      if (filters.searchQuery) {
        query = query.or(
          `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        toast("Error loading products");
        console.error("Error fetching products with filters:", error);
        return [];
      }

      return data || [];
    },
  });
}
