import React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { OrderStepper } from '@/components/menu/OrderStepper'
import { Platillo, Categoria } from '@/lib/types/database'
import { getEstadoRestaurante } from '@/lib/actions/negocioEstado'

export const revalidate = 0

export default async function PedirOnlinePage() {
  const supabase = createServerClient()

  let categorias: Categoria[] = []
  let platillos: Platillo[] = []
  let restauranteAbierto = true
  let mensajeCerrado = ''
  let horariosDias: any[] = []

  try {
    const [catRes, platRes, estadoRes] = await Promise.all([
      supabase.from('categorias').select('*').order('orden', { ascending: true }),
      supabase.from('platillos').select('*').order('id', { ascending: true }),
      getEstadoRestaurante(),
    ])

    if (catRes.data && catRes.data.length > 0) categorias = catRes.data
    if (platRes.data && platRes.data.length > 0) platillos = platRes.data
    if (estadoRes) {
      restauranteAbierto = estadoRes.abierto
      mensajeCerrado = estadoRes.mensaje_cerrado || ''
      horariosDias = estadoRes.horarios_dias || []
    }
  } catch (err) {
    console.warn('Error al cargar menú para pedir online:', err)
  }

  return (
    <OrderStepper
      categorias={categorias}
      platillos={platillos}
      inicialAbierto={restauranteAbierto}
      inicialMensaje={mensajeCerrado}
      inicialHorarios={horariosDias}
    />
  )
}
