'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mesa } from '@/lib/types/database'
import { guardarLayoutMesas } from '@/lib/actions/mesas'
import {
  Users,
  QrCode,
  DollarSign,
  Edit2,
  Move,
  Save,
  Loader2,
  Sparkles,
  MapPin,
  Utensils,
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

    const maxX = Math.max(100, rect.width - 160)
    const maxY = Math.max(100, rect.height - 160)

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
        <div className="bg-[#ECC94B]/10 border border-[#ECC94B]/30 rounded-2xl p-4 px-5 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <Move className="w-5 h-5 text-[#ECC94B] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-sans font-bold text-[#8B6E00] dark:text-[#ECC94B] uppercase tracking-wider">
                Modo Acomodo de Plano Activo
              </span>
              <p className="text-xs text-negro/60 dark:text-arena/70">
                Arrastra las mesas con el cursor para posicionarlas en el plano físico de tu restaurante.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveLayout}
            disabled={!hasChanges || isSaving}
            className="bg-[#ECC94B] text-[#3A2D00] font-sans font-bold text-xs px-5 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-sm disabled:opacity-40 active:scale-95 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Plano</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* CANVAS / PLANO INTERACTIVO DUAL THEME */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[620px] bg-white dark:bg-[#0D0E10] border border-black/10 dark:border-white/10 rounded-[32px] overflow-hidden shadow-sm transition-colors select-none ${
          isEditMode
            ? 'border-[#ECC94B]/40 ring-4 ring-[#ECC94B]/10 cursor-crosshair'
            : ''
        }`}
        style={{
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Zonas decorativas de fondo */}
        <div className="absolute top-4 left-6 pointer-events-none">
          <span className="text-[10px] font-mono font-bold text-negro/30 dark:text-arena/30 tracking-widest uppercase flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Entrada Principal / Salón</span>
          </span>
        </div>

        <div className="absolute bottom-4 right-6 pointer-events-none">
          <span className="text-[10px] font-mono font-bold text-negro/30 dark:text-arena/30 tracking-widest uppercase flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5" />
            <span>Área de Barra & Cocina</span>
          </span>
        </div>

        {/* RENDERIZADO DE MESAS */}
        {mesas.map((mesa) => {
          const isFree = mesa.estado === 'libre'
          const isOccupied = mesa.estado === 'ocupada'
          const isPendingBill = mesa.estado === 'cuenta_pedida'
          const totalMesa = Number(mesa.pedido_activo?.total || 0)

          // Clases según la forma visual
          let shapeClasses = 'w-36 h-36 rounded-[28px]'
          if (mesa.forma === 'redonda') shapeClasses = 'w-36 h-36 rounded-full'
          else if (mesa.forma === 'rectangular') shapeClasses = 'w-48 h-32 rounded-[28px]'
          else if (mesa.forma === 'barra') shapeClasses = 'w-32 h-28 rounded-2xl'

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
              className={`absolute transition-all flex flex-col items-center justify-between p-3.5 shadow-md border text-center ${shapeClasses} ${
                isEditMode
                  ? 'cursor-grab active:cursor-grabbing hover:scale-105 border-[#ECC94B] bg-white dark:bg-[#1A1A1A] ring-2 ring-[#ECC94B]/30 z-30'
                  : 'cursor-pointer hover:scale-105 active:scale-95'
              } ${
                isFree
                  ? 'bg-white dark:bg-[#141414] border-black/10 dark:border-white/10 hover:border-[#16A34B]'
                  : isOccupied
                  ? 'bg-white dark:bg-[#141414] border-coral shadow-coral/10'
                  : 'bg-white dark:bg-[#141414] border-[#ECC94B] animate-pulse'
              }`}
            >
              {/* Header de la mesa: Capacidad + Botón QR */}
              <div className="w-full flex items-center justify-between text-[10px] text-negro/50 dark:text-arena/60 px-1">
                <span className="flex items-center gap-1 font-mono font-bold">
                  <Users className="w-3 h-3 text-turquesa" />
                  <span>{mesa.capacidad}p</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenQr(mesa)
                  }}
                  className="p-1 text-negro/60 dark:text-arena/60 hover:text-turquesa rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  title="Ver código QR de la mesa"
                >
                  <QrCode className="w-3 h-3" />
                </button>
              </div>

              {/* Centro de la mesa: Nombre y Estado */}
              <div className="flex flex-col items-center justify-center my-auto">
                <span className="font-sans font-black text-sm sm:text-base tracking-tight text-negro dark:text-blanco leading-tight">
                  {mesa.nombre}
                </span>

                {isFree ? (
                  <span className="text-[9px] font-mono font-bold bg-[#16A34B] text-white px-2 py-0.5 rounded-full mt-1 shadow-sm">
                    Libre
                  </span>
                ) : (
                  <div className="flex flex-col items-center mt-0.5">
                    <span className="font-sans font-black text-sm sm:text-base text-negro dark:text-blanco">
                      ${totalMesa.toFixed(0)}
                    </span>
                    <span
                      className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 shadow-sm ${
                        isPendingBill
                          ? 'bg-[#ECC94B] text-[#3A2D00]'
                          : 'bg-coral text-white'
                      }`}
                    >
                      {isPendingBill ? 'Cuenta' : 'Comiendo'}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer de la mesa */}
              <div className="w-full flex items-center justify-center text-[9px] font-sans px-1">
                {isEditMode ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditConfig(mesa)
                    }}
                    className="text-oro font-bold hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>Config</span>
                  </button>
                ) : (
                  <span className="text-negro/50 dark:text-arena/50 truncate max-w-full font-medium text-[10px]">
                    {isFree ? 'Abrir comanda' : mesa.pedido_activo?.cliente_nombre || 'Comanda activa'}
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
