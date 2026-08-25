'use client'

import React, { useState } from 'react'
import { Mesa, FormaMesa } from '@/lib/types/database'
import { crearMesa, editarMesa, eliminarMesa } from '@/lib/actions/mesas'
import { X, Check, Trash2, Loader2, Square, Circle, RectangleHorizontal, LayoutGrid } from 'lucide-react'

interface MesaEditorModalProps {
  mesa?: Mesa | null
  onClose: () => void
  onSaved: (mesa: Mesa) => void
  onDeleted?: (id: number) => void
}

export function MesaEditorModal({
  mesa,
  onClose,
  onSaved,
  onDeleted,
}: MesaEditorModalProps) {
  const isEditing = Boolean(mesa)
  const [nombre, setNombre] = useState(mesa?.nombre || 'Mesa nueva')
  const [capacidad, setCapacidad] = useState<number>(mesa?.capacidad || 4)
  const [forma, setForma] = useState<FormaMesa>(mesa?.forma || 'cuadrada')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    setIsSubmitting(true)
    try {
      if (isEditing && mesa) {
        const res = await editarMesa(mesa.id, {
          nombre: nombre.trim(),
          capacidad,
          forma,
        })
        if (res.mesa) onSaved(res.mesa)
      } else {
        const res = await crearMesa({
          nombre: nombre.trim(),
          capacidad,
          forma,
        })
        if (res.mesa) onSaved(res.mesa)
      }
      onClose()
    } catch (err) {
      console.error('Error al guardar mesa:', err)
      alert('Ocurrió un error al guardar la mesa.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!mesa) return
    if (!confirm(`¿Eliminar la ${mesa.nombre} del plano?`)) return

    setIsSubmitting(true)
    try {
      await eliminarMesa(mesa.id)
      if (onDeleted) onDeleted(mesa.id)
      onClose()
    } catch (err) {
      console.error('Error al eliminar mesa:', err)
      alert('Ocurrió un error al eliminar la mesa.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/30 rounded-2xl w-full max-w-md p-6 gold-border-corner shadow-2xl relative text-blanco">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon border border-arena/20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase">
            DISTRIBUCIÓN DEL SALÓN
          </span>
          <h2 className="font-display text-2xl text-blanco mt-1">
            {isEditing ? `EDITAR: ${mesa?.nombre}` : 'CREAR NUEVA MESA'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-sans text-arena uppercase font-bold">
              Identificador / Nombre de la Mesa *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Mesa 1, Mesa Terraza, Barra 2..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-carbon border border-arena/20 rounded-xl px-4 py-3 text-base text-blanco focus:border-turquesa focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-arena uppercase font-bold">
                Capacidad (Personas)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={capacidad}
                onChange={(e) => setCapacidad(parseInt(e.target.value, 10) || 1)}
                className="bg-carbon border border-arena/20 rounded-xl px-4 py-3 text-base text-blanco font-display text-oro focus:border-turquesa focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-arena uppercase font-bold">
                Forma Visual
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'cuadrada', label: 'Cuadrada', icon: Square },
                  { id: 'redonda', label: 'Redonda', icon: Circle },
                  { id: 'rectangular', label: 'Rectangular', icon: RectangleHorizontal },
                  { id: 'barra', label: 'Barra', icon: LayoutGrid },
                ].map((item) => {
                  const Icon = item.icon
                  const isSel = forma === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setForma(item.id as FormaMesa)}
                      className={`p-2 rounded-lg border text-[11px] font-sans font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isSel
                          ? 'bg-turquesa text-negro border-turquesa shadow-sm'
                          : 'bg-carbon text-arena/70 border-arena/20 hover:border-turquesa'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-arena/15 mt-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/50 p-3.5 rounded-xl transition-all flex items-center justify-center shrink-0"
                title="Eliminar mesa del plano"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>GUARDANDO...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isEditing ? 'GUARDAR CAMBIOS' : 'AGREGAR MESA AL PLANO'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
