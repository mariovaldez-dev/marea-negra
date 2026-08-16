import React from 'react'

export default function MenuLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full text-blanco animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="w-40 h-4 bg-turquesa/20 rounded-full" />
          <div className="w-72 md:w-96 h-9 bg-carbon border border-arena/20 rounded-xl" />
        </div>
        <div className="w-48 h-12 bg-turquesa/20 rounded-full shrink-0" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-[#050404] bg-dots-pattern border border-arena/20 rounded-2xl p-6 flex flex-col justify-between gold-border-corner shadow-xl gap-4"
          >
            <div className="flex justify-between items-center">
              <div className="w-24 h-5 bg-turquesa/20 rounded-full" />
              <div className="w-16 h-8 bg-coral/20 rounded-xl" />
            </div>
            <div className="w-48 h-6 bg-arena/20 rounded-lg mt-2" />
            <div className="w-32 h-3 bg-arena/10 rounded-md" />
            <div className="w-full h-10 bg-carbon rounded-xl border border-arena/10 mt-3" />
          </div>
        ))}
      </div>
    </div>
  )
}
