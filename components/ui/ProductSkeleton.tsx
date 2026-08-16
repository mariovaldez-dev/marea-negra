'use client'

import React from 'react'

export function ProductSkeleton() {
  return (
    <div className="rounded-2xl bg-white text-negro dark:bg-[#080808] dark:text-blanco border border-arena/30 dark:border-arena/10 p-0 overflow-hidden flex flex-col justify-between h-[450px] animate-pulse shadow-xl transition-colors">
      {/* Skeleton Imagen Top */}
      <div className="w-full h-[230px] bg-[#EBE5D8] dark:bg-carbon/80 relative">
        <div className="absolute top-3 left-3 w-28 h-6 bg-arena/30 dark:bg-arena/10 rounded-full" />
      </div>

      {/* Skeleton Contenido Inferior */}
      <div className="p-5 flex flex-col justify-between flex-1 gap-3 bg-white dark:bg-[#080808] transition-colors">
        <div className="flex flex-col gap-2.5">
          <div className="h-8 bg-[#EBE5D8] dark:bg-carbon/90 rounded-lg w-3/4" />
          <div className="h-4 bg-[#EBE5D8] dark:bg-carbon/50 rounded-md w-full" />
          <div className="h-4 bg-[#EBE5D8] dark:bg-carbon/50 rounded-md w-2/3" />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-arena/30 dark:border-arena/10 mt-auto">
          <div className="flex flex-col gap-1">
            <div className="h-3 bg-arena/30 dark:bg-carbon/40 rounded w-10" />
            <div className="h-8 bg-coral/20 rounded-md w-24" />
          </div>

          <div className="h-10 bg-turquesa/20 rounded-full w-28" />
        </div>
      </div>
    </div>
  )
}

export function MenuSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {Array.from({ length: 6 }).map((_, idx) => (
        <ProductSkeleton key={idx} />
      ))}
    </div>
  )
}
