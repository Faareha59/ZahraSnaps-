import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Check if we're online
const checkOnline = () => {
  return typeof window !== 'undefined' && window.navigator.onLine;
};

// Retry function with exponential backoff and online check
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 1000
): Promise<T> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Check if we're online before attempting
      if (!checkOnline()) {
        await new Promise(resolve => {
          const handleOnline = () => {
            window.removeEventListener('online', handleOnline);
            resolve(undefined);
          };
          window.addEventListener('online', handleOnline);
        });
      }
      
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Create Supabase client with enhanced fetch behavior
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storage: localStorage // Explicitly set storage to ensure auth state persists
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    fetch: async (url, options = {}) => {
      try {
        // Ensure headers are properly merged
        const headers = {
          ...options.headers,
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        };

        return await withRetry(() => fetch(url, {
          ...options,
          headers
        }));
      } catch (error) {
        console.error('Supabase fetch error:', error);
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
    }
  }
});

// Helper function to handle Supabase operations with enhanced error handling
export async function supabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  errorMessage: string
): Promise<T> {
  if (!checkOnline()) {
    throw new Error('You are currently offline. Please check your internet connection.');
  }

  try {
    const { data, error } = await withRetry(() => operation());
    
    if (error) {
      console.error(`${errorMessage}:`, error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from server');
    }
    
    return data;
  } catch (error: any) {
    const message = error.message || 'An unexpected error occurred';
    console.error(`${errorMessage}:`, error);
    throw new Error(`${errorMessage}: ${message}`);
  }
}