import React from 'react'

export default function InventarioLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-20 animate-pulse">
      {/* ── HEADER SKELETON ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
        <div className="flex flex-col gap-1.5">
          <div className="w-28 h-5 bg-coral/30 rounded-full" />
          <div className="w-64 sm:w-80 h-9 bg-black/10 dark:bg-white/10 rounded-2xl" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-40 h-10 bg-black/5 dark:bg-white/5 rounded-full" />
          <div className="w-36 h-10 bg-coral/30 rounded-full" />
        </div>
      </div>

      {/* ── 3 KPI CARDS SKELETON ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[28px] p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex flex-col gap-1.5">
              <div className="w-28 h-3.5 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-16 h-7 bg-black/10 dark:bg-white/10 rounded-xl" />
            </div>
            <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5" />
          </div>
        ))}
      </div>

      {/* ── SEGMENTED TABS SKELETON ── */}
      <div className="w-96 h-10 bg-black/5 dark:bg-white/5 rounded-full" />

      {/* ── SEARCH BAR SKELETON ── */}
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[28px] p-4 flex justify-between items-center">
        <div className="w-64 h-8 bg-black/5 dark:bg-white/5 rounded-full" />
        <div className="w-48 h-8 bg-black/5 dark:bg-white/5 rounded-full" />
      </div>

      {/* ── INVENTORY LIST ROWS SKELETON ── */}
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[28px] overflow-hidden shadow-sm divide-y divide-black/5 dark:divide-white/5">
        {[1, 2, 3, 4, 5, 6].map((row) => (
          <div
            key={row}
            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-turquesa/40 shrink-0" />
              <div className="flex flex-col gap-1.5">
                <div className="w-44 sm:w-60 h-4 bg-black/10 dark:bg-white/10 rounded-md" />
                <div className="w-28 sm:w-36 h-3 bg-black/5 dark:bg-white/5 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-6 bg-black/10 dark:bg-white/10 rounded-md" />
              <div className="w-24 h-8 bg-black/5 dark:bg-white/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
