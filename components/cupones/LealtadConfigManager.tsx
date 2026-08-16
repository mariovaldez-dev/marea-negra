'use client'

import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'

export function LealtadConfigManager() {
  const [recompensas, setRecompensas] = useState<RecompensaLealtadItem[]>([])
  const [platillosList, setPlatillosList] = useState<Platillo[]>([])
  const [loading, setLoading] = useState(true)
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
    <div className="bg-white dark:bg-[#050404] bg-dots-pattern border-2 border-arena/30 dark:border-oro/40 rounded-3xl p-6 md:p-8 gold-border-corner shadow-2xl text-negro dark:text-blanco flex flex-col gap-6 transition-colors">
      {/* HEADER DE RECOMPENSAS DE LEALTAD MULTI-TIPO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/20 dark:border-arena/15 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#8C6D1F]/15 dark:bg-oro/20 border border-[#8C6D1F]/30 dark:border-oro/40 rounded-2xl text-[#8C6D1F] dark:text-oro">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C6D1F] dark:text-oro flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-oro" />
              <span>PLAN DE LEALTAD MULTI-TIPO (% OFF / PRODUCTO GRATIS / $ MONTO FIJO)</span>
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco tracking-wide">
              CUPONES DE LEALTAD Y RECOMPENSAS
            </h2>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-oro text-negro hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro font-sans font-bold text-xs tracking-wider px-6 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(201,168,76,0.3)] self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ NUEVO CUPÓN DE LEALTAD</span>
        </button>
      </div>

      <p className="font-sans text-sm text-negro/70 dark:text-arena/70">
        Crea cualquier tipo de cupón de lealtad: porcentaje de descuento en la orden, producto gratis seleccionado de tu menú o descuento en dinero ($ MXN). Se desbloquearán automáticamente cuando el cliente acumule los pedidos requeridos.
      </p>

      {/* LISTADO DE CUPONES DE LEALTAD N-DINÁMICOS */}
      {loading ? (
        <div className="p-8 text-center flex items-center justify-center gap-2 text-negro/60 dark:text-arena/60">
          <Loader2 className="w-5 h-5 animate-spin text-oro" />
          <span>Cargando cupones de lealtad desde la base de datos...</span>
        </div>
      ) : recompensas.length === 0 ? (
        <div className="bg-[#F4F0E8] dark:bg-carbon/50 border border-dashed border-arena/40 dark:border-arena/20 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
          <Award className="w-10 h-10 text-oro/60" />
          <h4 className="font-display text-2xl text-negro dark:text-blanco">
            NO HAY CUPONES DE LEALTAD REGISTRADOS
          </h4>
          <p className="font-sans text-xs text-negro/60 dark:text-arena/60 max-w-md">
            No se muestra nada al cliente hasta que agregues un cupón. Presiona el botón a continuación para crear el primero.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-2 bg-oro text-negro font-sans font-bold text-xs px-5 py-3 rounded-xl shadow-md hover:bg-blanco"
          >
            + AGREGAR PRIMER CUPÓN DE LEALTAD
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recompensas.map((item) => (
            <div
              key={item.id || item.codigo}
              className="bg-[#F4F0E8] dark:bg-carbon border border-oro/30 hover:border-oro rounded-2xl p-5 flex flex-col justify-between shadow-lg gap-3 transition-all"
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="bg-oro/20 text-[#8C6D1F] dark:text-oro font-sans text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-oro/30 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-oro" />
                    <span>AL ALCANZAR {item.pedidos_requeridos} PEDIDO(S)</span>
                  </span>

                  {item.tipo_recompensa === 'producto_regalo' ? (
                    <span className="bg-turquesa/20 text-turquesa text-[11px] font-sans font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-turquesa/30">
                      <Gift className="w-3.5 h-3.5" />
                      <span>REGALO GRATIS</span>
                    </span>
                  ) : item.tipo_recompensa === 'monto_fijo' ? (
                    <span className="font-display text-2xl text-coral font-bold">
                      -${item.monto_fijo} MXN
                    </span>
                  ) : (
                    <span className="font-display text-2xl text-coral font-bold">
                      -{item.descuento_porcentaje}% OFF
                    </span>
                  )}
                </div>

                <span className="font-mono text-xs font-bold text-turquesa tracking-wider mt-1">
                  Código: {item.codigo}
                </span>

                <h4 className="font-sans font-bold text-sm text-negro dark:text-blanco leading-snug">
                  {item.titulo}
                </h4>

                {item.tipo_recompensa === 'producto_regalo' && item.producto_regalo && (
                  <span className="text-xs font-sans text-[#8C6D1F] dark:text-oro italic bg-oro/10 px-2.5 py-1 rounded-lg border border-oro/20 self-start">
                    🎁 Regalo: {item.producto_regalo} (100% OFF)
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-arena/20 dark:border-arena/10 mt-2">
                <button
                  type="button"
                  onClick={() => item.id && handleToggle(item.id, item.activo)}
                  className={`px-3 py-1 rounded-full text-[11px] font-sans font-bold border transition-all flex items-center gap-1 ${
                    item.activo
                      ? 'bg-turquesa/15 border-turquesa/40 text-turquesa'
                      : 'bg-coral/15 border-coral/40 text-coral'
                  }`}
                >
                  {item.activo ? (
                    <>
                      <Power className="w-3 h-3" />
                      <span>Activo</span>
                    </>
                  ) : (
                    <>
                      <PowerOff className="w-3 h-3" />
                      <span>Pausado</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco hover:bg-arena/20 dark:hover:bg-carbon rounded-lg transition-colors"
                    title="Editar cupón de lealtad"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => item.id && handleDelete(item.id)}
                    className="p-2 text-coral/70 hover:text-coral hover:bg-coral/10 rounded-lg transition-colors"
                    title="Eliminar cupón de lealtad"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR / EDITAR CUPÓN DE LEALTAD MULTI-TIPO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-oro/40 rounded-2xl w-full max-w-lg p-6 gold-border-corner shadow-2xl relative text-negro dark:text-blanco transition-colors max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-arena/20 dark:hover:bg-carbon"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-xs font-sans font-bold tracking-widest text-oro uppercase">
                {editingItem ? 'EDITAR CUPÓN DE LEALTAD' : 'NUEVO CUPÓN DE LEALTAD'}
              </span>
              <h3 className="font-display text-3xl text-negro dark:text-blanco">
                {editingItem ? `CUPÓN: ${editingItem.codigo}` : 'CREAR RECOMPENSA DE LEALTAD'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* TIPO DE RECOMPENSA */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90">
                  Tipo de Recompensa de Lealtad *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoRecompensa('porcentaje')}
                    className={`p-3 rounded-xl border text-xs font-sans font-bold flex flex-col items-center gap-1.5 transition-all ${
                      tipoRecompensa === 'porcentaje'
                        ? 'bg-coral text-blanco border-coral shadow-md'
                        : 'bg-[#F4F0E8] dark:bg-carbon border-arena/30 text-negro/70 dark:text-arena/70 hover:border-coral'
                    }`}
                  >
                    <Percent className="w-4 h-4" />
                    <span>% Descuento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoRecompensa('producto_regalo')}
                    className={`p-3 rounded-xl border text-xs font-sans font-bold flex flex-col items-center gap-1.5 transition-all ${
                      tipoRecompensa === 'producto_regalo'
                        ? 'bg-turquesa text-negro border-turquesa shadow-md'
                        : 'bg-[#F4F0E8] dark:bg-carbon border-arena/30 text-negro/70 dark:text-arena/70 hover:border-turquesa'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    <span>Producto Gratis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoRecompensa('monto_fijo')}
                    className={`p-3 rounded-xl border text-xs font-sans font-bold flex flex-col items-center gap-1.5 transition-all ${
                      tipoRecompensa === 'monto_fijo'
                        ? 'bg-oro text-negro border-oro shadow-md'
                        : 'bg-[#F4F0E8] dark:bg-carbon border-arena/30 text-negro/70 dark:text-arena/70 hover:border-oro'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>$ Monto Fijo</span>
                  </button>
                </div>
              </div>

              {/* Pedidos Requeridos para Desbloquear */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90">
                  Número de Pedidos Completados Requeridos *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Ej. 3, 5, 8, 12..."
                  value={pedidosRequeridos}
                  onChange={(e) => setPedidosRequeridos(Number(e.target.value))}
                  className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:border-oro focus:outline-none"
                />
              </div>

              {/* Código de Cupón */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90">
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. LEALTAD-3-PEDIDOS o TOSTADA-GRATIS"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-base font-mono uppercase text-negro dark:text-blanco focus:border-oro focus:outline-none"
                />
              </div>

              {/* Título de la Recompensa */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90">
                  Título / Descripción de la Recompensa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tostada de Callo Gratis en tu 3er Pedido 🥑"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:border-oro focus:outline-none"
                />
              </div>

              {/* VALOR DE RECOMPENSA SEGÚN TIPO */}
              {tipoRecompensa === 'porcentaje' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90">
                      Porcentaje de Descuento (% OFF en comanda) *
                    </label>
                    <span className="font-display text-2xl text-coral">{descuentoPorcentaje}% OFF</span>
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
                  <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90">
                    Descuento en Dinero ($ MXN) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ej. 50 (Monto en $ MXN)"
                    value={montoFijo}
                    onChange={(e) => setMontoFijo(Number(e.target.value))}
                    className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:border-oro focus:outline-none"
                  />
                </div>
              )}

              {tipoRecompensa === 'producto_regalo' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90">
                    Seleccionar Platillo de Regalo del Menú (100% GRATIS) *
                  </label>
                  
                  {/* Select customizado libre de popups nativos de macOS */}
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

                  {/* Input manual de respaldo */}
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[10px] font-sans text-negro/60 dark:text-arena/60 uppercase">O escribe un nombre personalizado para el regalo:</span>
                    <input
                      type="text"
                      placeholder="Ej. Tostada de Callo de Hacha o Bebida al gusto"
                      value={productoRegalo}
                      onChange={(e) => setProductoRegalo(e.target.value)}
                      className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-2.5 text-xs text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
                    />
                  </div>

                  <span className="text-[11px] font-sans text-turquesa">
                    Este producto se insertará automáticamente con precio de $0.00 GRATIS en la comanda BDD y WhatsApp.
                  </span>
                </div>
              )}

              {/* Estado Activo */}
              <div className="flex justify-between items-center bg-[#F4F0E8] dark:bg-carbon p-3 rounded-xl border border-arena/30 dark:border-arena/20 mt-1">
                <span className="text-xs font-sans font-bold">Estado Activo:</span>
                <button
                  type="button"
                  onClick={() => setActivo(!activo)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activo ? 'bg-turquesa text-negro' : 'bg-coral text-blanco'
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
                  className="px-6 py-3 bg-oro text-negro font-sans font-bold text-xs tracking-wider rounded-xl hover:bg-blanco transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>GUARDANDO...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>GUARDAR CUPÓN DE LEALTAD</span>
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
