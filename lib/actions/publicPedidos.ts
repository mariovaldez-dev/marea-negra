'use server'

import { createServerClient } from '@/lib/supabase/server'
import { MetodoPago, NivelPicor } from '@/lib/types/database'
import { sendTelegramOrderNotification } from '@/lib/notifications/telegram'
import { revalidatePath } from 'next/cache'

export async function createPublicPedido(formData: {
  cliente_nombre: string
  cliente_telefono: string
  metodo_pago: MetodoPago
  hora_recogida?: string
  notas?: string
  subtotal?: number
  descuento?: number
  cupon_codigo?: string
  total?: number
  items: {
    platillo_id: number
    nombre_platillo: string
    precio_unitario: number
    cantidad: number
    nivel_picor?: NivelPicor
    notas_item?: string
  }[]
}) {
  const supabase = createServerClient()

  // 1. Calcular Subtotal bruto sumando los platillos
  const rawSubtotal = formData.subtotal !== undefined
    ? formData.subtotal
    : formData.items.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0)

  // 2. Calcular Total Neto Final y Descuento
  const finalTotal = formData.total !== undefined ? formData.total : rawSubtotal
  const discountAmount = formData.descuento !== undefined
    ? formData.descuento
    : Math.max(0, rawSubtotal - finalTotal)

  // 3. Insertar pedido en la tabla `pedidos` con subtotal, descuento, cupon_codigo y total neto
  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .insert({
      cliente_nombre: formData.cliente_nombre,
      cliente_telefono: formData.cliente_telefono,
      estado: 'nuevo',
      metodo_pago: formData.metodo_pago,
      hora_recogida: formData.hora_recogida || null,
      subtotal: rawSubtotal,
      descuento: discountAmount,
      cupon_codigo: formData.cupon_codigo || null,
      total: finalTotal,
      notas: formData.notas || null,
    })
    .select()
    .single()

  if (pedidoErr || !pedido) {
    console.error('Error al insertar en pedidos:', pedidoErr)
    if (pedidoErr?.code === '42501' || pedidoErr?.message?.includes('row-level security')) {
      throw new Error(
        'Falta la política de RLS en Supabase para permitir pedidos públicos. Ejecuta en tu SQL Editor: CREATE POLICY "Publico crea pedidos" ON pedidos FOR INSERT WITH CHECK (true);'
      )
    }
    throw new Error(`Error al registrar el pedido: ${pedidoErr?.message || 'Error en base de datos'}`)
  }

  // 4. Insertar detalles en `pedido_items` con nivel_picor y notas_item
  const itemsToInsert = formData.items.map((item) => ({
    pedido_id: pedido.id,
    platillo_id: item.platillo_id,
    nombre_platillo: item.nombre_platillo,
    precio_unitario: item.precio_unitario,
    cantidad: item.cantidad,
    nivel_picor: item.nivel_picor || 'medio',
    notas_item: item.notas_item || null,
  }))

  const { error: itemsErr } = await supabase
    .from('pedido_items')
    .insert(itemsToInsert)

  if (itemsErr) {
    console.error('Error al insertar en pedido_items:', itemsErr)
    throw new Error(`Error al registrar items del pedido: ${itemsErr.message}`)
  }

  // 5. Disparar notificación a Telegram al celular del dueño
  await sendTelegramOrderNotification({
    id: pedido.id,
    cliente_nombre: formData.cliente_nombre,
    cliente_telefono: formData.cliente_telefono,
    metodo_pago: formData.metodo_pago,
    hora_recogida: formData.hora_recogida,
    total: finalTotal,
    notas: formData.notas,
    items: formData.items,
  })

  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/pantalla')

  return { success: true, pedidoId: pedido.id }
}

export async function updateComprobantePedido(pedidoId: number, comprobanteUrl: string) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('pedidos')
    .update({ comprobante_url: comprobanteUrl })
    .eq('id', pedidoId)

  if (error) {
    console.error('Error al guardar comprobante:', error)
    throw new Error(`Error al vincular el comprobante: ${error.message}`)
  }

  revalidatePath(`/pedido/${pedidoId}`)
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/dashboard')
  return { success: true }
}
