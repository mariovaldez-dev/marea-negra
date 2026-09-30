'use client'

import React, { useState, useOptimistic, useTransition, useMemo } from 'react'
import Image from 'next/image'
import { Platillo, Categoria } from '@/lib/types/database'
import { ProductCard } from '@/components/ui/ProductCard'
import { ImageUploader } from '@/components/menu/ImageUploader'
import { togglePlatilloDisponible, savePlatillo, deletePlatillo } from '@/lib/actions/menu'
import { DIAS_SEMANA_PROMO, getPromoBannerText } from '@/lib/utils/promo'
import { InstagramStoryModal } from '@/components/menu/InstagramStoryModal'
import { ComboImageGenerator } from '@/components/menu/ComboImageGenerator'
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  Power,
  PowerOff,
  Calendar,
  Flame,
  Sparkles,
  UtensilsCrossed,
  Search,
  ChevronLeft,
  ChevronRight,
  Tag,
  Filter,
} from 'lucide-react'

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

interface MenuManagerProps {
  initialPlatillos: Platillo[]
  categorias: Categoria[]
}

const ITEMS_PER_PAGE = 10

export function MenuManager({
  initialPlatillos,
  categorias,
}: MenuManagerProps) {
  const [platillos, setPlatillos] = useState<Platillo[]>(initialPlatillos)
  const [, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [editingPlatillo, setEditingPlatillo] = useState<Partial<Platillo> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [storyPlatillo, setStoryPlatillo] = useState<Platillo | null>(null)
  const [showComboGenerator, setShowComboGenerator] = useState(false)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | 'todas'>('todas')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'disponibles' | 'agotados' | 'promos'>('todos')
  const [currentPage, setCurrentPage] = useState(1)

  // Mapa de categorías para búsqueda rápida
  const categoriasMap = useMemo(() => {
    const map = new Map<number, string>()
    categorias.forEach((c) => map.set(c.id, c.nombre))
    return map
  }, [categorias])

  // Optimistic UI for Availability Toggle
  const [optimisticPlatillos, setOptimisticPlatillos] = useOptimistic(
    platillos,
    (state, update: { id: number; disponible: boolean }) =>
      state.map((p) => (p.id === update.id ? { ...p, disponible: update.disponible } : p))
  )

  const handleToggle = (id: number, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    startTransition(async () => {
      setOptimisticPlatillos({ id, disponible: nextStatus })
      try {
        await togglePlatilloDisponible(id, nextStatus)
        setPlatillos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, disponible: nextStatus } : p))
        )
      } catch (err) {
        console.error('Error al cambiar disponibilidad:', err)
        setPlatillos(initialPlatillos)
      }
    })
  }

  const handleOpenCreateModal = () => {
    setEditingPlatillo({
      nombre: '',
      descripcion: '',
      precio: 149,
      emoji: '🦐',
      categoria_id: categorias[0]?.id || 1,
      disponible: true,
      imagen_url: null,
      es_promocion: false,
      etiqueta_promo: '',
      precio_anterior: null,
      dias_promo: DIAS_SEMANA_PROMO.map((d) => d.id),
    })
    setShowModal(true)
  }

  const handleOpenEditModal = (platillo: Platillo) => {
    const isPromo = Boolean(platillo.es_promocion || platillo.etiqueta_promo || platillo.precio_anterior)
    setEditingPlatillo({
      ...platillo,
      es_promocion: isPromo,
      dias_promo:
        platillo.dias_promo && platillo.dias_promo.length > 0
          ? platillo.dias_promo
          : DIAS_SEMANA_PROMO.map((d) => d.id),
    })
    setShowModal(true)
  }

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlatillo?.nombre || !editingPlatillo.precio) return

    setIsSaving(true)
    try {
      const res = await savePlatillo(editingPlatillo)
      if (res.data) {
        setPlatillos((prev) => {
          const idx = prev.findIndex((p) => p.id === res.data.id)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = res.data
            return next
          }
          return [...prev, res.data]
        })
      }
      setShowModal(false)
    } catch (err) {
      console.error('Error al guardar platillo:', err)
      alert('Ocurrió un error al guardar los datos del platillo.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este platillo del menú?')) return
    try {
      await deletePlatillo(id)
      setPlatillos((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Error al eliminar platillo:', err)
    }
  }

  // Filtrado de Platillos
  const filteredPlatillos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return optimisticPlatillos.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(term) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(term)) ||
        (p.emoji && p.emoji.includes(term))

      const matchCategory =
        selectedCategoryFilter === 'todas' || p.categoria_id === selectedCategoryFilter

      let matchStatus = true
      if (statusFilter === 'disponibles') matchStatus = p.disponible === true
      if (statusFilter === 'agotados') matchStatus = p.disponible === false
      if (statusFilter === 'promos') matchStatus = p.es_promocion === true

      return matchSearch && matchCategory && matchStatus
    })
  }, [optimisticPlatillos, searchTerm, selectedCategoryFilter, statusFilter])

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredPlatillos.length / ITEMS_PER_PAGE))
  const paginatedPlatillos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredPlatillos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredPlatillos, currentPage])

  const totalPlatillos = platillos.length
  const disponiblesCount = platillos.filter((p) => p.disponible).length
  const promosCount = platillos.filter((p) => p.es_promocion).length

  return (
    <div className="flex flex-col gap-6 relative min-h-[calc(100vh-140px)] w-full max-w-7xl mx-auto pb-20 text-neutral-900 dark:text-white transition-colors">
      {/* ── BENTO HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="bg-coral text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              CATÁLOGO & RECETARIO
            </span>
            <span className="text-[11px] font-sans font-medium text-neutral-500 dark:text-neutral-400">
              Marea Negra · Cocina de Mariscos
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-neutral-900 dark:text-white tracking-wide">
            GESTIÓN DEL MENÚ
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 bg-coral text-white hover:bg-coral/90 font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-2xl shadow-[0_4px_20px_rgba(232,67,10,0.35)] transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>AGREGAR PLATILLO</span>
          </button>
        </div>
      </div>

      {/* ── BENTO STATS CARDS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              TOTAL DE PLATILLOS
            </span>
            <span className="font-display text-3xl text-neutral-900 dark:text-white">
              {totalPlatillos}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#2ABFBF]/10 text-[#2ABFBF] flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              DISPONIBLES HOY
            </span>
            <span className="font-display text-3xl text-[#16A34B]">
              {disponiblesCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#16A34B]/10 text-[#16A34B] flex items-center justify-center">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              PROMOCIONES ACTIVAS
            </span>
            <span className="font-display text-3xl text-coral">
              {promosCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-coral/10 text-coral flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* BUSCADOR */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar platillo por nombre, ingredientes o emoji..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-neutral-900 dark:text-white font-sans font-medium focus:border-[#2ABFBF] focus:outline-none shadow-sm transition-colors"
          />
        </div>

        {/* FILTROS POR CATEGORÍA Y ESTADO */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* CATEGORÍAS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => {
                setSelectedCategoryFilter('todas')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold transition-all shrink-0 ${
                selectedCategoryFilter === 'todas'
                  ? 'bg-[#2ABFBF] text-black shadow-sm'
                  : 'bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              🍽️ Todas
            </button>

            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryFilter(cat.id)
                  setCurrentPage(1)
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold transition-all shrink-0 ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-[#2ABFBF] text-black shadow-sm'
                    : 'bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* FILTRO DE ESTADO */}
          <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-xl border border-black/[0.06] dark:border-white/[0.06] text-xs font-sans">
            <button
              onClick={() => {
                setStatusFilter('todos')
                setCurrentPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'todos'
                  ? 'bg-white dark:bg-[#111317] text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => {
                setStatusFilter('disponibles')
                setCurrentPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'disponibles'
                  ? 'bg-[#16A34B] text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Disponibles
            </button>
            <button
              onClick={() => {
                setStatusFilter('agotados')
                setCurrentPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'agotados'
                  ? 'bg-coral text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Agotados
            </button>
            <button
              onClick={() => {
                setStatusFilter('promos')
                setCurrentPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'promos'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Promos
            </button>
          </div>
        </div>
      </div>

      {/* ── TABLA DE LISTA DE PLATILLOS ────────────────────────────────────────── */}
      {filteredPlatillos.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] shadow-sm overflow-hidden">
            {/* VISTA DESKTOP (TABLA) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    <th className="py-4 px-5 w-5/12">Platillo</th>
                    <th className="py-4 px-4 w-2/12">Categoría</th>
                    <th className="py-4 px-4 w-2/12">Precio</th>
                    <th className="py-4 px-4 w-2/12 text-center">Disponibilidad</th>
                    <th className="py-4 px-5 w-1/12 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                  {paginatedPlatillos.map((platillo) => {
                    const categoriaNombre =
                      (platillo.categoria_id ? categoriasMap.get(platillo.categoria_id) : null) || 'General'

                    return (
                      <tr
                        key={platillo.id}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* PLATILLO & FOTO & PROMO BADGE */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3.5">
                            {/* MINIATURA / EMOJI */}
                            <div className="w-12 h-12 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-xl shrink-0 overflow-hidden relative shadow-sm">
                              {platillo.imagen_url ? (
                                <Image
                                  src={platillo.imagen_url}
                                  alt={platillo.nombre}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <span>{platillo.emoji || '🦐'}</span>
                              )}
                            </div>

                            <div className="flex flex-col min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                                  {platillo.nombre}
                                </span>
                                {platillo.es_promocion && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-coral/15 text-coral border border-coral/30 shrink-0">
                                    <Flame className="w-2.5 h-2.5" />
                                    <span>{platillo.etiqueta_promo || 'OFERTA'}</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-sm sm:max-w-md mt-0.5">
                                {platillo.descripcion || 'Sin descripción'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* CATEGORÍA */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-black/5 dark:border-white/5 whitespace-nowrap">
                            {categoriaNombre}
                          </span>
                        </td>

                        {/* PRECIO */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-coral">
                              ${platillo.precio.toFixed(0)} <span className="text-xs font-sans font-medium text-coral/80">MXN</span>
                            </span>
                            {platillo.precio_anterior && platillo.precio_anterior > platillo.precio && (
                              <span className="text-[11px] text-neutral-400 line-through">
                                ${platillo.precio_anterior.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* DISPONIBILIDAD (SWITCH 1 CLIC) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggle(platillo.id, platillo.disponible)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap ${
                              platillo.disponible
                                ? 'bg-[#16A34B]/15 text-[#16A34B] border border-[#16A34B]/30 hover:bg-[#16A34B]/25'
                                : 'bg-coral/15 text-coral border border-coral/30 hover:bg-coral/25'
                            }`}
                            title="Haz clic para alternar disponibilidad en cocina"
                          >
                            {platillo.disponible ? (
                              <>
                                <Power className="w-3 h-3 stroke-[3]" />
                                <span>Disponible</span>
                              </>
                            ) : (
                              <>
                                <PowerOff className="w-3 h-3 stroke-[3]" />
                                <span>Agotado</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* ACCIONES */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* HISTORIA DE INSTAGRAM */}
                            <button
                              type="button"
                              onClick={() => setStoryPlatillo(platillo)}
                              className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-coral hover:bg-coral/10 rounded-xl transition-all"
                              title="Generar Historia de Instagram"
                            >
                              <InstagramIcon className="w-4 h-4" />
                            </button>

                            {/* EDITAR */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(platillo)}
                              className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-[#2ABFBF] hover:bg-[#2ABFBF]/10 rounded-xl transition-all"
                              title="Editar platillo"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* ELIMINAR */}
                            <button
                              type="button"
                              onClick={() => handleDelete(platillo.id)}
                              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                              title="Eliminar platillo"
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

            {/* VISTA MOBILE (FILAS COMPACTAS) */}
            <div className="block md:hidden divide-y divide-black/[0.08] dark:divide-white/[0.08]">
              {paginatedPlatillos.map((platillo) => {
                const categoriaNombre =
                  (platillo.categoria_id ? categoriasMap.get(platillo.categoria_id) : null) || 'General'

                return (
                  <div key={platillo.id} className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-xl shrink-0 overflow-hidden relative">
                          {platillo.imagen_url ? (
                            <Image
                              src={platillo.imagen_url}
                              alt={platillo.nombre}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <span>{platillo.emoji || '🦐'}</span>
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                            {platillo.nombre}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-bold uppercase">
                            {categoriaNombre}
                          </span>
                        </div>
                      </div>

                      <span className="font-display text-lg text-coral shrink-0">
                        ${platillo.precio.toFixed(0)} MXN
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-black/[0.05] dark:border-white/[0.05] gap-2">
                      {/* TOGGLE DISPONIBILIDAD */}
                      <button
                        type="button"
                        onClick={() => handleToggle(platillo.id, platillo.disponible)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                          platillo.disponible
                            ? 'bg-[#16A34B]/15 text-[#16A34B] border border-[#16A34B]/30'
                            : 'bg-coral/15 text-coral border border-coral/30'
                        }`}
                      >
                        {platillo.disponible ? 'Disponible' : 'Agotado'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setStoryPlatillo(platillo)}
                          className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-coral rounded-lg"
                          title="Historia Instagram"
                        >
                          <InstagramIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(platillo)}
                          className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-[#2ABFBF] rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(platillo.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg"
                          title="Eliminar"
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

          {/* ── PAGINADOR ──────────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-black/[0.08] dark:border-white/[0.08]">
              <span className="text-xs font-sans font-medium text-neutral-500 dark:text-neutral-400">
                Página {currentPage} de {totalPages} ({filteredPlatillos.length} platillos)
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
                <span className="text-xs font-sans font-bold px-2 text-neutral-900 dark:text-white">
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
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#111317] rounded-[24px] border border-dashed border-black/10 dark:border-white/10">
          <p className="font-sans font-medium text-sm text-neutral-500 dark:text-neutral-400">
            No se encontraron platillos que coincidan con los filtros seleccionados.
          </p>
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR PLATILLO CON LIVE PREVIEW ──────────────────────── */}
      {showModal && editingPlatillo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-neutral-900 dark:bg-[#111317] dark:text-white border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative transition-colors">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-sans font-bold tracking-widest text-[#2ABFBF] uppercase">
                ADMINISTRADOR DE MENÚ
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 dark:text-white tracking-wide">
                {editingPlatillo.id ? 'EDITAR PLATILLO' : 'CREAR NUEVO PLATILLO'}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Formulario Izquierda */}
              <form onSubmit={handleSaveSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-neutral-700 dark:text-neutral-300 uppercase font-bold">
                    Nombre del Platillo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Aguachile Negro Especial"
                    value={editingPlatillo.nombre || ''}
                    onChange={(e) =>
                      setEditingPlatillo({ ...editingPlatillo, nombre: e.target.value })
                    }
                    className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:border-[#2ABFBF] focus:outline-none transition-all font-sans font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans text-neutral-700 dark:text-neutral-300 uppercase font-bold">
                      Precio ($ MXN) *
                    </label>
                    <input
                      type="number"
                      required
                      step="1"
                      placeholder="149"
                      value={editingPlatillo.precio || 0}
                      onChange={(e) =>
                        setEditingPlatillo({
                          ...editingPlatillo,
                          precio: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:border-[#2ABFBF] focus:outline-none transition-all font-sans font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans text-neutral-700 dark:text-neutral-300 uppercase font-bold">
                      Emoji
                    </label>
                    <input
                      type="text"
                      placeholder="🦐"
                      value={editingPlatillo.emoji || ''}
                      onChange={(e) =>
                        setEditingPlatillo({ ...editingPlatillo, emoji: e.target.value })
                      }
                      className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:border-[#2ABFBF] focus:outline-none transition-all text-center text-lg"
                    />
                  </div>
                </div>

                {/* BLOQUE DE CONFIGURACIÓN DE PROMOCIÓN */}
                <div
                  className={`p-4 rounded-[24px] border transition-all flex flex-col gap-3.5 ${
                    editingPlatillo.es_promocion
                      ? 'bg-coral/10 border-coral/30 shadow-sm'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editingPlatillo.es_promocion ?? false}
                        onChange={(e) => {
                          const isChecked = e.target.checked
                          setEditingPlatillo({
                            ...editingPlatillo,
                            es_promocion: isChecked,
                            dias_promo:
                              isChecked &&
                              (!editingPlatillo.dias_promo ||
                                editingPlatillo.dias_promo.length === 0)
                                ? DIAS_SEMANA_PROMO.map((d) => d.id)
                                : editingPlatillo.dias_promo,
                          })
                        }}
                        className="w-4 h-4 accent-coral cursor-pointer"
                      />
                      <span
                        className={
                          editingPlatillo.es_promocion
                            ? 'text-coral font-bold'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }
                      >
                        {editingPlatillo.es_promocion
                          ? '🔥 PROMOCIÓN ACTIVADA'
                          : '⚪ PROMOCIÓN APAGADA'}
                      </span>
                    </label>

                    {editingPlatillo.es_promocion && (
                      <span className="text-[10px] font-sans font-bold text-coral bg-coral/20 px-2.5 py-0.5 rounded-full uppercase">
                        OFERTA VIGENTE
                      </span>
                    )}
                  </div>

                  {editingPlatillo.es_promocion && (
                    <div className="flex flex-col gap-3.5 pt-3 border-t border-coral/20">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-sans text-neutral-700 dark:text-neutral-300 uppercase font-semibold">
                            Etiqueta Corta (Ej. 2x1)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. 2X1, COMBO"
                            value={editingPlatillo.etiqueta_promo || ''}
                            onChange={(e) =>
                              setEditingPlatillo({
                                ...editingPlatillo,
                                etiqueta_promo: e.target.value,
                              })
                            }
                            className="bg-black/[0.03] dark:bg-white/[0.05] border border-coral/30 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:border-coral focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-sans text-neutral-700 dark:text-neutral-300 uppercase font-semibold">
                            Precio Original (Tachado)
                          </label>
                          <input
                            type="number"
                            step="1"
                            placeholder="Ej. 199"
                            value={editingPlatillo.precio_anterior || ''}
                            onChange={(e) =>
                              setEditingPlatillo({
                                ...editingPlatillo,
                                precio_anterior: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              })
                            }
                            className="bg-black/[0.03] dark:bg-white/[0.05] border border-coral/30 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:border-coral focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Selector de días */}
                      <div className="flex flex-col gap-2 bg-black/[0.03] dark:bg-white/[0.03] p-3 rounded-2xl border border-coral/20">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-sans font-bold text-coral uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-coral" />
                            <span>Días activos:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const current = editingPlatillo.dias_promo || []
                              if (current.length === 7) {
                                setEditingPlatillo({ ...editingPlatillo, dias_promo: [] })
                              } else {
                                setEditingPlatillo({
                                  ...editingPlatillo,
                                  dias_promo: DIAS_SEMANA_PROMO.map((d) => d.id),
                                })
                              }
                            }}
                            className="text-[10px] font-sans text-[#2ABFBF] underline font-bold"
                          >
                            {(editingPlatillo.dias_promo || []).length === 7
                              ? 'Desmarcar todos'
                              : 'Todos los días'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {DIAS_SEMANA_PROMO.map((dia) => {
                            const isSelected =
                              !editingPlatillo.dias_promo ||
                              editingPlatillo.dias_promo.length === 0 ||
                              editingPlatillo.dias_promo.includes(dia.id)

                            return (
                              <button
                                key={dia.id}
                                type="button"
                                onClick={() => {
                                  let current = editingPlatillo.dias_promo
                                    ? [...editingPlatillo.dias_promo]
                                    : DIAS_SEMANA_PROMO.map((d) => d.id)

                                  if (current.includes(dia.id)) {
                                    current = current.filter((id) => id !== dia.id)
                                  } else {
                                    current.push(dia.id)
                                  }

                                  setEditingPlatillo({
                                    ...editingPlatillo,
                                    dias_promo: current,
                                  })
                                }}
                                className={`text-[10px] font-sans font-bold px-3 py-1.5 rounded-full border transition-all ${
                                  isSelected
                                    ? 'bg-coral text-white border-coral shadow-sm'
                                    : 'bg-black/5 dark:bg-white/5 text-neutral-400 border-black/10 dark:border-white/10'
                                }`}
                              >
                                {dia.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-neutral-700 dark:text-neutral-300 uppercase font-bold">
                    Categoría del Menú *
                  </label>
                  <select
                    value={editingPlatillo.categoria_id || categorias[0]?.id}
                    onChange={(e) =>
                      setEditingPlatillo({
                        ...editingPlatillo,
                        categoria_id: parseInt(e.target.value, 10),
                      })
                    }
                    className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:border-[#2ABFBF] focus:outline-none transition-all cursor-pointer font-sans font-medium"
                  >
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-neutral-700 dark:text-neutral-300 uppercase font-bold">
                    Descripción / Ingredientes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Camarón, chile chiltepín, pepino, cebolla morada..."
                    value={editingPlatillo.descripcion || ''}
                    onChange={(e) =>
                      setEditingPlatillo({
                        ...editingPlatillo,
                        descripcion: e.target.value,
                      })
                    }
                    className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl p-4 text-xs text-neutral-900 dark:text-white focus:border-[#2ABFBF] focus:outline-none transition-all font-sans font-medium"
                  />
                </div>

                {/* Subida de Imagen */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-sans text-neutral-700 dark:text-neutral-300 uppercase font-bold">
                      Imagen del Platillo
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowComboGenerator(true)}
                      className="text-[11px] font-sans font-bold text-[#2ABFBF] hover:text-coral flex items-center gap-1.5 transition-colors bg-[#2ABFBF]/10 px-3 py-1 rounded-full border border-[#2ABFBF]/30 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generar Collage</span>
                    </button>
                  </div>
                  <ImageUploader
                    currentUrl={editingPlatillo.imagen_url}
                    dishId={editingPlatillo.id || 'new'}
                    onImageChange={(url) =>
                      setEditingPlatillo({ ...editingPlatillo, imagen_url: url })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#2ABFBF] text-black hover:bg-[#2ABFBF]/90 font-sans font-bold text-xs tracking-wider py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-4 cursor-pointer active:scale-95"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>GUARDANDO PLATILLO...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>CONFIRMAR Y GUARDAR PLATILLO</span>
                    </>
                  )}
                </button>
              </form>

              {/* Preview en Vivo Derecha */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-sans font-bold text-[#2ABFBF] tracking-wider uppercase">
                  VISTA PREVIA EN VIVO
                </span>
                <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] rounded-[30px] border border-black/10 dark:border-white/10 transition-colors">
                  <ProductCard
                    previewMode={true}
                    platillo={{
                      id: editingPlatillo.id || 0,
                      nombre: editingPlatillo.nombre || 'Nombre del Platillo',
                      descripcion:
                        editingPlatillo.descripcion ||
                        'Descripción preliminar de los ingredientes del platillo...',
                      precio: editingPlatillo.precio || 149,
                      precio_anterior: editingPlatillo.precio_anterior || null,
                      es_promocion: editingPlatillo.es_promocion ?? false,
                      etiqueta_promo: editingPlatillo.etiqueta_promo || null,
                      dias_promo: editingPlatillo.dias_promo || null,
                      emoji: editingPlatillo.emoji || '🦐',
                      disponible: editingPlatillo.disponible ?? true,
                      imagen_url: editingPlatillo.imagen_url || null,
                      categoria_id: editingPlatillo.categoria_id || 1,
                    }}
                    onSelect={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIA DE INSTAGRAM */}
      {storyPlatillo && (
        <InstagramStoryModal
          platillo={storyPlatillo}
          onClose={() => setStoryPlatillo(null)}
        />
      )}

      {/* MODAL GENERADOR DE COLLAGE DE COMBO */}
      {showComboGenerator && editingPlatillo && (
        <ComboImageGenerator
          allPlatillos={platillos}
          comboPlatilloId={editingPlatillo.id}
          comboNombre={editingPlatillo.nombre || 'Nuevo Combo'}
          onImageSaved={(url) => {
            setEditingPlatillo({ ...editingPlatillo, imagen_url: url })
          }}
          onClose={() => setShowComboGenerator(false)}
        />
      )}
    </div>
  )
}
