'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { UserRole } from '@/lib/types/database'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CambiarPasswordAdminModal } from '@/components/auth/CambiarPasswordAdminModal'
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Package,
  CircleDollarSign,
  Monitor,
  Ticket,
  Users,
  Clock,
  LayoutGrid,
  UserCog,
  Sparkles,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: any
  roles: UserRole[]
  badge?: string
  badgeColor?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'OPERACIONES',
    items: [
      {
        name: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'cajero', 'empleado'],
      },
      {
        name: 'Pedidos en Vivo',
        href: '/admin/pedidos',
        icon: ShoppingBag,
        roles: ['admin', 'mesero', 'cajero', 'empleado'],
        badge: 'Live',
        badgeColor: 'bg-coral text-white',
      },
      {
        name: 'Pantalla Cocina',
        href: '/admin/pantalla',
        icon: Monitor,
        roles: ['admin', 'cocina', 'mesero', 'cajero', 'empleado'],
      },
      {
        name: 'Mesas & Salón',
        href: '/admin/mesas',
        icon: LayoutGrid,
        roles: ['admin', 'mesero', 'cajero', 'empleado'],
      },
      {
        name: 'Cierre de Caja',
        href: '/admin/caja',
        icon: CircleDollarSign,
        roles: ['admin', 'cajero'],
      },
    ],
  },
  {
    title: 'CATÁLOGO & STOCK',
    items: [
      {
        name: 'Gestión de Menú',
        href: '/admin/menu',
        icon: UtensilsCrossed,
        roles: ['admin'],
      },
      {
        name: 'Inventario & Insumos',
        href: '/admin/inventario',
        icon: Package,
        roles: ['admin', 'cocina', 'empleado'],
      },
    ],
  },
  {
    title: 'FIDELIZACIÓN & CRM',
    items: [
      {
        name: 'Clientes del Club',
        href: '/admin/clientes',
        icon: Users,
        roles: ['admin', 'cajero', 'empleado'],
      },
      {
        name: 'Cupones & Promos',
        href: '/admin/cupones',
        icon: Ticket,
        roles: ['admin'],
      },
    ],
  },
  {
    title: 'ADMINISTRACIÓN',
    items: [
      {
        name: 'Empleados & Roles',
        href: '/admin/empleados',
        icon: UserCog,
        roles: ['admin'],
      },
      {
        name: 'Horarios & Sucursal',
        href: '/admin/horarios',
        icon: Clock,
        roles: ['admin'],
      },
    ],
  },
]

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
  const [showPasswordModal, setShowPasswordModal] = useState(false)
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

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#080808] text-negro dark:text-blanco flex flex-col md:flex-row transition-colors duration-300">
      {/* SIDEBAR ADMIN (Bento / Linear Navigation) */}
      <aside
        className={`w-64 lg:w-72 bg-white dark:bg-[#0C0D0E] border-r border-black/[0.07] dark:border-white/[0.07] flex flex-col justify-between p-4 lg:p-5 fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:sticky md:top-0 md:h-screen md:overflow-y-auto md:shrink-0 md:translate-x-0 ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col gap-5">
          {/* Logo Brand Header */}
          <div className="flex flex-col pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
            <BrandLogo size="md" href="/admin/dashboard" />
          </div>

          {/* Menú de Navegación Segmentado en Secciones */}
          <nav className="flex flex-col gap-5 pb-6">
            {NAV_SECTIONS.map((section) => {
              const visibleItems = section.items.filter((item) =>
                item.roles.includes(role)
              )

              if (visibleItems.length === 0) return null

              return (
                <div key={section.title} className="flex flex-col gap-1">
                  {/* Título de Sección */}
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-3 py-1">
                    {section.title}
                  </span>

                  {/* Lista de Enlaces */}
                  <div className="flex flex-col gap-1">
                    {visibleItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-sans text-xs tracking-wide transition-all duration-200 active:scale-[0.98] ${isActive
                              ? 'bg-neutral-950 text-white dark:bg-white/[0.10] dark:text-white dark:border dark:border-white/[0.08] font-bold shadow-sm shadow-black/10'
                              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-white/[0.05] font-medium'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive
                                  ? 'text-[#2ABFBF]'
                                  : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white'
                                }`}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>

                          {/* Badge Opcional (ej. LIVE) */}
                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-[#2ABFBF] text-black'
                                }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Footer Sidebar Sutil & Limpio */}
        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[11px] font-sans text-neutral-400 dark:text-neutral-500">
          <span>v2.5 Sinaloa Mar & Tierra</span>
          <span className="w-2 h-2 rounded-full bg-[#16A34B] animate-pulse" title="Sistema en Línea" />
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL CON HEADER SUPERIOR */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER SUPERIOR */}
        <AdminHeader
          userName={userName}
          role={role}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onOpenPasswordModal={() => setShowPasswordModal(true)}
          onLogout={handleLogout}
        />

        {/* ÁREA DE CONTENIDO */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* MODAL CAMBIAR CONTRASEÑA ADMIN */}
      <CambiarPasswordAdminModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userName={userName}
      />
    </div>
  )
}
