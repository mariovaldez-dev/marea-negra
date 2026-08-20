'use server'

import { createServerClient } from '@/lib/supabase/server'
import { Platillo } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

export async function getPlatillosList(): Promise<Platillo[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('platillos')
    .select('*')
    .order('nombre', { ascending: true })

  if (error || !data) return []
  return data as Platillo[]
}

export async function togglePlatilloDisponible(platilloId: number, nuevoEstado: boolean) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('platillos')
    .update({ disponible: nuevoEstado })
    .eq('id', platilloId)

  if (error) {
    throw new Error(`Error al cambiar disponibilidad: ${error.message}`)
  }

  revalidatePath('/admin/menu')
  revalidatePath('/')
  return { success: true }
}

export async function savePlatillo(platilloData: Partial<Platillo>) {
  const supabase = createServerClient()

  if (platilloData.id) {
    // Actualizar platillo existente
    const updatePayload: any = {
      nombre: platilloData.nombre,
      descripcion: platilloData.descripcion,
      precio: platilloData.precio,
      precio_anterior: platilloData.precio_anterior || null,
      es_promocion: platilloData.es_promocion ?? false,
      etiqueta_promo: platilloData.etiqueta_promo || null,
      dias_promo: platilloData.dias_promo || null,
      emoji: platilloData.emoji,
      categoria_id: platilloData.categoria_id,
      disponible: platilloData.disponible,
      imagen_url: platilloData.imagen_url,
    }

    let { data, error } = await supabase
      .from('platillos')
      .update(updatePayload)
      .eq('id', platilloData.id)
      .select()
      .single()

    // Si la base de datos de Supabase no tiene las columnas de promoción creadas aún
    if (error && error.message.includes('column')) {
      console.warn('Columnas de promoción faltantes en Supabase:', error.message)
      throw new Error(
        'La base de datos de Supabase no tiene aún las columnas de promoción. Por favor ejecuta el archivo 04_promociones_platillos.sql en el SQL Editor de Supabase.'
      )
    }

    if (error) throw new Error(`Error al guardar platillo: ${error.message}`)

    revalidatePath('/admin/menu')
    revalidatePath('/')
    return { success: true, data }
  } else {
    // Insertar nuevo platillo
    const insertPayload: any = {
      nombre: platilloData.nombre!,
      descripcion: platilloData.descripcion || null,
      precio: platilloData.precio!,
      precio_anterior: platilloData.precio_anterior || null,
      es_promocion: platilloData.es_promocion ?? false,
      etiqueta_promo: platilloData.etiqueta_promo || null,
      dias_promo: platilloData.dias_promo || null,
      emoji: platilloData.emoji || '🦐',
      categoria_id: platilloData.categoria_id || null,
      disponible: platilloData.disponible ?? true,
      imagen_url: platilloData.imagen_url || null,
    }

    let { data, error } = await supabase
      .from('platillos')
      .insert(insertPayload)
      .select()
      .single()

    // Si la base de datos de Supabase no tiene las columnas de promoción creadas aún
    if (error && error.message.includes('column')) {
      console.warn('Columnas de promoción faltantes en Supabase:', error.message)
      throw new Error(
        'La base de datos de Supabase no tiene aún las columnas de promoción. Por favor ejecuta el archivo 04_promociones_platillos.sql en el SQL Editor de Supabase.'
      )
    }

    if (error) throw new Error(`Error al crear platillo: ${error.message}`)

    revalidatePath('/admin/menu')
    revalidatePath('/')
    return { success: true, data }
  }
}

export async function deletePlatillo(platilloId: number) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('platillos')
    .delete()
    .eq('id', platilloId)

  if (error) throw new Error(`Error al eliminar platillo: ${error.message}`)

  revalidatePath('/admin/menu')
  revalidatePath('/')
  return { success: true }
}
