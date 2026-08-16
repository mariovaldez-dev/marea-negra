import React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { CajaManager } from '@/components/caja/CajaManager'
import { CierreCaja, Pedido } from '@/lib/types/database'

export const revalidate = 0

export default async function CajaAdminPage() {
  const supabase = createServerClient()

  const fechaHoy = new Date().toISOString().split('T')[0]

  let totalSistemaEntregado = 0
  let ventasPorMetodo = {
    efectivo: 0,
    transferencia: 0,
    oxxo: 0,
  }
  let historialCierres: CierreCaja[] = []

  try {
    const [pedidosRes, cierresRes] = await Promise.all([
      supabase.from('pedidos').select('*').eq('estado', 'entregado'),
      supabase.from('cierres_caja').select('*').order('fecha', { ascending: false }),
    ])

    if (pedidosRes.data) {
      // Filtrar por los entregados hoy
      const hoyPedidos = pedidosRes.data.filter(
        (p) => p.created_at && p.created_at.startsWith(fechaHoy)
      )

      hoyPedidos.forEach((p) => {
        const monto = p.total || 0
        totalSistemaEntregado += monto
        if (p.metodo_pago === 'efectivo') ventasPorMetodo.efectivo += monto
        else if (p.metodo_pago === 'transferencia') ventasPorMetodo.transferencia += monto
        else if (p.metodo_pago === 'oxxo') ventasPorMetodo.oxxo += monto
        else ventasPorMetodo.efectivo += monto // fallback
      })
    }

    if (cierresRes.data) historialCierres = cierresRes.data
  } catch (err) {
    console.warn('Error al cargar datos de cierre de caja:', err)
  }

  return (
    <CajaManager
      totalSistemaEntregado={totalSistemaEntregado}
      ventasPorMetodo={ventasPorMetodo}
      historialCierres={historialCierres}
      fechaHoy={fechaHoy}
    />
  )
}
