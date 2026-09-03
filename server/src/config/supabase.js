import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Initialize the Supabase client with the Service Role key to bypass RLS for administrative actions.
// Important: This key should NEVER be sent to the frontend.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
