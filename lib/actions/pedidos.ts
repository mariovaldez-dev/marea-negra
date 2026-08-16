'use server'

import { createServerClient } from '@/lib/supabase/server'
import { EstadoPedido, MetodoPago } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import * as Sentry from '@sentry/nextjs'

export async function updatePedidoEstado(pedidoId: number, nuevoEstado: EstadoPedido) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('pedidos')
    .update({ estado: nuevoEstado })
    .eq('id', pedidoId)

  if (error) {
    throw new Error(`Error al actualizar estado del pedido: ${error.message}`)
  }

  // Auto-Descuento de Inventario y Desactivación de Platillos Agotados al Entregar Pedido
  if (nuevoEstado === 'entregado') {
    try {
      const { data: items } = await supabase
        .from('pedido_items')
        .select('*')
        .eq('pedido_id', pedidoId)

      if (items && items.length > 0) {
        const { data: insumos } = await supabase.from('insumos').select('*')
        if (insumos && insumos.length > 0) {
          const camaron = insumos.find((i) => i.nombre.toLowerCase().includes('camarón'))
          const pulpo = insumos.find((i) => i.nombre.toLowerCase().includes('pulpo'))
          const callo = insumos.find((i) => i.nombre.toLowerCase().includes('callo'))

          for (const item of items) {
            const lowerName = (item.nombre_platillo || '').toLowerCase()
            let targetInsumo = null
            let cantDescuento = 0.25 * (item.cantidad || 1) // 250g estimado por platillo

            if (lowerName.includes('camarón') && camaron) targetInsumo = camaron
            else if (lowerName.includes('pulpo') && pulpo) targetInsumo = pulpo
            else if (lowerName.includes('callo') && callo) targetInsumo = callo
            else if (camaron) targetInsumo = camaron

            if (targetInsumo) {
              const nuevoStock = Math.max(0, Number(targetInsumo.stock_actual || 0) - cantDescuento)
              
              // 1. Actualizar stock actual
              await supabase
                .from('insumos')
                .update({ stock_actual: nuevoStock })
                .eq('id', targetInsumo.id)

              // 2. Registrar historial en movimientos_inventario
              await supabase.from('movimientos_inventario').insert({
                insumo_id: targetInsumo.id,
                tipo: 'salida',
                cantidad: cantDescuento,
                motivo: `Salida automática por pedido entregado #${pedidoId} (${item.nombre_platillo})`,
              })

              // 3. Auto-desactivar platillos si el insumo queda agotado en 0
              if (nuevoStock <= 0) {
                const keyword = lowerName.includes('camarón')
                  ? 'camarón'
                  : lowerName.includes('pulpo')
                  ? 'pulpo'
                  : lowerName.includes('callo')
                  ? 'callo'
                  : ''

                if (keyword) {
                  const { data: platillosAfectados } = await supabase.from('platillos').select('id, nombre')
                  if (platillosAfectados) {
                    const toDisable = platillosAfectados.filter((p) => p.nombre.toLowerCase().includes(keyword))
                    for (const p of toDisable) {
                      await supabase.from('platillos').update({ disponible: false }).eq('id', p.id)
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Aviso: error en autodescuento de inventario:', e)
      Sentry.captureException(e, {
        tags: { module: 'pedidos', action: 'autoDescuentoInventario' },
        extra: { pedidoId }
      })
    }
  }

  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/inventario')
  revalidatePath('/admin/menu')
  revalidatePath('/pedir')
  revalidatePath('/')
  return { success: true }
}

export async function createNuevoPedido(formData: {
  cliente_nombre: string
  cliente_telefono?: string
  metodo_pago: MetodoPago
  hora_recogida?: string
  notas?: string
  items: {
    platillo_id: number
    nombre_platillo: string
    precio_unitario: number
    cantidad: number
  }[]
}) {
  const supabase = createServerClient()

  const total = formData.items.reduce(
    (sum, item) => sum + item.precio_unitario * item.cantidad,
    0
  )

  // 1. Insertar pedido principal
  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .insert({
      cliente_nombre: formData.cliente_nombre,
      cliente_telefono: formData.cliente_telefono || null,
      estado: 'nuevo',
      metodo_pago: formData.metodo_pago,
      hora_recogida: formData.hora_recogida || null,
      total,
      notas: formData.notas || null,
    })
    .select()
    .single()

  if (pedidoErr || !pedido) {
    throw new Error(`Error al crear el pedido: ${pedidoErr?.message}`)
  }

  // 2. Insertar items del pedido
  const itemsToInsert = formData.items.map((item) => ({
    pedido_id: pedido.id,
    platillo_id: item.platillo_id,
    nombre_platillo: item.nombre_platillo,
    precio_unitario: item.precio_unitario,
    cantidad: item.cantidad,
  }))

  const { error: itemsErr } = await supabase
    .from('pedido_items')
    .insert(itemsToInsert)

  if (itemsErr) {
    throw new Error(`Error al insertar detalles del pedido: ${itemsErr.message}`)
  }

  // 3. Disparar notificación push FCM a administradores y empleados
  const { data: tokens } = await supabase.from('fcm_tokens').select('token')
  if (tokens && tokens.length > 0) {
    const { enviarATodos } = await import('@/lib/firebase/admin')
    await enviarATodos(
      tokens.map((t) => t.token),
      {
        id: pedido.id,
        cliente: formData.cliente_nombre,
        total,
        horaRecogida: formData.hora_recogida || null,
        metodoPago: formData.metodo_pago,
        items: formData.items.map((i) => i.nombre_platillo),
      }
    )
  }

  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/inventario')
  revalidatePath('/admin/menu')
  revalidatePath('/pedir')
  revalidatePath('/')
  return { success: true, pedido }
}
