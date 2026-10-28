import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.');
    }
    return null;
  }

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server components cannot write cookies; middleware refreshes them on requests.
        }
      }
    }
  });
}

export type StorageContext = {
  supabase: SupabaseClient | null;
  userId: string;
};

export async function getStorageContext(): Promise<StorageContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, userId: 'local' };

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Sign in to access your career workspace.');
  return { supabase, userId: user.id };
}
