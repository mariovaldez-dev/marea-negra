'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, Gift, Ticket, LogOut, ChevronRight, Sparkles } from 'lucide-react'

interface MobileSidebarUserProfileProps {
  onNavigate?: () => void
}

export function MobileSidebarUserProfile({ onNavigate }: MobileSidebarUserProfileProps) {
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const [couponCount, setCouponCount] = useState<number>(0)

  useEffect(() => {
    setMounted(true)
    if (typeof window === 'undefined') return

    const loadSession = () => {
      const storedName = localStorage.getItem('marea_cliente_nombre')
      const storedPhone = localStorage.getItem('marea_cliente_telefono')
      const storedCoupons = localStorage.getItem('marea_user_coupons')

      if (storedName) {
        setUserName(storedName.trim())
      } else {
        setUserName(null)
      }

      if (storedPhone) {
        setUserPhone(storedPhone.trim())
      } else {
        setUserPhone(null)
      }

      if (storedCoupons) {
        try {
          const parsed = JSON.parse(storedCoupons)
          setCouponCount(Array.isArray(parsed) ? parsed.length : 0)
        } catch (e) {
          setCouponCount(0)
        }
      }
    }

    loadSession()
    window.addEventListener('storage', loadSession)
    return () => window.removeEventListener('storage', loadSession)
  }, [])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('marea_cliente_nombre')
      localStorage.removeItem('marea_cliente_telefono')
      localStorage.removeItem('marea_cliente_email')
      localStorage.removeItem('marea_club_registered')
      localStorage.removeItem('marea_user_coupons')

      document.cookie = 'marea_cliente_nombre=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      window.location.reload()
    }
  }

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl bg-arena/10 dark:bg-carbon/60 border border-arena/20 dark:border-arena/10 animate-pulse h-20" />
    )
  }

  if (!userName) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-turquesa/15 to-turquesa/5 border border-turquesa/30 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-turquesa font-bold text-xs uppercase tracking-wider">
            <Gift className="w-4 h-4 text-turquesa" />
            <span>Club Marea Negra</span>
          </div>
          <span className="bg-coral text-blanco text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            10% OFF
          </span>
        </div>
        <p className="text-xs text-negro/80 dark:text-arena/90 leading-relaxed font-sans">
          Únete a nuestro club de lealtad, acumula sellos en cada visita y canjea platillos gratis.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Link
            href="/registro"
            onClick={onNavigate}
            className="flex-1 bg-turquesa text-negro text-center text-xs font-sans font-bold py-2.5 rounded-xl hover:bg-turquesa/90 transition-all shadow-sm"
          >
            Registrarme Gratis
          </Link>
          <Link
            href="/login-cliente"
            onClick={onNavigate}
            className="px-3 py-2.5 bg-white/50 dark:bg-carbon border border-arena/30 dark:border-arena/20 text-xs font-sans font-semibold text-negro dark:text-blanco rounded-xl text-center hover:bg-arena/20 transition-all"
          >
            Ingresar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-carbon border border-arena/30 dark:border-oro/20 shadow-sm flex flex-col gap-3.5">
      {/* Header Perfil */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-turquesa/20 border border-turquesa/40 text-turquesa flex items-center justify-center font-display text-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-sans font-bold text-sm text-negro dark:text-blanco truncate">
              {userName}
            </span>
            <span className="text-[11px] font-sans text-turquesa font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Socio VIP
            </span>
          </div>
        </div>

        {couponCount > 0 && (
          <span className="bg-coral text-blanco text-[11px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Ticket className="w-3 h-3" />
            {couponCount}
          </span>
        )}
      </div>

      {/* Acciones de Perfil */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-arena/20 dark:border-arena/10">
        <Link
          href="/micuenta"
          onClick={onNavigate}
          className="flex items-center justify-between text-xs font-sans font-semibold text-negro/80 dark:text-arena/90 hover:text-turquesa p-2 rounded-xl hover:bg-[#F4F0E8] dark:hover:bg-negro/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <User className="w-4 h-4 text-turquesa" />
            <span>Mi Perfil & Tarjeta VIP</span>
          </span>
          <ChevronRight className="w-4 h-4 text-arena/60" />
        </Link>

        {couponCount > 0 && (
          <Link
            href="/pedir"
            onClick={onNavigate}
            className="flex items-center justify-between text-xs font-sans font-semibold text-negro/80 dark:text-arena/90 hover:text-turquesa p-2 rounded-xl hover:bg-[#F4F0E8] dark:hover:bg-negro/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-coral" />
              <span>Cupones Disponibles</span>
            </span>
            <span className="bg-coral/15 text-coral text-[10px] font-bold px-2 py-0.5 rounded-full">
              {couponCount} listos
            </span>
          </Link>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-sans font-semibold text-coral hover:bg-coral/10 p-2 rounded-xl transition-colors text-left mt-1"
        >
          <LogOut className="w-4 h-4 text-coral" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )
}
