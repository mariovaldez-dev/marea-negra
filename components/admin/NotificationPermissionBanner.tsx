'use client'

import React, { useState } from 'react'
import { useWebNotifications } from '@/lib/hooks/useWebNotifications'
import { BellRing, Megaphone, Volume2 } from 'lucide-react'

export function NotificationPermissionBanner() {
  const {
    permission,
    isSupported,
    requestPermission,
  } = useWebNotifications()
  
  const [dismissed, setDismissed] = useState(false)

  if (!isSupported || permission === 'granted' || dismissed) {
    return null
  }

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 bg-turquesa/10 border border-turquesa/20 rounded-xl text-turquesa shrink-0">
          <BellRing className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-sans font-bold text-xs uppercase tracking-wider text-turquesa">
            Alertas en Tiempo Real
          </span>
          <p className="font-sans text-xs text-negro/70 dark:text-arena/70 mt-0.5">
            Activa las alertas sonoras y voz parlante para enterarte al instante cuando entre una nueva comanda.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-sans font-semibold text-negro/50 dark:text-arena/50 hover:text-negro dark:hover:text-blanco rounded-xl transition-colors"
        >
          Omitir
        </button>
        <button
          type="button"
          onClick={requestPermission}
          className="flex-1 sm:flex-none px-4 py-2 bg-turquesa text-negro font-sans font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-sm active:scale-95 whitespace-nowrap"
        >
          Activar Alertas
        </button>
      </div>
    </div>
  )
}

