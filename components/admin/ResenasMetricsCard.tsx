'use client'

import React, { useState, useEffect } from 'react'
import { getMetricasResenas, getUltimasResenas, MetricasResenas } from '@/lib/actions/resenas'
import {
  Star,
  Sparkles,
  TrendingUp,
  HeartHandshake,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  Award,
  ExternalLink,
  Clock,
  ShieldCheck,
} from 'lucide-react'

export function ResenasMetricsCard() {
  const [metricas, setMetricas] = useState<MetricasResenas | null>(null)
  const [ultimasResenas, setUltimasResenas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [m, r] = await Promise.all([getMetricasResenas(), getUltimasResenas(5)])
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
      <div className="bg-[#050404] bg-dots-pattern border border-oro/15 rounded-3xl p-6 shadow-xl animate-pulse flex items-center justify-center min-h-[160px]">
        <div className="flex items-center gap-3 text-oro text-sm font-sans">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Calculando satisfacción de clientes...</span>
        </div>
      </div>
    )
  }

  if (!metricas) return null

  return (
    <div className="bg-[#050404] bg-dots-pattern border border-oro/20 rounded-3xl p-6 sm:p-7 shadow-2xl relative gold-border-corner transition-all">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-arena/10 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-oro/10 border border-oro/30 rounded-2xl text-oro">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-sans font-bold text-oro uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>SATISFACCIÓN & REPUTACIÓN</span>
            </span>
            <h3 className="font-display text-2xl text-blanco tracking-wide">
              RESEÑAS & GOOGLE MAPS BOOSTER
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-sans bg-oro/10 border border-oro/30 text-oro font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>{metricas.porcentajeCincoEstrellas}% 5 ESTRELLAS</span>
          </span>
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="p-2 text-arena/60 hover:text-oro rounded-lg hover:bg-carbon transition-colors"
            title="Actualizar reseñas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid Principal: Score + Barras de Estrellas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI Score Promedio */}
        <div className="bg-carbon border border-arena/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2">
          <span className="text-[10px] font-sans font-bold text-arena/60 uppercase tracking-wider">
            CALIFICACIÓN PROMEDIO
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-5xl sm:text-6xl text-oro drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]">
              {metricas.promedioEstrellas.toFixed(1)}
            </span>
            <span className="font-display text-2xl text-arena/50">/ 5.0</span>
          </div>

          {/* 5 Estrellas Doradas */}
          <div className="flex items-center gap-1 text-oro py-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-current text-oro" />
            ))}
          </div>

          <span className="text-xs font-mono text-arena/70 mt-1">
            Basado en <strong>{metricas.totalResenas}</strong> opiniones
          </span>
        </div>

        {/* Desglose de Estrellas (Barras) */}
        <div className="bg-carbon border border-arena/10 rounded-2xl p-5 flex flex-col justify-center gap-2 md:col-span-2">
          <span className="text-[10px] font-sans font-bold text-arena/60 uppercase tracking-wider mb-1">
            DISTRIBUCIÓN DE CALIFICACIONES
          </span>

          {[5, 4, 3, 2, 1].map((stars) => {
            const count = metricas.conteoPorEstrellas[stars] || 0
            const pct = metricas.totalResenas > 0 ? (count / metricas.totalResenas) * 100 : 0
            return (
              <div key={stars} className="flex items-center gap-3 text-xs font-sans">
                <div className="flex items-center gap-1 w-12 text-arena/80 shrink-0">
                  <span className="font-bold">{stars}</span>
                  <Star className="w-3 h-3 fill-current text-oro" />
                </div>
                <div className="flex-1 bg-negro h-2.5 rounded-full overflow-hidden border border-arena/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stars >= 4
                        ? 'bg-gradient-to-r from-oro to-turquesa'
                        : 'bg-coral'
                    }`}
                    style={{ width: `${Math.max(count > 0 ? 5 : 0, pct)}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-arena/60 w-8 text-right shrink-0">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Motivos de Atención o Inconformidad */}
      {metricas.motivosFrecuentes.length > 0 && (
        <div className="mt-5 pt-4 border-t border-arena/10 flex flex-col gap-2">
          <span className="text-[10px] font-sans font-bold text-coral uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>PUNTOS DE MEJORA DETECTADOS EN COCINA / SERVICIO</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {metricas.motivosFrecuentes.map((m, idx) => (
              <span
                key={idx}
                className="text-xs font-sans bg-coral/10 border border-coral/20 text-coral px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5"
              >
                <span>{m.motivo}</span>
                <span className="bg-coral/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono">
                  {m.conteo}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Feed de Últimas Reseñas */}
      {ultimasResenas.length > 0 && (
        <div className="mt-5 pt-4 border-t border-arena/10 flex flex-col gap-3">
          <span className="text-[10px] font-sans font-bold text-arena/60 uppercase tracking-wider">
            ÚLTIMAS OPINIONES RECIBIDAS
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ultimasResenas.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="bg-carbon border border-arena/10 rounded-xl p-3 flex flex-col gap-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-oro">
                    {Array.from({ length: r.calificacion }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-arena/50">
                    {r.pedidos?.cliente_nombre || 'Cliente'} (Pedido #{r.pedido_id})
                  </span>
                </div>
                {r.comentario && (
                  <p className="font-serif italic text-arena/90 text-xs">
                    "{r.comentario}"
                  </p>
                )}
                {r.motivo && (
                  <span className="text-[10px] text-coral font-sans font-bold">
                    Detalle: {r.motivo}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
