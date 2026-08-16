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
    <div className="bg-[#050404] border border-oro/15 rounded-xl p-5 sm:p-6 mb-6 shadow-[0_0_20px_rgba(201,168,76,0.05)] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      
      {/* Patrón 4 Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: 'radial-gradient(rgba(201,168,76,0.15) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
      ></div>

      <div className="flex items-start gap-4 z-10 relative">
        <div className="bg-oro/10 border border-oro/30 p-3 rounded-xl flex-shrink-0">
          <Smartphone className="w-8 h-8 text-oro" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-2xl tracking-wide text-blanco">
            Instala la app en tu celular
          </h3>
          <p className="font-serif italic text-arena/70 text-sm">
            Para recibir notificaciones al instante y acceso rápido.
          </p>

          <div className="mt-3 bg-carbon border border-arena/10 rounded-lg p-3 text-sm font-sans text-arena/80 inline-block">
            {platform === 'ios' ? (
              <div className="flex flex-col gap-1.5">
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-white text-black flex items-center justify-center rounded-md text-xs font-bold font-serif">↑</span>
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
                  <span className="font-bold text-lg leading-none tracking-[0.1em]">⋮</span>
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

      <div className="z-10 relative flex-shrink-0 w-full md:w-auto">
        <button
          onClick={handleDismiss}
          className="w-full md:w-auto px-5 py-2.5 bg-oro/10 hover:bg-oro/20 border border-oro/30 text-oro font-sans font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Ya lo instalé</span>
        </button>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-oro pointer-events-none rounded-tl-xl"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-oro pointer-events-none rounded-tr-xl"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-oro pointer-events-none rounded-bl-xl"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-oro pointer-events-none rounded-br-xl"></div>
    </div>
  )
}
