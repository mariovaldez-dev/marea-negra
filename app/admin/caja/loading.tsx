import React from 'react'

export default function CajaLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="flex flex-col gap-2">
          <div className="w-28 h-5 bg-black/10 dark:bg-white/10 rounded-full" />
          <div className="w-64 sm:w-80 h-9 bg-black/10 dark:bg-white/10 rounded-2xl" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32 h-9 bg-black/10 dark:bg-white/10 rounded-xl" />
          <div className="w-28 h-9 bg-black/10 dark:bg-white/10 rounded-xl" />
        </div>
      </div>

      {/* Selector & Turno Status Skeleton */}
      <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-black/10 dark:bg-white/10" />
          <div className="flex flex-col gap-1.5">
            <div className="w-32 h-3 bg-black/10 dark:bg-white/10 rounded-full" />
            <div className="w-48 h-5 bg-black/10 dark:bg-white/10 rounded-xl" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-8 bg-black/10 dark:bg-white/10 rounded-xl" />
          <div className="w-16 h-8 bg-black/10 dark:bg-white/10 rounded-xl" />
          <div className="w-36 h-8 bg-black/10 dark:bg-white/10 rounded-xl" />
        </div>
      </div>

      {/* 4 Bento KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-24 h-3.5 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-8 h-8 rounded-xl bg-black/10 dark:bg-white/10" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="w-28 h-8 bg-black/10 dark:bg-white/10 rounded-xl" />
              <div className="w-36 h-3 bg-black/5 dark:bg-white/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* 2 Column Workspace Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
            <div className="w-48 h-6 bg-black/10 dark:bg-white/10 rounded-xl" />
            <div className="w-36 h-8 bg-black/10 dark:bg-white/10 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-black/5 dark:bg-white/5 rounded-2xl" />
            ))}
          </div>
          <div className="h-28 bg-black/5 dark:bg-white/5 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="h-12 bg-black/10 dark:bg-white/10 rounded-xl" />
            <div className="h-12 bg-black/10 dark:bg-white/10 rounded-xl" />
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
            <div className="w-36 h-6 bg-black/10 dark:bg-white/10 rounded-xl" />
            <div className="w-24 h-8 bg-black/10 dark:bg-white/10 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="h-16 bg-black/5 dark:bg-white/5 rounded-2xl" />
            <div className="h-16 bg-black/5 dark:bg-white/5 rounded-2xl" />
          </div>
          <div className="flex flex-col gap-2.5 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-black/5 dark:bg-white/5 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
