'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Gift, Sparkles, X, ArrowRight, Zap, Award, Ticket } from 'lucide-react'

export function ClubBenefitsModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: {
  isOpen?: boolean
  onClose?: () => void
} = {}) {
  const router = useRouter()
  const [internalIsOpen, setInternalIsOpen] = useState(false)

  const isModalOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen

  useEffect(() => {
    if (externalIsOpen !== undefined) return // Si es controlado externamente, no aplicar el timer
    if (typeof window === 'undefined') return

    // Si el usuario ya está logueado o registrado en el Club, no mostrar el modal de enganche
    const registered = localStorage.getItem('marea_club_registered')
    const phone = localStorage.getItem('marea_cliente_telefono')
    const name = localStorage.getItem('marea_cliente_nombre')

    if (registered === 'true' || Boolean(phone) || Boolean(name)) {
      return
    }

    // Mostrar el modal a nuevos visitantes no registrados
    const timer = setTimeout(() => {
      setInternalIsOpen(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [externalIsOpen])

  // BLOQUEAR EL SCROLL DEL BODY/FONDO CUANDO EL MODAL ESTÉ ABIERTO
  useEffect(() => {
    if (!isModalOpen || typeof window === 'undefined') return

    const originalOverflow = document.body.style.overflow
    const originalTouchAction = document.body.style.touchAction

    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.touchAction = originalTouchAction
    }
  }, [isModalOpen])

  const handleClose = () => {
    if (externalIsOpen === undefined) {
      setInternalIsOpen(false)
    }
    if (externalOnClose) externalOnClose()
  }

  const handleAccept = () => {
    handleClose()
    router.push('/registro')
  }

  if (!isModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden touch-none overscroll-contain animate-in fade-in duration-200">
      {/* TARJETA MODAL MODERNA BENTO MINIMALISTA */}
      <div className="bg-white dark:bg-[#111317] text-neutral-900 dark:text-neutral-100 border border-black/[0.08] dark:border-white/[0.08] rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl relative flex flex-col justify-between gap-5 overflow-hidden my-auto max-h-[92vh] touch-auto transition-colors">
        {/* Glows de fondo sutiles */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-[#2ABFBF]/10 dark:bg-[#2ABFBF]/15 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-coral/10 dark:bg-coral/15 rounded-full filter blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-20"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera Lead Magnet */}
        <div className="flex flex-col items-center text-center gap-2 relative z-10 pt-2">
          {/* Badge Icon */}
          <div className="w-14 h-14 rounded-2xl bg-coral/10 text-coral border border-coral/20 flex items-center justify-center text-2xl shadow-sm mb-1">
            🎁
          </div>

          <span className="text-[11px] font-sans font-bold tracking-wider text-[#2ABFBF] uppercase bg-[#2ABFBF]/10 px-3 py-1 rounded-full">
            BENEFICIO DE BIENVENIDA
          </span>

          <h2 className="font-sans font-black text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight leading-snug mt-1">
            ¡10% OFF EN TU PRIMERA ORDEN!
          </h2>

          <p className="font-sans text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xs leading-relaxed">
            Únete al <strong>Club Marea Negra</strong> en 10 segundos y desbloquea tu cupón exclusivo para hoy.
          </p>
        </div>

        {/* 3 Beneficios Claros y Minimalistas */}
        <div className="flex flex-col gap-2.5 relative z-10 font-sans text-xs">
          <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-coral/10 text-coral flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-neutral-900 dark:text-white">Cupón del 10% de Descuento</span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Aplicable en cualquier platillo a precio regular.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2ABFBF]/10 text-[#2ABFBF] flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-neutral-900 dark:text-white">Puntos en Cada Pedido</span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Acumula saldo y canjea aguachiles y bebidas gratis.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-neutral-900 dark:text-white">Pedidos en 1 Clic</span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Guarda tus datos para ordenar más rápido por WhatsApp.</span>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col gap-2 relative z-10 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="w-full bg-coral text-white hover:bg-coral/90 font-sans font-bold text-xs tracking-wider py-4 px-4 rounded-2xl shadow-[0_4px_20px_rgba(232,67,10,0.35)] transition-all flex items-center justify-center gap-2 group active:scale-95 touch-manipulation cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>DESBLOQUEAR MI 10% OFF</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-sans font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-center py-1 transition-colors cursor-pointer"
          >
            Continuar viendo el menú
          </button>
        </div>
      </div>
    </div>
  )
}
