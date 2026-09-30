import React from 'react'

export default function PublicMenuLoading() {
  return (
    <div className="min-h-screen bg-[#F8F6F0] dark:bg-[#080808] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between animate-pulse">
      {/* 1. Header Skeleton */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="w-36 h-9 bg-black/10 dark:bg-white/10 rounded-xl" />
        <div className="hidden md:flex gap-3 items-center">
          <div className="w-24 h-8 bg-black/5 dark:bg-white/5 rounded-full" />
          <div className="w-28 h-8 bg-black/5 dark:bg-white/5 rounded-full" />
          <div className="w-28 h-8 bg-black/5 dark:bg-white/5 rounded-full" />
          <div className="w-36 h-9 bg-coral/30 rounded-full" />
        </div>
      </div>

      {/* 2. Hero Banner Full Width Skeleton (Estilo V1) */}
      <div className="w-full bg-[#EFEAE1] dark:bg-[#111317] border-b border-black/[0.08] dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16 transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Hero Branding Skeleton (8 cols) */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-5">
              <div className="w-48 h-6 bg-[#2ABFBF]/20 rounded-full" />
              <div className="w-64 sm:w-80 h-16 sm:h-20 bg-black/10 dark:bg-white/10 rounded-2xl" />
              <div className="w-3/4 h-4 bg-black/5 dark:bg-white/5 rounded-full" />
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3 border-t border-black/5 dark:border-white/5">
              <div className="w-48 h-12 bg-coral/30 rounded-2xl" />
              <div className="w-40 h-12 bg-[#C9A84C]/30 rounded-2xl" />
              <div className="w-36 h-12 bg-green-500/20 rounded-2xl" />
            </div>
          </div>

          {/* Full-Bleed Featured Dish Skeleton (4 cols) */}
          <div className="lg:col-span-4 rounded-[32px] overflow-hidden min-h-[420px] bg-neutral-900 dark:bg-[#111317] border border-black/10 dark:border-white/10 p-6 flex flex-col justify-between relative">
            <div className="flex items-start justify-between">
              <div className="w-36 h-7 bg-coral/40 rounded-full" />
              <div className="w-24 h-7 bg-white/15 rounded-full" />
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-32 h-4 bg-[#2ABFBF]/40 rounded-full" />
              <div className="w-3/4 h-8 bg-white/20 rounded-xl" />
              <div className="w-5/6 h-4 bg-white/10 rounded-full" />
              <div className="w-full h-12 bg-[#2ABFBF]/30 rounded-2xl mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Category Bar Skeleton */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <div className="w-24 h-9 bg-black/10 dark:bg-white/10 rounded-xl" />
          <div className="w-32 h-9 bg-black/5 dark:bg-white/5 rounded-xl" />
          <div className="w-28 h-9 bg-black/5 dark:bg-white/5 rounded-xl" />
        </div>
        <div className="w-64 h-9 bg-black/5 dark:bg-white/5 rounded-xl" />
      </div>

      {/* 5. Product Grid Skeleton (6 items) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-5 h-84 flex flex-col justify-between gap-4"
          >
            <div className="w-full h-48 bg-black/5 dark:bg-white/5 rounded-2xl" />
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="h-5 w-1/2 bg-black/10 dark:bg-white/10 rounded-full" />
                <div className="h-5 w-20 bg-coral/30 rounded-full" />
              </div>
              <div className="h-3.5 w-3/4 bg-black/5 dark:bg-white/5 rounded-full" />
            </div>
            <div className="h-11 w-full bg-black/5 dark:bg-white/5 rounded-xl" />
          </div>
        ))}
      </main>
    </div>
  )
}
