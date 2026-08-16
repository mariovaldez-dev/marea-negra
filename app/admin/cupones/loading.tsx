import React from 'react'
import { Sparkles, Ticket, Award, Plus } from 'lucide-react'

export default function CuponesLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-4 md:p-6 text-blanco animate-pulse">
      {/* SECCIÓN 1: CUPONES PROMOCIONALES TRADICIONALES */}
      <div className="bg-[#050404] bg-dots-pattern border-2 border-arena/20 rounded-3xl p-6 md:p-8 gold-border-corner shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/15 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-coral/10 border border-coral/30 rounded-2xl text-coral">
              <Ticket className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="w-32 h-3 bg-coral/30 rounded-full" />
              <div className="w-64 h-8 bg-carbon border border-arena/20 rounded-xl" />
            </div>
          </div>
          <div className="w-48 h-11 bg-coral/30 rounded-full shrink-0" />
        </div>

        <div className="w-full h-4 bg-arena/10 rounded-full max-w-lg" />

        {/* GRID DE CUPONES PROMOCIONALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#111111] border border-arena/15 rounded-2xl p-5 flex flex-col justify-between h-48 shadow-lg gap-3"
            >
              <div className="flex justify-between items-start">
                <div className="w-24 h-6 bg-turquesa/20 rounded-full" />
                <div className="w-16 h-8 bg-coral/20 rounded-xl" />
              </div>
              <div className="w-36 h-4 bg-arena/20 rounded-md" />
              <div className="w-48 h-3 bg-arena/10 rounded-md" />
              <div className="flex justify-between items-center pt-3 border-t border-arena/10 mt-auto">
                <div className="w-16 h-6 bg-turquesa/15 rounded-full" />
                <div className="w-16 h-6 bg-arena/15 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: PLAN DE LEALTAD Y RECOMPENSAS MULTI-TIPO */}
      <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/30 rounded-3xl p-6 md:p-8 gold-border-corner shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/15 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-oro/15 border border-oro/30 rounded-2xl text-oro">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="w-48 h-3 bg-oro/30 rounded-full" />
              <div className="w-72 h-8 bg-carbon border border-arena/20 rounded-xl" />
            </div>
          </div>
          <div className="w-56 h-11 bg-oro/30 rounded-full shrink-0" />
        </div>

        <div className="w-full h-4 bg-arena/10 rounded-full max-w-xl" />

        {/* GRID DE RECOMPENSAS DE LEALTAD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#111111] border border-oro/20 rounded-2xl p-5 flex flex-col justify-between h-52 shadow-lg gap-3"
            >
              <div className="flex justify-between items-start">
                <div className="w-36 h-5 bg-oro/20 rounded-full" />
                <div className="w-16 h-7 bg-coral/20 rounded-xl" />
              </div>
              <div className="w-28 h-4 bg-turquesa/20 rounded-md" />
              <div className="w-44 h-5 bg-arena/20 rounded-lg" />
              <div className="w-32 h-6 bg-oro/10 rounded-lg border border-oro/20" />
              <div className="flex justify-between items-center pt-3 border-t border-arena/10 mt-auto">
                <div className="w-16 h-6 bg-turquesa/15 rounded-full" />
                <div className="w-16 h-6 bg-arena/15 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
