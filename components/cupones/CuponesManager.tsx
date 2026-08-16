'use client'

import React, { useState } from 'react'
import { CuponData, saveCupon, toggleCuponActivo, deleteCupon, getMazatlanMidnightExpiration } from '@/lib/actions/cupones'
import { LuxuryCard } from '@/components/ui/LuxuryCard'
import { LealtadConfigManager } from '@/components/cupones/LealtadConfigManager'
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Power,
  PowerOff,
  Sparkles,
  Calendar,
  Percent,
  Hash,
  Loader2,
} from 'lucide-react'

interface CuponesManagerProps {
  initialCupones: CuponData[]
}

export function CuponesManager({ initialCupones }: CuponesManagerProps) {
  const [cupones, setCupones] = useState<CuponData[]>(initialCupones)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCupon, setEditingCupon] = useState<CuponData | null>(null)
  const [saving, setSaving] = useState(false)

  // Form State
  const [codigo, setCodigo] = useState('')
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(10)
  const [usosMaximos, setUsosMaximos] = useState<string>('')
  const [fechaExpiracion, setFechaExpiracion] = useState<string>('')
  const [activo, setActivo] = useState(true)

  const openCreateModal = () => {
    setEditingCupon(null)
    setCodigo('')
    setDescuentoPorcentaje(10)
    setUsosMaximos('')
    setFechaExpiracion('')
    setActivo(true)
    setIsModalOpen(true)
  }

  const openEditModal = (cupon: CuponData) => {
    setEditingCupon(cupon)
    setCodigo(cupon.codigo)
    setDescuentoPorcentaje(cupon.descuento_porcentaje)
    setUsosMaximos(cupon.usos_maximos !== null && cupon.usos_maximos !== undefined ? String(cupon.usos_maximos) : '')
    setFechaExpiracion(cupon.fecha_expiracion ? cupon.fecha_expiracion.slice(0, 10) : '')
    setActivo(cupon.activo !== undefined ? cupon.activo : true)
    setIsModalOpen(true)
  }

  const handleToggle = async (id: number, currentActivo: boolean) => {
    setCupones((prev) =>
      prev.map((c) => (c.id === id ? { ...c, activo: !currentActivo } : c))
    )
    try {
      await toggleCuponActivo(id, currentActivo)
    } catch (err) {
      console.error('Error toggling cupon:', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este cupón de descuento?')) return
    setCupones((prev) => prev.filter((c) => c.id !== id))
    try {
      await deleteCupon(id)
    } catch (err) {
      console.error('Error deleting cupon:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigo.trim()) return

    setSaving(true)
    try {
      // Calcular fecha de expiración fijada a medianoche 11:59:59 PM Horario Mazatlán
      const formattedExp = fechaExpiracion
        ? await getMazatlanMidnightExpiration(fechaExpiracion)
        : null

      await saveCupon({
        id: editingCupon?.id,
        codigo,
        descuento_porcentaje: Number(descuentoPorcentaje),
        usos_maximos: usosMaximos ? Number(usosMaximos) : null,
        fecha_expiracion: formattedExp,
        activo,
      })

      // Actualizar estado local
      const updatedList: CuponData[] = editingCupon
        ? cupones.map((c) =>
          c.id === editingCupon.id
            ? {
              ...c,
              codigo: codigo.toUpperCase(),
              descuento_porcentaje: Number(descuentoPorcentaje),
              usos_maximos: usosMaximos ? Number(usosMaximos) : null,
              fecha_expiracion: formattedExp,
              activo,
            }
            : c
        )
        : [
          {
            id: Date.now(),
            codigo: codigo.toUpperCase(),
            descuento_porcentaje: Number(descuentoPorcentaje),
            usos_maximos: usosMaximos ? Number(usosMaximos) : null,
            usos_actuales: 0,
            fecha_expiracion: formattedExp,
            activo,
          },
          ...cupones,
        ]

      setCupones(updatedList)
      setIsModalOpen(false)
    } catch (err: any) {
      alert(err.message || 'Error al guardar el cupón')
    } finally {
      setSaving(false)
    }
  }

  // KPIs
  const totalCupones = cupones.length
  const cuponesActivos = cupones.filter((c) => c.activo).length
  const totalCanjes = cupones.reduce((sum, c) => sum + (c.usos_actuales || 0), 0)

  const getStatusBadge = (cupon: CuponData) => {
    if (!cupon.activo) {
      return { label: 'INACTIVO', class: 'bg-arena/20 text-negro/80 dark:text-arena border-arena/30' }
    }
    if (cupon.fecha_expiracion && new Date() > new Date(cupon.fecha_expiracion)) {
      return { label: 'VENCIDO', class: 'bg-coral/15 text-coral border-coral/30' }
    }
    if (cupon.usos_maximos !== null && cupon.usos_maximos !== undefined && (cupon.usos_actuales || 0) >= cupon.usos_maximos) {
      return { label: 'AGOTADO', class: 'bg-oro/15 text-oro border-oro/30' }
    }
    return { label: 'ACTIVO', class: 'bg-turquesa/15 text-turquesa border-turquesa/30 font-bold' }
  }

  return (
    <div className="flex flex-col gap-8 text-negro dark:text-blanco transition-colors">
      {/* HEADER Y KPIS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-turquesa" />
            <span>MÓDULO DE PROMOCIONES</span>
          </span>
          <h1 className="font-display text-4xl text-negro dark:text-blanco tracking-wider">
            GESTIÓN DE CUPONES DE DESCUENTO
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-turquesa text-negro font-sans font-bold text-xs tracking-wider px-6 py-3.5 rounded-full hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(42,191,191,0.3)] self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>CREAR NUEVO CUPÓN</span>
        </button>
      </div>

      {/* KPIS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <LuxuryCard
          title="TOTAL DE CUPONES"
          value={totalCupones.toString()}
          subtitle="Cupones registrados en catálogo"
        />
        <LuxuryCard
          title="CUPONES ACTIVOS"
          value={cuponesActivos.toString()}
          subtitle="Listos para canjear en /pedir"
        />
        <LuxuryCard
          title="TOTAL DE CANJES"
          value={totalCanjes.toString()}
          subtitle="Redeems acumulados de clientes"
        />
      </div>

      {/* LISTADO DE CUPONES */}
      <div className="flex flex-col gap-4">
        <h3 className="font-display text-2xl text-coral tracking-wider border-b border-arena/20 dark:border-arena/10 pb-2">
          CATÁLOGO DE CUPONES VIGENTES
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cupones.map((cupon) => {
            const status = getStatusBadge(cupon)

            return (
              <div
                key={cupon.id}
                className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-oro/20 rounded-2xl p-6 flex flex-col justify-between gold-border-corner shadow-xl gap-4 hover:border-turquesa transition-all transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-sans font-bold uppercase px-2.5 py-0.5 rounded-full border ${status.class}`}>
                      {status.label}
                    </span>
                    <span className="font-display text-3xl text-coral">
                      {cupon.descuento_porcentaje}% OFF
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-sans text-negro/60 dark:text-arena/60 uppercase">Código del Cupón:</span>
                    <h4 className="font-mono font-bold text-2xl text-turquesa tracking-wider">
                      {cupon.codigo}
                    </h4>
                  </div>

                  {/* Canjes y Expiración en Horario Mazatlán */}
                  <div className="flex flex-col gap-1.5 mt-4 pt-3 border-t border-arena/20 dark:border-arena/10 text-xs font-sans text-negro/80 dark:text-arena/80">
                    <div className="flex justify-between items-center">
                      <span>Usos Realizados:</span>
                      <span className="font-bold text-negro dark:text-blanco">
                        {cupon.usos_actuales || 0} / {cupon.usos_maximos !== null && cupon.usos_maximos !== undefined ? `${cupon.usos_maximos} canjes` : '∞ Ilimitado'}
                      </span>
                    </div>

                    {/* Barra de progreso de canjes */}
                    {cupon.usos_maximos !== null && cupon.usos_maximos !== undefined && (
                      <div className="w-full h-1.5 bg-[#F4F0E8] dark:bg-carbon rounded-full overflow-hidden border border-arena/20 dark:border-arena/10">
                        <div
                          className="h-full bg-turquesa transition-all duration-300"
                          style={{
                            width: `${Math.min(100, ((cupon.usos_actuales || 0) / cupon.usos_maximos) * 100)}%`,
                          }}
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-1">
                      <span>Vencimiento:</span>
                      <span className="font-bold text-[#8C6D1F] dark:text-oro">
                        {cupon.fecha_expiracion
                          ? `${new Date(cupon.fecha_expiracion).toLocaleDateString('es-MX', {
                            timeZone: 'America/Mazatlan',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })} (11:59 PM)`
                          : 'Sin expiración'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex items-center justify-between pt-3 border-t border-arena/20 dark:border-arena/10">
                  <button
                    onClick={() => cupon.id && handleToggle(cupon.id, cupon.activo !== false)}
                    className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold border transition-all flex items-center gap-1.5 ${cupon.activo !== false
                        ? 'bg-turquesa/15 border-turquesa/40 text-turquesa hover:bg-turquesa hover:text-negro'
                        : 'bg-coral/15 border-coral/40 text-coral hover:bg-coral hover:text-blanco'
                      }`}
                  >
                    {cupon.activo !== false ? (
                      <>
                        <Power className="w-3.5 h-3.5" />
                        <span>Activo</span>
                      </>
                    ) : (
                      <>
                        <PowerOff className="w-3.5 h-3.5" />
                        <span>Pausado</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(cupon)}
                      className="p-2 text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco hover:bg-[#F4F0E8] dark:hover:bg-carbon rounded-lg transition-colors"
                      title="Editar cupón"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => cupon.id && handleDelete(cupon.id)}
                      className="p-2 text-coral/70 hover:text-coral hover:bg-coral/10 rounded-lg transition-colors"
                      title="Eliminar cupón"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECCIÓN CONFIGURACIÓN PLAN DE LEALTAD Y RECOMPENSAS ADMIN */}
      <LealtadConfigManager />

      {/* MODAL CREAR / EDITAR CUPÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-oro/30 rounded-2xl w-full max-w-lg p-6 gold-border-corner shadow-2xl relative text-negro dark:text-blanco transition-colors">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-arena/20 dark:hover:bg-carbon"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-xs font-sans font-bold tracking-widest text-turquesa uppercase">
                {editingCupon ? 'EDITAR CUPÓN' : 'CREAR NUEVO CUPÓN'}
              </span>
              <h3 className="font-display text-3xl text-negro dark:text-blanco">
                {editingCupon ? `CUPÓN: ${editingCupon.codigo}` : 'NUEVO CUPÓN DE DESCUENTO'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Código */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-turquesa" />
                  <span>Código del Cupón *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. VERANO20 o SINALOA15"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-base text-negro dark:text-blanco font-mono uppercase focus:border-turquesa focus:outline-none"
                />
              </div>

              {/* Porcentaje de Descuento (0 al 100%) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-turquesa" />
                    <span>Porcentaje de Descuento (0% al 100%) *</span>
                  </label>
                  <span className="font-display text-2xl text-coral">{descuentoPorcentaje}% OFF</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={descuentoPorcentaje}
                  onChange={(e) => setDescuentoPorcentaje(Number(e.target.value))}
                  className="w-full accent-coral cursor-pointer"
                />
              </div>

              {/* Límite de Canjes (Redeems) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-turquesa" />
                  <span>Límite de Canjes Máximos (Dejar en blanco para ilimitado)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej. 50 (Opcional)"
                  value={usosMaximos}
                  onChange={(e) => setUsosMaximos(e.target.value)}
                  className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
                />
              </div>

              {/* Fecha de Expiración (Horario Mazatlán Medianoche 11:59 PM) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-turquesa" />
                  <span>Fecha de Expiración (Medianoche 11:59 PM Mazatlán)</span>
                </label>
                <input
                  type="date"
                  value={fechaExpiracion}
                  onChange={(e) => setFechaExpiracion(e.target.value)}
                  className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:border-turquesa focus:outline-none cursor-pointer"
                />
                <span className="text-[11px] font-sans text-negro/60 dark:text-arena/60">
                  El cupón se desactivará automáticamente a las 11:59:59 PM (Horario Mazatlán) de la fecha elegida.
                </span>
              </div>

              {/* Status Activo */}
              <div className="flex justify-between items-center bg-[#F4F0E8] dark:bg-carbon p-3 rounded-xl border border-arena/30 dark:border-arena/20 mt-1">
                <span className="text-xs font-sans font-bold">Estado Activo:</span>
                <button
                  type="button"
                  onClick={() => setActivo(!activo)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activo ? 'bg-turquesa text-negro' : 'bg-coral text-blanco'
                    }`}
                >
                  {activo ? 'ACTIVADO' : 'PAUSADO'}
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 text-negro dark:text-blanco font-sans font-bold text-xs rounded-xl hover:bg-arena/20 dark:hover:bg-arena/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-turquesa text-negro font-sans font-bold text-xs tracking-wider rounded-xl hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>GUARDANDO...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>GUARDAR CUPÓN</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
