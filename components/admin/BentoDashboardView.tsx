'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  ShoppingBag,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpRight,
  Plus,
  Info,
  Bell,
  BarChart2,
  GitFork,
  Activity,
  Calendar,
  Sparkles,
  Settings,
  Check,
  Package,
  Monitor,
  LayoutGrid,
  TrendingUp,
  UtensilsCrossed,
  ChefHat,
  Users,
  Flame,
} from 'lucide-react'
import { BentoDashboardData } from '@/lib/actions/bentoAnalytics'

interface BentoDashboardProps {
  data: BentoDashboardData
}

export function BentoDashboardView({ data }: BentoDashboardProps) {
  const [subTab, setSubTab] = useState<'metrics' | 'widgets'>('metrics')
  const [timeFilter, setTimeFilter] = useState<'Semana' | 'Mes' | 'Hoy'>('Semana')
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0)
  const [showFilterSettings, setShowFilterSettings] = useState<boolean>(false)
  const [retentionSlide, setRetentionSlide] = useState<number>(0)
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null)

  // Obtener valor principal según el filtro seleccionado
  const displaySales =
    timeFilter === 'Hoy'
      ? data.ventasHoy
      : timeFilter === 'Mes'
      ? data.ventasMes
      : data.ventasSemana

  const displaySubtitle =
    timeFilter === 'Hoy'
      ? 'Ventas del Turno de Hoy'
      : timeFilter === 'Mes'
      ? 'Facturación Total del Mes'
      : 'Ventas de los Últimos 7 Días'

  const hoyObj = new Date()
  const diaMesActual = hoyObj.getDate()
  const diasCalendario = [
    diaMesActual - 4,
    diaMesActual - 3,
    diaMesActual - 2,
    diaMesActual - 1,
    diaMesActual,
    diaMesActual + 1,
  ]

  const totalMetodos = data.canalEfectivoTotal + data.canalTransferenciaTotal
  const efectivoPct = totalMetodos > 0 ? Math.round((data.canalEfectivoTotal / totalMetodos) * 100) : 58
  const transferenciaPct = 100 - efectivoPct

  // Source card dynamic values based on master timeFilter
  const sourceSales =
    timeFilter === 'Hoy'
      ? data.ventasHoy
      : timeFilter === 'Mes'
      ? data.ventasMes
      : (data.canalSalonTotal + data.canalDomicilioTotal > 0 ? (data.canalSalonTotal + data.canalDomicilioTotal) : 84300)

  // Gráfico dinámico según el filtro seleccionado
  const currentBarChartData =
    timeFilter === 'Hoy'
      ? (data.barChartDataHoy || data.barChartData)
      : timeFilter === 'Mes'
      ? (data.barChartDataMes || data.barChartData)
      : (data.barChartDataSemana || data.barChartData)

  // 3D Retention Carousel Data
  const retentionSlides = [
    {
      title: 'Tasa de Retención',
      value: `${data.tasaRetencionClub || 84}%`,
      subtext: 'Clientes que repiten pedido en el mes',
      badge: 'Club VIP Sinaloa',
      color: 'text-turquesa',
    },
    {
      title: 'Clientes Frecuentes',
      value: '128',
      subtext: '+14 nuevos comensales este mes',
      badge: 'Fidelización Alta',
      color: 'text-oro',
    },
    {
      title: 'Ticket Promedio VIP',
      value: '$340',
      subtext: '+38% sobre comanda estándar',
      badge: 'Alto Consumo',
      color: 'text-[#16A34B]',
    },
  ]

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* ========================================================= */}
      {/* 1. TOP FLOATING NAVIGATION & GREETING                     */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#16A34B] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-negro/50 dark:text-arena/60 uppercase">
              Terminal Ejecutiva · Sinaloa
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-sans font-black tracking-tight text-negro dark:text-blanco uppercase">
            BIENVENIDO DE VUELTA, {data.userName.toUpperCase()}
          </h1>
        </div>

        {/* Action Pills Right */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/pedidos"
            className="inline-flex items-center gap-2 bg-coral text-blanco font-sans font-bold text-xs tracking-wide px-4 py-2.5 rounded-full hover:bg-coral/90 transition-all shadow-sm active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Nuevo Pedido</span>
          </Link>
          <Link
            href="/admin/caja"
            className="inline-flex items-center gap-1.5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 text-negro dark:text-blanco font-sans font-semibold text-xs px-3.5 py-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm active:scale-95"
          >
            <DollarSign className="w-3.5 h-3.5 text-oro" />
            <span>Cierre de Caja</span>
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. ACCESOS RÁPIDOS OPERATIVOS (QUICK ACTIONS BAR)         */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Link
          href="/admin/mesas"
          className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 hover:border-coral/40 dark:hover:border-coral/40 rounded-2xl p-3 flex items-center gap-3 transition-all group shadow-sm hover:shadow active:scale-[0.99]"
        >
          <div className="w-8 h-8 rounded-xl bg-coral/10 text-coral flex items-center justify-center group-hover:bg-coral group-hover:text-white transition-all">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-sans font-bold text-negro dark:text-blanco block truncate">
              Mesas & Salón
            </span>
            <span className="text-[10px] text-negro/50 dark:text-arena/50 block truncate">
              {data.pedidosActivos > 0 ? `${data.pedidosActivos} comandas vivas` : 'Comedor listo'}
            </span>
          </div>
        </Link>

        <Link
          href="/admin/pantalla"
          className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 hover:border-turquesa/40 dark:hover:border-turquesa/40 rounded-2xl p-3 flex items-center gap-3 transition-all group shadow-sm hover:shadow active:scale-[0.99]"
        >
          <div className="w-8 h-8 rounded-xl bg-turquesa/10 text-turquesa flex items-center justify-center group-hover:bg-turquesa group-hover:text-negro transition-all">
            <Monitor className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-sans font-bold text-negro dark:text-blanco block truncate">
              Cocina (KDS)
            </span>
            <span className="text-[10px] text-negro/50 dark:text-arena/50 block truncate">
              Pantalla de preparación
            </span>
          </div>
        </Link>

        <Link
          href="/admin/inventario"
          className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 hover:border-amber-500/40 dark:hover:border-amber-500/40 rounded-2xl p-3 flex items-center gap-3 transition-all group shadow-sm hover:shadow active:scale-[0.99]"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
            <Package className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-sans font-bold text-negro dark:text-blanco block truncate">
              Inventario & Stock
            </span>
            <span className="text-[10px] text-negro/50 dark:text-arena/50 block truncate">
              {data.alertasInventario > 0 ? `${data.alertasInventario} stock bajo` : 'Insumos al 100%'}
            </span>
          </div>
        </Link>

        <Link
          href="/admin/menu"
          className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 rounded-2xl p-3 flex items-center gap-3 transition-all group shadow-sm hover:shadow active:scale-[0.99]"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#16A34B] flex items-center justify-center group-hover:bg-[#16A34B] group-hover:text-white transition-all">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-sans font-bold text-negro dark:text-blanco block truncate">
              Gestión de Carta
            </span>
            <span className="text-[10px] text-negro/50 dark:text-arena/50 block truncate">
              Platillos y precios
            </span>
          </div>
        </Link>
      </div>

      {/* ========================================================= */}
      {/* 3. MAIN BENTO GRID IDENTICAL TO DRIBBBLE MOCKUP           */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ========================================================= */}
        {/* CARD 1: OVERALL SALES / VENTAS TOTALES (7 COLS)           */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm flex flex-col justify-between transition-all">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-sans font-bold text-negro dark:text-blanco tracking-tight">
                Ventas Totales
              </h2>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-sans font-black text-negro dark:text-blanco tracking-tight">
                  ${displaySales.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                </span>
                <span className="text-xs font-mono font-bold text-white bg-[#16A34B] px-2.5 py-0.5 rounded-full shadow-sm">
                  {data.tasaConversion}% Eficiencia
                </span>
              </div>
            </div>

            {/* Segmented Control Filter [ Hoy | Semana | Mes ] */}
            <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/5 dark:border-white/5 self-start sm:self-auto">
              {(['Hoy', 'Semana', 'Mes'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  type="button"
                  onClick={() => setTimeFilter(filterOption)}
                  className={`px-3 py-1 text-xs font-sans font-bold rounded-full transition-all active:scale-95 ${
                    timeFilter === filterOption
                      ? 'bg-white dark:bg-[#222222] text-negro dark:text-blanco shadow-sm'
                      : 'text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco'
                  }`}
                >
                  {filterOption}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowFilterSettings(!showFilterSettings)}
                aria-label="Ajustes de filtro"
                className={`p-1.5 rounded-full transition-all ${
                  showFilterSettings
                    ? 'bg-coral text-white'
                    : 'text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Gráfico de Barras Cápsula 3D Dinámico según Filtro */}
          <div className="mt-8 pt-4">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-1 relative">
              {currentBarChartData.map((item, idx) => (
                <div
                  key={`${timeFilter}-${idx}`}
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  className="flex-1 flex flex-col items-center gap-2 group h-full justify-end animate-in fade-in zoom-in-95 duration-300 relative cursor-pointer"
                >
                  {/* Floating Percentage Badge */}
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md transition-transform group-hover:scale-110 shadow-sm text-white ${
                      item.highlight
                        ? 'bg-coral shadow-coral/30'
                        : 'bg-black/70 dark:bg-white/20'
                    }`}
                  >
                    {item.badge}
                  </span>

                  {/* Capsule Bar Container */}
                  <div className="w-full max-w-[48px] bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl p-1 flex items-end h-full relative group-hover:bg-black/[0.08] dark:group-hover:bg-white/[0.08] transition-all">
                    <div
                      className={`w-full rounded-xl transition-all duration-500 shadow-sm ${
                        item.highlight
                          ? 'bg-coral shadow-coral/30'
                          : 'bg-coral/80 group-hover:bg-coral group-hover:shadow-md'
                      }`}
                      style={{ height: item.height }}
                    />
                  </div>

                  {/* Period Label */}
                  <span className="text-xs font-sans font-semibold text-negro/50 dark:text-arena/50 mt-1 group-hover:text-negro dark:group-hover:text-blanco transition-colors">
                    {item.label}
                  </span>

                  {/* Rich Interactive Tooltip on Hover */}
                  {hoveredBarIndex === idx && (
                    <div className="absolute -top-14 z-30 bg-[#0B0C0E] text-white border border-white/10 rounded-xl px-2.5 py-1.5 shadow-xl text-center pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-90 duration-150">
                      <span className="text-[10px] font-mono font-bold text-coral block">
                        ${item.total.toLocaleString('es-MX')}
                      </span>
                      <span className="text-[9px] text-white/70 block">
                        {item.count} comanda{item.count !== 1 ? 's' : ''} · {item.label}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 2: SOURCE / ORIGEN DE INGRESOS (5 COLS)              */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm flex flex-col justify-between transition-all">
          {/* Top Header Row */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-sans font-bold text-negro dark:text-blanco tracking-tight">
                Origen de Ingresos
              </h2>

              <span className="text-[10px] font-mono text-negro font-bold uppercase tracking-wider bg-turquesa px-2.5 py-1 rounded-full shadow-sm">
                {timeFilter}
              </span>
            </div>

            {/* Subtitle & Big Metric */}
            <div className="mt-3">
              <span className="text-xs sm:text-sm font-sans text-negro/50 dark:text-arena/60 font-normal">
                Ganancia Neta
              </span>
              <div className="mt-0.5">
                <span className="text-3xl sm:text-4xl font-sans font-black text-negro dark:text-blanco tracking-tight">
                  ${sourceSales.toLocaleString('es-MX')}
                </span>
              </div>
            </div>
          </div>

          {/* Left Line Guide with Dual Capsule Rows */}
          <div className="border-l-2 border-black/10 dark:border-white/10 pl-3.5 my-5 flex flex-col gap-4">
            {/* Row 1: Canales de Venta (Salón vs Domicilio) */}
            <div>
              <div className="flex items-center justify-between text-xs text-negro/60 dark:text-arena/70 font-medium mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-negro/40 dark:text-arena/50 shrink-0" />
                  <span>Crecimiento por Canal</span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full">
                <div
                  className="h-8 sm:h-9 bg-[#ECC94B] text-[#3A2D00] rounded-2xl transition-all hover:opacity-95 cursor-pointer shadow-sm flex items-center justify-between px-3 overflow-hidden"
                  style={{ width: `${Math.max(28, Math.min(72, data.canalSalonPct || 65))}%` }}
                  title={`Salón & Mesas: ${data.canalSalonPct}% ($${data.canalSalonTotal.toLocaleString('es-MX')})`}
                >
                  <span className="text-[11px] font-sans font-bold truncate">Salón & Mesas</span>
                  <span className="text-[10px] font-mono font-black ml-1.5 shrink-0">{data.canalSalonPct}%</span>
                </div>
                <div
                  className="h-8 sm:h-9 bg-[#16A34B] text-white rounded-2xl transition-all hover:opacity-95 cursor-pointer shadow-sm flex items-center justify-between px-3 overflow-hidden"
                  style={{ width: `${Math.max(28, Math.min(72, data.canalDomicilioPct || 35))}%` }}
                  title={`Domicilio / WhatsApp: ${data.canalDomicilioPct}% ($${data.canalDomicilioTotal.toLocaleString('es-MX')})`}
                >
                  <span className="text-[11px] font-sans font-bold truncate">Domicilio / WA</span>
                  <span className="text-[10px] font-mono font-black ml-1.5 shrink-0">{data.canalDomicilioPct}%</span>
                </div>
              </div>
            </div>

            {/* Row 2: Métodos de Cobro (Efectivo vs Digital) */}
            <div>
              <div className="flex items-center justify-between text-xs text-negro/60 dark:text-arena/70 font-medium mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-negro/40 dark:text-arena/50 shrink-0" />
                  <span>Volumen Total de Ventas</span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full">
                <div
                  className="h-8 sm:h-9 bg-[#855BFA] text-white rounded-2xl transition-all hover:opacity-95 cursor-pointer shadow-sm flex items-center justify-between px-3 overflow-hidden"
                  style={{ width: `${Math.max(28, Math.min(72, efectivoPct))}%` }}
                  title={`Efectivo: $${data.canalEfectivoTotal.toLocaleString('es-MX')} (${efectivoPct}%)`}
                >
                  <span className="text-[11px] font-sans font-bold truncate">Efectivo</span>
                  <span className="text-[10px] font-mono font-black ml-1.5 shrink-0">${data.canalEfectivoTotal.toLocaleString('es-MX')}</span>
                </div>
                <div
                  className="h-8 sm:h-9 bg-[#F85938] text-white rounded-2xl transition-all hover:opacity-95 cursor-pointer shadow-sm flex items-center justify-between px-3 overflow-hidden"
                  style={{ width: `${Math.max(28, Math.min(72, transferenciaPct))}%` }}
                  title={`Transferencia / OXXO: $${data.canalTransferenciaTotal.toLocaleString('es-MX')} (${transferenciaPct}%)`}
                >
                  <span className="text-[11px] font-sans font-bold truncate">Transf / OXXO</span>
                  <span className="text-[10px] font-mono font-black ml-1.5 shrink-0">${data.canalTransferenciaTotal.toLocaleString('es-MX')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footnote */}
          <p className="text-xs text-negro/50 dark:text-arena/60 font-normal leading-relaxed pt-2">
            El margen de ganancia neta creció un 4.2% respecto al mes anterior.
          </p>
        </div>

        {/* ========================================================= */}
        {/* CARD 3: METRICS / MÉTRICAS & SUB-WIDGETS (5 COLS)         */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-sm flex flex-col gap-4 justify-between transition-all">
          {/* Header con Sub-pestañas Interactivas */}
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubTab('metrics')}
                className={`text-xs font-sans font-bold transition-all flex items-center gap-1.5 px-3.5 py-1.5 rounded-full cursor-pointer active:scale-95 ${
                  subTab === 'metrics'
                    ? 'bg-negro text-blanco dark:bg-blanco dark:text-negro shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-negro/60 dark:text-arena/60'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-coral text-blanco flex items-center justify-center text-[10px] font-mono font-bold">
                  10
                </span>
                <span>Métricas de Ingresos</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('widgets')}
                className={`text-xs font-sans font-bold transition-all flex items-center gap-1.5 px-3.5 py-1.5 rounded-full cursor-pointer active:scale-95 ${
                  subTab === 'widgets'
                    ? 'bg-negro text-blanco dark:bg-blanco dark:text-negro shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-negro/60 dark:text-arena/60'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-turquesa text-negro flex items-center justify-center text-[10px] font-mono font-bold">
                  8
                </span>
                <span>Widgets Operativos</span>
              </button>
            </div>

            <span className="text-[10px] font-mono text-white bg-coral px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
              {timeFilter}
            </span>
          </div>

          {/* VISTA 1: MÉTRICAS DE INGRESOS (SUB-TAB: METRICS) */}
          {subTab === 'metrics' ? (
            <div className="flex flex-col gap-3 animate-in fade-in duration-200">
              {/* Row 1: Platillo Estrella + Meta de Ingresos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center -space-x-2">
                      <span className="w-7 h-7 rounded-full bg-coral/20 border-2 border-white dark:border-black flex items-center justify-center text-xs">
                        🦐
                      </span>
                      <span className="w-7 h-7 rounded-full bg-turquesa/20 border-2 border-white dark:border-black flex items-center justify-center text-xs">
                        🥑
                      </span>
                    </div>
                    <div className="p-1.5 bg-black/5 dark:bg-white/5 rounded-lg text-negro/60 dark:text-arena/60">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-sans font-black text-negro dark:text-blanco tracking-tight block">
                      ${(data.platilloTopIngresos > 0 ? data.platilloTopIngresos : 149).toLocaleString('es-MX')}
                    </span>
                    <p className="text-xs text-negro/60 dark:text-arena/60 font-medium truncate mt-0.5">
                      {data.platilloTop || 'Aguachile Negro'}
                    </p>
                    <span className="text-[10px] font-mono text-white bg-coral px-2 py-0.5 rounded-full font-bold mt-1 inline-block shadow-sm">
                      {data.platilloTopCantidad > 0 ? `${data.platilloTopCantidad} pedidos listos` : 'Más pedido'}
                    </span>
                  </div>
                </div>

                <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-semibold text-negro/60 dark:text-arena/60">Ingresos Brutos</span>
                    <div className="p-1.5 bg-black/5 dark:bg-white/5 rounded-lg text-negro/60 dark:text-arena/60">
                      <Activity className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-sans font-black text-negro dark:text-blanco tracking-tight">
                      ${(data.ventasMes > 0 ? data.ventasMes : 248900).toLocaleString('es-MX')}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-negro/50 dark:text-arena/50 mt-1">
                      <span>Meta</span>
                      <span className="font-mono font-bold text-white bg-[#16A34B] px-2 py-0.5 rounded-full shadow-sm">{data.metaProgresoPct}% alcanzado</span>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/10 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className="bg-[#16A34B] h-full rounded-full transition-all"
                        style={{ width: `${data.metaProgresoPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: KPIs de Desempeño */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-sans font-semibold text-negro/60 dark:text-arena/60">Ticket Promedio</span>
                  <span className="text-xl font-sans font-black text-negro dark:text-blanco mt-1">
                    ${data.ticketPromedio}
                  </span>
                  <span className="text-[10px] text-white bg-[#16A34B] px-2 py-0.5 rounded-full font-mono font-bold mt-1 inline-block shadow-sm">
                    +{data.pedidosEntregadosHoy} comandas hoy
                  </span>
                </div>

                <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-sans font-semibold text-negro/60 dark:text-arena/60">Efectividad General</span>
                  <span className="text-xl font-sans font-black text-[#16A34B] mt-1">
                    {data.tasaConversion}%
                  </span>
                  <span className="text-[10px] text-negro/60 dark:text-arena/60 font-medium mt-1">
                    {data.totalPedidosSemana} pedidos semanales
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* VISTA 2: WIDGETS OPERATIVOS (SUB-TAB: WIDGETS) */
            <div className="flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Dark Widget 1: Recordatorios / Hoy */}
                <div className="flex flex-col gap-1">
                  <div className="bg-[#0D0E10] text-blanco rounded-2xl p-4 flex flex-col justify-between shadow-md min-h-[120px]">
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 bg-white/10 rounded-lg">
                        <Bell className="w-3.5 h-3.5 text-coral" />
                      </div>
                      <Link
                        href="/admin/pedidos"
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                        title="Ver pedidos"
                      >
                        <Plus className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs font-sans font-bold text-white">Hoy</span>
                      <p className="text-[10px] text-white/50">{data.pedidosActivos} Comandas Activas</p>
                    </div>
                    {/* Días Clickeables */}
                    <div className="flex items-center gap-1 mt-2">
                      {diasCalendario.map((d, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedDayOffset(i - 4)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                            i - 4 === selectedDayOffset
                              ? 'bg-white text-black shadow-sm'
                              : 'text-white/40 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] font-sans text-negro/50 dark:text-arena/50 px-1 font-medium">
                    Recordatorios & Comandas
                  </span>
                </div>

                {/* Dark Widget 2: Automatizaciones / Tareas */}
                <div className="flex flex-col gap-1">
                  <div className="bg-[#0D0E10] text-blanco rounded-2xl p-4 flex flex-col justify-between shadow-md min-h-[120px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-white/90 font-mono">
                        <span className="w-2 h-2 rounded-full bg-turquesa animate-pulse" />
                        <span>{data.alertasInventario > 0 ? `${data.alertasInventario} Críticos` : 'Insumos: Óptimo'}</span>
                      </div>
                      <Link
                        href="/admin/inventario"
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                        title="Ir a inventario"
                      >
                        <Plus className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <div>
                        <span className="text-base font-sans font-black text-white">
                          {data.alertasInventario > 0 ? 'Resurtir' : '150/256'}
                        </span>
                        <p className="text-[10px] text-white/50">
                          {data.insumosCriticos[0] ? `Atención: ${data.insumosCriticos[0]}` : 'Inventario Óptimo'}
                        </p>
                      </div>
                      <Link
                        href="/admin/inventario"
                        className="bg-white text-black font-sans font-bold text-[10px] px-3 py-1 rounded-full hover:bg-white/90 transition-all shadow-sm"
                      >
                        Ver Todo
                      </Link>
                    </div>
                  </div>
                  <span className="text-[11px] font-sans text-negro/50 dark:text-arena/50 px-1 font-medium">
                    Automatizaciones & Stock
                  </span>
                </div>
              </div>

              {/* Quick Operation Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Link
                  href="/admin/pantalla"
                  className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl p-2 text-center flex flex-col items-center gap-1 transition-all"
                >
                  <Monitor className="w-3.5 h-3.5 text-turquesa" />
                  <span className="text-[10px] font-sans font-semibold text-negro dark:text-blanco">Cocina</span>
                </Link>
                <Link
                  href="/admin/mesas"
                  className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl p-2 text-center flex flex-col items-center gap-1 transition-all"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-coral" />
                  <span className="text-[10px] font-sans font-semibold text-negro dark:text-blanco">Mesas</span>
                </Link>
                <Link
                  href="/admin/caja"
                  className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl p-2 text-center flex flex-col items-center gap-1 transition-all"
                >
                  <DollarSign className="w-3.5 h-3.5 text-oro" />
                  <span className="text-[10px] font-sans font-semibold text-negro dark:text-blanco">Caja</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* CARD 4 & 5: MIDDLE KPIs & TOTAL TRANSACTIONS (4 COLS)     */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
          {/* Top Row: Conversion Rate & Average Order Value & Manage Customers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tasa de Conversión */}
            <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-3xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xl font-sans font-black text-negro dark:text-blanco">
                  {data.tasaConversion}%
                </span>
                <span className="text-[10px] font-mono font-bold text-white bg-[#16A34B] px-2 py-0.5 rounded-full shadow-sm">
                  +6%
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-[11px] font-sans text-negro/60 dark:text-arena/60 leading-tight">
                  Tasa de Conversión
                </span>
                <div className="p-1.5 bg-black/5 dark:bg-white/5 rounded-full text-negro/60 dark:text-arena/60">
                  <GitFork className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Ticket Promedio */}
            <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-3xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xl font-sans font-black text-negro dark:text-blanco">
                  ${data.ticketPromedio}
                </span>
                <span className="text-[10px] font-mono font-bold text-white bg-[#16A34B] px-2 py-0.5 rounded-full shadow-sm">
                  +4%
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-[11px] font-sans text-negro/60 dark:text-arena/60 leading-tight">
                  Ticket Promedio
                </span>
                <div className="p-1.5 bg-black/5 dark:bg-white/5 rounded-full text-negro/60 dark:text-arena/60">
                  <BarChart2 className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Administrar Clientes */}
            <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-3xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-bold text-negro/80 dark:text-arena/80 leading-tight">
                  Administrar Clientes
                </span>
                <SlidersHorizontal className="w-3 h-3 text-negro/40 dark:text-arena/40" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Link
                  href="/admin/clientes"
                  className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-negro dark:text-blanco transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Link>
                <div className="flex items-center -space-x-2">
                  <span className="w-7 h-7 rounded-full bg-coral/30 border-2 border-white dark:border-black flex items-center justify-center text-xs">
                    🧔🏻
                  </span>
                  <span className="w-7 h-7 rounded-full bg-turquesa/30 border-2 border-white dark:border-black flex items-center justify-center text-xs">
                    👩🏽
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transacciones Totales con Matriz de Puntos Exacta */}
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 shadow-sm flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-sans font-semibold text-negro/50 dark:text-arena/60">
                  Transacciones Totales
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-sans font-black text-negro dark:text-blanco tracking-tight">
                    {(data.totalComandasMes > 0 ? data.totalComandasMes : 15842).toLocaleString('es-MX')}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-white bg-[#16A34B] px-2.5 py-0.5 rounded-full shadow-sm">
                    +10%
                  </span>
                </div>
                <span className="text-xs text-negro/40 dark:text-arena/40 font-medium">Este mes</span>
              </div>

              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-negro dark:text-blanco">
                <span>Ajustes</span>
              </div>
            </div>

            {/* Matriz de Puntos Idéntica al Diseño Dribbble con Heatmap de Horas */}
            <div className="py-4 flex items-end justify-center gap-2">
              <div className="flex flex-col gap-1.5 items-center group/dot" title="12:00 PM - 2:00 PM: 18 pedidos">
                <span className="w-3 h-3 rounded-md bg-coral/60 transition-transform group-hover/dot:scale-125" />
                <span className="w-3 h-3 rounded-md bg-coral/80 transition-transform group-hover/dot:scale-125" />
              </div>
              <div className="flex flex-col gap-1.5 items-center group/dot" title="2:00 PM - 4:00 PM: 45 pedidos (Pico Comida 🔥)">
                <span className="w-3 h-3 rounded-md bg-coral transition-transform group-hover/dot:scale-125 shadow-sm shadow-coral/30" />
                <span className="w-3 h-3 rounded-md bg-coral transition-transform group-hover/dot:scale-125 shadow-sm shadow-coral/30" />
                <span className="w-3 h-3 rounded-md bg-coral transition-transform group-hover/dot:scale-125 shadow-sm shadow-coral/30" />
              </div>
              <div className="flex flex-col gap-1.5 items-center group/dot" title="4:00 PM - 6:00 PM: 32 pedidos">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-coral/80 transition-transform group-hover/dot:scale-125" />
                  <span className="w-3 h-3 rounded-md bg-coral/80 transition-transform group-hover/dot:scale-125" />
                </div>
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-coral/80 transition-transform group-hover/dot:scale-125" />
                  <span className="w-3 h-3 rounded-md bg-coral/80 transition-transform group-hover/dot:scale-125" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 items-center group/dot" title="6:00 PM - 8:00 PM: 58 pedidos (Pico Cena 🔥)">
                <span className="w-3 h-3 rounded-md bg-coral transition-transform group-hover/dot:scale-125 shadow-sm shadow-coral/30" />
                <span className="w-3 h-3 rounded-md bg-coral transition-transform group-hover/dot:scale-125 shadow-sm shadow-coral/30" />
                <span className="w-3 h-3 rounded-md bg-coral transition-transform group-hover/dot:scale-125 shadow-sm shadow-coral/30" />
              </div>
              <div className="flex flex-col gap-1.5 items-center group/dot" title="8:00 PM - 9:30 PM: 28 pedidos">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-coral/80 transition-transform group-hover/dot:scale-125" />
                  <span className="w-3 h-3 rounded-md bg-coral/80 transition-transform group-hover/dot:scale-125" />
                </div>
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-coral/80 transition-transform group-hover/dot:scale-125" />
                  <span className="w-3 h-3 rounded-md bg-coral/80 transition-transform group-hover/dot:scale-125" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 items-center group/dot" title="Cierre: 12 pedidos">
                <span className="w-3 h-3 rounded-md bg-coral/50 transition-transform group-hover/dot:scale-125" />
                <span className="w-3 h-3 rounded-md bg-coral/70 transition-transform group-hover/dot:scale-125" />
              </div>
              <div className="flex gap-1.5 items-center group/dot" title="WhatsApp Delivery">
                <span className="w-3 h-3 rounded-md bg-[#16A34B] transition-transform group-hover/dot:scale-125 shadow-sm" />
                <span className="w-3 h-3 rounded-md bg-[#16A34B] transition-transform group-hover/dot:scale-125 shadow-sm" />
              </div>
            </div>

            <p className="text-xs text-negro/50 dark:text-arena/60 font-normal leading-relaxed">
              El total de transacciones creció un 9% en comparación con el mes anterior.
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 6: ULTRA DARK 3D TEXTURED CARD (3 COLS)              */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 bg-[#0B0C0E] border border-white/10 rounded-[32px] p-6 sm:p-7 shadow-xl text-blanco flex flex-col justify-between relative overflow-hidden group">
          {/* 3D Vertical Pleated Curtain Texture Background */}
          <div className="absolute inset-0 pointer-events-none opacity-30 bg-[repeating-linear-gradient(90deg,_transparent,_transparent_20px,_rgba(255,255,255,0.03)_20px,_rgba(255,255,255,0.03)_40px)]" />
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-coral/40 via-transparent to-black" />

          {/* Top Title & Interactive Slide Selector */}
          <div className="flex items-center justify-between z-10">
            <div>
              <span className="text-sm font-sans font-bold text-white tracking-tight block">
                {retentionSlides[retentionSlide].title}
              </span>
              <span className="text-[10px] font-mono text-white/50 block">
                {retentionSlides[retentionSlide].badge}
              </span>
            </div>

            {/* Vertical 3 dots clickable pagination */}
            <div className="flex flex-col gap-1.5 items-center p-1 bg-white/5 rounded-full">
              {retentionSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRetentionSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    retentionSlide === idx
                      ? 'bg-white scale-125 shadow-sm'
                      : 'bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Ver métrica ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Giant Metric Display with Animation */}
          <div className="my-6 z-10 animate-in fade-in zoom-in-95 duration-200" key={retentionSlide}>
            <span className={`text-6xl sm:text-7xl font-sans font-black tracking-tight text-white block`}>
              {retentionSlides[retentionSlide].value}
            </span>
            <p className="text-xs text-white/60 font-sans font-normal mt-1">
              {retentionSlides[retentionSlide].subtext}
            </p>
          </div>

          {/* View All Pill Button */}
          <div className="z-10 flex items-center gap-2">
            <Link
              href="/admin/clientes"
              className="w-full bg-white text-negro hover:bg-turquesa hover:text-negro font-sans font-bold text-xs py-3 px-4 rounded-full transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
            >
              <span>Ver Clientes VIP</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
