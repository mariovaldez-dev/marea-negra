'use client'

import React, { useState, useOptimistic, useTransition } from 'react'
import { Platillo, Categoria } from '@/lib/types/database'
import { ListRow } from '@/components/ui/ListRow'
import { ProductCard } from '@/components/ui/ProductCard'
import { ImageUploader } from '@/components/menu/ImageUploader'
import { togglePlatilloDisponible, savePlatillo, deletePlatillo } from '@/lib/actions/menu'
import { Plus, Edit2, Trash2, Eye, X, Check, Loader2, Power, PowerOff } from 'lucide-react'

interface MenuManagerProps {
  initialPlatillos: Platillo[]
  categorias: Categoria[]
}

export function MenuManager({
  initialPlatillos,
  categorias,
}: MenuManagerProps) {
  const [platillos, setPlatillos] = useState<Platillo[]>(initialPlatillos)
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [editingPlatillo, setEditingPlatillo] = useState<Partial<Platillo> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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
    })
    setShowModal(true)
  }

  const handleOpenEditModal = (platillo: Platillo) => {
    setEditingPlatillo(platillo)
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

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/10 pb-4">
        <div>
          <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase">
            ADMINISTRACIÓN DE CATÁLOGO
          </span>
          <h1 className="font-display text-4xl text-blanco tracking-wide">
            GESTIÓN DEL MENÚ
          </h1>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-coral text-blanco hover:bg-coral/80 font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-full shadow-[0_0_20px_rgba(232,67,10,0.3)] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>AGREGAR PLATILLO</span>
        </button>
      </div>

      {/* Lista por Categorías con ListRow (Patrón 2) */}
      <div className="flex flex-col gap-8">
        {categorias.map((cat) => {
          const catPlatillos = optimisticPlatillos.filter(
            (p) => p.categoria_id === cat.id
          )

          return (
            <div key={cat.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-arena/10 pb-2">
                <h3 className="font-display text-2xl text-oro tracking-wider">
                  {cat.nombre.toUpperCase()}
                </h3>
                <span className="text-xs font-sans text-arena/40">
                  ({catPlatillos.length} platillos)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catPlatillos.map((platillo) => (
                  <ListRow
                    key={platillo.id}
                    title={`${platillo.nombre}`}
                    subtitle={platillo.descripcion || 'Sin descripción'}
                    value={`$${platillo.precio.toFixed(0)}`}
                    badgeText={platillo.disponible ? 'DISPONIBLE' : 'AGOTADO'}
                    badgeVariant={platillo.disponible ? 'disponible' : 'agotado'}
                    actions={
                      <div className="flex items-center gap-2">
                        {/* Toggle Optimista Disponibilidad */}
                        <button
                          onClick={() => handleToggle(platillo.id, platillo.disponible)}
                          className={`px-3 py-1.5 rounded-full text-xs font-sans font-semibold border transition-all ${platillo.disponible
                            ? 'bg-turquesa/10 border-turquesa text-turquesa hover:bg-turquesa/20'
                            : 'bg-coral/10 border-coral text-coral hover:bg-coral/20'
                            }`}
                        >
                          {platillo.disponible ? <PowerOff className='w-4 h-4' /> : <PowerOff className='w-4 h-4' />}
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(platillo)}
                          className="p-2 text-arena/70 hover:text-blanco bg-carbon border border-arena/10 rounded-lg hover:border-turquesa/40 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(platillo.id)}
                          className="p-2 text-coral/70 hover:text-coral bg-carbon border border-arena/10 rounded-lg hover:border-coral/40 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    }
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL CREAR / EDITAR PLATILLO CON LIVE PREVIEW PRODUCTCARD (PATRÓN 1) */}
      {showModal && editingPlatillo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white text-negro dark:bg-[#050404] dark:text-blanco bg-dots-pattern border border-arena/30 dark:border-oro/30 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 gold-border-corner shadow-2xl relative transition-colors">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-negro/60 dark:text-arena/60 hover:text-coral dark:hover:text-blanco rounded-full hover:bg-arena/20 dark:hover:bg-carbon transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase">
                EDITOR DE MENÚ
              </span>
              <h2 className="font-display text-3xl text-negro dark:text-blanco tracking-wide">
                {editingPlatillo.id ? 'EDITAR PLATILLO' : 'CREAR NUEVO PLATILLO'}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Formulario Izquierda */}
              <form onSubmit={handleSaveSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans text-negro/80 dark:text-arena uppercase font-semibold">
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
                    className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-lg px-3 py-2 text-xs text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-sans text-negro/80 dark:text-arena uppercase font-semibold">
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
                      className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-lg px-3 py-2 text-xs text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-sans text-negro/80 dark:text-arena uppercase font-semibold">
                      Emoji / Ícono Representativo
                    </label>
                    <input
                      type="text"
                      placeholder="Icono o simbolo"
                      value={editingPlatillo.emoji || ''}
                      onChange={(e) =>
                        setEditingPlatillo({ ...editingPlatillo, emoji: e.target.value })
                      }
                      className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-lg px-3 py-2 text-xs text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans text-negro/80 dark:text-arena uppercase font-semibold">
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
                    className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-lg px-3 py-2 text-xs text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
                  >
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans text-negro/80 dark:text-arena uppercase font-semibold">
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
                    className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-lg p-3 text-xs text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
                  />
                </div>

                {/* Subida de Imagen con ImageUploader */}
                <ImageUploader
                  currentUrl={editingPlatillo.imagen_url}
                  dishId={editingPlatillo.id || 'new'}
                  onImageChange={(url) =>
                    setEditingPlatillo({ ...editingPlatillo, imagen_url: url })
                  }
                />

                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-turquesa text-negro hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(42,191,191,0.3)] disabled:opacity-50 mt-4"
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

              {/* Preview en Vivo Derecha (Patrón 1 - Adaptable a Light Mode) */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-sans font-semibold text-turquesa tracking-wider uppercase">
                  VISTA PREVIA EN VIVO
                </span>
                <div className="p-4 bg-[#F4F0E8] dark:bg-carbon/60 rounded-2xl border border-arena/30 dark:border-arena/10 transition-colors">
                  <ProductCard
                    platillo={{
                      id: editingPlatillo.id || 0,
                      nombre: editingPlatillo.nombre || 'Nombre del Platillo',
                      descripcion:
                        editingPlatillo.descripcion ||
                        'Descripción preliminar de los ingredientes del platillo...',
                      precio: editingPlatillo.precio || 149,
                      emoji: editingPlatillo.emoji || '🦐',
                      disponible: editingPlatillo.disponible ?? true,
                      imagen_url: editingPlatillo.imagen_url || null,
                      categoria_id: editingPlatillo.categoria_id || 1,
                    }}
                    onSelect={() => { }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
