import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton pattern using globalThis to survive Next.js hot reload
const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createBrowserClient> | undefined
}

export const supabase = globalForSupabase.supabase ?? createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'courage-kids-shop-auth' // optional: unique key
    }
  }
)

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = supabase