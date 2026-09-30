'use server'

import { createServerClient } from '@/lib/supabase/server'
import { Mesa, FormaMesa, EstadoMesa, MetodoPago, NivelPicor } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

export async function getMesasConPedidos(): Promise<Mesa[]> {
  const supabase = await createServerClient()
  try {
    const { data: mesas, error: mesasErr } = await supabase
      .from('mesas')
      .select('*, pedido_activo:pedidos!mesas_pedido_activo_id_fkey(*, pedido_items(*))')
      .eq('activo', true)
      .order('id', { ascending: true })

    if (mesasErr) {
      console.warn('Aviso: error al consultar mesas:', mesasErr)
      return []
    }

    return (mesas as Mesa[]) || []
  } catch (err) {
    console.error('Error al obtener mesas:', err)
    return []
  }
}

export async function guardarLayoutMesas(
  posiciones: { id: number; pos_x: number; pos_y: number }[]
) {
  const supabase = await createServerClient()
  try {
    for (const pos of posiciones) {
      await supabase
        .from('mesas')
        .update({ pos_x: pos.pos_x, pos_y: pos.pos_y })
        .eq('id', pos.id)
    }

    revalidatePath('/admin/mesas')
    return { success: true }
  } catch (err) {
    console.error('Error al guardar layout de mesas:', err)
    throw new Error('No se pudo guardar la distribución de mesas.')
  }
}

export async function crearMesa(data: {
  nombre: string
  capacidad: number
  forma: FormaMesa
  pos_x?: number
  pos_y?: number
}) {
  const supabase = await createServerClient()
  const { data: mesa, error } = await supabase
    .from('mesas')
    .insert({
      nombre: data.nombre,
      capacidad: data.capacidad || 4,
      forma: data.forma || 'cuadrada',
      pos_x: data.pos_x || 60,
      pos_y: data.pos_y || 60,
      estado: 'libre',
      activo: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Error al crear mesa: ${error.message}`)
  }

  revalidatePath('/admin/mesas')
  return { success: true, mesa }
}

export async function editarMesa(
  id: number,
  data: {
    nombre: string
    capacidad: number
    forma: FormaMesa
  }
) {
  const supabase = await createServerClient()
  const { data: mesa, error } = await supabase
    .from('mesas')
    .update({
      nombre: data.nombre,
      capacidad: data.capacidad,
      forma: data.forma,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Error al editar mesa: ${error.message}`)
  }

  revalidatePath('/admin/mesas')
  return { success: true, mesa }
}

export async function eliminarMesa(id: number) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('mesas')
    .update({ activo: false })
    .eq('id', id)

  if (error) {
    throw new Error(`Error al eliminar mesa: ${error.message}`)
  }

  revalidatePath('/admin/mesas')
  return { success: true }
}

export async function abrirComandaMesa(formData: {
  mesa_id: number
  cliente_nombre?: string
  cliente_telefono?: string
  notas?: string
  items: {
    platillo_id: number
    nombre_platillo: string
    precio_unitario: number
    cantidad: number
    nivel_picor?: NivelPicor
    notas_item?: string
  }[]
}) {
  const supabase = await createServerClient()

  // 1. Consultar mesa para obtener su nombre
  const { data: mesa } = await supabase
    .from('mesas')
    .select('*')
    .eq('id', formData.mesa_id)
    .single()

  if (!mesa) throw new Error('Mesa no encontrada')

  const total = formData.items.reduce(
    (sum, item) => sum + item.precio_unitario * item.cantidad,
    0
  )

  const clienteNombre = formData.cliente_nombre?.trim() || `${mesa.nombre}`
  const clienteTelefono = formData.cliente_telefono?.replace(/\D/g, '') || null

  // 2. Crear pedido asociado a la mesa con el teléfono del socio si fue asignado
  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .insert({
      cliente_nombre: clienteNombre,
      cliente_telefono: clienteTelefono,
      tipo_entrega: 'mesa',
      mesa_id: mesa.id,
      mesa_nombre: mesa.nombre,
      estado: 'nuevo',
      total,
      subtotal: total,
      notas: formData.notas || `Consumo en ${mesa.nombre}`,
    })
    .select()
    .single()

  if (pedidoErr || !pedido) {
    throw new Error(`Error al abrir comanda: ${pedidoErr?.message}`)
  }

  // 3. Insertar items del pedido
  if (formData.items.length > 0) {
    const itemsToInsert = formData.items.map((item) => ({
      pedido_id: pedido.id,
      platillo_id: item.platillo_id,
      nombre_platillo: item.nombre_platillo,
      precio_unitario: item.precio_unitario,
      cantidad: item.cantidad,
      nivel_picor: item.nivel_picor || 'medio',
      notas_item: item.notas_item || null,
    }))

    await supabase.from('pedido_items').insert(itemsToInsert)
  }

  // 4. Actualizar estado de la mesa a ocupada
  await supabase
    .from('mesas')
    .update({
      estado: 'ocupada',
      pedido_activo_id: pedido.id,
    })
    .eq('id', mesa.id)

  revalidatePath('/admin/mesas')
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/pantalla')
  revalidatePath('/admin/dashboard')

  return { success: true, pedidoId: pedido.id }
}

export async function agregarRondaAMesa(formData: {
  mesa_id: number
  pedido_id: number
  items: {
    platillo_id: number
    nombre_platillo: string
    precio_unitario: number
    cantidad: number
    nivel_picor?: NivelPicor
    notas_item?: string
  }[]
  notas_adicionales?: string
}) {
  const supabase = await createServerClient()

  // 1. Obtener pedido actual
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', formData.pedido_id)
    .single()

  if (!pedido) throw new Error('Comanda activa no encontrada')

  const extraTotal = formData.items.reduce(
    (sum, item) => sum + item.precio_unitario * item.cantidad,
    0
  )

  const nuevoTotal = (Number(pedido.total) || 0) + extraTotal

  // 2. Insertar nuevos items
  const itemsToInsert = formData.items.map((item) => ({
    pedido_id: formData.pedido_id,
    platillo_id: item.platillo_id,
    nombre_platillo: item.nombre_platillo,
    precio_unitario: item.precio_unitario,
    cantidad: item.cantidad,
    nivel_picor: item.nivel_picor || 'medio',
    notas_item: item.notas_item || null,
  }))

  await supabase.from('pedido_items').insert(itemsToInsert)

  // 3. Actualizar total y estado del pedido para que vuelva a alertar en cocina
  let nuevasNotas = pedido.notas || ''
  if (formData.notas_adicionales) {
    nuevasNotas = `${nuevasNotas ? nuevasNotas + ' | ' : ''}Ronda Extra: ${formData.notas_adicionales}`
  }

  await supabase
    .from('pedidos')
    .update({
      total: nuevoTotal,
      subtotal: nuevoTotal,
      estado: 'nuevo', // Notifica a cocina que hay nueva ronda
      notas: nuevasNotas,
    })
    .eq('id', formData.pedido_id)

  revalidatePath('/admin/mesas')
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/pantalla')

  return { success: true, nuevoTotal }
}

export async function cambiarEstadoMesa(mesaId: number, nuevoEstado: EstadoMesa) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('mesas')
    .update({ estado: nuevoEstado })
    .eq('id', mesaId)

  if (error) throw new Error(`Error al cambiar estado: ${error.message}`)

  revalidatePath('/admin/mesas')
  return { success: true }
}

export async function cobrarYLiberarMesa(formData: {
  mesa_id: number
  pedido_id: number
  metodo_pago: MetodoPago
  descuento?: number
  total_cobrado: number
  notas?: string
}) {
  const supabase = await createServerClient()

  // 1. Actualizar y cerrar el pedido
  const { error: pedidoErr } = await supabase
    .from('pedidos')
    .update({
      estado: 'entregado',
      metodo_pago: formData.metodo_pago,
      descuento: formData.descuento || 0,
      total: formData.total_cobrado,
      notas: formData.notas || null,
    })
    .eq('id', formData.pedido_id)

  if (pedidoErr) throw new Error(`Error al cobrar pedido: ${pedidoErr.message}`)

  // 2. Liberar la mesa
  const { error: mesaErr } = await supabase
    .from('mesas')
    .update({
      estado: 'libre',
      pedido_activo_id: null,
    })
    .eq('id', formData.mesa_id)

  if (mesaErr) throw new Error(`Error al liberar mesa: ${mesaErr.message}`)

  revalidatePath('/admin/mesas')
  revalidatePath('/admin/caja')
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/dashboard')

  return { success: true }
}

export async function asignarSocioAPedidoMesa(formData: {
  pedido_id: number
  cliente_telefono: string
  cliente_nombre: string
}) {
  const supabase = await createServerClient()
  const cleanPhone = formData.cliente_telefono.replace(/\D/g, '')

  const { error } = await supabase
    .from('pedidos')
    .update({
      cliente_telefono: cleanPhone,
      cliente_nombre: formData.cliente_nombre,
    })
    .eq('id', formData.pedido_id)

  if (error) {
    throw new Error(`Error al asignar socio: ${error.message}`)
  }

  revalidatePath('/admin/mesas')
  revalidatePath('/admin/caja')
  return { success: true }
}
