import React from 'react'
import { Clock } from 'lucide-react'

export default function HorariosLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl relative animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/10 pb-4">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-48 bg-turquesa/20 rounded-full" />
          <div className="h-9 w-80 bg-arena/20 rounded-2xl" />
        </div>
        <div className="h-12 w-44 bg-turquesa/20 rounded-full" />
      </div>

      {/* Cards Skeletons */}
      <div className="bg-[#050404] border border-oro/20 rounded-3xl p-8 h-48 gold-border-corner" />
      <div className="bg-[#050404] border border-oro/20 rounded-3xl p-8 h-40 gold-border-corner" />
      <div className="bg-[#050404] border border-oro/20 rounded-3xl p-8 h-96 gold-border-corner" />
    </div>
  )
}
