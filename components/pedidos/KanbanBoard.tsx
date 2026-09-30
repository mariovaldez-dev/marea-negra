'use client'

import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createBrowserClient } from '@/lib/supabase/client'
import { Pedido, Platillo, EstadoPedido, MetodoPago } from '@/lib/types/database'
import { updatePedidoEstado, createNuevoPedido } from '@/lib/actions/pedidos'
import { descontarInventarioPorPedido } from '@/lib/actions/recetas'
import { notificarPedidoListoCliente } from '@/lib/actions/whatsappNotification'
import {
  Plus,
  Clock,
  Phone,
  DollarSign,
  X,
  Loader2,
  Search,
  CheckCircle2,
  Eye,
  MessageSquare,
  ShoppingBag,
  Printer,
  Calendar,
  Receipt,
  Utensils,
} from 'lucide-react'

import { getMazatlanDateString } from '@/lib/utils/date'
import { TicketTermicoModal } from '@/components/print/TicketTermicoModal'

interface KanbanBoardProps {
  initialPedidos: Pedido[]
  platillosDisponibles: Platillo[]
}

const COLUMNS: {
  id: EstadoPedido
  label: string
  badgeBg: string
  badgeText: string
}[] = [
  {
    id: 'nuevo',
    label: 'NUEVO',
    badgeBg: 'bg-coral',
    badgeText: 'text-white',
  },
  {
    id: 'preparando',
    label: 'PREPARANDO',
    badgeBg: 'bg-[#ECC94B]',
    badgeText: 'text-[#3A2D00]',
  },
  {
    id: 'listo',
    label: 'LISTO',
    badgeBg: 'bg-[#16A34B]',
    badgeText: 'text-white',
  },
  {
    id: 'entregado',
    label: 'ENTREGADO',
    badgeBg: 'bg-turquesa',
    badgeText: 'text-black',
  },
]

export function KanbanBoard({
  initialPedidos,
  platillosDisponibles,
}: KanbanBoardProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos)
  const [showModal, setShowModal] = useState(false)
  const [previewPedido, setPreviewPedido] = useState<Pedido | null>(null)
  const [thermalTicketPedido, setThermalTicketPedido] = useState<Pedido | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pedidoToReject, setPedidoToReject] = useState<Pedido | null>(null)

  // Filtros de fecha (por defecto HOY en horario Mazatlán)
  const todayStr = getMazatlanDateString()
  const [filterMode, setFilterMode] = useState<'hoy' | 'activos' | 'fecha' | 'todos'>('hoy')
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)

  // Form State para Nuevo Pedido
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [horaRecogida, setHoraRecogida] = useState('')
  const [notas, setNotas] = useState('')
  const [selectedItems, setSelectedItems] = useState<
    { platillo: Platillo; cantidad: number }[]
  >([])
  const [dishQuery, setDishQuery] = useState('')

  const supabase = createBrowserClient()

  // 1. Supabase Realtime Listener
  useEffect(() => {
    const channel = supabase
      .channel('realtime_pedidos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Pedido
            setPedidos((prev) => [newOrder, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Pedido
            setPedidos((prev) =>
              prev.map((p) => (p.id === updatedOrder.id ? updatedOrder : p))
            )
            setPreviewPedido((current) =>
              current && current.id === updatedOrder.id ? updatedOrder : current
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setPedidos((prev) => prev.filter((p) => p.id !== deletedId))
            setPreviewPedido((current) => (current?.id === deletedId ? null : current))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Filtrado de pedidos según fecha de HOY (Mazatlán) o modo seleccionado
  const displayedPedidos = pedidos.filter((p) => {
    if (!p.created_at) return true
    const orderDateStr = getMazatlanDateString(p.created_at)

    if (filterMode === 'hoy') {
      return orderDateStr === todayStr || ['nuevo', 'preparando', 'listo'].includes(p.estado)
    }
    if (filterMode === 'activos') {
      return ['nuevo', 'preparando', 'listo'].includes(p.estado)
    }
    if (filterMode === 'fecha') {
      return orderDateStr === selectedDate
    }
    return true
  })

  // Handlers para Drag & Drop
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const pedidoId = parseInt(draggableId, 10)
    const nuevoEstado = destination.droppableId as EstadoPedido

    // Actualización optimista en cliente
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
    )

    try {
      await updatePedidoEstado(pedidoId, nuevoEstado)

      if (nuevoEstado === 'preparando' || nuevoEstado === 'listo') {
        descontarInventarioPorPedido(pedidoId).catch((e) =>
          console.warn('Stock discount error:', e)
        )
      }

      if (nuevoEstado === 'listo') {
        notificarPedidoListoCliente(pedidoId)
          .then((res) => {
            if (res.success && !res.sentViaApi && res.waUrl && typeof window !== 'undefined') {
              window.open(res.waUrl, '_blank', 'noopener,noreferrer')
            }
          })
          .catch((e) => console.warn('WA error:', e))
      }

      if (nuevoEstado === 'entregado') {
        const ped = pedidos.find((p) => p.id === pedidoId)
        if (ped) {
          setThermalTicketPedido(ped)
        }
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err)
      setPedidos(initialPedidos)
    }
  }

  const handleStatusChange = async (pedidoId: number, nuevoEstado: EstadoPedido) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
    )
    if (previewPedido && previewPedido.id === pedidoId) {
      setPreviewPedido({ ...previewPedido, estado: nuevoEstado })
    }
    try {
      await updatePedidoEstado(pedidoId, nuevoEstado)
      if (nuevoEstado === 'preparando' || nuevoEstado === 'listo') {
        descontarInventarioPorPedido(pedidoId).catch((e) =>
          console.warn('Stock discount error:', e)
        )
      }
      if (nuevoEstado === 'listo') {
        notificarPedidoListoCliente(pedidoId)
          .then((res) => {
            if (res.success && !res.sentViaApi && res.waUrl && typeof window !== 'undefined') {
              window.open(res.waUrl, '_blank', 'noopener,noreferrer')
            }
          })
          .catch((e) => console.warn('WA error:', e))
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err)
    }
  }

  const handleAddDish = (platillo: Platillo) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.platillo.id === platillo.id)
      if (existing) {
        return prev.map((item) =>
          item.platillo.id === platillo.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      return [...prev, { platillo, cantidad: 1 }]
    })
  }

  const handleRemoveDish = (platilloId: number) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.platillo.id === platilloId)
      if (!existing) return prev
      if (existing.cantidad === 1) {
        return prev.filter((item) => item.platillo.id !== platilloId)
      }
      return prev.map((item) =>
        item.platillo.id === platilloId
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      )
    })
  }

  const modalTotal = selectedItems.reduce(
    (sum, item) => sum + item.platillo.precio * item.cantidad,
    0
  )

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteNombre.trim() || selectedItems.length === 0) return

    setIsSubmitting(true)
    try {
      await createNuevoPedido({
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono,
        metodo_pago: metodoPago,
        hora_recogida: horaRecogida,
        notas,
        items: selectedItems.map((item) => ({
          platillo_id: item.platillo.id,
          nombre_platillo: item.platillo.nombre,
          precio_unitario: item.platillo.precio,
          cantidad: item.cantidad,
        })),
      })

      setClienteNombre('')
      setClienteTelefono('')
      setHoraRecogida('')
      setNotas('')
      setSelectedItems([])
      setShowModal(false)
    } catch (err) {
      console.error('Error al crear pedido:', err)
      alert('Ocurrió un error al crear el pedido.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredDishes = platillosDisponibles.filter((p) =>
    p.nombre.toLowerCase().includes(dishQuery.toLowerCase())
  )

  const totalHoy = displayedPedidos
    .filter((p) => p.estado === 'entregado')
    .reduce((sum, p) => sum + (p.total || 0), 0)

  const activeCount = displayedPedidos.filter(
    (p) => p.estado !== 'entregado' && p.estado !== 'cancelado'
  ).length

  return (
    <div className="flex flex-col gap-4 relative h-[calc(100vh-100px)] w-full max-w-7xl mx-auto overflow-hidden">
      {/* ── BENTO HEADER (COMPACTO) ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="bg-coral text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            COMANDAS
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-black dark:text-white tracking-wide">
            TABLERO KANBAN
          </h1>
          <span className="text-xs font-mono font-bold text-black/40 dark:text-white/40 hidden sm:inline">
            ({activeCount} activas)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Filter Control */}
          <div className="flex items-center p-1 bg-black/[0.04] dark:bg-white/[0.05] rounded-full border border-black/5 dark:border-white/10">
            <button
              onClick={() => setFilterMode('hoy')}
              className={`px-3 py-1 rounded-full text-xs font-sans font-bold transition-all ${
                filterMode === 'hoy'
                  ? 'bg-turquesa text-black shadow-sm'
                  : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
              }`}
            >
              HOY
            </button>
            <button
              onClick={() => setFilterMode('activos')}
              className={`px-3 py-1 rounded-full text-xs font-sans font-bold transition-all ${
                filterMode === 'activos'
                  ? 'bg-coral text-white shadow-sm'
                  : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
              }`}
            >
              ACTIVOS ({activeCount})
            </button>
            <button
              onClick={() => setFilterMode('todos')}
              className={`px-3 py-1 rounded-full text-xs font-sans font-bold transition-all ${
                filterMode === 'todos'
                  ? 'bg-[#ECC94B] text-[#3A2D00] shadow-sm'
                  : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
              }`}
            >
              TODOS
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 bg-coral text-white hover:bg-coral/90 font-sans font-bold text-xs px-4 py-2 rounded-full shadow-[0_2px_12px_rgba(232,67,10,0.3)] transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>NUEVO PEDIDO</span>
          </button>
        </div>
      </div>

      {/* ── KANBAN BOARD 4 COLUMNAS CON SCROLL INTERNO BLOQUEADO ─────────────────── */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 flex-1 min-h-0 items-stretch">
          {COLUMNS.map((col) => {
            const colPedidos = displayedPedidos.filter((p) => p.estado === col.id)

            return (
              <div
                key={col.id}
                className="bg-[#FBF9F5] dark:bg-[#0E0E0E] border border-black/10 dark:border-white/10 rounded-[24px] p-3 flex flex-col h-full shadow-sm overflow-hidden"
              >
                {/* Column Header Fijo */}
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5 shrink-0 px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`${col.badgeBg} ${col.badgeText} text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm`}
                    >
                      {col.label}
                    </span>
                  </div>

                  <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white text-[11px] font-bold font-mono flex items-center justify-center">
                    {colPedidos.length}
                  </span>
                </div>

                {/* Droppable Container con Scroll Vertical Interno */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1 mt-2 rounded-[18px] transition-all ${
                        snapshot.isDraggingOver
                          ? 'bg-turquesa/5 dark:bg-turquesa/10 border-2 border-dashed border-turquesa/40'
                          : ''
                      }`}
                    >
                      {colPedidos.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-center text-black/30 dark:text-white/30 text-xs font-sans italic">
                          <span>Sin comandas</span>
                        </div>
                      )}

                      {colPedidos.map((pedido, index) => (
                        <Draggable
                          key={pedido.id}
                          draggableId={pedido.id.toString()}
                          index={index}
                        >
                          {(providedDrag, snapshotDrag) => (
                            <div
                              ref={providedDrag.innerRef}
                              {...providedDrag.draggableProps}
                              {...providedDrag.dragHandleProps}
                              className={`transition-all ${
                                snapshotDrag.isDragging
                                  ? 'rotate-2 scale-105 z-50 shadow-2xl'
                                  : ''
                              }`}
                            >
                              {/* ── BENTO ORDER CARD COMPACTA ── */}
                              <div
                                onClick={() => setPreviewPedido(pedido)}
                                className="bg-white dark:bg-[#161616] border border-black/10 dark:border-white/10 rounded-[18px] p-3 flex flex-col gap-2 shadow-sm hover:shadow-md hover:border-turquesa/50 cursor-pointer transition-all group relative overflow-hidden"
                              >
                                {/* Header: #ID + Type Badge + Price */}
                                <div className="flex items-center justify-between gap-1.5 min-w-0">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className="font-mono text-xs font-bold text-turquesa">
                                      #{pedido.id}
                                    </span>
                                    {pedido.tipo_entrega === 'didi' && (
                                      <span className="bg-[#ECC94B] text-[#3A2D00] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                        🛵 DIDI
                                      </span>
                                    )}
                                    {(pedido.mesa_nombre || pedido.tipo_entrega === 'mesa') && (
                                      <span className="bg-coral text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 truncate max-w-[90px]">
                                        🍽️ {pedido.mesa_nombre || 'MESA'}
                                      </span>
                                    )}
                                  </div>

                                  <span className="font-display text-lg text-coral font-bold shrink-0">
                                    ${Number(pedido.total || 0).toFixed(0)}
                                  </span>
                                </div>

                                {/* Customer Name */}
                                <div className="flex items-center justify-between gap-2 min-w-0">
                                  <h4 className="font-sans font-bold text-xs text-black dark:text-white truncate group-hover:text-coral transition-colors">
                                    {pedido.cliente_nombre}
                                  </h4>

                                  {pedido.hora_recogida && (
                                    <span className="text-[10px] font-mono text-turquesa font-bold shrink-0 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      {pedido.hora_recogida.slice(0, 5)}
                                    </span>
                                  )}
                                </div>

                                {/* Items Breakdown (Compacto) */}
                                {pedido.pedido_items && pedido.pedido_items.length > 0 && (
                                  <div className="flex flex-col gap-0.5 py-1.5 border-y border-black/5 dark:border-white/5 text-[11px] font-sans text-black/75 dark:text-white/75">
                                    {pedido.pedido_items.map((item, i) => (
                                      <div
                                        key={i}
                                        className="flex justify-between items-center gap-1 min-w-0"
                                      >
                                        <span className="truncate min-w-0 flex-1">
                                          <strong className="text-turquesa mr-1">
                                            x{item.cantidad}
                                          </strong>
                                          {item.nombre_platillo}
                                        </span>
                                        <span className="font-mono text-[10px] text-black/40 dark:text-white/40 shrink-0">
                                          $
                                          {(
                                            (item.precio_unitario || 0) * item.cantidad
                                          ).toFixed(0)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Notes / Cupón legible en font-sans */}
                                {pedido.notas && (
                                  <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 text-[11px] font-sans font-semibold text-black/80 dark:text-white/80 truncate flex items-center gap-1.5">
                                    <span className="text-coral">📝</span>
                                    <span className="truncate">{pedido.notas}</span>
                                  </div>
                                )}

                                {/* Micro Action Buttons */}
                                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setThermalTicketPedido(pedido)
                                    }}
                                    className="flex-1 bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white text-[10px] font-sans font-bold py-1 px-2 rounded-full transition-all flex items-center justify-center gap-1"
                                    title="Ticket"
                                  >
                                    <Receipt className="w-3 h-3 text-oro" />
                                    <span>TICKET</span>
                                  </button>

                                  {pedido.cliente_telefono && (
                                    <a
                                      href={`https://wa.me/52${pedido.cliente_telefono.replace(
                                        /\D/g,
                                        ''
                                      )}?text=Hola%20${encodeURIComponent(
                                        pedido.cliente_nombre
                                      )},%20te%20contactamos%20de%20*Marea%20Negra*%20sobre%20tu%20pedido%20%23${
                                        pedido.id
                                      }.`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="bg-[#25D366] text-white hover:bg-[#1EBE5D] text-[10px] font-sans font-bold py-1 px-2.5 rounded-full transition-all flex items-center gap-1 shadow-sm"
                                      title="WhatsApp"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      <span>WA</span>
                                    </a>
                                  )}

                                  {pedido.estado !== 'entregado' &&
                                    pedido.estado !== 'cancelado' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setPedidoToReject(pedido)
                                        }}
                                        className="text-red-500 hover:bg-red-500/10 p-1 rounded-full transition-all"
                                        title="Rechazar"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* ── FOOTER RESUMEN COMPACTO ────────────────────────────────────────────── */}
      <div className="bg-white/90 dark:bg-[#111111]/90 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-full px-5 py-2.5 shadow-md flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#16A34B] animate-pulse" />
          <span className="text-xs font-sans text-turquesa font-bold uppercase tracking-wider">
            OPERACIÓN EN VIVO
          </span>
          <span className="text-xs font-sans text-black/60 dark:text-white/60 hidden sm:inline">
            Activas: <strong className="text-black dark:text-white">{activeCount}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-sans text-black/50 dark:text-white/50 uppercase">
            Ventas Entregadas:
          </span>
          <span className="font-display text-xl text-coral font-bold">
            ${totalHoy.toFixed(0)} MXN
          </span>
        </div>
      </div>

      {/* ── MODAL DETALLE & PREVIEW DE COMANDA ──────────────────────────────────── */}
      {previewPedido && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative text-black dark:text-white flex flex-col gap-6">
            {/* Header Preview */}
            <div className="flex items-start justify-between border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="bg-turquesa text-black text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    COMANDA #{previewPedido.id}
                  </span>
                  <span className="text-xs font-mono font-bold text-turquesa">
                    {previewPedido.estado.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-display text-3xl md:text-4xl text-black dark:text-white mt-1">
                  {previewPedido.cliente_nombre}
                </h3>
              </div>
              <button
                onClick={() => setPreviewPedido(null)}
                className="p-2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Buttons */}
            <div className="flex flex-col gap-2 bg-black/[0.03] dark:bg-white/[0.03] p-4 rounded-[24px] border border-black/5 dark:border-white/5">
              <span className="text-[11px] font-sans font-bold text-black/60 dark:text-white/60 uppercase tracking-wider">
                Mover Estado de la Comanda:
              </span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { id: 'nuevo', label: 'NUEVO', color: 'bg-coral text-white' },
                  { id: 'preparando', label: 'PREPARANDO', color: 'bg-[#ECC94B] text-[#3A2D00]' },
                  { id: 'listo', label: 'LISTO', color: 'bg-[#16A34B] text-white' },
                  { id: 'entregado', label: 'ENTREGADO', color: 'bg-turquesa text-black' },
                  { id: 'cancelado', label: 'RECHAZAR 🚫', color: 'bg-red-600 text-white' },
                ].map((st) => {
                  const isCurrent = previewPedido.estado === st.id
                  return (
                    <button
                      key={st.id}
                      onClick={() => handleStatusChange(previewPedido.id, st.id as EstadoPedido)}
                      className={`py-2 px-2 rounded-xl text-[10px] font-sans font-bold tracking-wider transition-all ${
                        isCurrent
                          ? `${st.color} shadow-md ring-2 ring-black/20 dark:ring-white/30 scale-105`
                          : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {st.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Customer & Order Data */}
            <div className="grid grid-cols-2 gap-4 bg-black/[0.03] dark:bg-white/[0.03] p-4 rounded-[24px] border border-black/5 dark:border-white/5 text-xs font-sans">
              <div className="flex flex-col gap-1">
                <span className="text-black/50 dark:text-white/50 uppercase font-bold text-[10px]">
                  Teléfono Cliente:
                </span>
                <span className="font-mono text-sm text-black dark:text-white flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-turquesa" />
                  {previewPedido.cliente_telefono || 'No registrado'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-black/50 dark:text-white/50 uppercase font-bold text-[10px]">
                  Hora Recogida:
                </span>
                <span className="font-mono text-sm text-turquesa flex items-center gap-1.5 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  {previewPedido.hora_recogida
                    ? `${previewPedido.hora_recogida.slice(0, 5)} hrs`
                    : 'Por acordar'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-black/50 dark:text-white/50 uppercase font-bold text-[10px]">
                  Método de Pago:
                </span>
                <span className="font-bold text-sm text-oro uppercase flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  {previewPedido.metodo_pago || 'Efectivo'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-black/50 dark:text-white/50 uppercase font-bold text-[10px]">
                  Tipo Entrega:
                </span>
                <span className="font-bold text-sm uppercase flex items-center gap-1.5 text-black dark:text-white">
                  {previewPedido.tipo_entrega === 'didi'
                    ? '🛵 ENVÍO DIDI'
                    : previewPedido.mesa_nombre
                    ? `🍽️ ${previewPedido.mesa_nombre}`
                    : '🚗 RECOGER'}
                </span>
              </div>

              <div className="flex flex-col gap-1 col-span-2 pt-2 border-t border-black/5 dark:border-white/5">
                <span className="text-black/50 dark:text-white/50 uppercase font-bold text-[10px]">
                  Total Comanda:
                </span>
                <span className="font-display text-3xl text-coral font-bold">
                  ${Number(previewPedido.total || 0).toFixed(2)} MXN
                </span>
              </div>
            </div>

            {/* Dish Breakdown */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-black/70 dark:text-white/70 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-coral" />
                <span>Detalle de Platillos Ordenados:</span>
              </span>

              {previewPedido.pedido_items && previewPedido.pedido_items.length > 0 ? (
                <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden divide-y divide-black/5 dark:divide-white/5">
                  {previewPedido.pedido_items.map((item, i) => (
                    <div
                      key={i}
                      className="p-3.5 flex items-center justify-between text-xs font-sans"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-turquesa text-black font-mono font-bold px-2 py-0.5 rounded-lg text-xs">
                          x{item.cantidad}
                        </span>
                        <span className="font-bold text-black dark:text-white text-sm">
                          {item.nombre_platillo}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-black/50 dark:text-white/50 text-[11px]">
                          ${item.precio_unitario} c/u
                        </span>
                        <span className="font-display text-lg text-coral font-bold min-w-[60px] text-right">
                          ${((item.precio_unitario || 0) * item.cantidad).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-black/50 dark:text-white/50 italic bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                  Sin detalle de platillos disponible.
                </p>
              )}
            </div>

            {/* Notes */}
            {previewPedido.notas && (
              <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[20px] p-4 flex flex-col gap-1 text-xs">
                <span className="font-sans font-bold text-coral uppercase tracking-wider">
                  📝 Notas Especiales / Cupón:
                </span>
                <p className="font-sans font-semibold text-black dark:text-white text-sm leading-relaxed">
                  {previewPedido.notas}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-black/10 dark:border-white/10">
              {previewPedido.cliente_telefono && (
                <a
                  href={`https://wa.me/52${previewPedido.cliente_telefono.replace(
                    /\D/g,
                    ''
                  )}?text=Hola%20${encodeURIComponent(
                    previewPedido.cliente_nombre
                  )},%20te%20contactamos%20de%20*Marea%20Negra*%20sobre%20tu%20pedido%20%23${
                    previewPedido.id
                  }.%20Tu%20pedido%20esta%20${previewPedido.estado.toUpperCase()}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#25D366] text-white font-sans font-bold text-xs py-3.5 px-4 rounded-full hover:bg-[#1EBE5D] transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WHATSAPP AL CLIENTE</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setThermalTicketPedido(previewPedido)}
                className="bg-black/10 dark:bg-white/10 text-black dark:text-white hover:bg-coral hover:text-white font-sans font-bold text-xs py-3.5 px-4 rounded-full transition-all flex items-center justify-center gap-2 border border-black/10 dark:border-white/10"
              >
                <Printer className="w-4 h-4" />
                <span>TICKET</span>
              </button>

              <button
                onClick={() => setPreviewPedido(null)}
                className="px-6 py-3.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white font-sans font-bold text-xs rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL TICKET TÉRMICO / PDF ─────────────────────────────────────────── */}
      {thermalTicketPedido && (
        <TicketTermicoModal
          pedido={thermalTicketPedido}
          tipo="cuenta_cliente"
          onClose={() => setThermalTicketPedido(null)}
        />
      )}

      {/* ── MODAL CREAR NUEVO PEDIDO MANUAL ───────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative text-black dark:text-white flex flex-col gap-6">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-sans font-bold tracking-widest text-turquesa uppercase">
                MOSTRADOR / LLAMADAS
              </span>
              <h3 className="font-display text-3xl text-black dark:text-white">
                REGISTRAR NUEVO PEDIDO MANUAL
              </h3>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-black/70 dark:text-white/70">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mario Valdez"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-black dark:text-white focus:border-turquesa focus:outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-black/70 dark:text-white/70">
                    Teléfono WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. 6691234567"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-black dark:text-white focus:border-turquesa focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-black/70 dark:text-white/70">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                    className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-black dark:text-white focus:border-turquesa focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia SPEI</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-black/70 dark:text-white/70">
                    Hora de Recogida
                  </label>
                  <input
                    type="time"
                    value={horaRecogida}
                    onChange={(e) => setHoraRecogida(e.target.value)}
                    className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-black dark:text-white focus:border-turquesa focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Platillos Selector */}
              <div className="flex flex-col gap-3 border-t border-black/10 dark:border-white/10 pt-4">
                <span className="text-xs font-sans uppercase font-bold text-black/70 dark:text-white/70">
                  Seleccionar Platillos del Menú *
                </span>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-black/40 dark:text-white/40" />
                  <input
                    type="text"
                    placeholder="Buscar platillo por nombre..."
                    value={dishQuery}
                    onChange={(e) => setDishQuery(e.target.value)}
                    className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-black dark:text-white focus:border-turquesa focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {filteredDishes.map((platillo) => {
                    const sel = selectedItems.find(
                      (item) => item.platillo.id === platillo.id
                    )
                    return (
                      <div
                        key={platillo.id}
                        className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-2.5 flex items-center justify-between text-xs hover:border-turquesa/40 transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-black dark:text-white">
                            {platillo.emoji} {platillo.nombre}
                          </span>
                          <span className="text-coral font-display text-sm font-bold">
                            ${platillo.precio}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {sel && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDish(platillo.id)}
                              className="w-7 h-7 rounded-full bg-coral/20 text-coral font-bold flex items-center justify-center hover:bg-coral hover:text-white transition-colors"
                            >
                              -
                            </button>
                          )}
                          {sel && (
                            <span className="font-bold text-turquesa text-sm px-1">
                              {sel.cantidad}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAddDish(platillo)}
                            className="w-7 h-7 rounded-full bg-turquesa text-black font-bold flex items-center justify-center hover:bg-turquesa/80 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Selected Summary */}
                {selectedItems.length > 0 && (
                  <div className="bg-black/[0.04] dark:bg-white/[0.04] border border-turquesa/30 rounded-[20px] p-3.5 flex flex-col gap-2 mt-2">
                    <span className="text-[11px] font-sans font-bold text-turquesa uppercase">
                      Items Seleccionados:
                    </span>
                    {selectedItems.map((item) => (
                      <div
                        key={item.platillo.id}
                        className="flex justify-between items-center text-xs text-black/80 dark:text-white/80"
                      >
                        <span>
                          x{item.cantidad} {item.platillo.nombre}
                        </span>
                        <span className="font-mono text-coral font-bold">
                          ${item.platillo.precio * item.cantidad}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-black/10 dark:border-white/10 text-sm">
                      <span className="font-bold text-black dark:text-white">
                        Total Calculado:
                      </span>
                      <span className="font-display text-2xl text-coral font-bold">
                        ${modalTotal}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Special Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-black/70 dark:text-white/70">
                  Notas Especiales / Especificaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Sin cebolla morada, salsa aparte..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-xs text-black dark:text-white focus:border-turquesa focus:outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white font-sans font-bold text-xs rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedItems.length === 0}
                  className="px-6 py-3 bg-coral text-white font-sans font-bold text-xs tracking-wider rounded-full hover:bg-coral/90 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>GUARDANDO...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CREAR COMANDA</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL RECHAZAR PEDIDO ──────────────────────────────────────────────── */}
      {pedidoToReject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111111] border border-red-500/30 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl p-6 flex flex-col gap-4 text-black dark:text-white">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500">
              <X className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-black dark:text-white">
                ¿Rechazar Comanda <span className="text-red-500">#{pedidoToReject.id}</span>?
              </h3>
              <p className="text-black/60 dark:text-white/60 font-sans text-xs mt-1 leading-relaxed">
                Estás a punto de cancelar la orden de <strong>{pedidoToReject.cliente_nombre}</strong>. Esta acción no se puede deshacer y el cliente no recibirá su pedido.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPedidoToReject(null)}
                className="px-4 py-2.5 font-sans font-bold text-xs text-black dark:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors border border-black/10 dark:border-white/10"
              >
                Mantener Pedido
              </button>
              <button
                onClick={() => {
                  handleStatusChange(pedidoToReject.id, 'cancelado')
                  setPedidoToReject(null)
                }}
                className="px-5 py-2.5 font-sans font-bold text-xs text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors shadow-lg"
              >
                Sí, Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
