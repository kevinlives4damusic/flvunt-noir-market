
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { toast } from 'sonner';

// Fixed Supabase URL and key - prevent blank screens from missing env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://vqcatlpsindjoosssqil.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxY2F0bHBzaW5kam9vc3NzcWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NTY2NDIsImV4cCI6MjA2MTQzMjY0Mn0.iWbA6EP4xeiEaBn2HRddEN922yKQrSmO4TzjtPlNS9I";

// Debug connection issues
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
  .then((result) => {
    console.log('Supabase connection successful', result.data.session ? 'User is authenticated' : 'No active session');
    
    // Test a simple query to confirm database is working
    return supabase.from('products').select('id').limit(1);
  })
  .then(result => {
    if (result.error) {
      console.error('Supabase query test failed:', result.error);
      toast.error('Database connection issue', {
        description: 'Could not retrieve data from the database'
      });
    } else {
      console.log('Supabase query test successful');
    }
  })
  .catch(err => {
    console.error('Error connecting to Supabase:', err);
    toast.error('Database connection failed', {
      description: 'Please check your connection or try again later'
    });
  });
