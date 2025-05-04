export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status: string;
          amount_cents: number;
          currency: string;
          payment_id: string | null;
          payment_provider: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          status?: string;
          amount_cents: number;
          currency?: string;
          payment_id?: string | null;
          payment_provider?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          status?: string;
          amount_cents?: number;
          currency?: string;
          payment_id?: string | null;
          payment_provider?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price_cents: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price_cents: number;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          price_cents?: number;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          amount_cents: number;
          currency: string;
          status: string;
          payment_provider: string;
          provider_payment_id: string | null;
          checkout_id: string | null;
          checkout_url: string | null;
          error_message: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount_cents: number;
          currency?: string;
          status?: string;
          payment_provider?: string;
          provider_payment_id?: string | null;
          checkout_id?: string | null;
          checkout_url?: string | null;
          error_message?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          payment_provider?: string;
          provider_payment_id?: string | null;
          checkout_id?: string | null;
          checkout_url?: string | null;
          error_message?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_service_role: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      payment_status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded' | 'partially_refunded';
    };
  };
}