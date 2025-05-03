
import { createClient } from '@supabase/supabase-js';

// Use the values from src/integrations/supabase/client.ts which has the proper configuration
const supabaseUrl = "https://vqcatlpsindjoosssqil.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxY2F0bHBzaW5kam9vc3NzcWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NTY2NDIsImV4cCI6MjA2MTQzMjY0Mn0.iWbA6EP4xeiEaBn2HRddEN922yKQrSmO4TzjtPlNS9I";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
