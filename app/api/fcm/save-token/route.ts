import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Usamos upsert para evitar duplicados si el mismo usuario registra el mismo token varias veces
    const { error: insertError } = await supabase
      .from('fcm_tokens')
      .upsert({
        user_id: user.id,
        token: token,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'token' // Necesita que la columna 'token' tenga una restricción UNIQUE en la DB
      })

    if (insertError) {
      console.error('Error guardando el token FCM:', insertError)
      Sentry.captureException(insertError, {
        tags: { module: 'api_fcm', action: 'save_token_db' },
        extra: { userId: user.id }
      })
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in save-token route:', error)
    Sentry.captureException(error, {
      tags: { module: 'api_fcm', action: 'save_token_catch' }
    })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
