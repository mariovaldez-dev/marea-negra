'use client'

import React from 'react'

interface LuxuryCardProps {
  eyebrow?: string
  title: string
  kpiValue?: string | number
  value?: string | number
  subtext?: string
  subtitle?: string
  ornament?: boolean
  children?: React.ReactNode
  icon?: React.ReactNode
}

export function LuxuryCard({
  eyebrow,
  title,
  kpiValue,
  value,
  subtext,
  subtitle,
  ornament = true,
  children,
  icon,
}: LuxuryCardProps) {
  const displayKpi = kpiValue !== undefined ? kpiValue : value
  const displaySubtitle = subtext !== undefined ? subtext : subtitle

  return (
    <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/40 dark:border-oro/20 rounded-2xl p-5 md:p-6 gold-border-corner shadow-xl relative overflow-hidden transition-all hover:border-[#8C6D1F]/40 dark:hover:border-oro/40 flex flex-col justify-between h-full min-h-[210px] w-full">
      {/* Glow radial en esquina superior derecha */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#8C6D1F]/10 dark:bg-oro/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col justify-between flex-1">
        {/* Eyebrow Label Turquesa & Ornamento */}
        <div className="flex justify-between items-center h-6 mb-2">
          {eyebrow ? (
            <span className="text-[11px] font-sans font-bold tracking-[0.2em] text-turquesa uppercase bg-turquesa/10 border border-turquesa/20 px-2.5 py-0.5 rounded-full">
              {eyebrow}
            </span>
          ) : (
            <span />
          )}
          {ornament && (
            <span className="text-[#8C6D1F] dark:text-oro opacity-70 dark:opacity-40 font-serif text-xs tracking-widest font-bold">
              — ✦ —
            </span>
          )}
        </div>

        {/* Regla Separadora de Oro de Alto Contraste */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#8C6D1F]/40 dark:via-oro/40 to-transparent mb-3" />

        {/* Título e Icono con Altura Mínima Uniforme para Alineación Milimétrica */}
        <div className="flex justify-between items-center gap-2 min-h-[2.75rem]">
          <h3 className="font-sans font-bold text-xs md:text-sm text-negro dark:text-blanco uppercase tracking-wider leading-snug">
            {title}
          </h3>
          {icon && <div className="text-[#8C6D1F] dark:text-oro p-1.5 bg-[#8C6D1F]/10 dark:bg-oro/10 rounded-xl shrink-0">{icon}</div>}
        </div>

        {/* KPI Value Principal Alineado con Bronce-Oro de Alto Contraste en Light Mode */}
        {displayKpi !== undefined && (
          <div className="my-2 font-display text-4xl md:text-5xl text-[#8C6D1F] dark:text-oro tracking-tight leading-none drop-shadow-sm">
            {displayKpi}
          </div>
        )}

        {/* Subtexto Informativo Claramente Legible */}
        {displaySubtitle && (
          <p className="font-sans text-xs text-negro/80 dark:text-arena/70 line-clamp-2 mt-auto font-medium">
            {displaySubtitle}
          </p>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
