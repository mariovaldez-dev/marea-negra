'use client'

import React, { useState, useEffect } from 'react'
import { getEstadoRestaurante, toggleEstadoRestaurante } from '@/lib/actions/negocioEstado'
import { Loader2, Store, Lock } from 'lucide-react'

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
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 text-xs text-negro/50 dark:text-arena/60">
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
      className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-bold flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer active:scale-95 text-white ${
        abierto
          ? 'bg-[#16A34B] hover:bg-[#15803D] shadow-[#16A34B]/25'
          : 'bg-coral hover:bg-coral/90 shadow-coral/20'
      }`}
    >
      {updating ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
      ) : abierto ? (
        <>
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <Store className="w-3.5 h-3.5 text-white" />
          <span>Restaurante Abierto</span>
        </>
      ) : (
        <>
          <Lock className="w-3.5 h-3.5 text-white" />
          <span>Restaurante Cerrado</span>
        </>
      )}
    </button>
  )
}
