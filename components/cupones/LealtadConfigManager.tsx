'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  getRecompensasLealtadList,
  saveRecompensaLealtad,
  deleteRecompensaLealtad,
  toggleRecompensaLealtadActivo,
  RecompensaLealtadItem,
} from '@/lib/actions/lealtadConfig'
import { getPlatillosList } from '@/lib/actions/menu'
import { Platillo } from '@/lib/types/database'
import { CustomSelect } from '@/components/ui/CustomSelect'
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  X,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShoppingBag,
  Gift,
  Percent,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'

const ITEMS_PER_PAGE = 10

export function LealtadConfigManager() {
  const [recompensas, setRecompensas] = useState<RecompensaLealtadItem[]>([])
  const [platillosList, setPlatillosList] = useState<Platillo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RecompensaLealtadItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [pedidosRequeridos, setPedidosRequeridos] = useState(3)
  const [codigo, setCodigo] = useState('')
  const [titulo, setTitulo] = useState('')
  const [tipoRecompensa, setTipoRecompensa] = useState<'porcentaje' | 'producto_regalo' | 'monto_fijo'>('porcentaje')
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(15)
  const [montoFijo, setMontoFijo] = useState(50)
  const [productoRegalo, setProductoRegalo] = useState('')
  const [activo, setActivo] = useState(true)

  const loadRecompensas = async () => {
    setLoading(true)
    try {
      const [recompData, menuData] = await Promise.all([
        getRecompensasLealtadList(),
        getPlatillosList(),
      ])
      setRecompensas(recompData)
      setPlatillosList(menuData)
    } catch (e) {
      console.error('Error cargando datos de lealtad:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecompensas()
  }, [])

  // Filtrado
  const filteredRecompensas = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return recompensas.filter((r) => {
      return (
        r.codigo.toLowerCase().includes(term) ||
        r.titulo.toLowerCase().includes(term) ||
        (r.producto_regalo && r.producto_regalo.toLowerCase().includes(term))
      )
    })
  }, [recompensas, searchTerm])

  // Paginación de 10 en 10
  const totalPages = Math.max(1, Math.ceil(filteredRecompensas.length / ITEMS_PER_PAGE))
  const paginatedRecompensas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredRecompensas.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredRecompensas, currentPage])

  const openCreateModal = () => {
    setEditingItem(null)
    setPedidosRequeridos(3)
    setCodigo(`LEALTAD-${Date.now().toString().slice(-4)}`)
    setTitulo('')
    setTipoRecompensa('porcentaje')
    setDescuentoPorcentaje(15)
    setMontoFijo(50)
    setProductoRegalo('')
    setActivo(true)
    setIsModalOpen(true)
  }

  const openEditModal = (item: RecompensaLealtadItem) => {
    setEditingItem(item)
    setPedidosRequeridos(item.pedidos_requeridos)
    setCodigo(item.codigo)
    setTitulo(item.titulo)
    setTipoRecompensa(item.tipo_recompensa || 'porcentaje')
    setDescuentoPorcentaje(item.descuento_porcentaje || 15)
    setMontoFijo(item.monto_fijo || 50)
    setProductoRegalo(item.producto_regalo || '')
    setActivo(item.activo)
    setIsModalOpen(true)
  }

  const handleToggle = async (id: number, currentActivo: boolean) => {
    setRecompensas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, activo: !currentActivo } : r))
    )
    try {
      await toggleRecompensaLealtadActivo(id, currentActivo)
    } catch (e) {
      console.error('Error al cambiar estado:', e)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este cupón de lealtad?')) return
    setRecompensas((prev) => prev.filter((r) => r.id !== id))
    try {
      await deleteRecompensaLealtad(id)
    } catch (e) {
      console.error('Error al eliminar cupón de lealtad:', e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigo.trim() || !titulo.trim()) return

    setSaving(true)
    try {
      const payload: RecompensaLealtadItem = {
        id: editingItem?.id,
        pedidos_requeridos: Number(pedidosRequeridos) || 1,
        codigo: codigo.trim().toUpperCase(),
        titulo: titulo.trim(),
        tipo_recompensa: tipoRecompensa,
        descuento_porcentaje: tipoRecompensa === 'porcentaje' ? Number(descuentoPorcentaje) || 0 : 0,
        monto_fijo: tipoRecompensa === 'monto_fijo' ? Number(montoFijo) || 0 : 0,
        producto_regalo: tipoRecompensa === 'producto_regalo' ? productoRegalo.trim() : undefined,
        activo,
      }

      await saveRecompensaLealtad(payload)
      await loadRecompensas()
      setIsModalOpen(false)
    } catch (err: any) {
      alert(err.message || 'Error al guardar el cupón de lealtad')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-5 md:p-6 shadow-sm flex flex-col gap-6 text-negro dark:text-blanco transition-colors">
      {/* HEADER DE RECOMPENSAS DE LEALTAD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#C9A84C]/15 text-[#C9A84C] rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#C9A84C] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C9A84C]" />
              <span>PLAN DE LEALTAD MULTI-TIPO</span>
            </span>
            <h2 className="font-display text-2xl md:text-3xl text-negro dark:text-blanco tracking-wide">
              RECOMPENSAS POR CONSUMO
            </h2>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90 font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-2xl transition-all flex items-center gap-2 shadow-md self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ NUEVA RECOMPENSA DE LEALTAD</span>
        </button>
      </div>

      <p className="font-sans text-xs text-negro/70 dark:text-arena/70">
        Configura los beneficios que se desbloquean automáticamente cuando los socios acumulan pedidos completados (% de descuento, producto de cortesía o saldo a favor).
      </p>

      {/* TABLA DE RECOMPENSAS DE LEALTAD CON PAGINACIÓN DE 10 */}
      {loading ? (
        <div className="p-8 text-center flex items-center justify-center gap-2 text-negro/60 dark:text-arena/60">
          <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
          <span className="font-sans text-xs font-medium">Cargando recompensas de lealtad...</span>
        </div>
      ) : filteredRecompensas.length === 0 ? (
        <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center flex flex-col items-center gap-3 font-sans">
          <Award className="w-10 h-10 text-[#C9A84C]/60" />
          <h4 className="font-display text-2xl text-negro dark:text-blanco font-bold">
            NO HAY RECOMPENSAS REGISTRADAS
          </h4>
          <p className="text-xs text-negro/60 dark:text-arena/60 max-w-md">
            Agrega una recompensa para premiar la recurrencia de tus clientes en cada visita.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-2 bg-[#C9A84C] text-black font-bold text-xs px-5 py-3 rounded-xl shadow-md hover:bg-[#C9A84C]/90"
          >
            + AGREGAR PRIMERA RECOMPENSA
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* VISTA ESCRITORIO (TABLA) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.08] dark:border-white/[0.08]">
                <tr>
                  <th className="py-3.5 px-4 font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60">
                    Requisito de Desbloqueo
                  </th>
                  <th className="py-3.5 px-4 font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60">
                    Código & Título
                  </th>
                  <th className="py-3.5 px-4 font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60">
                    Beneficio
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
                {paginatedRecompensas.map((item) => (
                  <tr
                    key={item.id || item.codigo}
                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Requisito */}
                    <td className="py-3.5 px-4">
                      <span className="bg-[#C9A84C]/15 text-[#C9A84C] font-bold px-3 py-1 rounded-full text-[11px] inline-flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Al {item.pedidos_requeridos}° pedido</span>
                      </span>
                    </td>

                    {/* Código y Título */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono font-bold text-xs text-[#2ABFBF]">
                          {item.codigo}
                        </span>
                        <span className="font-bold text-sm text-negro dark:text-blanco truncate mt-0.5">
                          {item.titulo}
                        </span>
                        {item.tipo_recompensa === 'producto_regalo' && item.producto_regalo && (
                          <span className="text-[11px] text-[#C9A84C] font-medium mt-0.5">
                            🎁 Cortesía: {item.producto_regalo} (100% OFF)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Beneficio */}
                    <td className="py-3.5 px-4">
                      {item.tipo_recompensa === 'producto_regalo' ? (
                        <span className="bg-[#2ABFBF]/15 text-[#2ABFBF] font-bold px-2.5 py-1 rounded-full text-[11px] inline-flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5" />
                          <span>REGALO 100% OFF</span>
                        </span>
                      ) : item.tipo_recompensa === 'monto_fijo' ? (
                        <span className="font-display text-xl text-coral font-bold">
                          -${item.monto_fijo} MXN
                        </span>
                      ) : (
                        <span className="font-display text-xl text-coral font-bold">
                          -{item.descuento_porcentaje}% OFF
                        </span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => item.id && handleToggle(item.id, item.activo)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${
                          item.activo
                            ? 'bg-[#16A34B] text-white border-transparent'
                            : 'bg-black/10 dark:bg-white/10 text-negro/60 dark:text-arena/60 border-transparent'
                        }`}
                        title="Clic para pausar o activar"
                      >
                        {item.activo ? 'ACTIVO' : 'PAUSADO'}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-negro/60 dark:text-arena/60 hover:text-[#2ABFBF] hover:bg-[#2ABFBF]/10 rounded-xl transition-colors"
                          title="Editar recompensa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => item.id && handleDelete(item.id)}
                          className="p-1.5 text-negro/40 dark:text-arena/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Eliminar recompensa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VISTA MÓVIL (LISTA ESCROLLEABLE) */}
          <div className="block md:hidden divide-y divide-black/5 dark:divide-white/5 font-sans">
            {paginatedRecompensas.map((item) => (
              <div
                key={item.id || item.codigo}
                className="p-4 flex flex-col gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="bg-[#C9A84C]/15 text-[#C9A84C] font-bold px-3 py-1 rounded-full text-[11px] inline-flex items-center gap-1.5">
                    <ShoppingBag className="w-3 h-3" />
                    <span>Al {item.pedidos_requeridos}° pedido</span>
                  </span>

                  {item.tipo_recompensa === 'producto_regalo' ? (
                    <span className="bg-[#2ABFBF]/15 text-[#2ABFBF] font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                      REGALO GRATIS
                    </span>
                  ) : item.tipo_recompensa === 'monto_fijo' ? (
                    <span className="font-display text-xl text-coral font-bold">
                      -${item.monto_fijo} MXN
                    </span>
                  ) : (
                    <span className="font-display text-xl text-coral font-bold">
                      -{item.descuento_porcentaje}% OFF
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="font-mono font-bold text-xs text-[#2ABFBF]">
                    {item.codigo}
                  </span>
                  <span className="font-bold text-sm text-negro dark:text-blanco mt-0.5">
                    {item.titulo}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => item.id && handleToggle(item.id, item.activo)}
                    className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                      item.activo ? 'bg-[#16A34B] text-white' : 'bg-black/10 dark:bg-white/10 text-negro/60 dark:text-arena/60'
                    }`}
                  >
                    {item.activo ? 'ACTIVO' : 'PAUSADO'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 text-negro/60 dark:text-arena/60 hover:text-[#2ABFBF] rounded-xl"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => item.id && handleDelete(item.id)}
                      className="p-2 text-negro/40 dark:text-arena/40 hover:text-red-500 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINACIÓN DE 10 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-black/[0.08] dark:border-white/[0.08] font-sans">
              <span className="text-xs font-medium text-negro/60 dark:text-arena/60">
                Mostrando página {currentPage} de {totalPages} ({filteredRecompensas.length} recompensas)
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
                <span className="text-xs font-bold px-2 text-negro dark:text-blanco">
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
        </div>
      )}

      {/* MODAL CREAR / EDITAR CUPÓN DE LEALTAD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 rounded-[28px] w-full max-w-lg p-6 shadow-2xl relative text-negro dark:text-blanco transition-colors max-h-[90vh] overflow-y-auto flex flex-col gap-4 font-sans">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-negro/40 dark:text-arena/40 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold tracking-widest text-[#C9A84C] uppercase">
                {editingItem ? 'EDITAR RECOMPENSA' : 'NUEVA RECOMPENSA'}
              </span>
              <h3 className="font-display text-3xl text-negro dark:text-blanco mt-0.5">
                {editingItem ? `CUPÓN: ${editingItem.codigo}` : 'CREAR RECOMPENSA DE LEALTAD'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* TIPO DE RECOMPENSA */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-negro/80 dark:text-arena/80">
                  Tipo de Recompensa de Lealtad *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoRecompensa('porcentaje')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      tipoRecompensa === 'porcentaje'
                        ? 'bg-coral text-white border-coral shadow-md'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 text-negro/70 dark:text-arena/70 hover:border-coral'
                    }`}
                  >
                    <Percent className="w-4 h-4" />
                    <span>% Descuento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoRecompensa('producto_regalo')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      tipoRecompensa === 'producto_regalo'
                        ? 'bg-[#2ABFBF] text-black border-[#2ABFBF] shadow-md'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 text-negro/70 dark:text-arena/70 hover:border-[#2ABFBF]'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    <span>Producto Gratis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoRecompensa('monto_fijo')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      tipoRecompensa === 'monto_fijo'
                        ? 'bg-[#C9A84C] text-black border-[#C9A84C] shadow-md'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 text-negro/70 dark:text-arena/70 hover:border-[#C9A84C]'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>$ Monto Fijo</span>
                  </button>
                </div>
              </div>

              {/* Pedidos Requeridos */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-negro/80 dark:text-arena/80">
                  Número de Pedidos Completados Requeridos *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Ej. 3, 5, 8, 12..."
                  value={pedidosRequeridos}
                  onChange={(e) => setPedidosRequeridos(Number(e.target.value))}
                  className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:border-[#C9A84C] focus:outline-none font-medium"
                />
              </div>

              {/* Código de Cupón */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-negro/80 dark:text-arena/80">
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. LEALTAD-3-PEDIDOS o TOSTADA-GRATIS"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-base font-mono uppercase text-negro dark:text-blanco focus:border-[#C9A84C] focus:outline-none"
                />
              </div>

              {/* Título de la Recompensa */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-negro/80 dark:text-arena/80">
                  Título / Descripción de la Recompensa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tostada de Callo Gratis en tu 3er Pedido 🥑"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco focus:border-[#C9A84C] focus:outline-none font-medium"
                />
              </div>

              {/* VALOR DE RECOMPENSA SEGÚN TIPO */}
              {tipoRecompensa === 'porcentaje' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs uppercase font-bold text-negro/80 dark:text-arena/80">
                      Porcentaje de Descuento (% OFF en comanda) *
                    </label>
                    <span className="font-display text-2xl text-coral font-bold">{descuentoPorcentaje}% OFF</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={descuentoPorcentaje}
                    onChange={(e) => setDescuentoPorcentaje(Number(e.target.value))}
                    className="w-full accent-coral cursor-pointer"
                  />
                </div>
              )}

              {tipoRecompensa === 'monto_fijo' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase font-bold text-negro/80 dark:text-arena/80">
                    Descuento en Dinero ($ MXN) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ej. 50 (Monto en $ MXN)"
                    value={montoFijo}
                    onChange={(e) => setMontoFijo(Number(e.target.value))}
                    className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:border-[#C9A84C] focus:outline-none"
                  />
                </div>
              )}

              {tipoRecompensa === 'producto_regalo' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase font-bold text-negro/80 dark:text-arena/80">
                    Seleccionar Platillo de Regalo del Menú (100% GRATIS) *
                  </label>
                  
                  <CustomSelect
                    options={[
                      ...platillosList.map((p) => ({
                        value: `${p.emoji || '🦐'} ${p.nombre}`,
                        label: p.nombre,
                        emoji: p.emoji || '🦐',
                        subtitle: `$${p.precio} MXN`,
                      })),
                      { value: '🥤 Bebida Gratis a Elegir', label: 'Bebida Gratis a Elegir', emoji: '🥤' },
                      { value: '🥑 Tostada Especial Gratis', label: 'Tostada Especial Gratis', emoji: '🥑' },
                    ]}
                    value={productoRegalo}
                    onChange={(selected) => {
                      setProductoRegalo(selected)
                      if (selected && !titulo) {
                        setTitulo(`${selected} GRATIS en tu pedido #${pedidosRequeridos} 🥑`)
                      }
                    }}
                    placeholder="-- Selecciona un platillo del menú --"
                  />

                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[10px] text-negro/60 dark:text-arena/60 uppercase">O escribe un nombre personalizado para el regalo:</span>
                    <input
                      type="text"
                      placeholder="Ej. Tostada de Callo de Hacha o Bebida al gusto"
                      value={productoRegalo}
                      onChange={(e) => setProductoRegalo(e.target.value)}
                      className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-negro dark:text-blanco focus:border-[#2ABFBF] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Estado Activo */}
              <div className="flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-2xl border border-black/10 dark:border-white/10 mt-1">
                <span className="text-xs font-bold">Estado Activo:</span>
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
                  className="px-5 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-negro dark:text-blanco font-bold text-xs rounded-xl hover:bg-black/10 dark:hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-[#C9A84C] text-black font-bold text-xs tracking-wider rounded-xl hover:bg-[#C9A84C]/90 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>GUARDANDO...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>GUARDAR RECOMPENSA</span>
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
