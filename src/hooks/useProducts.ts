
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
      let query = supabase
        .from("products")
        .select("*");
      
      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) {
        toast("Error loading products");
        console.error("Error fetching products:", error);
        return [];
      }

      return data || [];
    },
  });
}
