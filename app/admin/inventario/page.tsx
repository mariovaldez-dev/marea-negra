import React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { InventoryManager } from '@/components/inventario/InventoryManager'
import { Insumo, MovimientoInventario } from '@/lib/types/database'

export const revalidate = 0

const FALLBACK_INSUMOS: Insumo[] = [
  { id: 1, nombre: 'Camarón fresco', unidad: 'kg', stock_actual: 5.0, stock_minimo: 2.0 },
  { id: 2, nombre: 'Pulpo', unidad: 'kg', stock_actual: 2.0, stock_minimo: 1.0 },
  { id: 3, nombre: 'Callo de hacha', unidad: 'kg', stock_actual: 1.5, stock_minimo: 0.5 },
  { id: 4, nombre: 'Chile chiltepín', unidad: 'gr', stock_actual: 500, stock_minimo: 100 },
  { id: 5, nombre: 'Limón', unidad: 'kg', stock_actual: 3.0, stock_minimo: 1.0 },
  { id: 6, nombre: 'Pepino', unidad: 'pza', stock_actual: 10, stock_minimo: 5 },
  { id: 7, nombre: 'Cebolla morada', unidad: 'kg', stock_actual: 2.0, stock_minimo: 0.5 },
  { id: 8, nombre: 'Aguacate', unidad: 'pza', stock_actual: 8, stock_minimo: 4 },
  { id: 9, nombre: 'Tostadas', unidad: 'paquete', stock_actual: 3, stock_minimo: 2 },
]

export default async function InventarioAdminPage() {
  const supabase = createServerClient()

  let insumos: Insumo[] = FALLBACK_INSUMOS
  let historial: MovimientoInventario[] = []

  try {
    const [insRes, movRes] = await Promise.all([
      supabase.from('insumos').select('*').order('id', { ascending: true }),
      supabase
        .from('movimientos_inventario')
        .select('*, insumo:insumos(*)')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    if (insRes.data && insRes.data.length > 0) insumos = insRes.data
    if (movRes.data && movRes.data.length > 0) historial = movRes.data
  } catch (err) {
    console.warn('Error al cargar inventario:', err)
  }

  return (
    <InventoryManager
      initialInsumos={insumos}
      historialMovimientos={historial}
    />
  )
}
