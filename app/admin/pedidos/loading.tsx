import React from 'react'
import { ShoppingBag, Plus } from 'lucide-react'

export default function PedidosLoadingSkeleton() {
  const columns = [
    { label: 'NUEVO', color: 'bg-coral/30 border-coral/40 text-coral' },
    { label: 'PREPARANDO', color: 'bg-oro/30 border-oro/40 text-oro' },
    { label: 'LISTO', color: 'bg-turquesa/30 border-turquesa/40 text-turquesa' },
    { label: 'ENTREGADO', color: 'bg-arena/20 border-arena/30 text-arena' },
  ]

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-6 text-blanco animate-pulse">
      {/* HEADER KANBAN SKELETON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-coral/10 text-coral rounded-2xl border border-coral/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="w-48 h-3.5 bg-turquesa/30 rounded-full uppercase tracking-widest" />
            <div className="w-64 md:w-96 h-9 bg-carbon border border-arena/20 rounded-xl" />
          </div>
        </div>
        <div className="w-44 h-11 bg-coral/30 rounded-full shrink-0" />
      </div>

      {/* 4 COLUMNAS KANBAN SKELETON */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map((col, idx) => (
          <div
            key={idx}
            className="bg-[#050404] bg-dots-pattern border border-arena/15 rounded-2xl p-4 flex flex-col gap-4 min-h-[520px]"
          >
            {/* Header de columna */}
            <div className="flex items-center justify-between border-b border-arena/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-arena/40" />
                <span className="font-display text-xl text-arena/60">{col.label}</span>
              </div>
              <div className="w-7 h-6 rounded-full bg-arena/20" />
            </div>

            {/* Tarjetas de comanda dentro de la columna */}
            {[1, 2].map((card) => (
              <div
                key={card}
                className="bg-[#111111] border border-arena/15 rounded-xl p-4 flex flex-col gap-3 shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div className="w-32 h-5 bg-arena/20 rounded-lg" />
                  <div className="w-16 h-6 bg-coral/20 rounded-full" />
                </div>
                <div className="w-40 h-3 bg-arena/10 rounded-md" />
                <div className="w-28 h-3 bg-arena/10 rounded-md" />
                <div className="flex justify-between items-center pt-3 border-t border-arena/10 mt-2">
                  <div className="w-20 h-6 bg-oro/20 rounded-lg" />
                  <div className="w-16 h-6 bg-turquesa/20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* RESUMEN DEL DÍA STICKY INFERIOR SKELETON */}
      <div className="bg-[#050404] border border-arena/15 rounded-2xl p-4 flex justify-between items-center shadow-2xl">
        <div className="w-48 h-5 bg-arena/20 rounded-lg" />
        <div className="w-36 h-6 bg-oro/20 rounded-xl" />
      </div>
    </div>
  )
}
