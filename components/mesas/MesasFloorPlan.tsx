'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mesa, Platillo } from '@/lib/types/database'
import { guardarLayoutMesas } from '@/lib/actions/mesas'
import {
  Users,
  QrCode,
  DollarSign,
  Edit2,
  Move,
  Check,
  Save,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react'

interface MesasFloorPlanProps {
  mesas: Mesa[]
  isEditMode: boolean
  onSelectMesa: (mesa: Mesa) => void
  onOpenQr: (mesa: Mesa) => void
  onEditConfig: (mesa: Mesa) => void
  onLayoutSaved: () => void
}

export function MesasFloorPlan({
  mesas: initialMesas,
  isEditMode,
  onSelectMesa,
  onOpenQr,
  onEditConfig,
  onLayoutSaved,
}: MesasFloorPlanProps) {
  const [mesas, setMesas] = useState<Mesa[]>(initialMesas)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMesas(initialMesas)
    setHasChanges(false)
  }, [initialMesas])

  // Manejadores de Drag & Drop para acomodar las mesas
  const handleMouseDown = (e: React.MouseEvent, mesa: Mesa) => {
    if (!isEditMode) return
    e.preventDefault()
    setDraggingId(mesa.id)

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left - mesa.pos_x,
        y: e.clientY - rect.top - mesa.pos_y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isEditMode || draggingId === null || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const rawX = e.clientX - rect.left - dragOffset.x
    const rawY = e.clientY - rect.top - dragOffset.y

    // Limitar dentro del canvas (ej. 800x600 o similar)
    const maxX = Math.max(100, rect.width - 150)
    const maxY = Math.max(100, rect.height - 150)

    // Ajustar a cuadrícula de 10px (Grid snapping)
    const snappedX = Math.max(10, Math.min(maxX, Math.round(rawX / 10) * 10))
    const snappedY = Math.max(10, Math.min(maxY, Math.round(rawY / 10) * 10))

    setMesas((prev) =>
      prev.map((m) =>
        m.id === draggingId ? { ...m, pos_x: snappedX, pos_y: snappedY } : m
      )
    )
    setHasChanges(true)
  }

  const handleMouseUp = () => {
    setDraggingId(null)
  }

  // Guardar coordenadas de todas las mesas
  const handleSaveLayout = async () => {
    setIsSaving(true)
    try {
      await guardarLayoutMesas(
        mesas.map((m) => ({
          id: m.id,
          pos_x: m.pos_x,
          pos_y: m.pos_y,
        }))
      )
      setHasChanges(false)
      onLayoutSaved()
      alert('¡Distribución del plano guardada con éxito!')
    } catch (err) {
      console.error('Error al guardar layout:', err)
      alert('Ocurrió un error al guardar la distribución.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de estado del editor de plano */}
      {isEditMode && (
        <div className="bg-oro/10 border border-oro/30 rounded-2xl p-3.5 px-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <Move className="w-5 h-5 text-oro animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-sans font-bold text-oro uppercase tracking-wider">
                MODO ACOMODO DE PLANO ACTIVO
              </span>
              <p className="text-[11px] font-serif italic text-arena/70">
                Arrastra las mesas con el cursor para posicionarlas en el plano físico de tu restaurante.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveLayout}
            disabled={!hasChanges || isSaving}
            className="bg-oro text-negro hover:bg-blanco font-sans font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-md disabled:opacity-40"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>GUARDANDO...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>GUARDAR PLANO</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* CANVAS / PLANO INTERACTIVO */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[620px] bg-[#050404] bg-dots-pattern border-2 rounded-3xl overflow-hidden shadow-2xl transition-colors select-none ${
          isEditMode
            ? 'border-oro/40 ring-4 ring-oro/10 cursor-crosshair'
            : 'border-arena/20 gold-border-corner'
        }`}
        style={{
          backgroundSize: '24px 24px',
        }}
      >
        {/* Zonas decorativas de fondo */}
        <div className="absolute top-4 left-6 pointer-events-none opacity-40">
          <span className="font-display text-sm text-arena/40 tracking-widest uppercase">
            🚪 ENTRADA PRINCIPAL / SALÓN
          </span>
        </div>

        <div className="absolute bottom-4 right-6 pointer-events-none opacity-40">
          <span className="font-display text-sm text-arena/40 tracking-widest uppercase">
            🍹 ÁREA DE BARRA & BEBIDAS
          </span>
        </div>

        {/* RENDERIZADO DE MESAS */}
        {mesas.map((mesa) => {
          const isFree = mesa.estado === 'libre'
          const isOccupied = mesa.estado === 'ocupada'
          const isPendingBill = mesa.estado === 'cuenta_pedida'
          const totalMesa = Number(mesa.pedido_activo?.total || 0)

          // Clases según la forma visual
          let shapeClasses = 'w-32 h-32 rounded-2xl'
          if (mesa.forma === 'redonda') shapeClasses = 'w-32 h-32 rounded-full'
          else if (mesa.forma === 'rectangular') shapeClasses = 'w-44 h-28 rounded-2xl'
          else if (mesa.forma === 'barra') shapeClasses = 'w-28 h-24 rounded-xl'

          return (
            <div
              key={mesa.id}
              style={{
                left: `${mesa.pos_x}px`,
                top: `${mesa.pos_y}px`,
              }}
              onMouseDown={(e) => handleMouseDown(e, mesa)}
              onClick={() => {
                if (!isEditMode) onSelectMesa(mesa)
              }}
              className={`absolute transition-transform flex flex-col items-center justify-between p-3.5 shadow-xl border-2 text-center ${shapeClasses} ${
                isEditMode
                  ? 'cursor-grab active:cursor-grabbing hover:scale-105 border-oro bg-carbon/90 ring-2 ring-oro/30 z-30'
                  : 'cursor-pointer hover:scale-105 active:scale-95'
              } ${
                isFree
                  ? 'bg-carbon/80 border-emerald-500/40 hover:border-emerald-400 text-blanco'
                  : isOccupied
                  ? 'bg-[#180a08] border-coral shadow-[0_0_20px_rgba(232,67,10,0.3)] text-blanco'
                  : 'bg-[#181408] border-oro shadow-[0_0_20px_rgba(201,168,76,0.3)] text-blanco animate-pulse'
              }`}
            >
              {/* Header de la mesa: Capacidad + Botón QR */}
              <div className="w-full flex items-center justify-between text-[10px] text-arena/60">
                <span className="flex items-center gap-1 font-mono">
                  <Users className="w-3 h-3 text-turquesa" />
                  <span>{mesa.capacidad}p</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenQr(mesa)
                  }}
                  className="p-1 text-arena/60 hover:text-turquesa rounded-md hover:bg-carbon border border-arena/20"
                  title="Ver código QR de la mesa"
                >
                  <QrCode className="w-3 h-3" />
                </button>
              </div>

              {/* Centro de la mesa: Nombre y Estado */}
              <div className="flex flex-col items-center justify-center my-auto">
                <span className="font-display text-base md:text-lg tracking-wider text-blanco leading-tight">
                  {mesa.nombre}
                </span>

                {isFree ? (
                  <span className="text-[9px] font-sans font-bold text-emerald-400 uppercase tracking-widest mt-0.5">
                    🟢 LIBRE
                  </span>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="font-display text-base text-coral font-bold -mt-0.5">
                      ${totalMesa.toFixed(0)}
                    </span>
                    <span
                      className={`text-[8px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                        isPendingBill
                          ? 'bg-oro text-negro'
                          : 'bg-coral/30 text-coral border border-coral/40'
                      }`}
                    >
                      {isPendingBill ? '🟡 CUENTA' : '🔴 COMIENDO'}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer de la mesa */}
              <div className="w-full flex items-center justify-center text-[9px] font-sans">
                {isEditMode ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditConfig(mesa)
                    }}
                    className="text-oro hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>Config</span>
                  </button>
                ) : (
                  <span className="text-arena/50 truncate max-w-full font-serif italic text-[10px]">
                    {isFree ? 'Toca para abrir' : mesa.pedido_activo?.cliente_nombre || 'Comanda activa'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
