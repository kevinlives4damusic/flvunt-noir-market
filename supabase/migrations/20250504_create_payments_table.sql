-- Create payments table for tracking all payment attempts and statuses
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_provider TEXT NOT NULL DEFAULT 'yoco',
  provider_payment_id TEXT,
  checkout_id TEXT,
  checkout_url TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_id ON public.payments(checkout_id);

-- Add RLS policies for payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own payments
CREATE POLICY payments_select_policy ON public.payments
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.orders WHERE id = order_id)
  );

-- Allow authenticated users to insert payments
CREATE POLICY payments_insert_policy ON public.payments
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.orders WHERE id = order_id)
  );

-- Allow service role to update payments (for webhooks)
CREATE POLICY payments_update_policy ON public.payments
  FOR UPDATE USING (
    -- Only service role can update payment status
    (SELECT is_service_role() FROM auth.users WHERE id = auth.uid())
    OR
    -- Or the payment belongs to the current user
    auth.uid() = (SELECT user_id FROM public.orders WHERE id = order_id)
  );

-- Create payment_status enum type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM (
      'pending',
      'processing',
      'succeeded',
      'failed',
      'canceled',
      'refunded',
      'partially_refunded'
    );
  END IF;
END $$;

-- Add helper function to check if current user is service role
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
