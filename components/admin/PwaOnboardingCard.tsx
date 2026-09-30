'use client'

import React, { useState, useEffect } from 'react'
import { Smartphone, X, Apple, CheckCircle2 } from 'lucide-react'

export function PwaOnboardingCard() {
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')

  useEffect(() => {
    // Check if already installed or dismissed
    const installed = localStorage.getItem('pwa_installed')
    if (installed) return

    // Verify if it's running as standalone (already PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone

    if (isStandalone) {
      localStorage.setItem('pwa_installed', 'true')
      return
    }

    // Determine platform
    const userAgent = window.navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios')
    } else if (/android/.test(userAgent)) {
      setPlatform('android')
    }

    setShow(true)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('pwa_installed', 'true')
    setShow(false)
  }

  if (!show || platform === 'other') return null

  return (
    <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        <div className="bg-turquesa/10 border border-turquesa/20 p-3 rounded-xl flex-shrink-0 text-turquesa">
          <Smartphone className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-sans font-bold text-base sm:text-lg text-negro dark:text-blanco">
            Instala la app en tu dispositivo
          </h3>
          <p className="font-sans text-xs text-negro/60 dark:text-arena/70">
            Para recibir notificaciones sonoras al instante y acceder más rápido.
          </p>

          <div className="mt-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl p-3 text-xs font-sans text-negro/80 dark:text-arena/80 inline-block">
            {platform === 'ios' ? (
              <div className="flex flex-col gap-1.5">
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-black/10 dark:bg-white/10 text-negro dark:text-blanco flex items-center justify-center rounded-md text-xs font-bold">↑</span>
                  <span>1. Toca el botón <strong>Compartir</strong> en la barra de Safari.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center"><Apple className="w-4 h-4"/></span>
                  <span>2. Selecciona <strong>"Agregar a inicio"</strong>.</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <p className="flex items-center gap-2">
                  <span className="font-bold text-base leading-none">⋮</span>
                  <span>1. Toca el <strong>menú</strong> en la esquina superior derecha.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-turquesa">⊞</span>
                  <span>2. Selecciona <strong>"Agregar a pantalla de inicio"</strong>.</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 w-full md:w-auto">
        <button
          onClick={handleDismiss}
          className="w-full md:w-auto px-4 py-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-negro dark:text-blanco font-sans font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Ya lo instalé</span>
        </button>
      </div>
    </div>
  )
}

