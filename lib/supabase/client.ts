import { createBrowserClient as createBrowserClientSSR } from '@supabase/ssr'

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  return createBrowserClientSSR(url, key)
}

