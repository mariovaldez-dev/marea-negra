'use client'

import React from 'react'

interface NarrativeCardProps {
  urgent?: boolean
  title: string
  subtitle?: string
  date?: string
  badgeText?: string
  timestamp?: string
  narrativeText?: string
  author?: string
  children?: React.ReactNode
}

export function NarrativeCard({
  urgent = false,
  title,
  subtitle,
  date,
  badgeText,
  timestamp,
  narrativeText,
  author,
  children,
}: NarrativeCardProps) {
  const displayDate = date || timestamp
  const displaySubtitle = subtitle || narrativeText

  return (
    <div
      className={`bg-white dark:bg-[#0C0806] border-l-4 ${
        urgent ? 'border-l-coral' : 'border-l-turquesa'
      } border-arena/30 dark:border-arena/10 rounded-r-2xl p-6 md:p-7 shadow-lg flex flex-col gap-3 transition-all hover:bg-arena/10 dark:hover:bg-[#120c09]`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3">
          <h4 className="font-sans font-bold text-lg md:text-xl text-negro dark:text-blanco">
            {title}
          </h4>

          {badgeText && (
            <span
              className={`text-xs font-sans font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                urgent
                  ? 'bg-coral/10 text-coral border-coral/30'
                  : 'bg-turquesa/10 text-turquesa border-turquesa/30'
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {displayDate && (
          <span className="text-xs md:text-sm font-sans font-semibold text-negro/50 dark:text-arena/50 flex-shrink-0">
            {displayDate}
          </span>
        )}
      </div>

      {displaySubtitle && (
        <p className="font-serif italic text-base md:text-lg text-negro/80 dark:text-arena/70">
          "{displaySubtitle}"
        </p>
      )}

      {/* Separador Oro de 30px */}
      <div className="w-[35px] h-[2px] bg-oro my-1" />

      {author && (
        <span className="text-xs font-sans text-turquesa uppercase font-semibold">
          — Registrado por: {author}
        </span>
      )}

      {children && <div className="text-sm md:text-base font-sans text-negro/90 dark:text-blanco/90">{children}</div>}
    </div>
  )
}
