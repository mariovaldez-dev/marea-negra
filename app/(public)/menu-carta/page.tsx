'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Platillo, Categoria } from '@/lib/types/database'
import { TraditionalMenuBoard } from '@/components/menu/TraditionalMenuBoard'
import { Loader2 } from 'lucide-react'

export default function MenuCartaPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [platillos, setPlatillos] = useState<Platillo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createBrowserClient()

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [catRes, platRes] = await Promise.all([
          supabase.from('categorias').select('*').order('orden', { ascending: true }),
          supabase.from('platillos').select('*').order('id', { ascending: true }),
        ])

        if (catRes.data) setCategorias(catRes.data)
        if (platRes.data) setPlatillos(platRes.data)
      } catch (err) {
        console.error('Error al cargar la carta tradicional:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-negro text-blanco flex flex-col items-center justify-center p-6 gap-4">
        <Loader2 className="w-10 h-10 text-coral animate-spin" />
        <span className="font-display text-xl tracking-wider text-arena">
          CARGANDO CARTA TRADICIONAL...
        </span>
      </div>
    )
  }

  return <TraditionalMenuBoard categorias={categorias} platillos={platillos} />
}
