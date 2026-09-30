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
      className={`bg-white dark:bg-[#141414] border border-black/10 dark:border-white/10 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 relative overflow-hidden`}
    >
      {/* Indicador de urgencia/tipo en el borde lateral */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          urgent ? 'bg-coral' : 'bg-turquesa'
        }`}
      />

      <div className="flex justify-between items-start gap-3 pl-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h4 className="font-sans font-bold text-base md:text-lg text-black dark:text-white">
            {title}
          </h4>

          {badgeText && (
            <span
              className={`text-[10px] md:text-xs font-sans font-bold uppercase px-3 py-0.5 rounded-full shrink-0 shadow-sm ${
                urgent ? 'bg-coral text-white' : 'bg-turquesa text-black'
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {displayDate && (
          <span className="text-xs font-mono font-bold text-black/50 dark:text-white/50 shrink-0">
            {displayDate}
          </span>
        )}
      </div>

      {displaySubtitle && (
        <p className="font-sans font-medium text-xs md:text-sm text-black/75 dark:text-white/75 pl-1 leading-relaxed">
          {displaySubtitle}
        </p>
      )}

      {author && (
        <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-sans text-black/50 dark:text-white/50 pl-1">
          <span>Registrado por: <strong className="text-turquesa font-bold">{author}</strong></span>
        </div>
      )}

      {children && (
        <div className="text-xs md:text-sm font-sans text-black/80 dark:text-white/80 pl-1">
          {children}
        </div>
      )}
    </div>
  )
}
