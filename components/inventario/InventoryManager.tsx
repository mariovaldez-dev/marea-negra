'use client'

import React, { useState } from 'react'
import { Insumo, MovimientoInventario, TipoMovimiento } from '@/lib/types/database'
import { NarrativeCard } from '@/components/ui/NarrativeCard'
import {
  registrarMovimientoInventario,
  crearInsumo,
  editarInsumo,
  eliminarInsumo,
} from '@/lib/actions/inventario'
import { Plus, Minus, AlertTriangle, History, X, Check, Loader2, Edit2, Trash2 } from 'lucide-react'

interface InventoryManagerProps {
  initialInsumos: Insumo[]
  historialMovimientos: MovimientoInventario[]
}

export function InventoryManager({
  initialInsumos,
  historialMovimientos,
}: InventoryManagerProps) {
  const [insumos, setInsumos] = useState<Insumo[]>(initialInsumos)
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>(historialMovimientos)

  // Modales
  const [activeModal, setActiveModal] = useState<'movimiento' | 'nuevo' | 'editar' | null>(null)
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null)
  const [tipoMov, setTipoMov] = useState<TipoMovimiento>('entrada')
  const [cantidad, setCantidad] = useState<number>(0.5)
  const [motivo, setMotivo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Formulario Crear / Editar Insumo
  const [formNombre, setFormNombre] = useState('')
  const [formUnidad, setFormUnidad] = useState('kg')
  const [formStockActual, setFormStockActual] = useState(5)
  const [formStockMinimo, setFormStockMinimo] = useState(2)

  const handleOpenMovModal = (insumo: Insumo, tipo: TipoMovimiento) => {
    setSelectedInsumo(insumo)
    setTipoMov(tipo)
    setCantidad(tipo === 'entrada' ? 1 : 0.5)
    setMotivo(tipo === 'entrada' ? 'Resurtido de cocina' : 'Consumo diario / Merma')
    setActiveModal('movimiento')
  }

  const handleOpenCrearModal = () => {
    setFormNombre('')
    setFormUnidad('kg')
    setFormStockActual(5)
    setFormStockMinimo(2)
    setActiveModal('nuevo')
  }

  const handleOpenEditarModal = (insumo: Insumo) => {
    setSelectedInsumo(insumo)
    setFormNombre(insumo.nombre)
    setFormUnidad(insumo.unidad)
    setFormStockActual(insumo.stock_actual)
    setFormStockMinimo(insumo.stock_minimo)
    setActiveModal('editar')
  }

  const handleMovSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInsumo || cantidad <= 0) return

    setIsSubmitting(true)
    try {
      const res = await registrarMovimientoInventario({
        insumo_id: selectedInsumo.id,
        tipo: tipoMov,
        cantidad,
        motivo,
      })

      // Actualizar estado local
      setInsumos((prev) =>
        prev.map((item) =>
          item.id === selectedInsumo.id
            ? { ...item, stock_actual: res.nuevoStock }
            : item
        )
      )

      // Agregar a bitácora local
      const nuevoMov: MovimientoInventario = {
        id: Date.now(),
        insumo_id: selectedInsumo.id,
        tipo: tipoMov,
        cantidad,
        motivo,
        created_by: null,
        created_at: new Date().toISOString(),
        insumo: selectedInsumo,
      }
      setMovimientos((prev) => [nuevoMov, ...prev])

      setActiveModal(null)
    } catch (err) {
      console.error('Error al registrar movimiento:', err)
      alert('Ocurrió un error al registrar el movimiento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCrearInsumoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNombre.trim()) return

    setIsSubmitting(true)
    try {
      const res = await crearInsumo({
        nombre: formNombre,
        unidad: formUnidad,
        stock_actual: formStockActual,
        stock_minimo: formStockMinimo,
      })

      if (res.data) {
        setInsumos((prev) => [...prev, res.data])
      }
      setActiveModal(null)
    } catch (err) {
      console.error('Error al crear insumo:', err)
      alert('Ocurrió un error al crear el insumo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditarInsumoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInsumo || !formNombre.trim()) return

    setIsSubmitting(true)
    try {
      const res = await editarInsumo(selectedInsumo.id, {
        nombre: formNombre,
        unidad: formUnidad,
        stock_actual: formStockActual,
        stock_minimo: formStockMinimo,
      })

      if (res.data) {
        setInsumos((prev) =>
          prev.map((item) => (item.id === selectedInsumo.id ? res.data : item))
        )
      }
      setActiveModal(null)
    } catch (err) {
      console.error('Error al editar insumo:', err)
      alert('Ocurrió un error al guardar los cambios del insumo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEliminarInsumo = async (insumo: Insumo) => {
    if (!confirm(`¿Estás seguro de eliminar el insumo "${insumo.nombre}"?`)) return

    try {
      await eliminarInsumo(insumo.id)
      setInsumos((prev) => prev.filter((item) => item.id !== insumo.id))
    } catch (err) {
      console.error('Error al eliminar insumo:', err)
      alert('Ocurrió un error al eliminar el insumo.')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/10 pb-4">
        <div>
          <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase">
            CONTROL DE INGREDIENTES Y MERMA
          </span>
          <h1 className="font-display text-4xl text-blanco tracking-wide">
            INVENTARIO DE INSUMOS
          </h1>
        </div>

        <button
          onClick={handleOpenCrearModal}
          className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-full shadow-[0_0_20px_rgba(42,191,191,0.3)] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>NUEVO INSUMO</span>
        </button>
      </div>

      {/* Grid de Insumos con barra de progreso y acciones editar/eliminar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insumos.map((insumo) => {
          const isLow = insumo.stock_actual <= insumo.stock_minimo
          const percentage = Math.min(
            100,
            Math.round((insumo.stock_actual / (insumo.stock_minimo * 2.5)) * 100)
          )

          return (
            <div
              key={insumo.id}
              className={`bg-[#050404] bg-dots-pattern border rounded-2xl p-5 flex flex-col justify-between transition-all group ${
                isLow
                  ? 'border-coral/50 shadow-[0_0_15px_rgba(232,67,10,0.15)]'
                  : 'border-arena/10 hover:border-turquesa/40'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <h3 className="font-sans font-bold text-base text-blanco group-hover:text-turquesa transition-colors">
                      {insumo.nombre}
                    </h3>
                    <span className="text-[10px] font-sans text-arena/60">
                      Unidad: {insumo.unidad}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botón Editar */}
                    <button
                      onClick={() => handleOpenEditarModal(insumo)}
                      className="p-1.5 bg-carbon border border-arena/20 text-arena/80 hover:text-turquesa hover:border-turquesa rounded-lg transition-all"
                      title="Editar insumo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      onClick={() => handleEliminarInsumo(insumo)}
                      className="p-1.5 bg-carbon border border-arena/20 text-arena/80 hover:text-coral hover:border-coral rounded-lg transition-all"
                      title="Eliminar insumo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-display text-4xl text-blanco">
                    {insumo.stock_actual}
                  </span>
                  <span className="text-xs font-sans text-arena/70">
                    / mín: {insumo.stock_minimo} {insumo.unidad}
                  </span>
                </div>

                {/* Badge de estado */}
                <div className="mt-2">
                  {isLow ? (
                    <span className="inline-flex px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider rounded-md bg-coral/20 text-coral border border-coral/40 items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>⚠ Stock Bajo ({insumo.stock_actual} {insumo.unidad})</span>
                    </span>
                  ) : (
                    <span className="inline-flex px-2.5 py-1 text-[10px] font-sans uppercase tracking-wider rounded-md bg-turquesa/10 text-turquesa border border-turquesa/20">
                      Óptimo ({insumo.stock_actual} {insumo.unidad})
                    </span>
                  )}
                </div>

                {/* Barra de progreso de Stock */}
                <div className="w-full h-2.5 bg-carbon rounded-full overflow-hidden mt-3 border border-arena/10">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isLow ? 'bg-coral' : 'bg-turquesa'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Botones + Entrada y - Salida */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-arena/10">
                <button
                  onClick={() => handleOpenMovModal(insumo, 'entrada')}
                  className="flex-1 bg-turquesa/10 text-turquesa hover:bg-turquesa hover:text-negro border border-turquesa/30 font-sans font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ ENTRADA</span>
                </button>

                <button
                  onClick={() => handleOpenMovModal(insumo, 'salida')}
                  className="flex-1 bg-coral/10 text-coral hover:bg-coral hover:text-blanco border border-coral/30 font-sans font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md"
                >
                  <Minus className="w-4 h-4 stroke-[3]" />
                  <span>- SALIDA</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* BITÁCORA DE MOVIMIENTOS RECIENTES */}
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex items-center gap-2 border-b border-arena/10 pb-3">
          <History className="w-5 h-5 text-oro" />
          <h3 className="font-display text-2xl text-blanco tracking-wide">
            HISTORIAL DE MOVIMIENTOS Y MERMA
          </h3>
        </div>

        {movimientos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {movimientos.map((mov) => {
              const insumoNombre = mov.insumo?.nombre || `Insumo #${mov.insumo_id}`
              const isEntrada = mov.tipo === 'entrada'

              return (
                <NarrativeCard
                  key={mov.id}
                  urgent={!isEntrada}
                  title={`${isEntrada ? '➕ Entrada' : '➖ Salida'}: ${insumoNombre}`}
                  badgeText={`${isEntrada ? '+' : '-'}${mov.cantidad} ${mov.insumo?.unidad || ''}`}
                  timestamp={mov.created_at ? new Date(mov.created_at).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'Hoy'}
                  narrativeText={mov.motivo || 'Movimiento de inventario operativo.'}
                  author={mov.created_by ? 'Administración' : 'Sistema Marea Negra'}
                />
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-carbon/40 rounded-xl border border-arena/5">
            <p className="font-serif italic text-sm text-arena/60">
              No hay movimientos de inventario registrados en la bitácora.
            </p>
          </div>
        )}
      </div>

      {/* MODAL REGISTRAR MOVIMIENTO (ENTRADA / SALIDA CON SOPORTE PARA FRACCIONES 0.5, 1.5, ENTEROS) */}
      {activeModal === 'movimiento' && selectedInsumo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#050404] bg-dots-pattern border border-oro/30 rounded-2xl w-full max-w-md p-6 gold-border-corner shadow-2xl relative text-blanco">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase">
                AJUSTE DE INVENTARIO
              </span>
              <h2 className="font-display text-2xl text-blanco">
                REGISTRAR {tipoMov === 'entrada' ? 'ENTRADA' : 'SALIDA'}: {selectedInsumo.nombre}
              </h2>
            </div>

            <form onSubmit={handleMovSubmit} className="flex flex-col gap-4">
              {/* Atajos de cantidad rápida en fracciones y enteros */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-arena uppercase">
                  Atajos Rápidos de Cantidad:
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[0.25, 0.5, 0.75, 1, 2, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCantidad(val)}
                      className={`py-2 text-xs font-sans font-bold rounded-lg border transition-all ${
                        cantidad === val
                          ? 'bg-turquesa text-negro border-turquesa shadow-md'
                          : 'bg-carbon text-arena/80 border-arena/20 hover:border-turquesa hover:text-blanco'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans text-arena uppercase">
                  Cantidad Personalizada ({selectedInsumo.unidad}) *
                </label>
                <input
                  type="number"
                  required
                  step="0.05"
                  min="0.001"
                  placeholder="Ej. 0.5 o 1.5"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
                  className="bg-carbon border border-arena/20 rounded-lg px-4 py-3 text-base text-blanco font-bold focus:border-turquesa focus:outline-none"
                />
                <span className="text-[11px] font-serif italic text-arena/60">
                  Puedes escribir números enteros (ej. 2) o fracciones decimales (ej. 0.5, 1.5, 0.25).
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans text-arena uppercase">
                  Motivo / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Consumo de cocina o resurtido..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="bg-carbon border border-arena/20 rounded-lg p-3 text-xs text-blanco focus:border-turquesa focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`font-sans font-bold text-xs tracking-wider py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                  tipoMov === 'entrada'
                    ? 'bg-turquesa text-negro hover:bg-blanco'
                    : 'bg-coral text-blanco hover:bg-coral/80'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>GUARDANDO...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>CONFIRMAR {tipoMov.toUpperCase()} ({cantidad} {selectedInsumo.unidad})</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR INSUMO */}
      {(activeModal === 'nuevo' || activeModal === 'editar') && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#050404] bg-dots-pattern border border-oro/30 rounded-2xl w-full max-w-md p-6 gold-border-corner shadow-2xl relative text-blanco">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase">
                CATÁLOGO DE INGREDIENTES
              </span>
              <h2 className="font-display text-2xl text-blanco">
                {activeModal === 'nuevo' ? 'AGREGAR NUEVO INSUMO' : `EDITAR: ${selectedInsumo?.nombre}`}
              </h2>
            </div>

            <form
              onSubmit={activeModal === 'nuevo' ? handleCrearInsumoSubmit : handleEditarInsumoSubmit}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans text-arena uppercase">
                  Nombre del Insumo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Camarón Fresco 41/50"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="bg-carbon border border-arena/20 rounded-lg px-4 py-2.5 text-sm text-blanco focus:border-turquesa focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans text-arena uppercase">Unidad</label>
                  <select
                    value={formUnidad}
                    onChange={(e) => setFormUnidad(e.target.value)}
                    className="bg-carbon border border-arena/20 rounded-lg px-2 py-2.5 text-xs text-blanco focus:border-turquesa focus:outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="gr">gr</option>
                    <option value="pza">pza</option>
                    <option value="paquete">paquete</option>
                    <option value="litro">litro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans text-arena uppercase">Stock Actual</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formStockActual}
                    onChange={(e) => setFormStockActual(parseFloat(e.target.value) || 0)}
                    className="bg-carbon border border-arena/20 rounded-lg px-3 py-2.5 text-xs text-blanco focus:border-turquesa focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans text-arena uppercase">Stock Mínimo</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formStockMinimo}
                    onChange={(e) => setFormStockMinimo(parseFloat(e.target.value) || 0)}
                    className="bg-carbon border border-arena/20 rounded-lg px-3 py-2.5 text-xs text-blanco focus:border-turquesa focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>GUARDANDO...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{activeModal === 'nuevo' ? 'CREAR INSUMO' : 'GUARDAR CAMBIOS'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
