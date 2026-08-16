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

  return (
    <div className="bg-white dark:bg-carbon border border-arena/30 dark:border-arena/10 rounded-2xl p-4 md:p-5 transition-all hover:border-turquesa/40 flex flex-col gap-3 shadow-md max-w-full min-w-0 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h4 className="font-sans font-bold text-base md:text-lg text-negro dark:text-blanco truncate max-w-full">
                {displayNombre}
              </h4>

              {badgeText && (
                <span
                  className={`text-[10px] md:text-xs font-sans font-bold uppercase px-2.5 py-0.5 rounded-full border shrink-0 ${
                    displayBadgeStatus === 'disponible' ||
                    displayBadgeStatus === 'listo' ||
                    displayBadgeStatus === 'entregado'
                      ? 'bg-turquesa/10 text-turquesa border-turquesa/30'
                      : displayBadgeStatus === 'agotado' ||
                        displayBadgeStatus === 'nuevo' ||
                        displayBadgeStatus === 'preparando'
                      ? 'bg-coral/10 text-coral border-coral/30'
                      : 'bg-arena/10 text-arena border-arena/30'
                  }`}
                >
                  {badgeText}
                </span>
              )}
            </div>

            {displaySubtexto && (
              <span className="font-sans text-xs md:text-sm text-negro/80 dark:text-arena mt-0.5 break-words">
                {displaySubtexto}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-arena/10 shrink-0">
          {displayValor !== undefined && (
            <span className="font-display text-xl md:text-2xl text-coral tracking-wide font-bold">
              {displayValor}
            </span>
          )}

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>

      {footer && <div className="pt-2.5 border-t border-arena/10 break-words">{footer}</div>}
    </div>
  )
}
