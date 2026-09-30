import React from 'react'

export default function AdminLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12 animate-pulse">
      {/* HEADER SKELETON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/10 dark:border-white/10">
        <div className="flex flex-col gap-2">
          <div className="w-32 h-3.5 bg-black/10 dark:bg-white/10 rounded-full" />
          <div className="w-56 sm:w-80 h-8 bg-black/10 dark:bg-white/10 rounded-xl" />
        </div>
        <div className="w-36 h-10 bg-coral/20 rounded-xl shrink-0" />
      </div>

      {/* 4 STAT CARDS SKELETON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between min-h-[148px] shadow-sm gap-3"
          >
            <div className="flex justify-between items-center">
              <div className="w-24 h-3 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-8 h-8 bg-black/5 dark:bg-white/5 rounded-xl" />
            </div>
            <div className="w-28 h-8 bg-black/10 dark:bg-white/10 rounded-xl my-1" />
            <div className="w-36 h-2.5 bg-black/5 dark:bg-white/5 rounded-full mt-auto" />
          </div>
        ))}
      </div>

      {/* CONTENIDO PRINCIPAL SKELETON */}
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
          <div className="w-48 h-6 bg-black/10 dark:bg-white/10 rounded-xl" />
          <div className="w-24 h-4 bg-turquesa/20 rounded-full" />
        </div>

        {/* REGISTROS SKELETON */}
        <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-turquesa/40 shrink-0" />
                <div className="flex flex-col gap-1.5">
                  <div className="w-48 sm:w-64 h-4 bg-black/10 dark:bg-white/10 rounded-lg" />
                  <div className="w-32 h-3 bg-black/5 dark:bg-white/5 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="w-20 h-6 bg-turquesa/10 border border-turquesa/20 rounded-md" />
                <div className="w-16 h-6 bg-black/10 dark:bg-white/10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

