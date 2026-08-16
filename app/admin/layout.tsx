'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { UserRole } from '@/lib/types/database'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { RestauranteStateToggle } from '@/components/admin/RestauranteStateToggle'
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Package,
  CircleDollarSign,
  Monitor,
  Ticket,
  LogOut,
  UserCheck,
  Menu as MenuIcon,
  X,
  Users,
  Clock,
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [role, setRole] = useState<UserRole>('admin')
  const [userName, setUserName] = useState<string>('Administrador')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    async function getUserProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const userRole = (user.user_metadata?.rol as UserRole) || 'admin'
        setRole(userRole)
        setUserName(
          user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario'
        )
      }
    }
    getUserProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'empleado'],
    },
    {
      name: 'Pantalla Cocina',
      href: '/admin/pantalla',
      icon: Monitor,
      roles: ['admin', 'empleado'],
    },
    {
      name: 'Pedidos (Kanban)',
      href: '/admin/pedidos',
      icon: ShoppingBag,
      roles: ['admin', 'empleado'],
    },
    {
      name: 'Gestión de Menú',
      href: '/admin/menu',
      icon: UtensilsCrossed,
      roles: ['admin'],
    },
    {
      name: 'Inventario',
      href: '/admin/inventario',
      icon: Package,
      roles: ['admin', 'empleado'],
    },
    {
      name: 'Cierre de Caja',
      href: '/admin/caja',
      icon: CircleDollarSign,
      roles: ['admin'],
    },
    {
      name: 'Cupones & Promos',
      href: '/admin/cupones',
      icon: Ticket,
      roles: ['admin'],
    },
    {
      name: 'Horarios & Sucursal',
      href: '/admin/horarios',
      icon: Clock,
      roles: ['admin'],
    },
    {
      name: 'Clientes del Club',
      href: '/admin/clientes',
      icon: Users,
      roles: ['admin', 'empleado'],
    },
  ]

  const visibleNavItems = navItems.filter((item) => item.roles.includes(role))

  return (
    <div className="min-h-screen bg-[#F4F0E8] dark:bg-negro text-negro dark:text-blanco flex flex-col md:flex-row transition-colors duration-300">
      {/* Botón menú móvil */}
      <div className="md:hidden bg-white dark:bg-carbon border-b border-arena/30 dark:border-arena/10 px-5 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl text-negro dark:text-blanco">MAREA NEGRA</span>
          <span className="font-serif italic text-xs text-coral">— admin —</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-negro/80 dark:text-arena hover:text-coral"
          >
            {mobileOpen ? <X className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* SIDEBAR ADMIN */}
      <aside
        className={`w-72 bg-white dark:bg-carbon border-r border-arena/30 dark:border-oro/10 flex flex-col justify-between p-7 fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:sticky md:top-0 md:h-screen md:overflow-y-auto md:shrink-0 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-8">
          {/* Logo Brand Header, State Toggle & Theme Toggle */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <BrandLogo size="md" href="/admin/dashboard" />
                <span className="font-serif italic text-sm text-coral mt-0.5">
                  — admin —
                </span>
              </div>
              <ThemeToggle />
            </div>
            <RestauranteStateToggle />
          </div>

          {/* Menú de Navegación */}
          <nav className="flex flex-col gap-1.5">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-r-xl font-sans text-sm md:text-base tracking-wide transition-all border-l-4 ${
                    isActive
                      ? 'border-l-coral bg-arena/20 dark:bg-blanco/5 text-negro dark:text-blanco font-bold shadow-sm'
                      : 'border-l-transparent text-negro/80 dark:text-arena/80 hover:text-negro dark:hover:text-blanco hover:bg-arena/10 dark:hover:bg-blanco/5'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-coral' : 'text-negro/50 dark:text-arena/50'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Sidebar: Perfil y Logout */}
        <div className="pt-6 border-t border-arena/30 dark:border-arena/10 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-turquesa/10 border border-turquesa/30 text-turquesa flex items-center justify-center font-bold text-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-sans font-bold text-sm text-negro dark:text-blanco truncate">
                {userName}
              </span>
              <span className="text-xs font-sans text-turquesa font-semibold uppercase tracking-wider">
                Rol: {role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-sans font-semibold text-coral hover:bg-coral/10 rounded-xl transition-colors w-full mt-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
