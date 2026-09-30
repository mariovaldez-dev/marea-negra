import React from 'react'

export default function MesasLoadingSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 animate-pulse pb-12">
      {/* 1. TOP HEADER SKELETON */}
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#16A34B]/50" />
            <div className="w-48 h-3 bg-black/10 dark:bg-white/10 rounded-full" />
          </div>
          <div className="w-64 h-8 bg-black/10 dark:bg-white/10 rounded-xl" />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-28 h-10 bg-black/5 dark:bg-white/5 rounded-full" />
          <div className="w-32 h-10 bg-black/5 dark:bg-white/5 rounded-full" />
          <div className="w-36 h-10 bg-black/5 dark:bg-white/5 rounded-full" />
          <div className="w-32 h-10 bg-coral/20 rounded-full" />
        </div>
      </div>

      {/* 2. BENTO KPIS SKELETON (4 COLS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-5 shadow-sm flex flex-col justify-between min-h-[120px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-24 h-3 bg-black/10 dark:bg-white/10 rounded-md" />
              <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10" />
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              <div className="w-16 h-8 bg-black/10 dark:bg-white/10 rounded-lg" />
              <div className="w-32 h-2.5 bg-black/5 dark:bg-white/5 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. SELECTOR DE VISTA SKELETON */}
      <div className="flex items-center justify-between gap-3">
        <div className="w-64 h-10 bg-black/5 dark:bg-white/5 rounded-full" />
        <div className="w-72 h-3 bg-black/5 dark:bg-white/5 rounded-full hidden sm:block" />
      </div>

      {/* 4. CANVAS SKELETON */}
      <div className="w-full h-[620px] bg-white dark:bg-[#0D0E10] border border-black/10 dark:border-white/10 rounded-[32px] p-8 shadow-sm flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10" />
          <div className="w-48 h-3 bg-black/10 dark:bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  )
}
