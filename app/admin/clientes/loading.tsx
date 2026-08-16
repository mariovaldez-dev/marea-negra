import React from 'react'

export default function ClientesLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full text-blanco animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="w-40 h-4 bg-turquesa/20 rounded-full" />
          <div className="w-72 md:w-96 h-9 bg-carbon border border-arena/20 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[#050404] bg-dots-pattern border border-oro/20 rounded-2xl p-6 flex flex-col justify-between h-full min-h-[200px] gold-border-corner shadow-xl gap-3"
          >
            <div className="w-32 h-3.5 bg-arena/20 rounded-full" />
            <div className="w-20 h-10 bg-oro/20 rounded-xl my-2" />
            <div className="w-40 h-3 bg-arena/15 rounded-full mt-auto" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="bg-[#111111] border border-arena/15 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-turquesa/20" />
              <div className="flex flex-col gap-1.5">
                <div className="w-48 h-4 bg-arena/20 rounded-md" />
                <div className="w-32 h-3 bg-arena/10 rounded-md" />
              </div>
            </div>
            <div className="w-24 h-7 bg-arena/15 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
