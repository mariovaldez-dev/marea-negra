'use client'

import React, { useState } from 'react'
import { Insumo, MovimientoInventario, TipoMovimiento, Platillo, PlatilloIngrediente } from '@/lib/types/database'
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
  Copy,
  PackageCheck,
  Truck,
  ChefHat,
  Utensils,
  BookOpen,
  Boxes,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

interface InventoryManagerProps {
  initialInsumos: Insumo[]
  historialMovimientos: MovimientoInventario[]
  initialPlatillos?: Platillo[]
  initialRecetas?: PlatilloIngrediente[]
}

const ITEMS_PER_PAGE = 10

export function InventoryManager({
  initialInsumos,
  historialMovimientos,
  initialPlatillos = [],
  initialRecetas = [],
}: InventoryManagerProps) {
  const [activeTab, setActiveTab] = useState<'stock' | 'recetas' | 'proyeccion' | 'bitacora'>('stock')
  const [insumos, setInsumos] = useState<Insumo[]>(initialInsumos)
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>(historialMovimientos)
  const [platillos] = useState<Platillo[]>(initialPlatillos)
  const [recetas, setRecetas] = useState<PlatilloIngrediente[]>(initialRecetas)
  const [copiedOrder, setCopiedOrder] = useState(false)

  // Estados de Búsqueda y Filtros Homologados
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<'todos' | 'bajo' | 'optimo'>('todos')
  const [recetasFilter, setRecetasFilter] = useState<'todos' | 'con_receta' | 'sin_receta'>('todos')
  const [proyeccionFilter, setProyeccionFilter] = useState<'todos' | 'critico' | 'surtir' | 'optimo'>('todos')
  const [bitacoraFilter, setBitacoraFilter] = useState<'todos' | 'entrada' | 'salida'>('todos')

  // Paginación Homologada
  const [currentPage, setCurrentPage] = useState(1)

  // Modales
  const [activeModal, setActiveModal] = useState<'movimiento' | 'nuevo' | 'editar' | 'receta' | null>(null)
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null)
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

  // Cambio de Pestaña con reinicio de página y búsqueda
  const handleTabChange = (tab: 'stock' | 'recetas' | 'proyeccion' | 'bitacora') => {
    setActiveTab(tab)
    setSearchQuery('')
    setCurrentPage(1)
  }

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

      setInsumos((prev) =>
        prev.map((item) =>
          item.id === selectedInsumo.id
            ? { ...item, stock_actual: res.nuevoStock }
            : item
        )
      )

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
      const sugerido = Math.max(
        0,
        Math.ceil(demandaEstimada + Number(i.stock_minimo) - Number(i.stock_actual))
      )
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

  // Métricas
  const lowStockCount = insumos.filter((i) => i.stock_actual <= i.stock_minimo).length
  const totalInsumos = insumos.length
  const totalRecetasLinked = recetas.length
  const totalMovimientos = movimientos.length

  // Listas filtradas por pestaña
  const filteredInsumos = insumos.filter((insumo) => {
    const matches = insumo.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    const isLow = insumo.stock_actual <= insumo.stock_minimo
    if (stockFilter === 'bajo') return matches && isLow
    if (stockFilter === 'optimo') return matches && !isLow
    return matches
  })

  const filteredPlatillos = platillos.filter((p) => {
    const matches = p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    const hasReceta = recetas.some((r) => r.platillo_id === p.id)
    if (recetasFilter === 'con_receta') return matches && hasReceta
    if (recetasFilter === 'sin_receta') return matches && !hasReceta
    return matches
  })

  const filteredProyeccion = insumos.filter((insumo) => {
    const matches = insumo.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    const demandaEstimada = Number(insumo.stock_minimo) * 1.8
    const sugerido = Math.max(
      0,
      Math.ceil(demandaEstimada + Number(insumo.stock_minimo) - Number(insumo.stock_actual))
    )
    const isLow = insumo.stock_actual <= insumo.stock_minimo

    if (proyeccionFilter === 'critico') return matches && isLow
    if (proyeccionFilter === 'surtir') return matches && !isLow && sugerido > 0
    if (proyeccionFilter === 'optimo') return matches && !isLow && sugerido === 0
    return matches
  })

  const filteredMovimientos = movimientos.filter((m) => {
    const insumoNombre = m.insumo?.nombre || ''
    const motivoText = m.motivo || ''
    const matches =
      insumoNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      motivoText.toLowerCase().includes(searchQuery.toLowerCase())
    if (bitacoraFilter === 'entrada') return matches && m.tipo === 'entrada'
    if (bitacoraFilter === 'salida') return matches && m.tipo === 'salida'
    return matches
  })

  return (
    <div className="flex flex-col gap-6 relative min-h-[calc(100vh-140px)] w-full max-w-7xl mx-auto pb-20">
      {/* ── BENTO HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="bg-coral text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              CONTROL DE COCINA
            </span>
            <span className="text-[11px] font-sans font-medium text-black/50 dark:text-white/50">
              Insumos, Merma & Escandallos
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-black dark:text-white tracking-wide">
            INVENTARIO & RECETAS
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenRecetaModal()}
            className="inline-flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white border border-black/10 dark:border-white/10 font-sans font-bold text-xs tracking-wider px-4 py-2.5 rounded-full transition-all active:scale-95"
          >
            <ChefHat className="w-4 h-4 text-oro" />
            <span>VINCULAR INGREDIENTE</span>
          </button>

          <button
            onClick={handleOpenCrearModal}
            className="inline-flex items-center gap-2 bg-coral text-white hover:bg-coral/90 font-sans font-bold text-xs tracking-wider px-5 py-2.5 rounded-full shadow-[0_4px_20px_rgba(232,67,10,0.35)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>NUEVO INSUMO</span>
          </button>
        </div>
      </div>

      {/* ── 4 BENTO KPI CARDS HOMOLOGADAS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[24px] p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-black/50 dark:text-white/50">
              TOTAL INSUMOS
            </span>
            <span className="font-display text-2xl sm:text-3xl text-black dark:text-white">
              {totalInsumos}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-turquesa/10 dark:bg-turquesa/20 text-turquesa flex items-center justify-center">
            <Boxes className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[24px] p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-black/50 dark:text-white/50">
              STOCK BAJO
            </span>
            <span
              className={`font-display text-2xl sm:text-3xl ${
                lowStockCount > 0 ? 'text-coral' : 'text-[#16A34B]'
              }`}
            >
              {lowStockCount}
            </span>
          </div>
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              lowStockCount > 0
                ? 'bg-coral/10 dark:bg-coral/20 text-coral'
                : 'bg-[#16A34B]/10 dark:bg-[#16A34B]/20 text-[#16A34B]'
            }`}
          >
            {lowStockCount > 0 ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4 stroke-[3]" />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[24px] p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-black/50 dark:text-white/50">
              ESCANDALLOS
            </span>
            <span className="font-display text-2xl sm:text-3xl text-oro">
              {totalRecetasLinked}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-oro/10 dark:bg-oro/20 text-oro flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[24px] p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-black/50 dark:text-white/50">
              MOVIMIENTOS
            </span>
            <span className="font-display text-2xl sm:text-3xl text-black dark:text-white">
              {totalMovimientos}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── 4 PESTAÑAS SEGMENTADAS HOMOLOGADAS ─────────────────────────────────── */}
      <div className="flex items-center p-1 bg-black/[0.04] dark:bg-white/[0.05] rounded-full border border-black/5 dark:border-white/10 w-full sm:w-fit overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => handleTabChange('stock')}
          className={`px-4 py-2 rounded-full text-xs font-sans font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'stock'
              ? 'bg-turquesa text-black shadow-sm font-extrabold'
              : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>STOCK ACTUAL ({insumos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('recetas')}
          className={`px-4 py-2 rounded-full text-xs font-sans font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'recetas'
              ? 'bg-oro text-black shadow-sm font-extrabold'
              : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>RECETARIO & ESCANDALLOS ({platillos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('proyeccion')}
          className={`px-4 py-2 rounded-full text-xs font-sans font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'proyeccion'
              ? 'bg-coral text-white shadow-sm font-extrabold'
              : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>PROYECCIÓN COMPRAS</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('bitacora')}
          className={`px-4 py-2 rounded-full text-xs font-sans font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'bitacora'
              ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm font-extrabold'
              : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>BITÁCORA ({movimientos.length})</span>
        </button>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ESTÁNDAR HOMOLOGADA ────────────────────── */}
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[28px] p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-black/40 dark:text-white/40" />
          <input
            type="text"
            placeholder={
              activeTab === 'stock'
                ? 'Buscar insumo por nombre...'
                : activeTab === 'recetas'
                ? 'Buscar platillo por nombre...'
                : activeTab === 'proyeccion'
                ? 'Filtrar insumo para compra...'
                : 'Buscar en bitácora...'
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-black dark:text-white focus:border-turquesa focus:outline-none transition-all"
          />
        </div>

        {/* Filtros dinámicos según pestaña activa */}
        <div className="flex items-center gap-1.5 w-full md:w-auto flex-wrap justify-start md:justify-end">
          {activeTab === 'stock' && (
            <>
              <button
                onClick={() => { setStockFilter('todos'); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all ${
                  stockFilter === 'todos'
                    ? 'bg-black/10 dark:bg-white/15 text-black dark:text-white font-extrabold'
                    : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                Todos ({insumos.length})
              </button>
              <button
                onClick={() => { setStockFilter('bajo'); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all ${
                  stockFilter === 'bajo'
                    ? 'bg-coral text-white shadow-sm'
                    : 'text-black/60 dark:text-white/60 hover:text-coral'
                }`}
              >
                ⚠️ Bajo ({lowStockCount})
              </button>
              <button
                onClick={() => { setStockFilter('optimo'); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all ${
                  stockFilter === 'optimo'
                    ? 'bg-[#16A34B] text-white shadow-sm'
                    : 'text-black/60 dark:text-white/60 hover:text-[#16A34B]'
                }`}
              >
                ✅ Óptimo ({insumos.length - lowStockCount})
              </button>
            </>
          )}

          {activeTab === 'recetas' && (
            <>
              <button
                onClick={() => { setRecetasFilter('todos'); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all ${
                  recetasFilter === 'todos'
                    ? 'bg-black/10 dark:bg-white/15 text-black dark:text-white font-extrabold'
                    : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                Todos ({platillos.length})
              </button>
              <button
                onClick={() => { setRecetasFilter('con_receta'); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all ${
                  recetasFilter === 'con_receta'
                    ? 'bg-oro text-black shadow-sm font-extrabold'
                    : 'text-black/60 dark:text-white/60 hover:text-oro'
                }`}
              >
                🍳 Con Escandallo
              </button>
              <button
                onClick={() => { setRecetasFilter('sin_receta'); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all ${
                  recetasFilter === 'sin_receta'
                    ? 'bg-black/10 dark:bg-white/15 text-black dark:text-white font-extrabold'
                    : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                Sin Receta
              </button>
            </>
          )}

          {activeTab === 'proyeccion' && (
            <>
              <button
                onClick={() => { setProyeccionFilter('todos'); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all ${
                  proyeccionFilter === 'todos'
                    ? 'bg-black/10 dark:bg-white/15 text-black dark:text-white font-extrabold'
                    : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                Todos ({insumos.length})
              </button>
              <button
                onClick={() => { setProyeccionFilter('critico'); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all ${
                  proyeccionFilter === 'critico'
                    ? 'bg-coral text-white shadow-sm'
                    : 'text-black/60 dark:text-white/60 hover:text-coral'
                }`}
              >
                🔴 Críticos
              </button>
              <button
                onClick={() => { setProyeccionFilter('surtir'); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all ${
                  proyeccionFilter === 'surtir'
                    ? 'bg-[#ECC94B] text-[#3A2D00] shadow-sm font-bold'
                    : 'text-black/60 dark:text-white/60 hover:text-[#ECC94B]'
                }`}
              >
                🟡 Surtir
              </button>
              <button
                type="button"
                onClick={handleCopyShoppingList}
                className="bg-coral text-white hover:bg-coral/90 font-sans font-bold text-xs py-1.5 px-3.5 rounded-full shadow-sm transition-all flex items-center gap-1 shrink-0 ml-1"
              >
                {copiedOrder ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar WhatsApp</span>
                  </>
                )}
              </button>
            </>
          )}

          {activeTab === 'bitacora' && (
            <>
              <button
                onClick={() => { setBitacoraFilter('todos'); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all ${
                  bitacoraFilter === 'todos'
                    ? 'bg-black/10 dark:bg-white/15 text-black dark:text-white font-extrabold'
                    : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                Todos ({movimientos.length})
              </button>
              <button
                onClick={() => { setBitacoraFilter('entrada'); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all ${
                  bitacoraFilter === 'entrada'
                    ? 'bg-turquesa text-black shadow-sm font-extrabold'
                    : 'text-black/60 dark:text-white/60 hover:text-turquesa'
                }`}
              >
                ➕ Entradas
              </button>
              <button
                onClick={() => { setBitacoraFilter('salida'); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all ${
                  bitacoraFilter === 'salida'
                    ? 'bg-coral text-white shadow-sm font-extrabold'
                    : 'text-black/60 dark:text-white/60 hover:text-coral'
                }`}
              >
                ➖ Salidas / Mermas
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── TAB 1: STOCK ACTUAL (LISTA BENTO) ─────────────────────────────────── */}
      {activeTab === 'stock' && (() => {
        const totalPages = Math.ceil(filteredInsumos.length / ITEMS_PER_PAGE) || 1
        const safePage = Math.min(currentPage, totalPages)
        const paginated = filteredInsumos.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

        return (
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[28px] overflow-hidden shadow-sm flex flex-col">
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {filteredInsumos.length === 0 ? (
                <div className="p-12 text-center text-black/40 dark:text-white/40 text-xs font-sans">
                  No se encontraron insumos que coincidan con la búsqueda.
                </div>
              ) : (
                paginated.map((insumo) => {
                  const isLow = insumo.stock_actual <= insumo.stock_minimo
                  const percentage = Math.min(
                    100,
                    Math.round((insumo.stock_actual / (insumo.stock_minimo * 2.5)) * 100)
                  )

                  return (
                    <div
                      key={insumo.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-3 h-3 rounded-full shrink-0 ${
                            isLow ? 'bg-coral shadow-[0_0_8px_#E8430A]' : 'bg-[#16A34B]'
                          }`}
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-sans font-bold text-sm sm:text-base text-black dark:text-white truncate">
                              {insumo.nombre}
                            </h4>
                            <span className="text-[10px] font-mono font-bold text-black/50 dark:text-white/50 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md uppercase">
                              {insumo.unidad}
                            </span>
                            {isLow ? (
                              <span className="text-[10px] font-sans font-bold uppercase px-2.5 py-0.5 rounded-full bg-coral text-white shadow-sm">
                                Stock Bajo
                              </span>
                            ) : (
                              <span className="text-[10px] font-sans font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#16A34B] text-white shadow-sm">
                                Óptimo
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-sans text-black/50 dark:text-white/50 mt-0.5">
                            Mínimo requerido: {insumo.stock_minimo} {insumo.unidad}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                        <div className="flex flex-col items-start md:items-end min-w-[120px]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-2xl sm:text-3xl text-black dark:text-white font-bold">
                              {insumo.stock_actual}
                            </span>
                            <span className="text-xs font-mono font-bold text-black/50 dark:text-white/50">
                              {insumo.unidad}
                            </span>
                          </div>
                          <div className="w-24 h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isLow ? 'bg-coral' : 'bg-turquesa'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenMovModal(insumo, 'entrada')}
                            className="bg-turquesa text-black hover:bg-turquesa/80 font-sans font-bold text-[11px] py-1.5 px-3 rounded-full transition-all flex items-center gap-1 shadow-sm active:scale-95"
                            title="Registrar Entrada"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>Entrada</span>
                          </button>

                          <button
                            onClick={() => handleOpenMovModal(insumo, 'salida')}
                            className="bg-coral text-white hover:bg-coral/90 font-sans font-bold text-[11px] py-1.5 px-3 rounded-full transition-all flex items-center gap-1 shadow-sm active:scale-95"
                            title="Registrar Salida / Merma"
                          >
                            <Minus className="w-3 h-3 stroke-[3]" />
                            <span>Salida</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditarModal(insumo)}
                            className="p-2 text-black/70 dark:text-white/70 hover:text-turquesa bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full transition-all active:scale-95"
                            title="Editar Insumo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleEliminarInsumo(insumo)}
                            className="p-2 text-red-500 hover:text-white hover:bg-red-500 bg-red-500/10 border border-red-500/20 rounded-full transition-all active:scale-95"
                            title="Eliminar Insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Paginación Homologada */}
            {filteredInsumos.length > 0 && (
              <div className="p-3.5 sm:p-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans">
                <span className="text-black/60 dark:text-white/60">
                  Mostrando <strong className="text-black dark:text-white font-bold">{(safePage - 1) * ITEMS_PER_PAGE + 1}</strong> -{' '}
                  <strong className="text-black dark:text-white font-bold">{Math.min(safePage * ITEMS_PER_PAGE, filteredInsumos.length)}</strong> de{' '}
                  <strong className="text-black dark:text-white font-bold">{filteredInsumos.length}</strong> insumos
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="py-1 px-3 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                            safePage === num
                              ? 'bg-turquesa text-black shadow-sm font-extrabold'
                              : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="py-1 px-3 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs flex items-center gap-1"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── TAB 2: RECETARIO & ESCANDALLOS (LISTA BENTO) ──────────────────────── */}
      {activeTab === 'recetas' && (() => {
        const totalPages = Math.ceil(filteredPlatillos.length / ITEMS_PER_PAGE) || 1
        const safePage = Math.min(currentPage, totalPages)
        const paginated = filteredPlatillos.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

        return (
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[28px] overflow-hidden shadow-sm flex flex-col">
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {filteredPlatillos.length === 0 ? (
                <div className="p-12 text-center text-black/40 dark:text-white/40 text-xs font-sans">
                  No se encontraron platillos.
                </div>
              ) : (
                paginated.map((platillo) => {
                  const ingredientesPlatillo = recetas.filter((r) => r.platillo_id === platillo.id)

                  return (
                    <div
                      key={platillo.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Info del platillo */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="text-2xl shrink-0 mt-0.5">{platillo.emoji || '🦐'}</span>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-sans font-bold text-sm sm:text-base text-black dark:text-white truncate">
                              {platillo.nombre}
                            </h4>
                            <span className="font-mono text-xs font-bold text-coral">
                              ${Number(platillo.precio).toFixed(0)} MXN
                            </span>
                            <span className="text-[10px] font-sans font-bold uppercase px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60">
                              {ingredientesPlatillo.length} insumos
                            </span>
                          </div>

                          {/* Chips de Ingredientes en Escandallo */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-2">
                            {ingredientesPlatillo.length > 0 ? (
                              ingredientesPlatillo.map((rec) => {
                                const insumoName =
                                  rec.insumo?.nombre ||
                                  insumos.find((i) => i.id === rec.insumo_id)?.nombre ||
                                  `Insumo #${rec.insumo_id}`
                                const insumoUnidad =
                                  rec.insumo?.unidad ||
                                  insumos.find((i) => i.id === rec.insumo_id)?.unidad ||
                                  ''

                                return (
                                  <span
                                    key={rec.id}
                                    className="inline-flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-full px-2.5 py-1 text-[11px] font-sans text-black/80 dark:text-white/80"
                                  >
                                    <span className="font-bold text-black dark:text-white">{insumoName}:</span>
                                    <strong className="text-turquesa font-mono">
                                      {rec.cantidad_por_porcion} {insumoUnidad}
                                    </strong>
                                    <button
                                      onClick={() => handleEliminarIngrediente(rec.id)}
                                      className="text-black/40 dark:text-white/40 hover:text-red-500 transition-colors ml-0.5"
                                      title="Quitar ingrediente"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                )
                              })
                            ) : (
                              <span className="text-xs font-sans text-black/40 dark:text-white/40">
                                Sin ingredientes configurados para auto-descuento
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botón Vincular Ingrediente */}
                      <div className="shrink-0 flex items-center justify-end">
                        <button
                          onClick={() => handleOpenRecetaModal(platillo)}
                          className="bg-oro text-black hover:bg-oro/90 font-sans font-bold text-xs py-2 px-4 rounded-full transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>+ Ingrediente</span>
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Paginación */}
            {filteredPlatillos.length > 0 && (
              <div className="p-3.5 sm:p-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans">
                <span className="text-black/60 dark:text-white/60">
                  Mostrando <strong className="text-black dark:text-white font-bold">{(safePage - 1) * ITEMS_PER_PAGE + 1}</strong> -{' '}
                  <strong className="text-black dark:text-white font-bold">{Math.min(safePage * ITEMS_PER_PAGE, filteredPlatillos.length)}</strong> de{' '}
                  <strong className="text-black dark:text-white font-bold">{filteredPlatillos.length}</strong> platillos
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="py-1 px-3 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                            safePage === num
                              ? 'bg-oro text-black shadow-sm font-extrabold'
                              : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="py-1 px-3 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs flex items-center gap-1"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── TAB 3: PROYECCIÓN DE COMPRAS (TABLA BENTO) ────────────────────────── */}
      {activeTab === 'proyeccion' && (() => {
        const totalPages = Math.ceil(filteredProyeccion.length / ITEMS_PER_PAGE) || 1
        const safePage = Math.min(currentPage, totalPages)
        const paginated = filteredProyeccion.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

        return (
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[28px] overflow-hidden shadow-sm flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 uppercase text-[10px] tracking-wider bg-black/[0.01] dark:bg-white/[0.01]">
                    <th className="p-4">Insumo</th>
                    <th className="p-4 text-center">Stock Actual</th>
                    <th className="p-4 text-center">Consumo Estimado (Fin de Semana)</th>
                    <th className="p-4 text-center">Stock Mínimo</th>
                    <th className="p-4 text-center">Sugerencia de Compra</th>
                    <th className="p-4 text-right">Estado / Urgencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {filteredProyeccion.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-black/40 dark:text-white/40 text-xs font-sans">
                        No hay insumos para la proyección seleccionada.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((insumo) => {
                      const demandaEstimada = Number(insumo.stock_minimo) * 1.8
                      const sugerido = Math.max(
                        0,
                        Math.ceil(demandaEstimada + Number(insumo.stock_minimo) - Number(insumo.stock_actual))
                      )
                      const isLow = insumo.stock_actual <= insumo.stock_minimo

                      return (
                        <tr key={insumo.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-bold text-sm text-black dark:text-white">
                            {insumo.nombre}
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-turquesa">
                            {insumo.stock_actual} {insumo.unidad}
                          </td>
                          <td className="p-4 text-center font-mono text-black/70 dark:text-white/70">
                            ~{demandaEstimada.toFixed(1)} {insumo.unidad}
                          </td>
                          <td className="p-4 text-center font-mono text-black/50 dark:text-white/50">
                            {insumo.stock_minimo} {insumo.unidad}
                          </td>
                          <td className="p-4 text-center">
                            {sugerido > 0 ? (
                              <span className="font-display text-lg text-coral font-bold bg-coral/10 px-3 py-1 rounded-full border border-coral/20">
                                Pedir +{sugerido} {insumo.unidad}
                              </span>
                            ) : (
                              <span className="text-[#16A34B] font-sans font-bold bg-[#16A34B]/10 px-3 py-1 rounded-full text-xs">
                                Cubierto ✓
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {isLow ? (
                              <span className="text-[10px] font-bold text-white bg-coral px-2.5 py-1 rounded-full uppercase shadow-sm">
                                🔴 Crítico
                              </span>
                            ) : sugerido > 0 ? (
                              <span className="text-[10px] font-bold text-[#3A2D00] bg-[#ECC94B] px-2.5 py-1 rounded-full uppercase shadow-sm">
                                🟡 Surtir
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-white bg-[#16A34B] px-2.5 py-1 rounded-full uppercase shadow-sm">
                                🟢 Óptimo
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {filteredProyeccion.length > 0 && (
              <div className="p-3.5 sm:p-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans">
                <span className="text-black/60 dark:text-white/60">
                  Mostrando <strong className="text-black dark:text-white font-bold">{(safePage - 1) * ITEMS_PER_PAGE + 1}</strong> -{' '}
                  <strong className="text-black dark:text-white font-bold">{Math.min(safePage * ITEMS_PER_PAGE, filteredProyeccion.length)}</strong> de{' '}
                  <strong className="text-black dark:text-white font-bold">{filteredProyeccion.length}</strong> insumos
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="py-1 px-3 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                            safePage === num
                              ? 'bg-coral text-white shadow-sm font-extrabold'
                              : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="py-1 px-3 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs flex items-center gap-1"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── TAB 4: BITÁCORA DE MOVIMIENTOS (LISTA BENTO) ───────────────────────── */}
      {activeTab === 'bitacora' && (() => {
        const totalPages = Math.ceil(filteredMovimientos.length / ITEMS_PER_PAGE) || 1
        const safePage = Math.min(currentPage, totalPages)
        const paginated = filteredMovimientos.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

        return (
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[28px] overflow-hidden shadow-sm flex flex-col">
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {filteredMovimientos.length === 0 ? (
                <div className="p-12 text-center text-black/40 dark:text-white/40 text-xs font-sans">
                  No hay movimientos registrados en la bitácora.
                </div>
              ) : (
                paginated.map((mov) => {
                  const insumoNombre = mov.insumo?.nombre || `Insumo #${mov.insumo_id}`
                  const isEntrada = mov.tipo === 'entrada'

                  return (
                    <div
                      key={mov.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isEntrada ? 'bg-turquesa text-black' : 'bg-coral text-white'
                          }`}
                        >
                          {isEntrada ? '+' : '-'}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-sans font-bold text-sm sm:text-base text-black dark:text-white truncate">
                              {insumoNombre}
                            </h4>
                            <span
                              className={`text-[10px] font-sans font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                isEntrada ? 'bg-turquesa text-black' : 'bg-coral text-white'
                              }`}
                            >
                              {isEntrada ? 'Entrada' : 'Salida / Merma'}
                            </span>
                          </div>
                          <span className="text-xs font-sans font-medium text-black/60 dark:text-white/60 mt-0.5">
                            {mov.motivo || 'Ajuste operativo'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                        <span
                          className={`font-display text-xl sm:text-2xl font-bold ${
                            isEntrada ? 'text-turquesa' : 'text-coral'
                          }`}
                        >
                          {isEntrada ? '+' : '-'}
                          {mov.cantidad} {mov.insumo?.unidad || ''}
                        </span>

                        <div className="flex flex-col items-end text-right text-[11px] font-mono text-black/50 dark:text-white/50">
                          <span>
                            {mov.created_at
                              ? new Date(mov.created_at).toLocaleString('es-MX', {
                                  timeZone: 'America/Mazatlan',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: 'short',
                                })
                              : 'Hoy'}
                          </span>
                          <span className="text-[10px] text-black/40 dark:text-white/40 font-sans">
                            {mov.created_by ? 'Administrador' : 'Sistema'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Paginación */}
            {filteredMovimientos.length > 0 && (
              <div className="p-3.5 sm:p-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans">
                <span className="text-black/60 dark:text-white/60">
                  Mostrando <strong className="text-black dark:text-white font-bold">{(safePage - 1) * ITEMS_PER_PAGE + 1}</strong> -{' '}
                  <strong className="text-black dark:text-white font-bold">{Math.min(safePage * ITEMS_PER_PAGE, filteredMovimientos.length)}</strong> de{' '}
                  <strong className="text-black dark:text-white font-bold">{filteredMovimientos.length}</strong> movimientos
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="py-1 px-3 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                            safePage === num
                              ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm font-extrabold'
                              : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="py-1 px-3 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs flex items-center gap-1"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── MODAL REGISTRAR MOVIMIENTO ────────────────────────────────────────── */}
      {activeModal === 'movimiento' && selectedInsumo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-md p-6 md:p-8 shadow-2xl relative text-black dark:text-white flex flex-col gap-5">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 p-2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-sans font-bold tracking-widest text-turquesa uppercase">
                AJUSTE DE INVENTARIO
              </span>
              <h2 className="font-display text-2xl sm:text-3xl text-black dark:text-white">
                REGISTRAR {tipoMov === 'entrada' ? 'ENTRADA' : 'SALIDA'}: {selectedInsumo.nombre}
              </h2>
            </div>

            <form onSubmit={handleMovSubmit} className="flex flex-col gap-4">
              {/* Atajos Rápidos */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-black/70 dark:text-white/70 uppercase font-bold">
                  Atajos Rápidos ({selectedInsumo.unidad}):
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[0.25, 0.5, 0.75, 1, 2, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCantidad(val)}
                      className={`py-2 text-xs font-sans font-bold rounded-xl border transition-all ${
                        cantidad === val
                          ? 'bg-turquesa text-black border-turquesa shadow-sm'
                          : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-black/70 dark:text-white/70 uppercase font-bold">
                  Cantidad ({selectedInsumo.unidad}) *
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  min="0.001"
                  placeholder="Ej. 1, 0.5 o 2.5"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-base text-black dark:text-white font-bold focus:border-turquesa focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-black/70 dark:text-white/70 uppercase font-bold">
                  Motivo / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Consumo de cocina o resurtido..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl p-3 text-xs text-black dark:text-white focus:border-turquesa focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`font-sans font-bold text-xs tracking-wider py-4 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg ${
                  tipoMov === 'entrada'
                    ? 'bg-turquesa text-black hover:bg-turquesa/90'
                    : 'bg-coral text-white hover:bg-coral/90'
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
                    <span>
                      CONFIRMAR {tipoMov.toUpperCase()} ({cantidad || 0} {selectedInsumo.unidad})
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR INSUMO ───────────────────────────────────────── */}
      {(activeModal === 'nuevo' || activeModal === 'editar') && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-md p-6 md:p-8 shadow-2xl relative text-black dark:text-white flex flex-col gap-5">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 p-2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-sans font-bold tracking-widest text-turquesa uppercase">
                CATÁLOGO DE INSUMOS
              </span>
              <h2 className="font-display text-2xl sm:text-3xl text-black dark:text-white">
                {activeModal === 'nuevo'
                  ? 'AGREGAR NUEVO INSUMO'
                  : `EDITAR: ${selectedInsumo?.nombre}`}
              </h2>
            </div>

            <form
              onSubmit={activeModal === 'nuevo' ? handleCrearInsumoSubmit : handleEditarInsumoSubmit}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-black/70 dark:text-white/70 uppercase font-bold">
                  Nombre del Insumo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Camarón Fresco 41/50"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-black dark:text-white focus:border-turquesa focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-black/70 dark:text-white/70 uppercase font-bold">
                    Unidad
                  </label>
                  <select
                    value={formUnidad}
                    onChange={(e) => setFormUnidad(e.target.value)}
                    className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-2 py-3 text-xs text-black dark:text-white focus:border-turquesa focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="kg">kg</option>
                    <option value="gr">gr</option>
                    <option value="pza">pza</option>
                    <option value="paquete">paquete</option>
                    <option value="litro">litro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-black/70 dark:text-white/70 uppercase font-bold">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={formStockActual}
                    onChange={(e) => setFormStockActual(e.target.value)}
                    className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-3 py-3 text-xs text-black dark:text-white focus:border-turquesa focus:outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-black/70 dark:text-white/70 uppercase font-bold">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={formStockMinimo}
                    onChange={(e) => setFormStockMinimo(e.target.value)}
                    className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-3 py-3 text-xs text-black dark:text-white focus:border-turquesa focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-turquesa text-black hover:bg-turquesa/90 font-sans font-bold text-xs tracking-wider py-4 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg mt-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>GUARDANDO...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>
                      {activeModal === 'nuevo' ? 'CREAR INSUMO' : 'GUARDAR CAMBIOS'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIGURAR INGREDIENTE EN RECETA ─────────────────────────────── */}
      {activeModal === 'receta' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-md p-6 md:p-8 shadow-2xl relative text-black dark:text-white flex flex-col gap-5">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 p-2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-3">
              <div className="w-10 h-10 rounded-full bg-oro/10 dark:bg-oro/20 text-oro flex items-center justify-center shrink-0">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-sans font-bold text-turquesa uppercase tracking-widest">
                  ESCANDALLO DE COCINA
                </span>
                <h3 className="font-display text-2xl text-black dark:text-white">
                  AGREGAR INGREDIENTE
                </h3>
              </div>
            </div>

            <form onSubmit={handleGuardarReceta} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-black/70 dark:text-white/70 uppercase font-bold">
                  Platillo
                </label>
                <select
                  value={recetaPlatilloId}
                  onChange={(e) => setRecetaPlatilloId(Number(e.target.value))}
                  className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-black dark:text-white focus:border-oro focus:outline-none transition-all cursor-pointer"
                >
                  {platillos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji || '🦐'} {p.nombre} (${Number(p.precio).toFixed(0)} MXN)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-black/70 dark:text-white/70 uppercase font-bold">
                  Insumo a Descontar
                </label>
                <select
                  value={recetaInsumoId}
                  onChange={(e) => setRecetaInsumoId(Number(e.target.value))}
                  className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-black dark:text-white focus:border-turquesa focus:outline-none transition-all cursor-pointer"
                >
                  {insumos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} ({i.unidad}) - Stock: {i.stock_actual} {i.unidad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-black/70 dark:text-white/70 uppercase font-bold flex justify-between">
                  <span>Cantidad por Porción</span>
                  <span className="text-turquesa">
                    Unidad: {insumos.find((i) => i.id === recetaInsumoId)?.unidad || 'kg'}
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
                  className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-mono text-black dark:text-white focus:border-turquesa focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-oro text-black hover:bg-oro/90 font-sans font-bold text-xs tracking-wider py-4 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg mt-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>GUARDANDO RECETA...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>VINCULAR INGREDIENTE</span>
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
