-- Create payment_events table for monitoring
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('status_change', 'error', 'webhook', 'verification')),
    status TEXT,
    previous_status TEXT,
    error_code TEXT,
    error_message TEXT,
    error_detail TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (
        status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded')
    ),
    CONSTRAINT valid_previous_status CHECK (
        previous_status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded')
    )
);

-- Add indexes for monitoring queries
CREATE INDEX idx_payment_events_payment_id ON public.payment_events(payment_id);
CREATE INDEX idx_payment_events_order_id ON public.payment_events(order_id);
CREATE INDEX idx_payment_events_type ON public.payment_events(type);
CREATE INDEX idx_payment_events_timestamp ON public.payment_events(timestamp DESC);
CREATE INDEX idx_payment_events_error ON public.payment_events(type) WHERE type = 'error';

-- Add RLS policies
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Allow users to view events for their own payments
CREATE POLICY payment_events_select_policy ON public.payment_events
    FOR SELECT USING (
        auth.uid() = (
            SELECT o.user_id 
            FROM public.orders o 
            WHERE o.id = order_id
        )
    );

-- Allow service role to insert events
CREATE POLICY payment_events_insert_policy ON public.payment_events
    FOR INSERT WITH CHECK (
        (SELECT is_service_role() FROM auth.users WHERE id = auth.uid())
    );

-- Create view for payment error analysis
CREATE OR REPLACE VIEW payment_error_rates AS
WITH payment_counts AS (
    SELECT
        DATE_TRUNC('hour', created_at) as time_bucket,
        COUNT(*) as total_payments
    FROM public.payments
    GROUP BY 1
),
error_counts AS (
    SELECT
        DATE_TRUNC('hour', timestamp) as time_bucket,
        COUNT(*) as error_count
    FROM public.payment_events
    WHERE type = 'error'
    GROUP BY 1
)
SELECT
    pc.time_bucket,
    pc.total_payments,
    COALESCE(ec.error_count, 0) as error_count,
    ROUND(
        (COALESCE(ec.error_count, 0)::DECIMAL / NULLIF(pc.total_payments, 0) * 100)::DECIMAL, 2
    ) as error_rate
FROM payment_counts pc
LEFT JOIN error_counts ec ON pc.time_bucket = ec.time_bucket
ORDER BY pc.time_bucket DESC;