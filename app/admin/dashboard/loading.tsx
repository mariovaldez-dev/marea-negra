import React from 'react'

export default function DashboardLoadingSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 animate-pulse">
      {/* 1. TOP HEADER SKELETON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#16A34B]/50 animate-pulse" />
            <div className="w-44 h-3 bg-black/10 dark:bg-white/10 rounded-full" />
          </div>
          <div className="w-72 sm:w-96 h-9 bg-black/10 dark:bg-white/10 rounded-2xl" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex items-center gap-2.5">
          <div className="w-32 h-10 bg-coral/20 rounded-full" />
          <div className="w-32 h-10 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full" />
        </div>
      </div>

      {/* QUICK ACTIONS BAR SKELETON */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 shrink-0" />
            <div className="flex flex-col gap-1.5 w-full">
              <div className="w-20 h-3 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-28 h-2.5 bg-black/5 dark:bg-white/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* 2. MAIN BENTO GRID SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CARD 1: OVERALL SALES / VENTAS TOTALES (7 COLS) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm flex flex-col justify-between min-h-[340px]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="w-36 h-6 bg-black/10 dark:bg-white/10 rounded-lg" />
              <div className="w-44 sm:w-56 h-10 bg-black/10 dark:bg-white/10 rounded-xl" />
            </div>
            {/* Segmented filter skeleton */}
            <div className="w-36 h-8 bg-black/5 dark:bg-white/10 rounded-full" />
          </div>

          {/* Capsule bar chart skeleton */}
          <div className="mt-8 pt-4">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-1">
              {[
                { h: '45%', highlight: false },
                { h: '75%', highlight: false },
                { h: '50%', highlight: false },
                { h: '35%', highlight: false },
                { h: '65%', highlight: false },
                { h: '25%', highlight: false },
                { h: '85%', highlight: true },
              ].map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className={`w-10 h-4 rounded-md ${
                      bar.highlight ? 'bg-coral/30' : 'bg-black/10 dark:bg-white/10'
                    }`}
                  />
                  <div className="w-full max-w-[48px] bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl p-1 flex items-end h-full">
                    <div
                      className={`w-full rounded-xl ${
                        bar.highlight ? 'bg-coral/40' : 'bg-coral/20'
                      }`}
                      style={{ height: bar.h }}
                    />
                  </div>
                  <div className="w-6 h-3 bg-black/10 dark:bg-white/10 rounded-md mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: SOURCE / ORIGEN DE INGRESOS (5 COLS) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div className="w-36 h-6 bg-black/10 dark:bg-white/10 rounded-lg" />
              <div className="w-14 h-5 bg-turquesa/20 rounded-full" />
            </div>

            <div className="mt-3 flex flex-col gap-1">
              <div className="w-24 h-3.5 bg-black/10 dark:bg-white/10 rounded-md" />
              <div className="w-40 h-9 bg-black/10 dark:bg-white/10 rounded-xl mt-0.5" />
            </div>
          </div>

          {/* Dual Capsule Pill Rows Skeleton */}
          <div className="border-l-2 border-black/10 dark:border-white/10 pl-3.5 my-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="w-40 h-3 bg-black/10 dark:bg-white/10 rounded-md" />
              <div className="flex items-center gap-2 w-full">
                <div className="h-8 sm:h-9 bg-[#ECC94B]/40 rounded-2xl w-[65%]" />
                <div className="h-8 sm:h-9 bg-[#16A34B]/40 rounded-2xl w-[35%]" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="w-44 h-3 bg-black/10 dark:bg-white/10 rounded-md" />
              <div className="flex items-center gap-2 w-full">
                <div className="h-8 sm:h-9 bg-[#855BFA]/40 rounded-2xl w-[58%]" />
                <div className="h-8 sm:h-9 bg-[#F85938]/40 rounded-2xl w-[42%]" />
              </div>
            </div>
          </div>

          {/* Footnote Skeleton */}
          <div className="w-3/4 h-3 bg-black/10 dark:bg-white/10 rounded-md pt-1" />
        </div>

        {/* CARD 3: METRICS / MÉTRICAS & SUB-WIDGETS (5 COLS) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm flex flex-col gap-4 justify-between">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-36 h-7 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-36 h-7 bg-black/5 dark:bg-white/5 rounded-full" />
            </div>
            <div className="w-14 h-4 bg-coral/20 rounded-full" />
          </div>

          {/* Mini Top Row: Platillo Estrella + Meta de Ingresos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between min-h-[105px]">
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-coral/20" />
                  <div className="w-7 h-7 rounded-full bg-turquesa/20" />
                </div>
                <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5" />
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                <div className="w-20 h-6 bg-black/10 dark:bg-white/10 rounded-md" />
                <div className="w-28 h-3 bg-black/5 dark:bg-white/5 rounded-md" />
              </div>
            </div>

            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between min-h-[105px]">
              <div className="flex items-center justify-between">
                <div className="w-24 h-3 bg-black/10 dark:bg-white/10 rounded-md" />
                <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5" />
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                <div className="w-28 h-6 bg-black/10 dark:bg-white/10 rounded-md" />
                <div className="w-full bg-black/5 dark:bg-white/10 h-1.5 rounded-full" />
              </div>
            </div>
          </div>

          {/* Mini Dark Widgets Apple Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#0D0E10] rounded-2xl p-4 flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-lg bg-white/10" />
                <div className="w-6 h-6 rounded-full bg-white/10" />
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="w-16 h-3 bg-white/20 rounded-md" />
                <div className="w-32 h-2.5 bg-white/10 rounded-md" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-white/10" />
                ))}
              </div>
            </div>

            <div className="bg-[#0D0E10] rounded-2xl p-4 flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <div className="w-20 h-3 bg-white/20 rounded-md" />
                <div className="w-6 h-6 rounded-full bg-white/10" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="w-20 h-5 bg-white/20 rounded-md" />
                <div className="w-16 h-6 bg-white/90 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4 & 5: MIDDLE KPIs & TOTAL TRANSACTIONS (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-3xl p-4 shadow-sm flex flex-col justify-between min-h-[105px]">
              <div className="flex items-center justify-between">
                <div className="w-12 h-6 bg-black/10 dark:bg-white/10 rounded-lg" />
                <div className="w-8 h-3.5 bg-emerald-500/20 rounded-full" />
              </div>
              <div className="w-20 h-3 bg-black/10 dark:bg-white/10 rounded-md mt-3" />
            </div>

            <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-3xl p-4 shadow-sm flex flex-col justify-between min-h-[105px]">
              <div className="flex items-center justify-between">
                <div className="w-14 h-6 bg-black/10 dark:bg-white/10 rounded-lg" />
                <div className="w-8 h-3.5 bg-emerald-500/20 rounded-full" />
              </div>
              <div className="w-20 h-3 bg-black/10 dark:bg-white/10 rounded-md mt-3" />
            </div>

            <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-3xl p-4 shadow-sm flex flex-col justify-between min-h-[105px]">
              <div className="w-24 h-3 bg-black/10 dark:bg-white/10 rounded-md" />
              <div className="flex items-center justify-between mt-3">
                <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10" />
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-coral/20" />
                  <div className="w-7 h-7 rounded-full bg-turquesa/20" />
                </div>
              </div>
            </div>
          </div>

          {/* Transacciones Totales Matrix Skeleton */}
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 shadow-sm flex-1 flex flex-col justify-between min-h-[190px]">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1.5">
                <div className="w-36 h-3 bg-black/10 dark:bg-white/10 rounded-md" />
                <div className="flex items-baseline gap-2">
                  <div className="w-24 h-8 bg-black/10 dark:bg-white/10 rounded-lg" />
                  <div className="w-10 h-4 bg-emerald-500/20 rounded-full" />
                </div>
              </div>
              <div className="w-16 h-6 bg-black/5 dark:bg-white/10 rounded-full" />
            </div>

            {/* Matrix Dot Display Skeleton */}
            <div className="py-4 flex items-end justify-center gap-2">
              <div className="flex flex-col gap-1.5 items-center">
                <span className="w-3 h-3 rounded-md bg-coral/40" />
                <span className="w-3 h-3 rounded-md bg-coral/40" />
              </div>
              <div className="flex flex-col gap-1.5 items-center">
                <span className="w-3 h-3 rounded-md bg-coral/40" />
                <span className="w-3 h-3 rounded-md bg-coral/40" />
                <span className="w-3 h-3 rounded-md bg-coral/40" />
              </div>
              <div className="flex flex-col gap-1.5 items-center">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-coral/30" />
                  <span className="w-3 h-3 rounded-md bg-coral/30" />
                </div>
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-coral/30" />
                  <span className="w-3 h-3 rounded-md bg-coral/30" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 items-center">
                <span className="w-3 h-3 rounded-md bg-coral/40" />
                <span className="w-3 h-3 rounded-md bg-coral/40" />
                <span className="w-3 h-3 rounded-md bg-coral/40" />
              </div>
              <div className="flex flex-col gap-1.5 items-center">
                <span className="w-3 h-3 rounded-md bg-coral/40" />
                <span className="w-3 h-3 rounded-md bg-coral/40" />
              </div>
            </div>

            <div className="w-4/5 h-3 bg-black/10 dark:bg-white/10 rounded-md" />
          </div>
        </div>

        {/* CARD 6: ULTRA DARK 3D TEXTURED CARD (3 COLS) */}
        <div className="lg:col-span-3 bg-[#0B0C0E] border border-white/10 rounded-[32px] p-6 sm:p-7 shadow-xl text-blanco flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between">
            <div className="w-28 h-4 bg-white/20 rounded-md" />
            <div className="flex flex-col gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            </div>
          </div>

          <div className="my-6 flex flex-col gap-2">
            <div className="w-32 sm:w-40 h-16 bg-white/20 rounded-2xl" />
          </div>

          <div className="w-full h-11 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* 3. FILA INFERIOR BENTO SKELETON: ÚLTIMOS PEDIDOS (7 COLS) + REPUTACIÓN (5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-1">
        {/* ÚLTIMOS PEDIDOS SKELETON */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-turquesa/10" />
                <div className="flex flex-col gap-1.5">
                  <div className="w-24 h-2.5 bg-black/10 dark:bg-white/10 rounded-full" />
                  <div className="w-44 h-5 bg-black/10 dark:bg-white/10 rounded-lg" />
                </div>
              </div>
              <div className="w-24 h-8 bg-black/5 dark:bg-white/5 rounded-full" />
            </div>

            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="py-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10" />
                    <div className="flex flex-col gap-1.5">
                      <div className="w-32 h-3.5 bg-black/10 dark:bg-white/10 rounded-md" />
                      <div className="w-44 h-2.5 bg-black/5 dark:bg-white/5 rounded-md" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-5 bg-black/10 dark:bg-white/10 rounded-full" />
                    <div className="w-12 h-5 bg-black/10 dark:bg-white/10 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* REPUTACIÓN SKELETON */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-oro/10" />
                <div className="flex flex-col gap-1.5">
                  <div className="w-28 h-2.5 bg-black/10 dark:bg-white/10 rounded-full" />
                  <div className="w-44 h-5 bg-black/10 dark:bg-white/10 rounded-lg" />
                </div>
              </div>
              <div className="w-24 h-6 bg-oro/20 rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[110px]">
                <div className="w-14 h-8 bg-black/10 dark:bg-white/10 rounded-lg" />
                <div className="w-20 h-3 bg-black/10 dark:bg-white/10 rounded-md" />
              </div>
              <div className="sm:col-span-8 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 flex flex-col justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
