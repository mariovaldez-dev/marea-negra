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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-md p-6 sm:p-7 shadow-2xl relative text-negro dark:text-blanco">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-negro/40 dark:text-arena/50 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-[10px] font-mono font-bold tracking-wider text-turquesa uppercase block mb-0.5">
            Distribución del Salón
          </span>
          <h2 className="font-sans font-black text-2xl text-negro dark:text-blanco tracking-tight">
            {isEditing ? `Editar: ${mesa?.nombre}` : 'Nueva Mesa'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-sans text-negro/70 dark:text-arena/70 font-bold">
              Nombre de la Mesa *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Mesa 1, Terraza 2, Barra..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-negro dark:text-blanco focus:outline-none focus:ring-2 focus:ring-turquesa"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-negro/70 dark:text-arena/70 font-bold">
                Capacidad (Personas)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={capacidad}
                onChange={(e) => setCapacidad(parseInt(e.target.value, 10) || 1)}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-negro dark:text-blanco focus:outline-none focus:ring-2 focus:ring-turquesa"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-negro/70 dark:text-arena/70 font-bold">
                Forma Visual
              </label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: 'cuadrada', label: 'Cuad', icon: Square },
                  { id: 'redonda', label: 'Red', icon: Circle },
                  { id: 'rectangular', label: 'Rect', icon: RectangleHorizontal },
                  { id: 'barra', label: 'Barra', icon: LayoutGrid },
                ].map((item) => {
                  const Icon = item.icon
                  const isSel = forma === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setForma(item.id as FormaMesa)}
                      className={`p-2 rounded-xl text-[11px] font-sans font-bold flex items-center justify-center gap-1 transition-all ${
                        isSel
                          ? 'bg-[#16A34B] text-white shadow-sm'
                          : 'bg-black/5 dark:bg-white/5 text-negro/70 dark:text-arena/70 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-4 border-t border-black/5 dark:border-white/5 mt-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 p-3.5 rounded-2xl transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="Eliminar mesa del plano"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-coral hover:bg-coral/90 text-white font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isEditing ? 'Guardar Cambios' : 'Agregar al Plano'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
