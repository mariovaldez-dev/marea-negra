'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'

export interface ResenaInput {
  pedidoId: number
  clienteTelefono?: string
  calificacion: number
  motivo?: string
  comentario?: string
  canalDestino: 'google_maps' | 'whatsapp_soporte' | 'interno'
}

export interface MetricasResenas {
  totalResenas: number
  promedioEstrellas: number
  porcentajeCincoEstrellas: number
  conteoPorEstrellas: Record<number, number>
  quejasAtendidas: number
  motivosFrecuentes: { motivo: string; conteo: number }[]
}

export async function registrarResenaPedido(input: ResenaInput) {
  const adminSupabase = createAdminClient()

  if (input.calificacion < 1 || input.calificacion > 5) {
    return { success: false, error: 'La calificación debe ser entre 1 y 5 estrellas.' }
  }

  // Verificar si ya existe reseña para este pedido
  const { data: existente } = await adminSupabase
    .from('resenas_pedidos')
    .select('id')
    .eq('pedido_id', input.pedidoId)
    .maybeSingle()

  if (existente) {
    // Actualizar reseña
    const { error: updateErr } = await adminSupabase
      .from('resenas_pedidos')
      .update({
        calificacion: input.calificacion,
        motivo: input.motivo || null,
        comentario: input.comentario || null,
        canal_destino: input.canalDestino,
      })
      .eq('id', existente.id)

    if (updateErr) {
      return { success: false, error: updateErr.message }
    }
    return { success: true, message: '¡Muchas gracias por actualizar tu opinión!' }
  }

  // Insertar nueva reseña
  const { error: insertErr } = await adminSupabase.from('resenas_pedidos').insert({
    pedido_id: input.pedidoId,
    cliente_telefono: input.clienteTelefono ? input.clienteTelefono.replace(/\D/g, '') : null,
    calificacion: input.calificacion,
    motivo: input.motivo || null,
    comentario: input.comentario || null,
    canal_destino: input.canalDestino,
  })

  if (insertErr) {
    return { success: false, error: insertErr.message }
  }

  return { success: true, message: '¡Gracias por compartir tu opinión con Marea Negra!' }
}

export async function getMetricasResenas(): Promise<MetricasResenas> {
  const supabase = createAdminClient()

  const { data: resenas, error } = await supabase
    .from('resenas_pedidos')
    .select('id, calificacion, motivo, canal_destino, created_at')

  if (error || !resenas || resenas.length === 0) {
    return {
      totalResenas: 0,
      promedioEstrellas: 5.0,
      porcentajeCincoEstrellas: 100,
      conteoPorEstrellas: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      quejasAtendidas: 0,
      motivosFrecuentes: [],
    }
  }

  const totalResenas = resenas.length
  const sumaEstrellas = resenas.reduce((acc: number, r: { calificacion: number }) => acc + Number(r.calificacion), 0)
  const promedioEstrellas = Number((sumaEstrellas / totalResenas).toFixed(2))

  const conteoPorEstrellas: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const mapaMotivos: Record<string, number> = {}
  let quejasAtendidas = 0

  resenas.forEach((r: { calificacion: number; motivo?: string | null }) => {
    const star = Number(r.calificacion)
    if (conteoPorEstrellas[star] !== undefined) {
      conteoPorEstrellas[star]++
    }
    if (star <= 3) {
      quejasAtendidas++
    }
    if (r.motivo) {
      mapaMotivos[r.motivo] = (mapaMotivos[r.motivo] || 0) + 1
    }
  })

  const porcentajeCincoEstrellas = Math.round(((conteoPorEstrellas[5] || 0) / totalResenas) * 100)

  const motivosFrecuentes = Object.entries(mapaMotivos)
    .map(([motivo, conteo]) => ({ motivo, conteo }))
    .sort((a, b) => b.conteo - a.conteo)
    .slice(0, 4)

  return {
    totalResenas,
    promedioEstrellas,
    porcentajeCincoEstrellas,
    conteoPorEstrellas,
    quejasAtendidas,
    motivosFrecuentes,
  }
}

export async function getUltimasResenas(limite = 6) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('resenas_pedidos')
    .select(`
      id,
      pedido_id,
      cliente_telefono,
      calificacion,
      motivo,
      comentario,
      canal_destino,
      created_at,
      pedidos (
        cliente_nombre,
        total
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error) {
    console.error('Error al obtener reseñas:', error)
    return []
  }

  return data || []
}
