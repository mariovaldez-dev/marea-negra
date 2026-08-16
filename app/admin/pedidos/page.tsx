import React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/pedidos/KanbanBoard'
import { Pedido, Platillo } from '@/lib/types/database'

export const revalidate = 0

export default async function PedidosPage() {
  const supabase = createServerClient()

  let initialPedidos: Pedido[] = []
  let platillosDisponibles: Platillo[] = []

  try {
    const [pedidosRes, platillosRes] = await Promise.all([
      supabase.from('pedidos').select('*, pedido_items(*)').order('created_at', { ascending: false }),
      supabase.from('platillos').select('*').eq('disponible', true).order('nombre', { ascending: true }),
    ])

    if (pedidosRes.data) initialPedidos = pedidosRes.data
    if (platillosRes.data) platillosDisponibles = platillosRes.data
  } catch (err) {
    console.warn('Error fetching pedidos iniciales:', err)
  }

  return (
    <KanbanBoard
      initialPedidos={initialPedidos}
      platillosDisponibles={platillosDisponibles}
    />
  )
}
