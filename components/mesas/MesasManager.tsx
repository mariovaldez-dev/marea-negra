'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Mesa, Platillo } from '@/lib/types/database'
import { LuxuryCard } from '@/components/ui/LuxuryCard'
import { MesasFloorPlan } from '@/components/mesas/MesasFloorPlan'
import { getMesasConPedidos } from '@/lib/actions/mesas'

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
  Sparkles,
  Printer,
} from 'lucide-react'

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
  const porcentajeOcupacion = totalMesas > 0 ? (mesasOcupadas / totalMesas) * 100 : 0
  const totalEnConsumo = mesas
    .filter((m) => m.estado !== 'libre')
    .reduce((acc, m) => acc + Number(m.pedido_activo?.total || 0), 0)

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/20 dark:border-arena/10 pb-4">
        <div>
          <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase">
            CONTROL DE SALÓN & COMANDAS
          </span>
          <h1 className="font-display text-4xl text-negro dark:text-blanco tracking-wide">
            MAPA DE MESAS & RESTAURANTE
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPrintAllQrModal(true)}
            className="bg-oro text-negro hover:bg-blanco font-sans font-bold text-xs px-5 py-3 rounded-full transition-all flex items-center gap-2 border border-oro/40 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>📄 IMPRIMIR QR DE MESAS</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`font-sans font-bold text-xs px-5 py-3 rounded-full transition-all flex items-center gap-2 border ${
              isEditMode
                ? 'bg-oro text-negro border-oro shadow-[0_0_20px_rgba(201,168,76,0.4)]'
                : 'bg-white text-negro border-arena/30 dark:bg-carbon dark:text-arena dark:border-arena/20 hover:border-oro'
            }`}
          >
            <Move className="w-4 h-4" />
            <span>{isEditMode ? 'TERMINAR DE ACOMODAR' : '✏️ ACOMODAR PLANO'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bg-coral text-blanco hover:bg-coral/80 font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-full shadow-[0_0_20px_rgba(232,67,10,0.3)] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>NUEVA MESA</span>
          </button>
        </div>
      </div>

      {/* LUXURY CARDS (PATRÓN 4) PARA KPIS DE SALÓN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <LuxuryCard
          eyebrow="CAPACIDAD TOTAL"
          title="Mesas Activas"
          value={totalMesas}
          subtitle={`Espacio para ~${mesas.reduce((acc, m) => acc + m.capacidad, 0)} comensales`}
          icon={<LayoutGrid className="w-5 h-5 text-oro" />}
        />

        <LuxuryCard
          eyebrow="SERVICIO EN VIVO"
          title="Mesas Ocupadas"
          value={`${mesasOcupadas} / ${totalMesas}`}
          subtitle={`${mesas.filter((m) => m.estado === 'libre').length} mesas libres disponibles`}
          icon={<Utensils className="w-5 h-5 text-oro" />}
        />

        <LuxuryCard
          eyebrow="OCUPACIÓN"
          title="Tasa de Ocupación"
          value={`${porcentajeOcupacion.toFixed(0)}%`}
          subtitle="Capacidad de salón en uso"
          icon={<Percent className="w-5 h-5 text-oro" />}
        />

        <LuxuryCard
          eyebrow="VENTAS EN SALÓN"
          title="Consumo Activo"
          value={`$${totalEnConsumo.toFixed(0)}`}
          subtitle="Cuentas abiertas en mesas"
          icon={<DollarSign className="w-5 h-5 text-oro" />}
        />
      </div>

      {/* SELECTOR DE VISTA: PLANO INTERACTIVO vs TARJETAS */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-carbon p-1 rounded-xl border border-arena/20">
          <button
            type="button"
            onClick={() => setViewMode('plano')}
            className={`px-4 py-2 rounded-lg text-xs font-sans font-bold transition-all ${
              viewMode === 'plano'
                ? 'bg-turquesa text-negro shadow-md'
                : 'text-arena/70 hover:text-blanco'
            }`}
          >
            🗺️ PLANO DECORATIVO INTERACTIVO
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tarjetas')}
            className={`px-4 py-2 rounded-lg text-xs font-sans font-bold transition-all ${
              viewMode === 'tarjetas'
                ? 'bg-turquesa text-negro shadow-md'
                : 'text-arena/70 hover:text-blanco'
            }`}
          >
            📋 VISTA EN TARJETAS
          </button>
        </div>

        <span className="text-xs font-serif italic text-arena/60 hidden md:block">
          Haz clic en cualquier mesa para abrir su comanda, agregar rondas o cobrar.
        </span>
      </div>

      {/* VISTA 1: PLANO INTERACTIVO CON DRAG & DROP */}
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

      {/* VISTA 2: LISTA / CUADRÍCULA DE TARJETAS */}
      {viewMode === 'tarjetas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mesas.map((mesa) => {
            const isFree = mesa.estado === 'libre'
            const totalMesa = Number(mesa.pedido_activo?.total || 0)

            return (
              <div
                key={mesa.id}
                onClick={() => setSelectedMesaForComanda(mesa)}
                className={`bg-white dark:bg-[#050404] bg-dots-pattern border-2 rounded-2xl p-5 flex flex-col justify-between gap-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg gold-border-corner ${
                  isFree
                    ? 'border-emerald-500/30 hover:border-emerald-400'
                    : mesa.estado === 'ocupada'
                    ? 'border-coral shadow-[0_0_15px_rgba(232,67,10,0.25)]'
                    : 'border-oro shadow-[0_0_15px_rgba(201,168,76,0.3)] animate-pulse'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-display text-2xl text-negro dark:text-blanco">
                      {mesa.nombre}
                    </span>
                    <span className="text-[11px] font-sans text-negro/60 dark:text-arena/60">
                      Capacidad: {mesa.capacidad} personas · Forma: {mesa.forma}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded-full uppercase border ${
                      isFree
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30'
                        : mesa.estado === 'ocupada'
                        ? 'bg-coral/15 text-coral border-coral/30'
                        : 'bg-oro/20 text-oro border-oro/30'
                    }`}
                  >
                    {isFree ? '🟢 LIBRE' : mesa.estado === 'ocupada' ? '🔴 COMIENDO' : '🟡 CUENTA'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-arena/20 dark:border-arena/10">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-negro/50 dark:text-arena/50 uppercase font-bold">Cuenta:</span>
                    <span className="font-display text-xl text-coral font-bold">
                      ${totalMesa.toFixed(0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedMesaForQr(mesa)
                      }}
                      className="p-2 text-negro/60 dark:text-arena/60 hover:text-turquesa rounded-lg bg-[#F4F0E8] dark:bg-carbon border border-arena/20"
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
                      className="p-2 text-negro/60 dark:text-arena/60 hover:text-oro rounded-lg bg-[#F4F0E8] dark:bg-carbon border border-arena/20"
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

      {/* MODALES */}
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
