import React from 'react'

export default function MenuLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-20 animate-pulse">
      {/* ── HEADER SKELETON ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="flex flex-col gap-1.5">
          <div className="w-28 h-5 bg-coral/30 rounded-full" />
          <div className="w-64 sm:w-80 h-9 bg-black/10 dark:bg-white/10 rounded-2xl" />
        </div>
        <div className="w-44 h-11 bg-coral/30 rounded-2xl shrink-0" />
      </div>

      {/* ── STATS BAR SKELETON ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex flex-col gap-1.5">
              <div className="w-28 h-3.5 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-16 h-7 bg-black/10 dark:bg-white/10 rounded-xl" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5" />
          </div>
        ))}
      </div>

      {/* ── SEARCH & CATEGORY FILTER SKELETON ── */}
      <div className="flex flex-col gap-3">
        <div className="w-full h-11 bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl" />
        <div className="flex items-center gap-2">
          <div className="w-24 h-8 bg-[#2ABFBF]/30 rounded-xl" />
          <div className="w-24 h-8 bg-black/5 dark:bg-white/5 rounded-xl" />
          <div className="w-28 h-8 bg-black/5 dark:bg-white/5 rounded-xl" />
        </div>
      </div>

      {/* ── TABLE LIST SKELETON ── */}
      <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] overflow-hidden p-2">
        <div className="h-10 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl mb-2" />
        <div className="flex flex-col divide-y divide-black/[0.04] dark:divide-white/[0.04]">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="py-3.5 px-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black/10 dark:bg-white/10 shrink-0" />
                <div className="flex flex-col gap-1.5">
                  <div className="w-36 h-4 bg-black/10 dark:bg-white/10 rounded-full" />
                  <div className="w-24 h-3 bg-black/5 dark:bg-white/5 rounded-full" />
                </div>
              </div>

              <div className="hidden sm:flex flex-col gap-1 w-24">
                <div className="w-20 h-5 bg-black/10 dark:bg-white/10 rounded-full" />
              </div>

              <div className="hidden md:flex flex-col gap-1 w-20">
                <div className="w-16 h-4 bg-coral/30 rounded-full" />
              </div>

              <div className="hidden lg:flex flex-col gap-1 w-20">
                <div className="w-16 h-4 bg-black/5 dark:bg-white/5 rounded-full" />
              </div>

              <div className="w-24 h-6 bg-[#16A34B]/20 rounded-full" />

              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 bg-black/10 dark:bg-white/10 rounded-xl" />
                <div className="w-8 h-8 bg-black/10 dark:bg-white/10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
