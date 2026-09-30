import React from 'react'

export default function PedirOnlineLoading() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8F6F0] dark:bg-[#080808] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-coral selection:text-white transition-colors duration-300">
      
      {/* ── 1. NAVBAR COMPACTO SKELETON ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#080808]/95 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] px-4 sm:px-6 py-2.5 safe-header">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Botón Volver */}
          <div className="h-8 w-20 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 animate-pulse" />

          {/* Logo Central */}
          <div className="h-5 w-32 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse" />

          {/* Lado Derecho */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block h-8 w-24 bg-black/5 dark:bg-white/10 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-black/5 dark:bg-white/10 rounded-xl animate-pulse" />
          </div>
        </div>
      </header>

      {/* ── 2. CONTENIDO PRINCIPAL (PASO 1 SKELETON) ─────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        <div className="flex flex-col gap-6">
          
          {/* Header y Buscador */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-40 bg-[#2ABFBF]/20 rounded-full animate-pulse" />
              <div className="h-8 sm:h-9 w-64 sm:w-80 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse" />
            </div>

            {/* Buscador */}
            <div className="w-full sm:w-72 h-10 bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-xl flex items-center px-3.5 gap-2.5 shadow-sm animate-pulse">
              <div className="w-4 h-4 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-32 h-3 bg-black/5 dark:bg-white/5 rounded-full" />
            </div>
          </div>

          {/* BARRA STICKY DE CATEGORÍAS */}
          <div className="sticky top-[53px] z-30 w-full py-2 bg-[#F8F6F0]/95 dark:bg-[#080808]/95 backdrop-blur-xl border-y border-black/[0.06] dark:border-white/[0.06] flex items-center gap-1.5 overflow-x-hidden">
            <div className="h-8 w-24 bg-neutral-950/15 dark:bg-white/15 rounded-xl animate-pulse shrink-0" />
            <div className="h-8 w-28 bg-coral/15 border border-coral/20 rounded-xl animate-pulse shrink-0" />
            <div className="h-8 w-28 bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-xl animate-pulse shrink-0" />
            <div className="h-8 w-32 bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-xl animate-pulse shrink-0" />
            <div className="h-8 w-24 bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-xl animate-pulse shrink-0" />
            <div className="h-8 w-28 bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-xl animate-pulse shrink-0 hidden sm:block" />
          </div>

          {/* LISTA DE PLATILLOS EN GRID BENTO SKELETON */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between gap-3.5 animate-pulse"
              >
                {/* Info Izquierda */}
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                  <div className="flex flex-col gap-2">
                    {i === 1 && (
                      <div className="h-4 w-24 bg-coral/15 rounded-md border border-coral/20" />
                    )}
                    <div className="h-5 w-3/4 bg-black/10 dark:bg-white/10 rounded-lg" />
                    <div className="space-y-1 mt-1">
                      <div className="h-3 w-full bg-black/5 dark:bg-white/5 rounded-md" />
                      <div className="h-3 w-4/5 bg-black/5 dark:bg-white/5 rounded-md" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-1">
                    <div className="h-6 w-20 bg-coral/20 rounded-lg" />
                  </div>
                </div>

                {/* Foto y Botón + */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-black/5 dark:bg-white/5 shrink-0 shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5" />
                  </div>
                  <div className="absolute bottom-1.5 right-1.5">
                    <div className="h-7 w-7 sm:w-20 bg-[#2ABFBF]/30 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

    </div>
  )
}
