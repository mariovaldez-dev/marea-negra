'use client'

import React from 'react'

interface ListRowProps {
  nombre?: string
  title?: string
  badgeText?: string
  badgeStatus?: 'disponible' | 'agotado' | 'normal' | string
  badgeVariant?: string
  valor?: string | number
  value?: string | number
  subtexto?: string
  subtitle?: string
  valueSubtitle?: string
  actions?: React.ReactNode
  footer?: React.ReactNode
}

export function ListRow({
  nombre,
  title,
  badgeText,
  badgeStatus,
  badgeVariant,
  valor,
  value,
  subtexto,
  subtitle,
  valueSubtitle,
  actions,
  footer,
}: ListRowProps) {
  const displayNombre = nombre || title || ''
  const displayBadgeStatus = badgeStatus || badgeVariant || 'normal'
  const displayValor = valor !== undefined ? valor : value
  const displaySubtexto = subtexto || subtitle || valueSubtitle

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'disponible':
      case 'listo':
      case 'entregado':
        return 'bg-[#16A34B] text-white shadow-sm'
      case 'agotado':
      case 'nuevo':
        return 'bg-coral text-white shadow-sm'
      case 'preparando':
      case 'promo':
        return 'bg-[#ECC94B] text-[#3A2D00] shadow-sm'
      default:
        return 'bg-turquesa text-black shadow-sm'
    }
  }

  return (
    <div className="bg-white dark:bg-[#141414] border border-black/10 dark:border-white/10 rounded-[24px] p-4 sm:p-5 transition-all hover:border-turquesa/50 flex flex-col gap-3 shadow-sm hover:shadow-md max-w-full min-w-0 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h4 className="font-sans font-bold text-base md:text-lg text-black dark:text-white truncate max-w-full">
                {displayNombre}
              </h4>

              {badgeText && (
                <span
                  className={`text-[10px] md:text-[11px] font-sans font-bold uppercase px-3 py-0.5 rounded-full shrink-0 ${getBadgeClass(
                    displayBadgeStatus
                  )}`}
                >
                  {badgeText}
                </span>
              )}
            </div>

            {displaySubtexto && (
              <span className="font-sans text-xs md:text-sm text-black/60 dark:text-white/60 mt-0.5 break-words">
                {displaySubtexto}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-black/5 dark:border-white/5 shrink-0">
          {displayValor !== undefined && (
            <span className="font-display text-2xl md:text-3xl text-coral tracking-wide font-bold">
              {displayValor}
            </span>
          )}

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>

      {footer && (
        <div className="pt-2.5 border-t border-black/5 dark:border-white/5 break-words">
          {footer}
        </div>
      )}
    </div>
  )
}
