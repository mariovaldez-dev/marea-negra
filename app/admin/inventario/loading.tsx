import React from 'react'

export default function InventarioLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full text-blanco animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="w-40 h-4 bg-turquesa/20 rounded-full" />
          <div className="w-72 md:w-96 h-9 bg-carbon border border-arena/20 rounded-xl" />
        </div>
        <div className="w-48 h-12 bg-turquesa/20 rounded-full shrink-0" />
      </div>

      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="bg-[#111111] border border-arena/15 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-turquesa/40 shrink-0" />
              <div className="flex flex-col gap-1.5">
                <div className="w-48 h-4 bg-arena/20 rounded-md" />
                <div className="w-32 h-3 bg-arena/10 rounded-md" />
              </div>
            </div>
            <div className="w-32 h-8 bg-turquesa/20 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
