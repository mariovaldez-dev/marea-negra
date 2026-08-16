import React from 'react'
import { DollarSign, ShoppingBag, Flame, AlertTriangle, ArrowRight, UtensilsCrossed, CircleDollarSign } from 'lucide-react'

export default function DashboardLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-4 md:p-6 text-blanco animate-pulse">
      {/* HEADER DASHBOARD SKELETON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/10 pb-6">
        <div className="flex flex-col gap-2">
          <div className="w-48 h-3.5 bg-turquesa/30 rounded-full uppercase tracking-widest" />
          <div className="w-72 md:w-96 h-10 bg-carbon border border-arena/20 rounded-xl" />
        </div>
        <div className="w-44 h-11 bg-coral/30 rounded-full shrink-0" />
      </div>

      {/* 4 LUXURY CARDS SKELETON (PATRÓN 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'INGRESOS DEL DÍA', title: 'Ventas Hoy', icon: DollarSign },
          { label: 'OPERACIONES', title: 'Pedidos Activos', icon: ShoppingBag },
          { label: 'PREFERENCIA', title: 'Platillo Top', icon: Flame },
          { label: 'ALERTAS STOCK', title: 'Inventario Bajo', icon: AlertTriangle },
        ].map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              className="bg-[#050404] bg-dots-pattern border border-oro/20 rounded-2xl p-6 flex flex-col justify-between h-full min-h-[210px] gold-border-corner shadow-xl gap-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-sans font-bold text-arena/40 tracking-widest uppercase">
                  {card.label}
                </span>
                <Icon className="w-5 h-5 text-oro/40" />
              </div>
              <h3 className="font-display text-2xl text-arena/60">{card.title}</h3>
              <div className="w-32 h-10 bg-oro/20 rounded-xl my-1" />
              <div className="w-40 h-3 bg-arena/15 rounded-full mt-auto" />
            </div>
          )
        })}
      </div>

      {/* ACCESOS RÁPIDOS MÓDULOS SKELETON */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { num: '01', title: 'Tablero Kanban Pedidos', icon: ShoppingBag },
          { num: '02', title: 'Gestión del Menú', icon: UtensilsCrossed },
          { num: '03', title: 'Cierre de Caja', icon: CircleDollarSign },
        ].map((m, i) => {
          const Icon = m.icon
          return (
            <div
              key={i}
              className="bg-carbon border border-arena/10 rounded-xl p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-turquesa/10 text-turquesa/40 rounded-lg border border-turquesa/20">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-sans font-semibold text-turquesa/40 tracking-widest uppercase">
                    MÓDULO {m.num}
                  </span>
                  <div className="w-48 h-6 bg-arena/20 rounded-lg" />
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-arena/20" />
            </div>
          )
        })}
      </div>

      {/* LISTA ÚLTIMOS PEDIDOS SKELETON */}
      <div className="bg-[#050404] border border-arena/10 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-arena/10 pb-3">
          <div className="flex flex-col gap-1">
            <div className="w-64 h-7 bg-arena/30 rounded-lg" />
            <div className="w-48 h-3.5 bg-arena/10 rounded-md" />
          </div>
          <div className="w-32 h-4 bg-turquesa/20 rounded-full" />
        </div>

        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="bg-[#111111] border border-arena/10 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-turquesa/40 shrink-0" />
                <div className="flex flex-col gap-1.5">
                  <div className="w-48 h-5 bg-arena/20 rounded-lg" />
                  <div className="w-36 h-3 bg-arena/10 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-6 bg-turquesa/20 rounded-full" />
                <div className="w-16 h-8 bg-arena/20 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
