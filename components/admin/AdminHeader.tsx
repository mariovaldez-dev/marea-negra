'use client'

import React, { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { RestauranteStateToggle } from '@/components/admin/RestauranteStateToggle'
import { NotificationButton } from '@/components/ui/NotificationButton'
import { UserRole } from '@/lib/types/database'
import {
  Menu as MenuIcon,
  X,
  ChevronDown,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'

interface AdminHeaderProps {
  userName: string
  role: UserRole
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  onOpenPasswordModal: () => void
  onLogout: () => void
}

const PAGE_TITLES: Record<string, { title: string; category: string }> = {
  '/admin/dashboard': { title: 'Dashboard Ejecutivo', category: 'Visión General' },
  '/admin/pedidos': { title: 'Pedidos en Vivo (Kanban)', category: 'Operaciones' },
  '/admin/pantalla': { title: 'Pantalla Cocina (KDS)', category: 'Operaciones' },
  '/admin/mesas': { title: 'Mesas & Salón', category: 'Operaciones' },
  '/admin/caja': { title: 'Cierre de Caja & Turno', category: 'Operaciones' },
  '/admin/menu': { title: 'Gestión de Menú & Platillos', category: 'Catálogo & Stock' },
  '/admin/inventario': { title: 'Inventario & Insumos', category: 'Catálogo & Stock' },
  '/admin/clientes': { title: 'Clientes del Club & CRM', category: 'Fidelización' },
  '/admin/cupones': { title: 'Cupones & Promociones', category: 'Fidelización' },
  '/admin/empleados': { title: 'Empleados, Roles & PINs', category: 'Administración' },
  '/admin/horarios': { title: 'Horarios & Datos de Sucursal', category: 'Administración' },
}

export function AdminHeader({
  userName,
  role,
  mobileOpen,
  setMobileOpen,
  onOpenPasswordModal,
  onLogout,
}: AdminHeaderProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentPage = PAGE_TITLES[pathname] || {
    title: 'Panel Administrativo',
    category: 'Marea Negra',
  }

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const inicial = (userName || 'A').charAt(0).toUpperCase()

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return 'bg-[#C9A84C] text-black'
      case 'cajero':
        return 'bg-[#2ABFBF] text-black'
      case 'cocina':
        return 'bg-coral text-white'
      case 'mesero':
        return 'bg-purple-600 text-white'
      default:
        return 'bg-black/10 dark:bg-white/10 text-negro dark:text-blanco'
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0C0D0E]/90 backdrop-blur-xl border-b border-black/[0.07] dark:border-white/[0.07] transition-colors duration-200">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* LADO IZQUIERDO: MOBILE BURGER + BREADCRUMB / TITULO DE SECCION */}
        <div className="flex items-center gap-3">
          {/* BOTÓN MÓVIL */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-coral hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95"
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>

          {/* LOGO EN MOBILE */}
          <div className="md:hidden flex items-center gap-1.5">
            <BrandLogo size="sm" href="/admin/dashboard" />
          </div>

          {/* TITULO Y BREADCRUMB EN DESKTOP */}
          <div className="hidden md:flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {currentPage.category}
              </span>
              <span className="text-neutral-300 dark:text-neutral-600 text-xs">•</span>
              <span className="text-xs font-sans font-semibold text-[#2ABFBF]">
                Terminal Activa
              </span>
            </div>
            <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-white leading-tight tracking-tight">
              {currentPage.title}
            </h2>
          </div>
        </div>

        {/* LADO DERECHO: TOGGLES + PERFIL DROPDOWN */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* INTERRUPTOR DE APERTURA DE RESTAURANTE EN VIVO */}
          <div className="hidden sm:block">
            <RestauranteStateToggle />
          </div>

          {/* BOTÓN DE NOTIFICACIONES PUSH */}
          <div className="hidden lg:block">
            <NotificationButton />
          </div>

          {/* TEMA OSCURO / CLARO */}
          <div className="shrink-0">
            <ThemeToggle />
          </div>

          {/* DROPDOWN DE USUARIO / PERFIL / CERRAR SESIÓN */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="group flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-neutral-100/80 dark:bg-white/[0.06] hover:bg-neutral-200/70 dark:hover:bg-white/[0.10] border border-black/[0.08] dark:border-white/[0.08] transition-all active:scale-[0.98]"
            >
              {/* AVATAR INICIAL */}
              <div className="w-8 h-8 rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-black font-bold font-sans flex items-center justify-center text-xs shadow-sm shrink-0">
                {inicial}
              </div>

              {/* INFO DE USUARIO (DESKTOP) */}
              <div className="hidden md:flex flex-col text-left min-w-0 pr-1">
                <span className="font-sans font-bold text-xs text-neutral-900 dark:text-white truncate max-w-[120px]">
                  {userName}
                </span>
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full w-fit mt-0.5 ${getRoleBadgeColor(role)}`}>
                  {role}
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-transform duration-200 shrink-0 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* MENÚ FLOTANTE */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[22px] p-2.5 shadow-2xl z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                {/* ENCABEZADO DEL MENÚ */}
                <div className="p-3 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-black/[0.04] dark:border-white/[0.04] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2ABFBF] text-black font-bold font-sans flex items-center justify-center text-sm shadow-sm shrink-0">
                    {inicial}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-sans font-bold text-sm text-negro dark:text-blanco truncate">
                      {userName}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getRoleBadgeColor(role)}`}>
                        {role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TOGGLE EN MOBILE DENTRO DEL DROPDOWN */}
                <div className="sm:hidden p-2 border-b border-black/[0.05] dark:border-white/[0.05]">
                  <RestauranteStateToggle />
                </div>

                {/* OPCIÓN: CAMBIAR CONTRASEÑA */}
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false)
                    onOpenPasswordModal()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-sans font-semibold text-negro/80 dark:text-arena/90 hover:text-negro dark:hover:text-blanco hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left"
                >
                  <KeyRound className="w-4 h-4 text-[#C9A84C]" />
                  <span>Cambiar Mi Contraseña</span>
                </button>

                {/* SEPARADOR */}
                <div className="h-px bg-black/[0.06] dark:bg-white/[0.06] my-0.5" />

                {/* OPCIÓN: CERRAR SESIÓN */}
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false)
                    onLogout()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-sans font-bold text-coral hover:bg-coral/10 transition-all text-left"
                >
                  <LogOut className="w-4 h-4 text-coral" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
