'use server'

import { createServerClient } from '@/lib/supabase/server'
import { TipoMovimiento } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

export async function registrarMovimientoInventario(formData: {
  insumo_id: number
  tipo: TipoMovimiento
  cantidad: number
  motivo?: string
}) {
  const supabase = createServerClient()

  // 1. Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Obtener insumo actual para recalcular stock
  const { data: insumo, error: insumoErr } = await supabase
    .from('insumos')
    .select('stock_actual')
    .eq('id', formData.insumo_id)
    .single()

  if (insumoErr || !insumo) {
    throw new Error(`Insumo no encontrado: ${insumoErr?.message}`)
  }

  const delta = formData.tipo === 'entrada' ? formData.cantidad : -formData.cantidad
  const nuevoStock = Math.max(0, parseFloat(((insumo.stock_actual || 0) + delta).toFixed(3)))

  // 3. Actualizar stock del insumo
  const { error: updateErr } = await supabase
    .from('insumos')
    .update({ stock_actual: nuevoStock })
    .eq('id', formData.insumo_id)

  if (updateErr) {
    throw new Error(`Error al actualizar stock: ${updateErr.message}`)
  }

  // 4. Registrar el movimiento en movimientos_inventario
  const { error: movErr } = await supabase.from('movimientos_inventario').insert({
    insumo_id: formData.insumo_id,
    tipo: formData.tipo,
    cantidad: formData.cantidad,
    motivo: formData.motivo || (formData.tipo === 'entrada' ? 'Resurtido de cocina' : 'Merma / Consumo diario'),
    created_by: user?.id || null,
  })

  if (movErr) {
    throw new Error(`Error al registrar movimiento: ${movErr.message}`)
  }

  revalidatePath('/admin/inventario')
  revalidatePath('/admin/dashboard')
  return { success: true, nuevoStock }
}

export async function crearInsumo(insumoData: {
  nombre: string
  unidad: string
  stock_actual: number
  stock_minimo: number
}) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('insumos').insert(insumoData).select().single()

  if (error) throw new Error(`Error al crear insumo: ${error.message}`)

  revalidatePath('/admin/inventario')
  revalidatePath('/admin/dashboard')
  return { success: true, data }
}

export async function editarInsumo(
  id: number,
  insumoData: {
    nombre: string
    unidad: string
    stock_actual: number
    stock_minimo: number
  }
) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('insumos')
    .update(insumoData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Error al editar insumo: ${error.message}`)

  revalidatePath('/admin/inventario')
  revalidatePath('/admin/dashboard')
  return { success: true, data }
}

export async function eliminarInsumo(id: number) {
  const supabase = createServerClient()

  // 1. Eliminar historial de movimientos asociados para no violar llave foránea
  await supabase.from('movimientos_inventario').delete().eq('insumo_id', id)

  // 2. Eliminar el insumo del catálogo
  const { error } = await supabase.from('insumos').delete().eq('id', id)

  if (error) throw new Error(`Error al eliminar insumo: ${error.message}`)

  revalidatePath('/admin/inventario')
  revalidatePath('/admin/dashboard')
  return { success: true }
}
