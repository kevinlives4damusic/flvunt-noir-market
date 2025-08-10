-- Create webhook_retries table
CREATE TABLE IF NOT EXISTS public.webhook_retries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payload JSONB NOT NULL,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    next_retry TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    last_error TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed'))
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_retries_status ON webhook_retries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_retries_next_retry ON webhook_retries(next_retry)
    WHERE status = 'pending';

-- Add RLS policies
ALTER TABLE public.webhook_retries ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access webhook retries
CREATE POLICY webhook_retries_service_role_policy ON public.webhook_retries
    FOR ALL USING (
        (SELECT is_service_role() FROM auth.users WHERE id = auth.uid())
    );

-- Add trigger for updating updated_at
CREATE TRIGGER update_webhook_retries_timestamp
    BEFORE UPDATE ON public.webhook_retries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();