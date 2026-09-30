'use server'

import { createServerClient } from '@/lib/supabase/server'
import { Platillo } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

export async function getPlatillosList(): Promise<Platillo[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('platillos')
    .select('*')
    .order('nombre', { ascending: true })

  if (error || !data) return []
  return data as Platillo[]
}

export async function togglePlatilloDisponible(platilloId: number, nuevoEstado: boolean) {
  const supabase = await createServerClient()
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
  const supabase = await createServerClient()

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
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('platillos')
    .delete()
    .eq('id', platilloId)

  if (error) throw new Error(`Error al eliminar platillo: ${error.message}`)

  revalidatePath('/admin/menu')
  revalidatePath('/')
  return { success: true }
}

export interface FavoritoSistemaResult {
  platillo: Platillo | null
  motivo: 'top_ventas' | 'promo_activa' | 'recomendado_casa'
  tituloBadge: string
  totalVendido?: number
}

export async function getPlatilloFavoritoDelSistema(): Promise<FavoritoSistemaResult> {
  const supabase = await createServerClient()

  // 1. Obtener todos los platillos disponibles
  const { data: platillos } = await supabase
    .from('platillos')
    .select('*')
    .eq('disponible', true)
    .order('id', { ascending: true })

  const platillosDisponibles = (platillos as Platillo[]) || []
  if (platillosDisponibles.length === 0) {
    return {
      platillo: null,
      motivo: 'recomendado_casa',
      tituloBadge: 'FAVORITO DE LA CASA',
    }
  }

  // 2. Analizar histórico de pedidos reales en la BD para determinar el #1 en ventas
  try {
    const { data: items } = await supabase
      .from('pedido_items')
      .select('platillo_id, nombre_platillo, cantidad')
      .limit(500)

    if (items && items.length > 0) {
      const contador: Record<number, number> = {}
      const contadorNombres: Record<string, number> = {}

      items.forEach((it) => {
        const qty = it.cantidad || 1
        if (it.platillo_id) {
          contador[it.platillo_id] = (contador[it.platillo_id] || 0) + qty
        }
        if (it.nombre_platillo) {
          const norm = it.nombre_platillo.trim().toLowerCase()
          contadorNombres[norm] = (contadorNombres[norm] || 0) + qty
        }
      })

      // Buscar platillo disponible con más ventas por id o por nombre
      let maxVentas = 0
      let topPlatillo: Platillo | null = null

      platillosDisponibles.forEach((p) => {
        const ventasById = contador[p.id] || 0
        const ventasByName = contadorNombres[p.nombre.trim().toLowerCase()] || 0
        const totalVentas = Math.max(ventasById, ventasByName)

        if (totalVentas > maxVentas) {
          maxVentas = totalVentas
          topPlatillo = p
        }
      })

      if (topPlatillo && maxVentas > 0) {
        return {
          platillo: topPlatillo,
          motivo: 'top_ventas',
          tituloBadge: 'EL MÁS PEDIDO DE LA CASA',
          totalVendido: maxVentas,
        }
      }
    }
  } catch (err) {
    console.error('Error calculando platillo top del sistema:', err)
  }

  // 3. Fallback inteligente: Platillo insignia de la casa (Aguachile Negro o primer platillo disponible)
  const insignia =
    platillosDisponibles.find((p) => p.nombre.toLowerCase().includes('negro')) ||
    platillosDisponibles[0]

  return {
    platillo: insignia,
    motivo: 'recomendado_casa',
    tituloBadge: 'FAVORITO DE LA CASA',
  }
}

