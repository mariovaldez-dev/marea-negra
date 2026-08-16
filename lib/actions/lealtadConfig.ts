'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface RecompensaLealtadItem {
  id?: number
  pedidos_requeridos: number
  codigo: string
  titulo: string
  tipo_recompensa: 'porcentaje' | 'producto_regalo' | 'monto_fijo'
  descuento_porcentaje: number
  monto_fijo: number
  producto_regalo?: string
  activo: boolean
}

// Obtener la lista N-dinámica de cupones de lealtad registrados en Supabase BDD
export async function getRecompensasLealtadList(): Promise<RecompensaLealtadItem[]> {
  const supabase = createServerClient()

  // 1. Intentar consultar tabla dedicada recompensas_lealtad
  try {
    const { data, error } = await supabase
      .from('recompensas_lealtad')
      .select('*')
      .order('pedidos_requeridos', { ascending: true })

    if (!error && data && data.length > 0) {
      return data.map((item) => ({
        id: item.id,
        pedidos_requeridos: Number(item.pedidos_requeridos) || 1,
        codigo: item.codigo,
        titulo: item.titulo,
        tipo_recompensa: (item.tipo_recompensa as any) || 'porcentaje',
        descuento_porcentaje: Number(item.descuento_porcentaje) || 0,
        monto_fijo: Number(item.monto_fijo) || 0,
        producto_regalo: item.producto_regalo || '',
        activo: item.activo !== false,
      }))
    }
  } catch (e) {
    // Si la tabla no existe en el esquema de Supabase, pasamos a consultar el respaldo en cupones
  }

  // 2. Respaldo transparente en la tabla cupones existente
  try {
    const { data: cuponesData } = await supabase
      .from('cupones')
      .select('*')
      .or('codigo.ilike.LEALTAD-%,codigo.ilike.RECOMPENSA-%')
      .order('id', { ascending: true })

    if (cuponesData && cuponesData.length > 0) {
      return cuponesData.map((c) => {
        const reqOrders = Number(c.usos_maximos) || 3
        return {
          id: c.id,
          pedidos_requeridos: reqOrders,
          codigo: c.codigo,
          titulo: `Recompensa Lealtad (${c.descuento_porcentaje ? `${c.descuento_porcentaje}% OFF` : `$${c.monto_fijo} MXN`})`,
          tipo_recompensa: (c.monto_fijo ? 'monto_fijo' : 'porcentaje') as any,
          descuento_porcentaje: Number(c.descuento_porcentaje) || 0,
          monto_fijo: Number(c.monto_fijo) || 0,
          producto_regalo: '',
          activo: c.activo !== false,
        }
      })
    }
  } catch (e) {
    console.error('Error consultando cupones respaldo:', e)
  }

  return []
}

// Guardar o crear un nuevo cupón de lealtad con fallback transparente si la tabla no existe aún en Supabase
export async function saveRecompensaLealtad(item: RecompensaLealtadItem) {
  const supabase = createServerClient()
  const cleanCodigo = item.codigo.trim().toUpperCase()

  const payload = {
    pedidos_requeridos: Number(item.pedidos_requeridos) || 1,
    codigo: cleanCodigo,
    titulo: item.titulo.trim(),
    tipo_recompensa: item.tipo_recompensa || 'porcentaje',
    descuento_porcentaje: Number(item.descuento_porcentaje) || 0,
    monto_fijo: Number(item.monto_fijo) || 0,
    producto_regalo: item.producto_regalo?.trim() || null,
    activo: item.activo !== undefined ? item.activo : true,
  }

  let savedSuccess = false

  // 1. Intentar guardar en la tabla dedicada recompensas_lealtad
  try {
    if (item.id) {
      const { error } = await supabase
        .from('recompensas_lealtad')
        .update(payload)
        .eq('id', item.id)

      if (!error) savedSuccess = true
    } else {
      const { error } = await supabase
        .from('recompensas_lealtad')
        .insert(payload)

      if (!error) savedSuccess = true
    }
  } catch (err: any) {
    savedSuccess = false
  }

  // 2. Si la tabla recompensas_lealtad no existe aún en la BDD remota, guardar transparente en la tabla cupones
  if (!savedSuccess) {
    const cuponPayload = {
      codigo: cleanCodigo,
      descuento_porcentaje: payload.descuento_porcentaje || 10,
      monto_fijo: payload.monto_fijo || 0,
      usos_maximos: payload.pedidos_requeridos,
      activo: payload.activo,
    }

    const { error: cuponErr } = await supabase
      .from('cupones')
      .upsert(cuponPayload, { onConflict: 'codigo' })

    if (cuponErr) {
      throw new Error(`No se pudo guardar el cupón de lealtad en la base de datos: ${cuponErr.message}`)
    }
  }

  revalidatePath('/admin/cupones')
  revalidatePath('/micuenta')
  revalidatePath('/pedir')
  return { success: true }
}

// Eliminar un cupón de lealtad N-dinámico
export async function deleteRecompensaLealtad(id: number) {
  const supabase = createServerClient()

  try {
    await supabase.from('recompensas_lealtad').delete().eq('id', id)
  } catch (e) {
    await supabase.from('cupones').delete().eq('id', id)
  }

  revalidatePath('/admin/cupones')
  revalidatePath('/micuenta')
  revalidatePath('/pedir')
  return { success: true }
}

// Alternar estado activo / inactivo en 1 solo clic
export async function toggleRecompensaLealtadActivo(id: number, currentActivo: boolean) {
  const supabase = createServerClient()

  try {
    await supabase
      .from('recompensas_lealtad')
      .update({ activo: !currentActivo })
      .eq('id', id)
  } catch (e) {
    await supabase
      .from('cupones')
      .update({ activo: !currentActivo })
      .eq('id', id)
  }

  revalidatePath('/admin/cupones')
  revalidatePath('/micuenta')
  revalidatePath('/pedir')
  return { success: true }
}

// Compatibilidad con getLealtadConfig
export async function getLealtadConfig() {
  const list = await getRecompensasLealtadList()
  if (list.length === 0) return null

  return {
    meta1_pedidos: list[0]?.pedidos_requeridos || 0,
    recompensa1_producto: list[0]?.titulo || '',
    meta2_pedidos: list[1]?.pedidos_requeridos || 0,
    recompensa2_producto: list[1]?.titulo || '',
    meta3_pedidos: list[2]?.pedidos_requeridos || 0,
    recompensa3_producto: list[2]?.titulo || '',
  }
}
