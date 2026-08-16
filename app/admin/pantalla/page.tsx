import React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { KitchenMonitor } from '@/components/cocina/KitchenMonitor'
import { Pedido } from '@/lib/types/database'

export const revalidate = 0

export default async function PantallaCocinaPage() {
  const supabase = createServerClient()

  let initialPedidos: Pedido[] = []

  try {
    const { data } = await supabase
      .from('pedidos')
      .select('*, pedido_items(*)')
      .order('created_at', { ascending: false })

    if (data) initialPedidos = data
  } catch (err) {
    console.warn('Error al cargar pedidos para pantalla de cocina:', err)
  }

  return <KitchenMonitor initialPedidos={initialPedidos} />
}
