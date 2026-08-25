'use client'

import React, { useState } from 'react'
import { Insumo, MovimientoInventario, TipoMovimiento, Platillo, PlatilloIngrediente } from '@/lib/types/database'
import { NarrativeCard } from '@/components/ui/NarrativeCard'
import {
  registrarMovimientoInventario,
  crearInsumo,
  editarInsumo,
  eliminarInsumo,
} from '@/lib/actions/inventario'
import {
  guardarIngredienteReceta,
  eliminarIngredienteReceta,
} from '@/lib/actions/recetas'
import {
  Plus,
  Minus,
  AlertTriangle,
  History,
  X,
  Check,
  Loader2,
  Edit2,
  Trash2,
  TrendingUp,
  Calendar,
  Copy,
  Sparkles,
  PackageCheck,
  Truck,
  ChefHat,
  Utensils,
  BookOpen,
} from 'lucide-react'

interface InventoryManagerProps {
  initialInsumos: Insumo[]
  historialMovimientos: MovimientoInventario[]
  initialPlatillos?: Platillo[]
  initialRecetas?: PlatilloIngrediente[]
}

export function InventoryManager({
  initialInsumos,
  historialMovimientos,
  initialPlatillos = [],
  initialRecetas = [],
}: InventoryManagerProps) {
  const [activeTab, setActiveTab] = useState<'stock' | 'proyeccion' | 'recetas'>('stock')
  const [insumos, setInsumos] = useState<Insumo[]>(initialInsumos)
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>(historialMovimientos)
  const [platillos] = useState<Platillo[]>(initialPlatillos)
  const [recetas, setRecetas] = useState<PlatilloIngrediente[]>(initialRecetas)
  const [copiedOrder, setCopiedOrder] = useState(false)

  // Modales
  const [activeModal, setActiveModal] = useState<'movimiento' | 'nuevo' | 'editar' | 'receta' | null>(null)
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null)
  const [selectedPlatillo, setSelectedPlatillo] = useState<Platillo | null>(null)
  const [tipoMov, setTipoMov] = useState<TipoMovimiento>('entrada')
  const [cantidad, setCantidad] = useState<string | number>(1)
  const [motivo, setMotivo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Formulario Receta
  const [recetaPlatilloId, setRecetaPlatilloId] = useState<number>(platillos[0]?.id || 1)
  const [recetaInsumoId, setRecetaInsumoId] = useState<number>(insumos[0]?.id || 1)
  const [recetaCantidad, setRecetaCantidad] = useState<string | number>(0.25)

  // Formulario Crear / Editar Insumo
  const [formNombre, setFormNombre] = useState('')
  const [formUnidad, setFormUnidad] = useState('kg')
  const [formStockActual, setFormStockActual] = useState<string | number>(5)
  const [formStockMinimo, setFormStockMinimo] = useState<string | number>(2)

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
    const numCantidad = parseFloat(String(cantidad))
    if (!selectedInsumo || isNaN(numCantidad) || numCantidad <= 0) {
      alert('Por favor ingresa una cantidad válida mayor a 0.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await registrarMovimientoInventario({
        insumo_id: selectedInsumo.id,
        tipo: tipoMov,
        cantidad: numCantidad,
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
        cantidad: numCantidad,
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

    const stockAct = parseFloat(String(formStockActual)) || 0
    const stockMin = parseFloat(String(formStockMinimo)) || 0

    setIsSubmitting(true)
    try {
      const res = await crearInsumo({
        nombre: formNombre,
        unidad: formUnidad,
        stock_actual: stockAct,
        stock_minimo: stockMin,
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

    const stockAct = parseFloat(String(formStockActual)) || 0
    const stockMin = parseFloat(String(formStockMinimo)) || 0

    setIsSubmitting(true)
    try {
      const res = await editarInsumo(selectedInsumo.id, {
        nombre: formNombre,
        unidad: formUnidad,
        stock_actual: stockAct,
        stock_minimo: stockMin,
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

  const handleCopyShoppingList = () => {
    const listLines = insumos.map((i) => {
      const demandaEstimada = Number(i.stock_minimo) * 1.8
      const sugerido = Math.max(0, Math.ceil(demandaEstimada + Number(i.stock_minimo) - Number(i.stock_actual)))
      return `• ${i.nombre}: Pedir ${sugerido} ${i.unidad} (Stock actual: ${i.stock_actual} ${i.unidad})`
    })

    const textToCopy = `🦐 PEDIDO DE INSUMOS - MAREA NEGRA 🌊\nFecha: ${new Date().toLocaleDateString('es-MX')}\n\n${listLines.join('\n')}\n\nFavor de confirmar entrega y horario de llegada. ¡Muchas gracias!`

    navigator.clipboard.writeText(textToCopy)
    setCopiedOrder(true)
    setTimeout(() => setCopiedOrder(false), 3000)
  }

  const handleOpenRecetaModal = (platillo?: Platillo) => {
    if (platillo) {
      setRecetaPlatilloId(platillo.id)
    }
    setRecetaInsumoId(insumos[0]?.id || 1)
    setRecetaCantidad(0.25)
    setActiveModal('receta')
  }

  const handleGuardarReceta = async (e: React.FormEvent) => {
    e.preventDefault()
    const cantNum = parseFloat(String(recetaCantidad))
    if (isNaN(cantNum) || cantNum <= 0) {
      alert('Ingresa una cantidad por porción válida mayor a 0.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await guardarIngredienteReceta(recetaPlatilloId, recetaInsumoId, cantNum)
      if (res.success) {
        const platilloObj = platillos.find((p) => p.id === recetaPlatilloId)
        const insumoObj = insumos.find((i) => i.id === recetaInsumoId)
        setRecetas((prev) => {
          const filtered = prev.filter(
            (r) => !(r.platillo_id === recetaPlatilloId && r.insumo_id === recetaInsumoId)
          )
          return [
            ...filtered,
            {
              id: Date.now(),
              platillo_id: recetaPlatilloId,
              insumo_id: recetaInsumoId,
              cantidad_por_porcion: cantNum,
              platillo: platilloObj,
              insumo: insumoObj,
            },
          ]
        })
        setActiveModal(null)
      } else {
        alert(res.error || 'Error al guardar ingrediente en la receta.')
      }
    } catch (err) {
      console.error('Error guardando receta:', err)
      alert('Ocurrió un error al guardar la receta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEliminarIngrediente = async (id: number) => {
    if (!confirm('¿Deseas quitar este ingrediente de la receta?')) return

    try {
      await eliminarIngredienteReceta(id)
      setRecetas((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error('Error eliminando ingrediente:', err)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/10 pb-4">
        <div>
          <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase">
            CONTROL DE INGREDIENTES, MERMA & ESCANDALLOS
          </span>
          <h1 className="font-display text-4xl text-blanco tracking-wide">
            INVENTARIO & RECETAS DE COCINA
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenRecetaModal()}
            className="bg-carbon border border-oro/40 hover:border-oro text-oro hover:text-blanco font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-full transition-all flex items-center gap-2"
          >
            <ChefHat className="w-4 h-4" />
            <span>CONFIGURAR RECETA</span>
          </button>

          <button
            onClick={handleOpenCrearModal}
            className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-full shadow-[0_0_20px_rgba(42,191,191,0.3)] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>NUEVO INSUMO</span>
          </button>
        </div>
      </div>

      {/* PESTAÑAS: STOCK ACTUAL VS RECETAS VS PROYECCIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-carbon p-1.5 rounded-2xl border border-arena/20">
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-sans font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'stock'
              ? 'bg-turquesa text-negro shadow-md'
              : 'text-arena/70 hover:text-blanco'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>STOCK ACTUAL ({insumos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recetas')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-sans font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'recetas'
              ? 'bg-oro text-negro shadow-md'
              : 'text-arena/70 hover:text-blanco'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>🍳 RECETAS & ESCANDALLOS ({platillos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('proyeccion')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-sans font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'proyeccion'
              ? 'bg-gradient-to-r from-coral to-amber-600 text-blanco shadow-md'
              : 'text-arena/70 hover:text-blanco'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>📊 PROYECCIÓN FIN DE SEMANA</span>
        </button>
      </div>

      {/* VISTA 1: STOCK ACTUAL */}
      {activeTab === 'stock' && (
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
      )}

      {/* VISTA 2: PROYECCIÓN PREDICTIVA DE COMPRAS PARA FIN DE SEMANA */}
      {activeTab === 'proyeccion' && (
        <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
          {/* BANNER EXPLICATIVO */}
          <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-oro/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-oro/20 text-oro rounded-2xl border border-oro/30">
                <Truck className="w-6 h-6 text-oro" />
              </div>
              <div>
                <h3 className="font-display text-2xl text-negro dark:text-blanco">
                  PROYECCIÓN INTELIGENTE DE COMPRAS (VIE - DOM)
                </h3>
                <p className="text-xs text-negro/70 dark:text-arena/70">
                  Cálculo automático de demanda para asegurar stock en horas pico sin generar merma innecesaria.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyShoppingList}
              className="bg-oro text-negro hover:bg-blanco font-sans font-bold text-xs py-3 px-5 rounded-2xl shadow-lg transition-all flex items-center gap-2 border border-oro/40 shrink-0"
            >
              {copiedOrder ? (
                <>
                  <Check className="w-4 h-4 text-negro" />
                  <span>¡LISTA COPIADA!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>📋 COPIAR LISTA PARA PROVEEDOR</span>
                </>
              )}
            </button>
          </div>

          {/* TABLA DE INSUMOS CON SEMÁFORO DE COMPRA */}
          <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-oro/30 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-arena/20 text-arena uppercase text-[10px] tracking-wider">
                    <th className="pb-3">Insumo</th>
                    <th className="pb-3 text-center">Stock Actual</th>
                    <th className="pb-3 text-center">Consumo Estimado (Fin de Semana)</th>
                    <th className="pb-3 text-center">Stock Mínimo</th>
                    <th className="pb-3 text-center">Sugerencia de Compra</th>
                    <th className="pb-3 text-right">Estado / Urgencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arena/10">
                  {insumos.map((insumo) => {
                    const demandaEstimada = Number(insumo.stock_minimo) * 1.8
                    const sugerido = Math.max(
                      0,
                      Math.ceil(demandaEstimada + Number(insumo.stock_minimo) - Number(insumo.stock_actual))
                    )
                    const isLow = insumo.stock_actual <= insumo.stock_minimo

                    return (
                      <tr key={insumo.id} className="hover:bg-arena/5 transition-colors">
                        <td className="py-4 font-bold text-sm text-negro dark:text-blanco">
                          {insumo.nombre}
                        </td>
                        <td className="py-4 text-center font-mono font-bold text-turquesa">
                          {insumo.stock_actual} {insumo.unidad}
                        </td>
                        <td className="py-4 text-center font-mono text-arena/80">
                          ~{demandaEstimada.toFixed(1)} {insumo.unidad}
                        </td>
                        <td className="py-4 text-center font-mono text-arena/60">
                          {insumo.stock_minimo} {insumo.unidad}
                        </td>
                        <td className="py-4 text-center">
                          {sugerido > 0 ? (
                            <span className="font-display text-lg text-coral font-bold bg-coral/10 px-3 py-1 rounded-xl border border-coral/30">
                              Pedir +{sugerido} {insumo.unidad}
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-mono font-bold bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-500/30">
                              Cubierto ✅
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          {isLow ? (
                            <span className="text-[10px] font-bold text-coral bg-coral/20 border border-coral/40 px-2.5 py-1 rounded-full uppercase animate-pulse">
                              🔴 Crítico / Urgente
                            </span>
                          ) : sugerido > 0 ? (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase">
                              🟡 Comprar p/ Fin de Semana
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
                              🟢 Stock Óptimo
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: RECETAS & ESCANDALLOS */}
      {activeTab === 'recetas' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="bg-[#050404] bg-dots-pattern border border-oro/30 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-oro/10 border border-oro/30 rounded-2xl text-oro shadow-inner">
                <ChefHat className="w-8 h-8" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-sans font-bold tracking-widest text-turquesa uppercase">
                  DESCUENTO AUTOMÁTICO POR COMANDA
                </span>
                <h2 className="font-display text-3xl text-blanco tracking-wide">
                  RECETARIO & ESCANDALLOS DE PLATILLOS
                </h2>
                <span className="text-xs font-serif italic text-arena/80">
                  Cada vez que una orden entra a cocina o se entrega, el sistema descuenta automáticamente los gramos/unidades exactas de tus insumos.
                </span>
              </div>
            </div>

            <button
              onClick={() => handleOpenRecetaModal()}
              className="bg-oro text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider px-6 py-3.5 rounded-full shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all flex items-center gap-2 self-start md:self-auto shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>AGREGAR INGREDIENTE A PLATILLO</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platillos.map((platillo) => {
              const ingredientesPlatillo = recetas.filter((r) => r.platillo_id === platillo.id)

              return (
                <div
                  key={platillo.id}
                  className="bg-[#0A0A0A] border border-arena/20 hover:border-oro/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4 transition-all group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-arena/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{platillo.emoji || '🦐'}</span>
                        <div className="flex flex-col">
                          <span className="font-display text-xl text-blanco tracking-wide group-hover:text-oro transition-colors">
                            {platillo.nombre}
                          </span>
                          <span className="text-[11px] font-mono text-turquesa font-bold">
                            ${Number(platillo.precio).toFixed(0)} MXN
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenRecetaModal(platillo)}
                        className="p-1.5 bg-carbon hover:bg-oro text-arena hover:text-negro border border-arena/20 rounded-lg transition-all"
                        title="Agregar insumo a este platillo"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Lista de Ingredientes del Escandallo */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-sans font-bold text-arena/60 uppercase tracking-widest">
                        Ingredientes por porción:
                      </span>

                      {ingredientesPlatillo.length > 0 ? (
                        <div className="flex flex-col gap-1.5 divide-y divide-arena/5">
                          {ingredientesPlatillo.map((rec) => {
                            const insumoName = rec.insumo?.nombre || insumos.find((i) => i.id === rec.insumo_id)?.nombre || `Insumo #${rec.insumo_id}`
                            const insumoUnidad = rec.insumo?.unidad || insumos.find((i) => i.id === rec.insumo_id)?.unidad || ''

                            return (
                              <div
                                key={rec.id}
                                className="pt-1.5 first:pt-0 flex items-center justify-between text-xs"
                              >
                                <span className="text-arena font-medium flex items-center gap-1.5">
                                  <span className="text-coral">▪</span>
                                  <span>{insumoName}</span>
                                </span>

                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-turquesa bg-turquesa/10 px-2 py-0.5 rounded border border-turquesa/20 text-[11px]">
                                    {rec.cantidad_por_porcion} {insumoUnidad}
                                  </span>

                                  <button
                                    onClick={() => handleEliminarIngrediente(rec.id)}
                                    className="text-arena/40 hover:text-coral transition-colors p-1"
                                    title="Quitar de receta"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-carbon/50 rounded-xl border border-dashed border-arena/20 text-center flex flex-col items-center gap-1">
                          <Utensils className="w-4 h-4 text-arena/40" />
                          <span className="text-[11px] font-serif italic text-arena/50">
                            Sin receta configurada aún
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-arena/10 pt-3 flex items-center justify-between text-[10px] text-arena/60">
                    <span>{ingredientesPlatillo.length} insumos asignados</span>
                    <span className="text-turquesa font-bold">Auto-descuento activo ✓</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* BITÁCORA DE MOVIMIENTOS RECIENTES (SOLO EN TAB STOCK) */}
      {activeTab === 'stock' && (
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
                    timestamp={mov.created_at ? new Date(mov.created_at).toLocaleString('es-MX', { timeZone: 'America/Mazatlan', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'Hoy'}
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
      )}

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
                  step="any"
                  min="0.001"
                  placeholder="Ej. 1, 0.5 o 2.5"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="bg-carbon border border-arena/20 rounded-lg px-4 py-3 text-base text-blanco font-bold focus:border-turquesa focus:outline-none"
                />
                <span className="text-[11px] font-serif italic text-arena/60">
                  Puedes escribir números enteros (ej. 1, 2) o decimales (ej. 0.5, 1.5, 0.25).
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
                    <span>CONFIRMAR {tipoMov.toUpperCase()} ({cantidad || 0} {selectedInsumo.unidad})</span>
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
                    step="any"
                    min="0"
                    placeholder="0"
                    value={formStockActual}
                    onChange={(e) => setFormStockActual(e.target.value)}
                    className="bg-carbon border border-arena/20 rounded-lg px-3 py-2.5 text-xs text-blanco focus:border-turquesa focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans text-arena uppercase">Stock Mínimo</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={formStockMinimo}
                    onChange={(e) => setFormStockMinimo(e.target.value)}
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

      {/* MODAL: CONFIGURAR INGREDIENTE EN RECETA */}
      {activeModal === 'receta' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0D0907] border border-oro/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-arena hover:text-coral rounded-full hover:bg-carbon transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-arena/10 pb-4 mb-4">
              <div className="p-2.5 bg-oro/10 border border-oro/30 rounded-xl text-oro">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-widest">
                  ESCANDALLO DE COCINA
                </span>
                <h3 className="font-display text-2xl text-blanco tracking-wide">
                  AGREGAR INGREDIENTE
                </h3>
              </div>
            </div>

            <form onSubmit={handleGuardarReceta} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans text-arena uppercase font-bold">
                  Platillo
                </label>
                <select
                  value={recetaPlatilloId}
                  onChange={(e) => setRecetaPlatilloId(Number(e.target.value))}
                  className="bg-carbon border border-arena/20 rounded-xl px-3 py-3 text-sm text-blanco focus:border-oro focus:outline-none"
                >
                  {platillos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji || '🦐'} {p.nombre} (${Number(p.precio).toFixed(0)} MXN)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans text-arena uppercase font-bold">
                  Insumo a Descontar
                </label>
                <select
                  value={recetaInsumoId}
                  onChange={(e) => setRecetaInsumoId(Number(e.target.value))}
                  className="bg-carbon border border-arena/20 rounded-xl px-3 py-3 text-sm text-blanco focus:border-turquesa focus:outline-none"
                >
                  {insumos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} ({i.unidad}) - Stock: {i.stock_actual} {i.unidad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans text-arena uppercase font-bold flex justify-between">
                  <span>Cantidad por Porción</span>
                  <span className="text-turquesa">
                    Unidad:{' '}
                    {insumos.find((i) => i.id === recetaInsumoId)?.unidad || 'kg'}
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  required
                  placeholder="Ej. 0.250"
                  value={recetaCantidad}
                  onChange={(e) => setRecetaCantidad(e.target.value)}
                  className="bg-carbon border border-arena/20 rounded-xl px-4 py-3 text-base font-mono text-blanco focus:border-turquesa focus:outline-none"
                />
                <span className="text-[11px] font-serif italic text-arena/60">
                  Ejemplo: 0.250 para 250 gramos de camarón, 1 para 1 pieza de tostada/aguacate.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-oro text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg mt-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>GUARDANDO RECETA...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>VINCULAR INGREDIENTE A PLATILLO</span>
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
