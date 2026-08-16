'use client'

import React, { useState, useEffect } from 'react'
import { getEstadoRestaurante, toggleEstadoRestaurante } from '@/lib/actions/negocioEstado'
import { Power, Loader2, Store, Lock } from 'lucide-react'

export function RestauranteStateToggle() {
  const [abierto, setAbierto] = useState(true)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await getEstadoRestaurante()
        setAbierto(res.abierto)
      } catch (e) {
        console.error('Error cargando estado del restaurante:', e)
      } finally {
        setLoading(false)
      }
    }
    loadStatus()
  }, [])

  const handleToggle = async () => {
    const nextState = !abierto
    setAbierto(nextState) // Actualización optimista 0ms
    setUpdating(true)
    try {
      await toggleEstadoRestaurante(nextState)
    } catch (e) {
      console.error('Error guardando estado:', e)
      setAbierto(!nextState) // Rollback en error
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-carbon/60 border border-arena/20 text-xs text-arena/60">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-turquesa" />
        <span>Cargando estado...</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={updating}
      title={abierto ? 'Haz clic para CERRAR el restaurante y pausar pedidos' : 'Haz clic para ABRIR el restaurante y recibir pedidos'}
      className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-bold flex items-center gap-2 transition-all border shadow-md shrink-0 cursor-pointer ${
        abierto
          ? 'bg-turquesa/15 border-turquesa/50 text-turquesa hover:bg-turquesa/25'
          : 'bg-coral/15 border-coral/50 text-coral hover:bg-coral/25 animate-pulse'
      }`}
    >
      {updating ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : abierto ? (
        <>
          <span className="w-2.5 h-2.5 rounded-full bg-turquesa shadow-[0_0_8px_#2ABFBF] animate-ping" />
          <Store className="w-3.5 h-3.5" />
          <span>RESTAURANTE ABIERTO</span>
        </>
      ) : (
        <>
          <Lock className="w-3.5 h-3.5" />
          <span>RESTAURANTE CERRADO</span>
        </>
      )}
    </button>
  )
}
