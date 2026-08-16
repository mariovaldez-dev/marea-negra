import React from 'react'

export default function AdminLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full p-2 md:p-4 text-blanco animate-pulse">
      {/* HEADER SKELETON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/15 pb-6">
        <div className="flex flex-col gap-2">
          <div className="w-36 h-4 bg-turquesa/20 rounded-full" />
          <div className="w-64 md:w-96 h-9 bg-carbon border border-arena/20 rounded-xl" />
        </div>
        <div className="w-48 h-12 bg-turquesa/20 rounded-full shrink-0" />
      </div>

      {/* 4 LUXURY KPI CARDS SKELETON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#050404] bg-dots-pattern border border-oro/20 rounded-2xl p-6 flex flex-col justify-between h-full min-h-[210px] gold-border-corner shadow-xl gap-3"
          >
            <div className="flex justify-between items-center">
              <div className="w-28 h-3.5 bg-arena/20 rounded-full" />
              <div className="w-4 h-4 bg-oro/30 rounded-full" />
            </div>
            <div className="w-24 h-10 bg-oro/20 rounded-xl my-2" />
            <div className="w-36 h-3 bg-arena/15 rounded-full mt-auto" />
          </div>
        ))}
      </div>

      {/* CONTENIDO PRINCIPAL SKELETON (TABLA / TARJETAS / KANBAN) */}
      <div className="bg-[#050404] bg-dots-pattern border border-arena/20 rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-2xl gold-border-corner">
        <div className="flex items-center justify-between border-b border-arena/15 pb-4">
          <div className="w-48 h-6 bg-coral/30 rounded-xl" />
          <div className="w-28 h-4 bg-turquesa/20 rounded-full" />
        </div>

        {/* REGISTROS SKELETON */}
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="bg-[#111111] border border-arena/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-turquesa/40 shrink-0" />
                <div className="flex flex-col gap-1.5">
                  <div className="w-48 md:w-64 h-4 bg-arena/20 rounded-lg" />
                  <div className="w-32 h-3 bg-arena/10 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="w-20 h-6 bg-turquesa/15 border border-turquesa/30 rounded-full" />
                <div className="w-16 h-7 bg-arena/15 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
