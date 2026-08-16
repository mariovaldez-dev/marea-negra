'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Sparkles, X, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react'

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

    // Si el usuario ya está registrado en el Club, no mostrar el modal de enganche
    const registered = localStorage.getItem('marea_club_registered')
    if (registered === 'true') return

    // Mostrar SIEMPRE el modal al cargar/recargar la página si no se ha registrado aún
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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 overflow-hidden touch-none overscroll-contain selection:bg-coral animate-in fade-in duration-200">
      {/* TARJETA MODAL FIJA ADAPTABLE A LIGHT MODE Y DARK MODE */}
      <div className="bg-white text-negro dark:bg-[#050404] dark:text-blanco bg-dots-pattern border-2 border-arena/40 dark:border-oro/40 rounded-2xl sm:rounded-3xl w-[92vw] max-w-md sm:max-w-lg p-4 sm:p-6 gold-border-corner shadow-2xl relative flex flex-col justify-between gap-3 sm:gap-4 overflow-hidden my-auto max-h-[94vh] touch-auto transition-colors">
        {/* Adorno Glow de Fondo */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-limon/20 dark:bg-limon/15 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-coral/20 dark:bg-coral/20 rounded-full filter blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 p-1.5 text-negro/60 dark:text-arena/60 hover:text-coral dark:hover:text-blanco rounded-full hover:bg-arena/20 dark:hover:bg-carbon transition-colors z-20"
          title="Cerrar ventana"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Cabecera Lead Magnet */}
        <div className="flex flex-col items-center text-center gap-1 sm:gap-1.5 relative z-10 pt-0.5">
          <span className="text-[9px] sm:text-xs font-sans font-bold tracking-widest text-black dark:text-limon uppercase bg-limon dark:bg-limon/10 border border-limon/50 dark:border-limon/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black dark:text-limon shrink-0" />
            <span>BENEFICIO DE BIENVENIDA EXCLUSIVO</span>
          </span>

          <h2 className="font-display text-2xl xs:text-3xl sm:text-4xl text-negro dark:text-blanco tracking-wide mt-0.5 leading-tight">
            ¡RECIBE UN <span className="text-coral">10% DE DESCUENTO</span> EN TU PRIMER PEDIDO!
          </h2>

          <p className="font-sans italic text-[11px] sm:text-xs md:text-sm text-negro/80 dark:text-arena/90 max-w-sm">
            Únete gratis al <strong>Club Marea Negra</strong> en 10 segundos y desbloquea beneficios inmediatos:
          </p>
        </div>

        {/* Lista de Beneficios Exclusivos (Formato Compacto Fijo) */}
        <div className="bg-[#F4F0E8] dark:bg-carbon/90 border border-arena/30 dark:border-arena/15 rounded-xl p-2.5 sm:p-3.5 flex flex-col gap-1.5 sm:gap-2 relative z-10 transition-colors">
          <div className="flex items-center gap-2 text-[10px] xs:text-[11px] sm:text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-turquesa dark:text-limon shrink-0" />
            <div className="flex flex-col">
              <span className="font-sans font-bold text-negro dark:text-blanco leading-none">Cupón Personal Único del 10% OFF</span>
              <span className="text-negro/70 dark:text-arena/70 font-sans italic text-[9px] sm:text-[11px]">Válido en tu próximo pedido de aguachiles o cocteles.</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] xs:text-[11px] sm:text-xs border-t border-arena/20 dark:border-arena/10 pt-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-turquesa shrink-0" />
            <div className="flex flex-col">
              <span className="font-sans font-bold text-negro dark:text-blanco leading-none">Programa de Referidos Personal</span>
              <span className="text-negro/70 dark:text-arena/70 font-sans italic text-[9px] sm:text-[11px]">Gana 10% extra por cada amigo que invites.</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] xs:text-[11px] sm:text-xs border-t border-arena/20 dark:border-arena/10 pt-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-coral dark:text-oro shrink-0" />
            <div className="flex flex-col">
              <span className="font-sans font-bold text-negro dark:text-blanco leading-none">Promociones Secretas del Día</span>
              <span className="text-negro/70 dark:text-arena/70 font-sans italic text-[9px] sm:text-[11px]">Acceso anticipado a la pesca fresca del día y platillos exclusivos.</span>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col gap-1.5 sm:gap-2 relative z-10">
          <button
            onClick={handleAccept}
            className="w-full bg-turquesa text-negro hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro font-sans font-bold text-[11px] sm:text-xs tracking-wider py-3 sm:py-3.5 px-2 rounded-xl shadow-[0_0_25px_rgba(42,191,191,0.4)] transition-all flex items-center justify-center gap-1.5 group active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>OBTENER MI 10% DE DESCUENTO AHORA</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={handleClose}
            className="text-[10px] sm:text-xs font-sans font-semibold text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco text-center py-0.5 transition-colors"
          >
            No por ahora, continuar viendo el menú
          </button>
        </div>

        {/* Footer Garantía */}
        <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-sans text-negro/50 dark:text-arena/40 pt-0.5 border-t border-arena/20 dark:border-arena/10">
          <ShieldCheck className="w-3 h-3 text-turquesa shrink-0" />
          <span>Sin costo · Registro instantáneo</span>
        </div>
      </div>
    </div>
  )
}
