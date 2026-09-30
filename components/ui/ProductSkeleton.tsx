'use client'

import React from 'react'

export function ProductSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 p-0 overflow-hidden flex flex-col justify-between h-[420px] animate-pulse shadow-sm transition-colors">
      {/* Skeleton Imagen Top */}
      <div className="w-full h-[210px] bg-black/5 dark:bg-white/5 relative">
        <div className="absolute top-3 left-3 w-24 h-5 bg-black/10 dark:bg-white/10 rounded-full" />
      </div>

      {/* Skeleton Contenido Inferior */}
      <div className="p-5 flex flex-col justify-between flex-1 gap-3">
        <div className="flex flex-col gap-2">
          <div className="h-6 bg-black/10 dark:bg-white/10 rounded-lg w-3/4" />
          <div className="h-3.5 bg-black/5 dark:bg-white/5 rounded-md w-full" />
          <div className="h-3.5 bg-black/5 dark:bg-white/5 rounded-md w-2/3" />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5 mt-auto">
          <div className="flex flex-col gap-1">
            <div className="h-3 bg-black/5 dark:bg-white/5 rounded w-8" />
            <div className="h-6 bg-coral/20 rounded-md w-20" />
          </div>

          <div className="h-9 bg-turquesa/20 rounded-full w-24" />
        </div>
      </div>
    </div>
  )
}

export function MenuSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
      {Array.from({ length: 6 }).map((_, idx) => (
        <ProductSkeleton key={idx} />
      ))}
    </div>
  )
}

