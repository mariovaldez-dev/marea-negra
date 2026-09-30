import React from 'react'
import Link from 'next/link'
import {
  Clock,
  ArrowRight,
  ShoppingBag,
  ArrowUpRight,
  Receipt,
  User,
} from 'lucide-react'
import { NotificationPermissionBanner } from '@/components/admin/NotificationPermissionBanner'
import { PwaOnboardingCard } from '@/components/admin/PwaOnboardingCard'
import { ResenasMetricsCard } from '@/components/admin/ResenasMetricsCard'
import { BentoDashboardView } from '@/components/admin/BentoDashboardView'
import { getBentoDashboardMetrics } from '@/lib/actions/bentoAnalytics'

export const revalidate = 0 // Server component siempre fresco

export default async function DashboardPage() {
  const metrics = await getBentoDashboardMetrics()

  const getBadgeStyle = (estado: string) => {
    switch (estado) {
      case 'nuevo':
        return 'bg-coral text-white font-bold'
      case 'preparando':
        return 'bg-amber-500 text-white font-bold'
      case 'listo':
        return 'bg-turquesa text-negro font-black'
      case 'entregado':
        return 'bg-[#16A34B] text-white font-bold'
      default:
        return 'bg-black/10 dark:bg-white/10 text-negro/70 dark:text-arena/70 font-semibold'
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <PwaOnboardingCard />
      <NotificationPermissionBanner />

      {/* Bento Grid Principal Dribbble Pro con Datos Reales */}
      <BentoDashboardView data={metrics} />

      {/* Fila Inferior Bento: Últimos Pedidos (7 Cols) + Satisfacción de Clientes (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-1">
        {/* TABLA BENTO: ÚLTIMOS PEDIDOS DEL TURNO (7 COLS) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-turquesa/10 border border-turquesa/20 text-turquesa flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-turquesa uppercase tracking-wider block">
                    En Vivo · Comandas
                  </span>
                  <h2 className="text-lg sm:text-xl font-sans font-black text-negro dark:text-blanco tracking-tight">
                    Últimos Pedidos del Turno
                  </h2>
                </div>
              </div>

              <Link
                href="/admin/pedidos"
                className="text-xs font-sans font-bold text-negro dark:text-blanco hover:text-coral dark:hover:text-coral flex items-center gap-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-3.5 py-1.5 rounded-full transition-all"
              >
                <span>Ver todos ({metrics.totalPedidosSemana})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Lista de Pedidos */}
            {metrics.ultimosPedidos.length > 0 ? (
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {metrics.ultimosPedidos.slice(0, 5).map((pedido) => (
                  <div
                    key={pedido.id}
                    className="py-3.5 flex items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-xl px-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-negro/70 dark:text-arena/80 shrink-0">
                        {pedido.cliente_nombre.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-bold text-sm text-negro dark:text-blanco truncate">
                            {pedido.cliente_nombre}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-negro/40 dark:text-arena/40">
                            #{pedido.id}
                          </span>
                        </div>
                        <span className="text-[11px] text-negro/50 dark:text-arena/50 truncate">
                          {pedido.hora_recogida
                            ? `Recogida: ${pedido.hora_recogida.slice(0, 5)} hrs · ${pedido.metodo_pago || 'Efectivo'}`
                            : `Método: ${pedido.metodo_pago || 'Efectivo'}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${getBadgeStyle(
                          pedido.estado
                        )}`}
                      >
                        {pedido.estado}
                      </span>
                      <span className="font-sans font-black text-sm sm:text-base text-negro dark:text-blanco min-w-[60px] text-right">
                        ${pedido.total?.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <ShoppingBag className="w-8 h-8 text-negro/20 dark:text-arena/20" />
                <p className="text-xs text-negro/50 dark:text-arena/50 font-medium">
                  No hay pedidos registrados en este turno aún.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-negro/50 dark:text-arena/50">
            <span>Sincronización en tiempo real activa</span>
            <Link
              href="/admin/pedidos"
              className="text-coral hover:underline font-bold flex items-center gap-1"
            >
              <span>Abrir Tablero Kanban</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* REPUTACIÓN & RESEÑAS BENTO (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col">
          <ResenasMetricsCard />
        </div>
      </div>
    </div>
  )
}
