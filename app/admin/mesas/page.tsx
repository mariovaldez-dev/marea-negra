import React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { MesasManager } from '@/components/mesas/MesasManager'
import { Mesa, Platillo } from '@/lib/types/database'

export const revalidate = 0

export default async function MesasAdminPage() {
  const supabase = await createServerClient()

  let mesas: Mesa[] = []
  let platillos: Platillo[] = []

  try {
    const [mesasRes, platillosRes] = await Promise.all([
      supabase
        .from('mesas')
        .select('*, pedido_activo:pedidos!mesas_pedido_activo_id_fkey(*, pedido_items(*))')
        .eq('activo', true)
        .order('id', { ascending: true }),
      supabase
        .from('platillos')
        .select('*')
        .eq('disponible', true)
        .order('nombre', { ascending: true }),
    ])

    if (mesasRes.data) {
      mesas = mesasRes.data as Mesa[]
    }
    if (platillosRes.data) {
      platillos = platillosRes.data as Platillo[]
    }
  } catch (err) {
    console.warn('Error al cargar mesas en server component:', err)
  }

  return <MesasManager initialMesas={mesas} platillos={platillos} />
}
