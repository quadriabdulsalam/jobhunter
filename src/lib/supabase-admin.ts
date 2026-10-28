import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in the deployment environment.');
    }
    return null;
  }

  if (!client) {
    client = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    });
  }

  return client;
}
