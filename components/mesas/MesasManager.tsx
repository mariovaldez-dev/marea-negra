'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Mesa, Platillo } from '@/lib/types/database'
import { MesasFloorPlan } from '@/components/mesas/MesasFloorPlan'
import { getMesasConPedidos } from '@/lib/actions/mesas'
import { StaffSelectorPill } from '@/components/admin/StaffSelectorPill'
import {
  LayoutGrid,
  Plus,
  Move,
  CheckCircle2,
  Users,
  Utensils,
  Percent,
  DollarSign,
  QrCode,
  Printer,
  Sparkles,
  MapPin,
} from 'lucide-react'

const MesaComandaModal = dynamic(
  () => import('@/components/mesas/MesaComandaModal').then((mod) => mod.MesaComandaModal),
  { ssr: false }
)
const MesaQrModal = dynamic(
  () => import('@/components/mesas/MesaQrModal').then((mod) => mod.MesaQrModal),
  { ssr: false }
)
const MesasPrintAllQrModal = dynamic(
  () => import('@/components/mesas/MesasPrintAllQrModal').then((mod) => mod.MesasPrintAllQrModal),
  { ssr: false }
)
const MesaEditorModal = dynamic(
  () => import('@/components/mesas/MesaEditorModal').then((mod) => mod.MesaEditorModal),
  { ssr: false }
)

interface MesasManagerProps {
  initialMesas: Mesa[]
  platillos: Platillo[]
}

export function MesasManager({ initialMesas, platillos }: MesasManagerProps) {
  const [mesas, setMesas] = useState<Mesa[]>(initialMesas)
  const [viewMode, setViewMode] = useState<'plano' | 'tarjetas'>('plano')
  const [isEditMode, setIsEditMode] = useState(false)

  // Modales
  const [selectedMesaForComanda, setSelectedMesaForComanda] = useState<Mesa | null>(null)
  const [selectedMesaForQr, setSelectedMesaForQr] = useState<Mesa | null>(null)
  const [selectedMesaForConfig, setSelectedMesaForConfig] = useState<Mesa | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPrintAllQrModal, setShowPrintAllQrModal] = useState(false)

  const refreshMesas = async () => {
    try {
      const data = await getMesasConPedidos()
      setMesas(data)
    } catch (err) {
      console.error('Error al refrescar mesas:', err)
    }
  }

  // KPIs
  const totalMesas = mesas.length
  const mesasOcupadas = mesas.filter((m) => m.estado !== 'libre').length
  const mesasLibres = totalMesas - mesasOcupadas
  const porcentajeOcupacion = totalMesas > 0 ? (mesasOcupadas / totalMesas) * 100 : 0
  const totalEnConsumo = mesas
    .filter((m) => m.estado !== 'libre')
    .reduce((acc, m) => acc + Number(m.pedido_activo?.total || 0), 0)
  const capacidadTotal = mesas.reduce((acc, m) => acc + m.capacidad, 0)

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300 pb-12">
      {/* ========================================================= */}
      {/* 1. TOP FLOATING NAVIGATION & GREETING                     */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#16A34B] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-negro/50 dark:text-arena/60 uppercase">
              Control de Salón & Comedor · Sinaloa
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-negro dark:text-blanco uppercase">
            Mapa de Mesas & Salón
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <StaffSelectorPill allowedRoles={['admin', 'mesero', 'cajero']} defaultRoleLabel="Mesero" />

          <button
            type="button"
            onClick={() => setShowPrintAllQrModal(true)}
            className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-negro dark:text-blanco font-sans font-bold text-xs px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-oro" />
            <span>Imprimir QRs</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`font-sans font-bold text-xs px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer ${
              isEditMode
                ? 'bg-[#ECC94B] text-[#3A2D00]'
                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-negro dark:text-blanco'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Terminar Acomodo' : 'Acomodar Plano'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bg-coral hover:bg-coral/90 text-white font-sans font-bold text-xs tracking-wide px-4 py-2.5 rounded-full shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Mesa</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BENTO KPIS DE SALÓN (4 COLS)                           */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Mesas Totales */}
        <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-negro/50 dark:text-arena/60 uppercase tracking-wider">
              Capacidad Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-turquesa/10 text-turquesa flex items-center justify-center">
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-sans font-black text-negro dark:text-blanco tracking-tight block">
              {totalMesas}
            </span>
            <span className="text-xs text-negro/50 dark:text-arena/50 font-medium">
              Espacio para ~{capacidadTotal} comensales
            </span>
          </div>
        </div>

        {/* KPI 2: Servicio en Vivo */}
        <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-negro/50 dark:text-arena/60 uppercase tracking-wider">
              Servicio en Vivo
            </span>
            <span className="text-[10px] font-mono font-bold bg-[#16A34B] text-white px-2.5 py-0.5 rounded-full shadow-sm">
              {mesasLibres} libres
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-sans font-black text-negro dark:text-blanco tracking-tight">
                {mesasOcupadas}
              </span>
              <span className="text-sm font-sans font-bold text-negro/40 dark:text-arena/40">
                / {totalMesas} ocupadas
              </span>
            </div>
            <span className="text-xs text-coral font-sans font-bold">
              {mesasOcupadas > 0 ? 'Comandas en salón' : 'Salón listo para comensales'}
            </span>
          </div>
        </div>

        {/* KPI 3: Tasa de Ocupación */}
        <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-negro/50 dark:text-arena/60 uppercase tracking-wider">
              Ocupación
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#ECC94B]/20 text-[#8B6E00] dark:text-[#ECC94B] flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-sans font-black text-negro dark:text-blanco tracking-tight block">
              {porcentajeOcupacion.toFixed(0)}%
            </span>
            <div className="w-full bg-black/5 dark:bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-[#16A34B] h-full rounded-full transition-all"
                style={{ width: `${Math.max(4, porcentajeOcupacion)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 4: Ventas en Salón */}
        <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-negro/50 dark:text-arena/60 uppercase tracking-wider">
              Ventas en Salón
            </span>
            <div className="w-8 h-8 rounded-xl bg-coral/10 text-coral flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-sans font-black text-negro dark:text-blanco tracking-tight block">
              ${totalEnConsumo.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-negro/50 dark:text-arena/50 font-medium">
              Cuentas abiertas en mesas
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SELECTOR DE VISTA: PLANO INTERACTIVO vs TARJETAS       */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/5 dark:border-white/5 self-start">
          <button
            type="button"
            onClick={() => setViewMode('plano')}
            className={`px-4 py-2 rounded-full text-xs font-sans font-bold transition-all active:scale-95 cursor-pointer ${
              viewMode === 'plano'
                ? 'bg-white dark:bg-[#222222] text-negro dark:text-blanco shadow-sm'
                : 'text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco'
            }`}
          >
            🗺️ Plano Interactivo
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tarjetas')}
            className={`px-4 py-2 rounded-full text-xs font-sans font-bold transition-all active:scale-95 cursor-pointer ${
              viewMode === 'tarjetas'
                ? 'bg-white dark:bg-[#222222] text-negro dark:text-blanco shadow-sm'
                : 'text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco'
            }`}
          >
            📋 Vista en Tarjetas
          </button>
        </div>

        <span className="text-xs font-sans text-negro/50 dark:text-arena/50">
          Haz clic en cualquier mesa para abrir su comanda, agregar rondas o cobrar.
        </span>
      </div>

      {/* ========================================================= */}
      {/* 4. VISTA 1: PLANO INTERACTIVO CON DRAG & DROP             */}
      {/* ========================================================= */}
      {viewMode === 'plano' && (
        <MesasFloorPlan
          mesas={mesas}
          isEditMode={isEditMode}
          onSelectMesa={(mesa) => setSelectedMesaForComanda(mesa)}
          onOpenQr={(mesa) => setSelectedMesaForQr(mesa)}
          onEditConfig={(mesa) => setSelectedMesaForConfig(mesa)}
          onLayoutSaved={refreshMesas}
        />
      )}

      {/* ========================================================= */}
      {/* 5. VISTA 2: CUADRÍCULA BENTO DE TARJETAS                  */}
      {/* ========================================================= */}
      {viewMode === 'tarjetas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mesas.map((mesa) => {
            const isFree = mesa.estado === 'libre'
            const isPendingBill = mesa.estado === 'cuenta_pedida'
            const totalMesa = Number(mesa.pedido_activo?.total || 0)

            return (
              <div
                key={mesa.id}
                onClick={() => setSelectedMesaForComanda(mesa)}
                className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-5 flex flex-col justify-between gap-4 cursor-pointer hover:shadow-md transition-all shadow-sm active:scale-[0.99] group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <h3 className="font-sans font-black text-xl text-negro dark:text-blanco group-hover:text-coral transition-colors">
                      {mesa.nombre}
                    </h3>
                    <span className="text-[11px] font-mono text-negro/50 dark:text-arena/50 mt-0.5">
                      {mesa.capacidad} personas · {mesa.forma}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase shadow-sm ${
                      isFree
                        ? 'bg-[#16A34B] text-white'
                        : isPendingBill
                        ? 'bg-[#ECC94B] text-[#3A2D00]'
                        : 'bg-coral text-white'
                    }`}
                  >
                    {isFree ? 'Libre' : isPendingBill ? 'Cuenta' : 'Ocupada'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold text-negro/40 dark:text-arena/40 uppercase">
                      Cuenta:
                    </span>
                    <span className="font-sans font-black text-lg text-negro dark:text-blanco">
                      ${totalMesa.toFixed(0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedMesaForQr(mesa)
                      }}
                      className="p-2 text-negro/60 dark:text-arena/60 hover:text-turquesa rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      title="Ver QR de la mesa"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedMesaForConfig(mesa)
                      }}
                      className="p-2 text-negro/60 dark:text-arena/60 hover:text-oro rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      title="Editar configuración"
                    >
                      <Move className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODALES                                                */}
      {/* ========================================================= */}
      {selectedMesaForComanda && (
        <MesaComandaModal
          mesa={selectedMesaForComanda}
          platillos={platillos}
          onClose={() => setSelectedMesaForComanda(null)}
          onMesaUpdated={refreshMesas}
        />
      )}

      {selectedMesaForQr && (
        <MesaQrModal
          mesa={selectedMesaForQr}
          onClose={() => setSelectedMesaForQr(null)}
        />
      )}

      {(selectedMesaForConfig || showCreateModal) && (
        <MesaEditorModal
          mesa={selectedMesaForConfig}
          onClose={() => {
            setSelectedMesaForConfig(null)
            setShowCreateModal(false)
          }}
          onSaved={() => {
            refreshMesas()
          }}
          onDeleted={() => {
            refreshMesas()
          }}
        />
      )}

      {showPrintAllQrModal && (
        <MesasPrintAllQrModal
          mesas={mesas}
          onClose={() => setShowPrintAllQrModal(false)}
        />
      )}
    </div>
  )
}
