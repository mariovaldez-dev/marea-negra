import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { enviarATodos } from '@/lib/firebase/admin'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Solo accesible si hay sesión activa
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { pedidoId } = body

    if (!pedidoId) {
      return NextResponse.json({ error: 'Falta pedidoId' }, { status: 400 })
    }

    // Obtener información básica del pedido para testear
    const { data: pedido, error: pedidoErr } = await supabase
      .from('pedidos')
      .select('id, cliente_nombre, total, hora_recogida, metodo_pago')
      .eq('id', pedidoId)
      .single()

    if (pedidoErr || !pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Obtener los items del pedido
    const { data: items } = await supabase
      .from('pedido_items')
      .select('nombre_platillo')
      .eq('pedido_id', pedidoId)

    const itemNames = items ? items.map(i => i.nombre_platillo || '') : []

    // Obtener todos los tokens FCM registrados
    const { data: tokens, error: tokenErr } = await supabase
      .from('fcm_tokens')
      .select('token')

    if (tokenErr) {
      console.error('Error fetching fcm_tokens:', tokenErr)
      Sentry.captureException(tokenErr, {
        tags: { module: 'api_fcm', action: 'send_route_fetch_tokens' },
        extra: { pedidoId }
      })
      return NextResponse.json({ error: 'Error obteniendo tokens' }, { status: 500 })
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No hay tokens registrados para enviar la notificación' })
    }

    // Enviar notificación a todos los tokens
    const tokensArray = tokens.map(t => t.token)
    
    await enviarATodos(tokensArray, {
      id: pedido.id,
      cliente: pedido.cliente_nombre,
      total: Number(pedido.total),
      horaRecogida: pedido.hora_recogida,
      metodoPago: pedido.metodo_pago,
      items: itemNames
    })

    return NextResponse.json({ sent: tokensArray.length })
  } catch (error) {
    console.error('Error en /api/fcm/send:', error)
    Sentry.captureException(error, {
      tags: { module: 'api_fcm', action: 'send_route_catch' }
    })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
