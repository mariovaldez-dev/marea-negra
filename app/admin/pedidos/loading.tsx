import React from 'react'

export default function PedidosLoadingSkeleton() {
  const columns = [
    { label: 'NUEVO', badgeBg: 'bg-coral text-white' },
    { label: 'PREPARANDO', badgeBg: 'bg-[#ECC94B] text-[#3A2D00]' },
    { label: 'LISTO', badgeBg: 'bg-[#16A34B] text-white' },
    { label: 'ENTREGADO', badgeBg: 'bg-turquesa text-black' },
  ]

  return (
    <div className="flex flex-col gap-4 relative h-[calc(100vh-100px)] w-full max-w-7xl mx-auto overflow-hidden animate-pulse">
      {/* ── HEADER SKELETON ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-20 h-5 bg-coral/30 rounded-full" />
          <div className="w-48 sm:w-64 h-8 bg-black/10 dark:bg-white/10 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-52 h-9 bg-black/5 dark:bg-white/5 rounded-full" />
          <div className="w-36 h-9 bg-coral/30 rounded-full shrink-0" />
        </div>
      </div>

      {/* ── 4 COLUMNAS KANBAN SKELETON ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 flex-1 min-h-0">
        {columns.map((col, idx) => (
          <div
            key={idx}
            className="bg-[#FBF9F5] dark:bg-[#0E0E0E] border border-black/10 dark:border-white/10 rounded-[24px] p-3 flex flex-col h-full overflow-hidden"
          >
            {/* Header de columna */}
            <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5 shrink-0 px-1">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${col.badgeBg}`}>
                {col.label}
              </span>
              <div className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10" />
            </div>

            {/* Tarjetas compactas skeleton */}
            <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1 mt-2">
              {[1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="bg-white dark:bg-[#161616] border border-black/10 dark:border-white/10 rounded-[18px] p-3 flex flex-col gap-2 shadow-sm shrink-0"
                >
                  <div className="flex justify-between items-center">
                    <div className="w-12 h-3.5 bg-turquesa/20 rounded-full" />
                    <div className="w-10 h-4 bg-coral/20 rounded-md" />
                  </div>
                  <div className="w-28 h-3.5 bg-black/10 dark:bg-white/10 rounded-md" />
                  <div className="w-full h-3 bg-black/5 dark:bg-white/5 rounded-md" />
                  <div className="flex justify-between items-center pt-1 border-t border-black/5 dark:border-white/5">
                    <div className="w-16 h-4 bg-black/5 dark:bg-white/5 rounded-full" />
                    <div className="w-8 h-4 bg-[#25D366]/30 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER SKELETON ── */}
      <div className="bg-white/90 dark:bg-[#111111]/90 border border-black/10 dark:border-white/10 rounded-full px-5 py-2.5 shadow-md flex items-center justify-between shrink-0">
        <div className="w-36 h-4 bg-black/10 dark:bg-white/10 rounded-full" />
        <div className="w-32 h-6 bg-coral/20 rounded-md" />
      </div>
    </div>
  )
}
