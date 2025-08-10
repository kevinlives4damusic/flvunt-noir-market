import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MAX_RETRIES = 3;
const RETRY_INTERVALS = [5 * 60, 15 * 60, 30 * 60]; // 5min, 15min, 30min in seconds

export const addToRetryQueue = async (payload, error) => {
  try {
    const { data, error: insertError } = await supabaseAdmin
      .from('webhook_retries')
      .insert({
        payload,
        error_message: error instanceof Error ? error.message : String(error),
        next_retry: new Date(Date.now() + RETRY_INTERVALS[0] * 1000).toISOString(),
        retry_count: 0,
        max_retries: MAX_RETRIES
      });

    if (insertError) {
      console.error('Error adding to retry queue:', insertError);
    }

    return { success: !insertError };
  } catch (err) {
    console.error('Error in addToRetryQueue:', err);
    return { success: false };
  }
};

export const processRetryQueue = async () => {
  try {
    // Get all items that are due for retry
    const { data: retries, error: fetchError } = await supabaseAdmin
      .from('webhook_retries')
      .select('*')
      .lt('next_retry', new Date().toISOString())
      .lt('retry_count', MAX_RETRIES)
      .eq('status', 'pending');

    if (fetchError) {
      console.error('Error fetching retry queue:', fetchError);
      return;
    }

    for (const retry of retries) {
      try {
        // Process the webhook payload
        const result = await processWebhookPayload(retry.payload);
        
        if (result.success) {
          // Mark as completed
          await supabaseAdmin
            .from('webhook_retries')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', retry.id);
        } else {
          // Update retry count and next retry time
          const nextRetryInterval = RETRY_INTERVALS[Math.min(retry.retry_count, RETRY_INTERVALS.length - 1)];
          await supabaseAdmin
            .from('webhook_retries')
            .update({
              retry_count: retry.retry_count + 1,
              next_retry: new Date(Date.now() + nextRetryInterval * 1000).toISOString(),
              last_error: result.error
            })
            .eq('id', retry.id);
        }
      } catch (err) {
        console.error('Error processing retry:', err);
      }
    }
  } catch (err) {
    console.error('Error in processRetryQueue:', err);
  }
};