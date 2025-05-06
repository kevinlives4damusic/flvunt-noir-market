
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { toast } from 'sonner';

// Fixed Supabase URL and key - prevent blank screens from missing env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://vqcatlpsindjoosssqil.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxY2F0bHBzaW5kam9vc3NzcWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NTY2NDIsImV4cCI6MjA2MTQzMjY0Mn0.iWbA6EP4xeiEaBn2HRddEN922yKQrSmO4TzjtPlNS9I";

// Always log info about the Supabase connection
console.log('Initializing Supabase client with URL:', supabaseUrl);

if (!supabaseAnonKey) {
  // Provide a clear error message but avoid crashing the application
  console.error('Supabase anon key is not defined in environment variables');
  toast.error('Database connection error', {
    description: 'Authentication credentials are missing'
  });
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
});

// Test the connection and log results
supabase.auth.getSession()
  .then(() => console.log('Supabase connection successful'))
  .catch(err => console.error('Error connecting to Supabase:', err));
