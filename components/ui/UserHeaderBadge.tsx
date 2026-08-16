'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, Gift, Ticket, LogOut, ChevronDown } from 'lucide-react'

export function UserHeaderBadge() {
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [couponCount, setCouponCount] = useState<number>(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window === 'undefined') return

    const loadUserSession = () => {
      const storedName = localStorage.getItem('marea_cliente_nombre')
      const storedCoupons = localStorage.getItem('marea_user_coupons')

      if (storedName) {
        setUserName(storedName.trim().split(' ')[0])
      } else {
        setUserName(null)
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

    loadUserSession()
    window.addEventListener('storage', loadUserSession)
    return () => window.removeEventListener('storage', loadUserSession)
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

  // Prevenir desajuste de hidratación (hydration mismatch) entre SSR y Cliente
  if (!mounted) {
    return (
      <div className="h-9 w-32 bg-arena/10 rounded-full animate-pulse shrink-0" />
    )
  }

  if (!userName) {
    return (
      <Link
        href="/registro"
        className="bg-turquesa/15 border border-turquesa/40 hover:bg-turquesa hover:text-negro text-turquesa text-xs font-sans font-bold px-3.5 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-sm shrink-0"
      >
        <Gift className="w-3.5 h-3.5 text-turquesa" />
        <span>Unirme al Club (10% OFF)</span>
      </Link>
    )
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 hover:border-turquesa text-negro dark:text-blanco text-xs font-sans font-bold px-3 py-1.5 rounded-full flex items-center gap-2 transition-all shadow-sm"
      >
        <div className="w-5 h-5 rounded-full bg-turquesa text-negro flex items-center justify-center font-bold text-[10px]">
          {userName.charAt(0).toUpperCase()}
        </div>
        <span>Hola, {userName}</span>
        {couponCount > 0 && (
          <span className="bg-coral text-blanco text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
            🎟️ {couponCount}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0C0806] border border-arena/30 dark:border-oro/30 rounded-2xl p-3 shadow-2xl z-50 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col border-b border-arena/20 dark:border-arena/10 pb-2 px-1">
            <span className="text-[10px] font-sans uppercase font-bold text-turquesa tracking-wider">Socio Club Marea Negra</span>
            <span className="text-xs font-sans font-bold text-negro dark:text-blanco">{userName}</span>
          </div>

          <Link
            href="/micuenta"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 text-xs font-sans font-semibold text-negro/80 dark:text-arena/90 hover:text-turquesa p-2 rounded-xl hover:bg-[#F4F0E8] dark:hover:bg-carbon transition-colors"
          >
            <User className="w-4 h-4 text-turquesa" />
            <span>Mi Perfil & Pedidos</span>
          </Link>

          <Link
            href="/pedir"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between text-xs font-sans font-semibold text-negro/80 dark:text-arena/90 hover:text-turquesa p-2 rounded-xl hover:bg-[#F4F0E8] dark:hover:bg-carbon transition-colors"
          >
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-turquesa" />
              <span>Cupones Activos</span>
            </div>
            {couponCount > 0 && (
              <span className="bg-turquesa text-negro text-[10px] font-bold px-2 py-0.5 rounded-full">
                {couponCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-sans font-bold text-coral hover:bg-coral/10 p-2 rounded-xl transition-colors mt-1 border-t border-arena/20 dark:border-arena/10"
          >
            <LogOut className="w-4 h-4 text-coral" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  )
}
