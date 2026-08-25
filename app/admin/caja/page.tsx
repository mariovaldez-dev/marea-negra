import React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { CajaManager } from '@/components/caja/CajaManager'
import { getMazatlanDateString } from '@/lib/utils/date'
import { CierreCaja, Pedido, GastoCaja } from '@/lib/types/database'

export const revalidate = 0

export default async function CajaAdminPage() {
  const supabase = createServerClient()
  const fechaHoy = getMazatlanDateString()

  let pedidosEntregados: Pedido[] = []
  let historialCierres: CierreCaja[] = []
  let gastosCaja: GastoCaja[] = []

  try {
    const [pedidosRes, cierresRes, gastosRes] = await Promise.all([
      supabase.from('pedidos').select('*').eq('estado', 'entregado').order('created_at', { ascending: false }),
      supabase.from('cierres_caja').select('*').order('fecha', { ascending: false }),
      supabase.from('gastos_caja').select('*').order('created_at', { ascending: false }),
    ])

    if (pedidosRes.data) {
      pedidosEntregados = pedidosRes.data
    }

    if (cierresRes.data) {
      historialCierres = cierresRes.data
    }

    if (gastosRes.data) {
      gastosCaja = gastosRes.data as GastoCaja[]
    }
  } catch (err) {
    console.warn('Error al cargar datos de cierre de caja:', err)
  }

  return (
    <CajaManager
      pedidosEntregados={pedidosEntregados}
      historialCierres={historialCierres}
      initialGastos={gastosCaja}
      fechaHoy={fechaHoy}
    />
  )
}
