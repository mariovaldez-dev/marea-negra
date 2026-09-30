'use client'

import React, { useState, useEffect } from 'react'
import { getMetricasResenas, getUltimasResenas, MetricasResenas } from '@/lib/actions/resenas'
import {
  Star,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  Award,
} from 'lucide-react'

export function ResenasMetricsCard() {
  const [metricas, setMetricas] = useState<MetricasResenas | null>(null)
  const [ultimasResenas, setUltimasResenas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [m, r] = await Promise.all([getMetricasResenas(), getUltimasResenas(3)])
      setMetricas(m)
      setUltimasResenas(r)
    } catch (err) {
      console.error('Error cargando métricas de reseñas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  if (loading && !metricas) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm animate-pulse flex items-center justify-center min-h-[260px]">
        <div className="flex items-center gap-3 text-negro/50 dark:text-arena/60 text-sm font-sans">
          <RefreshCw className="w-5 h-5 animate-spin text-turquesa" />
          <span>Calculando satisfacción de comensales...</span>
        </div>
      </div>
    )
  }

  if (!metricas) return null

  const esExcelente = metricas.promedioEstrellas >= 4.5

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm transition-all flex flex-col justify-between gap-5 h-full">
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block truncate">
              Satisfacción del Cliente
            </span>
            <h3 className="font-sans font-black text-lg sm:text-xl text-negro dark:text-blanco tracking-tight truncate">
              Reputación de Clientes
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono bg-[#16A34B] text-white font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
            {metricas.porcentajeCincoEstrellas}% 5 Estrellas
          </span>
          <button
            type="button"
            onClick={cargarDatos}
            disabled={loading}
            aria-label="Actualizar datos de satisfacción"
            className="p-2 text-negro/50 dark:text-arena/60 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Actualizar satisfacción"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid Principal: Score + Distribución de Estrellas */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        {/* KPI Score Promedio */}
        <div className="sm:col-span-5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-negro/50 dark:text-arena/60 uppercase tracking-wider">
            Calificación Global
          </span>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="font-sans font-black text-4xl sm:text-5xl text-negro dark:text-blanco tracking-tight">
              {metricas.promedioEstrellas.toFixed(1)}
            </span>
            <span className="font-sans font-bold text-base text-negro/40 dark:text-arena/40">/ 5.0</span>
          </div>

          {/* 5 Estrellas */}
          <div className="flex items-center gap-1 text-amber-500 py-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= Math.round(metricas.promedioEstrellas)
                    ? 'fill-amber-500 text-amber-500'
                    : 'text-black/20 dark:text-white/20'
                }`}
              />
            ))}
          </div>

          <span className="text-[11px] font-sans text-negro/60 dark:text-arena/70 font-medium mt-0.5">
            {metricas.totalResenas === 1 ? '1 opinión registrada' : `${metricas.totalResenas} opiniones registradas`}
          </span>
        </div>

        {/* Desglose de Estrellas (Barras Cápsula) */}
        <div className="sm:col-span-7 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col justify-center gap-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = metricas.conteoPorEstrellas[stars] || 0
            const pct = metricas.totalResenas > 0 ? (count / metricas.totalResenas) * 100 : 0
            return (
              <div key={stars} className="flex items-center gap-2.5 text-xs font-sans">
                <div className="flex items-center gap-1 w-8 text-negro/80 dark:text-arena/80 shrink-0">
                  <span className="font-bold text-xs">{stars}</span>
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                </div>
                <div className="flex-1 bg-black/5 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stars >= 4 ? 'bg-[#16A34B]' : stars === 3 ? 'bg-amber-500' : 'bg-coral'
                    }`}
                    style={{ width: `${Math.max(count > 0 ? 10 : 0, pct)}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-negro/60 dark:text-arena/60 w-5 text-right shrink-0">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Feed de Últimas Reseñas Breves */}
      <div className="pt-2 border-t border-black/5 dark:border-white/5 flex flex-col gap-2">
        <span className="text-[10px] font-mono font-bold text-negro/40 dark:text-arena/50 uppercase tracking-wider">
          Opiniones Recientes
        </span>

        {ultimasResenas.length > 0 ? (
          <div className="flex flex-col gap-2">
            {ultimasResenas.map((r) => (
              <div
                key={r.id}
                className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-3 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-amber-500 shrink-0">
                    {Array.from({ length: r.calificacion || 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="text-[11px] font-sans font-bold text-negro dark:text-blanco truncate">
                    {r.pedidos?.cliente_nombre || 'Cliente'} <span className="font-mono text-[10px] font-normal text-negro/40 dark:text-arena/40">#{r.pedido_id}</span>
                  </span>
                </div>
                <p className="font-serif italic text-negro/80 dark:text-arena/90 text-xs mt-0.5">
                  {r.comentario ? `"${r.comentario}"` : 'Calificación de 5 estrellas sin comentarios adicionales.'}
                </p>
                {r.motivo && (
                  <span className="text-[10px] text-coral font-sans font-bold">
                    Nota: {r.motivo}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-negro/40 dark:text-arena/40">
            Aún no hay opiniones registradas.
          </div>
        )}
      </div>
    </div>
  )
}
