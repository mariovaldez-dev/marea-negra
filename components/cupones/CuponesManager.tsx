'use client'

import React, { useState, useMemo } from 'react'
import { CuponData, saveCupon, toggleCuponActivo, deleteCupon, getMazatlanMidnightExpiration } from '@/lib/actions/cupones'
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
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Tag,
} from 'lucide-react'

interface CuponesManagerProps {
  initialCupones: CuponData[]
}

const ITEMS_PER_PAGE = 10

export function CuponesManager({ initialCupones }: CuponesManagerProps) {
  const [cupones, setCupones] = useState<CuponData[]>(initialCupones)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCupon, setEditingCupon] = useState<CuponData | null>(null)
  const [saving, setSaving] = useState(false)

  // Form State
  const [codigo, setCodigo] = useState('')
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(10)
  const [usosMaximos, setUsosMaximos] = useState<string>('')
  const [fechaExpiracion, setFechaExpiracion] = useState<string>('')
  const [activo, setActivo] = useState(true)

  // Filtrado
  const filteredCupones = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return cupones.filter((c) => {
      return (
        c.codigo.toLowerCase().includes(term) ||
        String(c.descuento_porcentaje).includes(term)
      )
    })
  }, [cupones, searchTerm])

  // Paginación de 10 en 10
  const totalPages = Math.max(1, Math.ceil(filteredCupones.length / ITEMS_PER_PAGE))
  const paginatedCupones = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredCupones.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredCupones, currentPage])

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
      return { label: 'INACTIVO', class: 'bg-black/10 dark:bg-white/10 text-negro/60 dark:text-arena/60' }
    }
    if (cupon.fecha_expiracion && new Date() > new Date(cupon.fecha_expiracion)) {
      return { label: 'VENCIDO', class: 'bg-coral text-white' }
    }
    if (cupon.usos_maximos !== null && cupon.usos_maximos !== undefined && (cupon.usos_actuales || 0) >= cupon.usos_maximos) {
      return { label: 'AGOTADO', class: 'bg-[#C9A84C] text-black' }
    }
    return { label: 'ACTIVO', class: 'bg-[#16A34B] text-white' }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 text-negro dark:text-blanco transition-colors">
      {/* 1. HEADER BENTO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-sans uppercase tracking-wider font-bold bg-[#2ABFBF] text-black px-2.5 py-0.5 rounded-full">
              Promociones & Descuentos
            </span>
            <span className="text-xs text-negro/60 dark:text-arena/60 font-sans font-medium">
              Campañas & Cupones
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco tracking-wide">
            GESTIÓN DE CUPONES DE DESCUENTO
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#2ABFBF] text-black hover:bg-[#2ABFBF]/90 font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-2xl transition-all flex items-center gap-2 shadow-md self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>CREAR NUEVO CUPÓN</span>
        </button>
      </div>

      {/* 2. KPIS BENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-negro/50 dark:text-arena/50">
              Total de Cupones
            </span>
            <div className="p-2 rounded-xl bg-black/5 dark:bg-white/10 text-negro dark:text-blanco">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-negro dark:text-blanco">
              {totalCupones}
            </div>
            <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
              Cupones en catálogo
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#16A34B]">
              Cupones Activos
            </span>
            <div className="p-2 rounded-xl bg-[#16A34B]/10 text-[#16A34B]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-[#16A34B]">
              {cuponesActivos}
            </div>
            <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
              Listos para canjear en /pedir
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-coral">
              Total de Canjes
            </span>
            <div className="p-2 rounded-xl bg-coral/10 text-coral">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-coral">
              {totalCanjes}
            </div>
            <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
              Redeems acumulados
            </div>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE BÚSQUEDA */}
      <div className="relative w-full">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-negro/40 dark:text-arena/40" />
        <input
          type="text"
          placeholder="Buscar cupón por código o porcentaje..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-negro dark:text-blanco w-full focus:border-[#2ABFBF] focus:outline-none shadow-sm font-sans font-medium"
        />
      </div>

      {/* 4. TABLA DE LISTA DE CUPONES CON PAGINACIÓN DE 10 EN 10 */}
      <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-black/[0.08] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-negro dark:text-blanco font-bold">
              Catálogo de Cupones
            </h2>
            <span className="text-xs text-negro/60 dark:text-arena/60 font-sans font-medium">
              Listado de códigos promocionales con seguimiento de canjes y límites
            </span>
          </div>
          <span className="text-xs text-negro/50 dark:text-arena/50 font-sans font-semibold">
            {filteredCupones.length} cupón{filteredCupones.length === 1 ? '' : 'es'} registrado{filteredCupones.length === 1 ? '' : 's'}
          </span>
        </div>

        {filteredCupones.length > 0 ? (
          <>
            {/* VISTA ESCRITORIO & TABLETS (TABLA) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.08] dark:border-white/[0.08]">
                  <tr>
                    <th className="py-3.5 px-4 font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60">
                      Código & Descuento
                    </th>
                    <th className="py-3.5 px-4 font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60">
                      Descuento
                    </th>
                    <th className="py-3.5 px-4 font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60">
                      Canjes Realizados
                    </th>
                    <th className="py-3.5 px-4 font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60">
                      Expiración (Mazatlán)
                    </th>
                    <th className="py-3.5 px-4 font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60 text-center">
                      Estado
                    </th>
                    <th className="py-3.5 px-4 font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {paginatedCupones.map((cupon) => {
                    const status = getStatusBadge(cupon)
                    const isIlimitado = cupon.usos_maximos === null || cupon.usos_maximos === undefined
                    const pctUsado = isIlimitado ? 0 : Math.min(100, ((cupon.usos_actuales || 0) / Number(cupon.usos_maximos)) * 100)

                    return (
                      <tr
                        key={cupon.id}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Código */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#2ABFBF]/10 text-[#2ABFBF] flex items-center justify-center font-bold shrink-0">
                              <Tag className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-mono font-bold text-sm text-[#2ABFBF] tracking-wider truncate">
                                {cupon.codigo}
                              </span>
                              <span className="text-[11px] text-negro/50 dark:text-arena/50">
                                Cupón de descuento
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Descuento */}
                        <td className="py-3.5 px-4">
                          <span className="font-display text-xl text-coral font-bold">
                            {cupon.descuento_porcentaje}% OFF
                          </span>
                        </td>

                        {/* Canjes con barra */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 min-w-[140px]">
                            <span className="font-bold text-negro dark:text-blanco">
                              {cupon.usos_actuales || 0} / {isIlimitado ? '∞ Ilimitado' : `${cupon.usos_maximos} canjes`}
                            </span>
                            {!isIlimitado && (
                              <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#2ABFBF] transition-all duration-300"
                                  style={{ width: `${pctUsado}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Expiración */}
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-[#C9A84C]">
                            {cupon.fecha_expiracion
                              ? `${new Date(cupon.fecha_expiracion).toLocaleDateString('es-MX', {
                                timeZone: 'America/Mazatlan',
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })} (11:59 PM)`
                              : 'Sin expiración'}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => cupon.id && handleToggle(cupon.id, cupon.activo !== false)}
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${status.class}`}
                            title="Clic para pausar o activar cupón"
                          >
                            {status.label}
                          </button>
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openEditModal(cupon)}
                              className="p-1.5 rounded-xl text-negro/60 dark:text-arena/60 hover:text-[#2ABFBF] hover:bg-[#2ABFBF]/10 transition-all"
                              title="Editar cupón"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => cupon.id && handleDelete(cupon.id)}
                              className="p-1.5 rounded-xl text-negro/40 dark:text-arena/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                              title="Eliminar cupón"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* VISTA MÓVIL (LISTA ESCROLLEABLE COMPACTA) */}
            <div className="block md:hidden divide-y divide-black/5 dark:divide-white/5 font-sans">
              {paginatedCupones.map((cupon) => {
                const status = getStatusBadge(cupon)
                const isIlimitado = cupon.usos_maximos === null || cupon.usos_maximos === undefined

                return (
                  <div
                    key={cupon.id}
                    className="p-4 flex flex-col gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-lg text-[#2ABFBF]">
                          {cupon.codigo}
                        </span>
                        <span className="text-[11px] text-negro/50 dark:text-arena/50">
                          {isIlimitado ? 'Canjes ilimitados' : `${cupon.usos_actuales || 0} de ${cupon.usos_maximos} usados`}
                        </span>
                      </div>

                      <span className="font-display text-2xl text-coral font-bold">
                        {cupon.descuento_porcentaje}% OFF
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-black/[0.02] dark:bg-white/[0.02] p-2.5 rounded-xl">
                      <span className="text-negro/60 dark:text-arena/60">Vence:</span>
                      <span className="font-bold text-[#C9A84C]">
                        {cupon.fecha_expiracion
                          ? new Date(cupon.fecha_expiracion).toLocaleDateString('es-MX', {
                            timeZone: 'America/Mazatlan',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                          : 'Sin expiración'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => cupon.id && handleToggle(cupon.id, cupon.activo !== false)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full ${status.class}`}
                      >
                        {status.label}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(cupon)}
                          className="p-2 text-negro/60 dark:text-arena/60 hover:text-[#2ABFBF] rounded-xl"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => cupon.id && handleDelete(cupon.id)}
                          className="p-2 text-negro/40 dark:text-arena/40 hover:text-red-500 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* PAGINACIÓN DE 10 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-black/[0.08] dark:border-white/[0.08]">
                <span className="text-xs font-sans font-medium text-negro/60 dark:text-arena/60">
                  Mostrando página {currentPage} de {totalPages} ({filteredCupones.length} cupones)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-sans font-bold px-2 text-negro dark:text-blanco">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center bg-black/[0.02] dark:bg-white/[0.02]">
            <Ticket className="w-8 h-8 mx-auto text-negro/30 dark:text-arena/30 mb-2" />
            <p className="text-xs text-negro/60 dark:text-arena/60 font-sans font-medium">
              No hay cupones registrados que coincidan con la búsqueda.
            </p>
          </div>
        )}
      </div>

      {/* SECCIÓN CONFIGURACIÓN PLAN DE LEALTAD Y RECOMPENSAS ADMIN */}
      <LealtadConfigManager />

      {/* MODAL CREAR / EDITAR CUPÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 rounded-[28px] w-full max-w-lg p-6 shadow-2xl relative text-negro dark:text-blanco transition-colors flex flex-col gap-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-negro/40 dark:text-arena/40 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-sans font-bold tracking-widest text-[#2ABFBF] uppercase">
                {editingCupon ? 'EDITAR CUPÓN' : 'CREAR NUEVO CUPÓN'}
              </span>
              <h3 className="font-display text-3xl text-negro dark:text-blanco mt-0.5">
                {editingCupon ? `CUPÓN: ${editingCupon.codigo}` : 'NUEVO CUPÓN DE DESCUENTO'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Código */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/80 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-[#2ABFBF]" />
                  <span>Código del Cupón *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. VERANO20 o SINALOA15"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-base text-negro dark:text-blanco font-mono uppercase focus:border-[#2ABFBF] focus:outline-none"
                />
              </div>

              {/* Porcentaje de Descuento */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/80 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-[#2ABFBF]" />
                    <span>Porcentaje de Descuento (0% al 100%) *</span>
                  </label>
                  <span className="font-display text-2xl text-coral font-bold">{descuentoPorcentaje}% OFF</span>
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

              {/* Límite de Canjes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/80 flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-[#2ABFBF]" />
                  <span>Límite de Canjes Máximos (Dejar en blanco para ilimitado)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej. 50 (Opcional)"
                  value={usosMaximos}
                  onChange={(e) => setUsosMaximos(e.target.value)}
                  className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco focus:border-[#2ABFBF] focus:outline-none font-sans font-medium"
                />
              </div>

              {/* Fecha de Expiración */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/80 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#2ABFBF]" />
                  <span>Fecha de Expiración (Medianoche 11:59 PM Mazatlán)</span>
                </label>
                <input
                  type="date"
                  value={fechaExpiracion}
                  onChange={(e) => setFechaExpiracion(e.target.value)}
                  className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco focus:border-[#2ABFBF] focus:outline-none cursor-pointer font-sans font-medium"
                />
                <span className="text-[11px] font-sans text-negro/60 dark:text-arena/60">
                  El cupón se desactivará automáticamente a las 11:59:59 PM (Horario Mazatlán) de la fecha elegida.
                </span>
              </div>

              {/* Status Activo */}
              <div className="flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-2xl border border-black/10 dark:border-white/10 mt-1">
                <span className="text-xs font-sans font-bold">Estado Activo:</span>
                <button
                  type="button"
                  onClick={() => setActivo(!activo)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activo ? 'bg-[#16A34B] text-white' : 'bg-coral text-white'
                  }`}
                >
                  {activo ? 'ACTIVADO' : 'PAUSADO'}
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-negro dark:text-blanco font-sans font-bold text-xs rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-[#2ABFBF] text-black font-sans font-bold text-xs tracking-wider rounded-xl hover:bg-[#2ABFBF]/90 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
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
