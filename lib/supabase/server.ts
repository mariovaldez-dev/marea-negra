import { createServerClient as createServerClientSSR } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerClient() {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  return createServerClientSSR(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Se maneja en middleware si ocurre en Server Components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Se maneja en middleware si ocurre en Server Components
          }
        },
      },
    }
  )
}

/**
 * Cliente de Supabase con Service Role Key
 * ATENCIÓN: Solo usar en Server Actions/Rutas seguras para bypassear RLS.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  
  if (!serviceRoleKey) {
    console.warn('Falta SUPABASE_SERVICE_ROLE_KEY en el environment.')
  }

  // No necesitamos cookies para el admin client ya que no maneja sesión web
  return createServerClientSSR(
    url,
    serviceRoleKey,
    {
      cookies: {
        get() { return null },
        set() {},
        remove() {}
      }
    }
  )
}
