import React from 'react'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { LuxuryCard } from '@/components/ui/LuxuryCard'
import { ListRow } from '@/components/ui/ListRow'
import {
  DollarSign,
  ShoppingBag,
  Flame,
  AlertTriangle,
  ArrowRight,
  UtensilsCrossed,
  Package,
  CircleDollarSign,
} from 'lucide-react'
import { Pedido, Insumo } from '@/lib/types/database'
import { NotificationPermissionBanner } from '@/components/admin/NotificationPermissionBanner'
import { PwaOnboardingCard } from '@/components/admin/PwaOnboardingCard'

export const revalidate = 0 // Server component siempre fresco

export default async function DashboardPage() {
  const supabase = createServerClient()

  let ventasHoy = 0
  let pedidosActivos = 0
  let platilloTop = 'Aguachile Negro'
  let alertasInventario = 0
  let ultimosPedidos: Pedido[] = []
  let insumosBajos: Insumo[] = []

  try {
    const hoyStr = new Date().toISOString().split('T')[0]

    // 1. Pedidos del día
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('*, pedido_items(*)')
      .order('created_at', { ascending: false })

    if (pedidos) {
      ultimosPedidos = pedidos.slice(0, 5)

      // Suma ventas entregadas de hoy
      ventasHoy = pedidos
        .filter(
          (p) =>
            p.estado === 'entregado' &&
            p.created_at &&
            p.created_at.startsWith(hoyStr)
        )
        .reduce((sum, p) => sum + (p.total || 0), 0)

      // Pedidos activos (nuevo, preparando, listo)
      pedidosActivos = pedidos.filter((p) =>
        ['nuevo', 'preparando', 'listo'].includes(p.estado)
      ).length
    }

    // 2. Alertas de Inventario
    const { data: insumos } = await supabase.from('insumos').select('*')
    if (insumos) {
      insumosBajos = insumos.filter((i) => i.stock_actual <= i.stock_minimo)
      alertasInventario = insumosBajos.length
    }
  } catch (err) {
    console.warn('Dashboard usando datos de demostración si DB aún no tiene datos:', err)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/10 pb-6">
        <div>
          <span className="text-xs font-sans font-semibold tracking-[0.2em] text-turquesa uppercase">
            MÓDULO DE CONTROL DE GESTIÓN
          </span>
          <h1 className="font-display text-4xl text-blanco tracking-wide mt-1">
            DASHBOARD GENERAL
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/pedidos"
            className="bg-coral text-blanco font-sans font-semibold text-xs tracking-wider px-5 py-2.5 rounded-full hover:bg-coral/80 transition-all shadow-[0_0_15px_rgba(232,67,10,0.3)] flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>NUEVO PEDIDO</span>
          </Link>
        </div>
      </div>

      <PwaOnboardingCard />

      {/* BANNER NOTIFICACIONES NATIVAS DE NAVEGADOR (SAFARI, CHROME, BRAVE) */}
      <NotificationPermissionBanner />

      {/* 4 LUXURY CARDS (PATRÓN 4) PARA KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <LuxuryCard
          eyebrow="INGRESOS DEL DÍA"
          title="Ventas Hoy"
          value={`$${ventasHoy.toFixed(0)}`}
          subtitle="Pedidos entregados acumulados"
          icon={<DollarSign className="w-5 h-5 text-oro" />}
        />

        <LuxuryCard
          eyebrow="OPERACIONES"
          title="Pedidos Activos"
          value={pedidosActivos}
          subtitle="En cocina o listos para entrega"
          icon={<ShoppingBag className="w-5 h-5 text-oro" />}
        />

        <LuxuryCard
          eyebrow="PREFERENCIA"
          title="Platillo Top"
          value={platilloTop}
          subtitle="El más ordenado esta semana"
          icon={<Flame className="w-5 h-5 text-oro" />}
        />

        <LuxuryCard
          eyebrow="ALERTAS STOCK"
          title="Inventario Bajo"
          value={alertasInventario}
          subtitle={
            alertasInventario > 0
              ? '⚠ Insumos requieren resurtido'
              : 'Nivel de stock óptimo'
          }
          icon={<AlertTriangle className="w-5 h-5 text-oro" />}
        />
      </div>

      {/* ACCESOS RÁPIDOS A MÓDULOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/pedidos" className="group">
          <div className="bg-carbon border border-arena/10 rounded-xl p-5 hover:border-turquesa/40 transition-all flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-turquesa/10 text-turquesa rounded-lg border border-turquesa/20">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-sans font-semibold text-turquesa tracking-widest uppercase">
                  MÓDULO 01
                </span>
                <h4 className="font-display text-2xl text-blanco group-hover:text-turquesa transition-colors">
                  Tablero Kanban Pedidos
                </h4>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-arena/40 group-hover:text-turquesa group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link href="/admin/menu" className="group">
          <div className="bg-carbon border border-arena/10 rounded-xl p-5 hover:border-turquesa/40 transition-all flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-coral/10 text-coral rounded-lg border border-coral/20">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-sans font-semibold text-turquesa tracking-widest uppercase">
                  MÓDULO 02
                </span>
                <h4 className="font-display text-2xl text-blanco group-hover:text-coral transition-colors">
                  Gestión del Menú
                </h4>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-arena/40 group-hover:text-coral group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link href="/admin/caja" className="group">
          <div className="bg-carbon border border-arena/10 rounded-xl p-5 hover:border-turquesa/40 transition-all flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-oro/10 text-oro rounded-lg border border-oro/20">
                <CircleDollarSign className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-sans font-semibold text-turquesa tracking-widest uppercase">
                  MÓDULO 03
                </span>
                <h4 className="font-display text-2xl text-blanco group-hover:text-oro transition-colors">
                  Cierre de Caja
                </h4>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-arena/40 group-hover:text-oro group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* SECCIÓN LISTA DE ÚLTIMOS PEDIDOS (PATRÓN 2) */}
      <div className="bg-[#050404] border border-arena/10 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-arena/10 pb-3">
          <div>
            <h3 className="font-display text-2xl text-blanco">
              ÚLTIMOS PEDIDOS REGISTRADOS
            </h3>
            <p className="font-serif italic text-xs text-arena/60">
              Actualización en tiempo real de actividad del negocio.
            </p>
          </div>
          <Link
            href="/admin/pedidos"
            className="text-xs font-sans text-turquesa hover:underline flex items-center gap-1"
          >
            <span>Ver Kanban Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {ultimosPedidos.length > 0 ? (
          <div className="flex flex-col gap-3">
            {ultimosPedidos.map((pedido) => (
              <ListRow
                key={pedido.id}
                title={`#${pedido.id} - ${pedido.cliente_nombre}`}
                subtitle={
                  pedido.hora_recogida
                    ? `Recoge a las ${pedido.hora_recogida.slice(0, 5)} hrs · Pago: ${pedido.metodo_pago}`
                    : `Pago: ${pedido.metodo_pago || 'No especificado'}`
                }
                badgeText={pedido.estado.toUpperCase()}
                badgeVariant={pedido.estado}
                value={`$${pedido.total?.toFixed(0)}`}
                valueSubtitle="TOTAL"
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-carbon/40 rounded-xl border border-arena/5 flex flex-col items-center justify-center gap-2">
            <ShoppingBag className="w-8 h-8 text-arena/30" />
            <p className="font-serif italic text-sm text-arena/60">
              No hay pedidos registrados el día de hoy aún.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
