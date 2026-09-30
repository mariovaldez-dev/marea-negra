import React from 'react'
import { MenuSkeletonGrid } from '@/components/ui/ProductSkeleton'
import { RefreshCw } from 'lucide-react'

export default function LegacyPublicMenuLoading() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] text-negro dark:bg-[#080808] dark:text-blanco flex flex-col justify-between selection:bg-coral transition-colors duration-300">
      {/* HEADER SKELETON */}
      <header className="sticky top-0 z-40 bg-[#F5F5F5]/90 dark:bg-[#080808]/90 backdrop-blur-md border-b border-black/10 dark:border-white/10 px-6 py-3 safe-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="h-8 bg-black/10 dark:bg-white/10 rounded-md w-36 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-9 bg-coral/20 rounded-full w-28 animate-pulse" />
            <div className="h-9 bg-black/10 dark:bg-white/10 rounded-full w-9 animate-pulse" />
          </div>
        </div>
      </header>

      {/* BANNER HERO SKELETON ADAPTABLE */}
      <div className="bg-white text-negro dark:bg-[#111111] dark:text-blanco py-12 px-6 border-b border-black/10 dark:border-white/10 relative overflow-hidden transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-4 animate-pulse">
          <div className="h-4 bg-turquesa/20 rounded-full w-48" />
          <div className="h-10 bg-black/10 dark:bg-white/10 rounded-xl w-3/4 max-w-md" />
          <div className="h-4 bg-black/5 dark:bg-white/5 rounded-md w-2/3 max-w-lg" />

          <div className="flex gap-2 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 bg-black/5 dark:bg-white/5 rounded-full w-24" />
            ))}
          </div>
        </div>
      </div>

      {/* SKELETON GRID DE PLATILLOS */}
      <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
          <div className="h-6 bg-black/10 dark:bg-white/10 rounded-md w-44 animate-pulse" />
          <div className="flex items-center gap-2 text-turquesa font-sans font-bold text-xs">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Cargando platillos frescos...</span>
          </div>
        </div>

        <MenuSkeletonGrid />
      </main>
    </div>
  )
}
