import React from 'react'

export default function MiCuentaLoading() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8F6F0] dark:bg-[#080808] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-coral selection:text-white transition-colors duration-300">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#080808]/95 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] px-4 sm:px-6 py-2.5 safe-header">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="h-8 w-20 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 animate-pulse" />
          <div className="h-5 w-32 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-black/5 dark:bg-white/5 rounded-xl animate-pulse" />
        </div>
      </header>

      {/* Main Skeleton */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col gap-6">
        {/* Pass Skeleton */}
        <div className="w-full max-w-md mx-auto aspect-[1.586/1] rounded-[28px] bg-neutral-900 dark:bg-[#111317] border border-black/10 dark:border-white/10 p-6 flex flex-col justify-between animate-pulse">
          <div className="flex justify-between items-start">
            <div className="h-5 w-32 bg-white/20 rounded-md" />
            <div className="h-6 w-16 bg-[#C9A84C]/30 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-48 bg-white/30 rounded-lg" />
            <div className="h-4 w-32 bg-white/15 rounded-md" />
          </div>
          <div className="flex justify-between items-end pt-4 border-t border-white/10">
            <div className="h-4 w-28 bg-white/20 rounded-md" />
            <div className="h-12 w-12 bg-white/20 rounded-xl" />
          </div>
        </div>

        {/* 3 Quick Action Pills Skeleton */}
        <div className="max-w-md mx-auto w-full grid grid-cols-3 gap-2">
          <div className="h-10 bg-white dark:bg-[#111317] rounded-xl border border-black/5 dark:border-white/5 animate-pulse" />
          <div className="h-10 bg-white dark:bg-[#111317] rounded-xl border border-black/5 dark:border-white/5 animate-pulse" />
          <div className="h-10 bg-white dark:bg-[#111317] rounded-xl border border-black/5 dark:border-white/5 animate-pulse" />
        </div>

        {/* 3 KPIs Skeleton */}
        <div className="max-w-md mx-auto w-full grid grid-cols-3 gap-2 sm:gap-3">
          <div className="h-20 bg-white dark:bg-[#111317] rounded-2xl border border-black/[0.08] dark:border-white/[0.08] animate-pulse" />
          <div className="h-20 bg-white dark:bg-[#111317] rounded-2xl border border-black/[0.08] dark:border-white/[0.08] animate-pulse" />
          <div className="h-20 bg-white dark:bg-[#111317] rounded-2xl border border-black/[0.08] dark:border-white/[0.08] animate-pulse" />
        </div>
      </main>
    </div>
  )
}
