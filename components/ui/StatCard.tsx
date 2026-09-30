'use client'

import React from 'react'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  trend?: {
    value: string
    isPositive?: boolean
  }
  icon: React.ReactNode
  iconColor?: 'coral' | 'turquesa' | 'oro' | 'amber' | 'neutral'
  badge?: string
}

export function StatCard({
  label,
  value,
  subtext,
  trend,
  icon,
  iconColor = 'turquesa',
  badge,
}: StatCardProps) {
  const getIconStyles = () => {
    switch (iconColor) {
      case 'coral':
        return 'bg-coral/10 text-coral border-coral/20'
      case 'oro':
        return 'bg-oro/10 text-oro border-oro/20'
      case 'amber':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'neutral':
        return 'bg-black/5 dark:bg-white/5 text-negro/70 dark:text-arena/70 border-black/10 dark:border-white/10'
      case 'turquesa':
      default:
        return 'bg-turquesa/10 text-turquesa border-turquesa/20'
    }
  }

  const isLongText = typeof value === 'string' && value.length > 7

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:border-black/20 dark:hover:border-white/20 hover:shadow-md shadow-sm group min-h-[148px]">
      <div>
        {/* Top: Label & Icon */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-sans font-bold text-negro/50 dark:text-arena/60 uppercase tracking-wider truncate">
            {label}
          </span>
          <div className={`p-2 rounded-xl border shrink-0 transition-transform duration-200 group-hover:scale-105 ${getIconStyles()}`}>
            {icon}
          </div>
        </div>

        {/* Big Value / Clean Typography */}
        <div className="mt-2.5 flex items-baseline gap-2">
          <span
            className={`font-sans font-extrabold text-negro dark:text-blanco tracking-tight leading-tight ${
              isLongText ? 'text-xl sm:text-2xl line-clamp-1' : 'text-3xl sm:text-4xl'
            }`}
            title={typeof value === 'string' ? value : undefined}
          >
            {value}
          </span>
          {badge && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-turquesa/10 text-turquesa border border-turquesa/20 shrink-0">
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* Bottom: Subtext & Trend */}
      <div className="mt-4 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs gap-2">
        {subtext && (
          <span className="text-negro/50 dark:text-arena/50 font-medium truncate text-[11px]">
            {subtext}
          </span>
        )}
        {trend && (
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
              trend.isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-coral/10 text-coral'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}

