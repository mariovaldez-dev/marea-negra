'use server'

import { createServerClient } from '@/lib/supabase/server'
import { PlatilloIngrediente } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

// Obtener todas las recetas con platillos e insumos
export async function getRecetas(): Promise<PlatilloIngrediente[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('platillo_ingredientes')
      .select('*, platillos(id, nombre, emoji), insumos(id, nombre, unidad, stock_actual)')
      .order('id', { ascending: true })

    if (error) {
      console.error('Error fetching recetas:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      platillo_id: item.platillo_id,
      insumo_id: item.insumo_id,
      cantidad_por_porcion: Number(item.cantidad_por_porcion),
      created_at: item.created_at,
      platillo: item.platillos,
      insumo: item.insumos,
    }))
  } catch (err) {
    console.error('Error in getRecetas:', err)
    return []
  }
}

// Asignar o actualizar ingrediente a un platillo
export async function guardarIngredienteReceta(
  platilloId: number,
  insumoId: number,
  cantidadPorPorcion: number
) {
  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('platillo_ingredientes')
      .upsert(
        {
          platillo_id: platilloId,
          insumo_id: insumoId,
          cantidad_por_porcion: cantidadPorPorcion,
        },
        { onConflict: 'platillo_id,insumo_id' }
      )

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/inventario')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// Eliminar ingrediente de la receta de un platillo
export async function eliminarIngredienteReceta(id: number) {
  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('platillo_ingredientes')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/inventario')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// Descontar inventario automáticamente al procesar o entregar un pedido
export async function descontarInventarioPorPedido(pedidoId: number) {
  try {
    const supabase = createServerClient()

    // 1. Obtener los items del pedido
    const { data: items, error: errItems } = await supabase
      .from('pedido_items')
      .select('platillo_id, cantidad, nombre_platillo')
      .eq('pedido_id', pedidoId)

    if (errItems || !items || items.length === 0) {
      return { success: false, error: 'No se encontraron items en el pedido' }
    }

    // 2. Obtener las recetas de los platillos involucrados
    const platilloIds = items.map((i) => i.platillo_id).filter(Boolean)
    if (platilloIds.length === 0) return { success: true }

    const { data: recetas, error: errRecetas } = await supabase
      .from('platillo_ingredientes')
      .select('platillo_id, insumo_id, cantidad_por_porcion, insumos(nombre, unidad, stock_actual)')
      .in('platillo_id', platilloIds)

    if (errRecetas || !recetas || recetas.length === 0) {
      return { success: true, message: 'No hay recetas configuradas para estos platillos' }
    }

    // 3. Procesar el descuento por cada item
    for (const item of items) {
      const ingredientes = recetas.filter((r) => r.platillo_id === item.platillo_id)
      for (const ing of ingredientes) {
        const cantidadTotalDescontar = Number(ing.cantidad_por_porcion) * (item.cantidad || 1)
        const insumoActual = ing.insumos as any
        const stockActual = Number(insumoActual?.stock_actual || 0)
        const nuevoStock = Math.max(0, stockActual - cantidadTotalDescontar)

        // Actualizar stock del insumo
        await supabase
          .from('insumos')
          .update({ stock_actual: nuevoStock })
          .eq('id', ing.insumo_id)

        // Registrar movimiento de salida
        await supabase.from('movimientos_inventario').insert({
          insumo_id: ing.insumo_id,
          tipo: 'salida',
          cantidad: cantidadTotalDescontar,
          motivo: `Consumo automático comanda #${pedidoId} (${item.nombre_platillo || 'Platillo'} x${item.cantidad})`,
        })
      }
    }

    revalidatePath('/admin/inventario')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('Error descontando inventario automático:', err)
    return { success: false, error: err.message }
  }
}
