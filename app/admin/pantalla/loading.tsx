import React from 'react'

export default function PantallaCocinaLoadingSkeleton() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col gap-6 animate-pulse pb-12">
      {/* 1. CABECERA SKELETON */}
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-coral/20 shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="w-28 h-3 bg-black/10 dark:bg-white/10 rounded-full" />
            <div className="w-48 sm:w-64 h-7 bg-black/10 dark:bg-white/10 rounded-xl" />
          </div>
        </div>

        <div className="w-72 h-10 bg-black/5 dark:bg-white/5 rounded-full" />

        <div className="flex items-center gap-2">
          <div className="w-32 h-10 bg-coral/20 rounded-full" />
          <div className="w-10 h-10 bg-black/5 dark:bg-white/10 rounded-full" />
          <div className="w-10 h-10 bg-black/5 dark:bg-white/10 rounded-full" />
        </div>
      </div>

      {/* 2. GRID DE COMANDAS SKELETON (3 COLUMNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 flex-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 shadow-sm flex flex-col justify-between min-h-[380px]"
          >
            <div className="flex flex-col gap-4">
              {/* Top Row */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-5 bg-coral/20 rounded-full" />
                    <div className="w-12 h-5 bg-[#16A34B]/20 rounded-full" />
                  </div>
                  <div className="w-36 h-8 bg-black/10 dark:bg-white/10 rounded-lg" />
                </div>
                <div className="w-20 h-7 bg-black/10 dark:bg-white/10 rounded-full" />
              </div>

              {/* Client row */}
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10" />
                  <div className="w-28 h-4 bg-black/10 dark:bg-white/10 rounded-md" />
                </div>
                <div className="w-20 h-3 bg-black/10 dark:bg-white/10 rounded-md" />
              </div>

              {/* Items container */}
              <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl p-4 flex flex-col gap-3">
                <div className="w-24 h-3 bg-turquesa/20 rounded-md" />
                <div className="flex flex-col gap-2">
                  <div className="w-full h-4 bg-black/10 dark:bg-white/10 rounded-md" />
                  <div className="w-3/4 h-3 bg-black/5 dark:bg-white/5 rounded-md" />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex flex-col gap-2">
              <div className="w-full h-12 bg-coral/20 rounded-2xl" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 bg-black/5 dark:bg-white/5 rounded-2xl" />
                <div className="h-10 bg-red-500/10 rounded-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
