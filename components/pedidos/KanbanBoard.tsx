'use client'

import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createBrowserClient } from '@/lib/supabase/client'
import { Pedido, Platillo, EstadoPedido, MetodoPago } from '@/lib/types/database'
import { updatePedidoEstado, createNuevoPedido } from '@/lib/actions/pedidos'
import {
  Plus,
  Clock,
  User,
  Phone,
  DollarSign,
  FileText,
  X,
  Loader2,
  Search,
  CheckCircle2,
  Eye,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Printer,
  ChevronRight,
  Calendar,
  Filter,
} from 'lucide-react'

import { TicketPrintModal } from '@/components/pedidos/TicketPrintModal'

interface KanbanBoardProps {
  initialPedidos: Pedido[]
  platillosDisponibles: Platillo[]
}

const COLUMNS: { id: EstadoPedido; label: string; dot: 'coral' | 'oro' | 'turquesa' | 'neutral' }[] = [
  { id: 'nuevo', label: 'NUEVO', dot: 'coral' },
  { id: 'preparando', label: 'PREPARANDO', dot: 'oro' },
  { id: 'listo', label: 'LISTO', dot: 'turquesa' },
  { id: 'entregado', label: 'ENTREGADO', dot: 'neutral' },
]

function getMazatlanTodayDateString(): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Mazatlan',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }
    const formatter = new Intl.DateTimeFormat('en-CA', options)
    return formatter.format(new Date())
  } catch (e) {
    return new Date().toISOString().slice(0, 10)
  }
}

export function KanbanBoard({
  initialPedidos,
  platillosDisponibles,
}: KanbanBoardProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos)
  const [showModal, setShowModal] = useState(false)
  const [previewPedido, setPreviewPedido] = useState<Pedido | null>(null)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtros de fecha (por defecto HOY en horario Mazatlán)
  const todayStr = getMazatlanTodayDateString()
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
    const orderDateStr = p.created_at.slice(0, 10)

    if (filterMode === 'hoy') {
      // Mostrar todos los pedidos creados HOY + cualquier pedido activo (nuevo, preparando, listo) sin importar fecha
      return orderDateStr === todayStr || ['nuevo', 'preparando', 'listo'].includes(p.estado)
    }
    if (filterMode === 'activos') {
      return ['nuevo', 'preparando', 'listo'].includes(p.estado)
    }
    if (filterMode === 'fecha') {
      return orderDateStr === selectedDate
    }
    return true // 'todos'
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
    } catch (err) {
      console.error('Error al actualizar estado:', err)
    }
  }

  // Handlers de la modal de creación
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

  return (
    <div className="flex flex-col gap-6 relative min-h-[calc(100vh-140px)]">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/10 pb-4">
        <div>
          <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase">
            OPERACIONES EN TIEMPO REAL
          </span>
          <h1 className="font-display text-4xl text-blanco tracking-wide">
            TABLERO KANBAN DE PEDIDOS
          </h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-coral text-blanco hover:bg-coral/80 font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-full shadow-[0_0_20px_rgba(232,67,10,0.3)] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>NUEVO PEDIDO MANUAL</span>
        </button>
      </div>

      {/* BARRA DE FILTRO POR FECHA DE HOY (HORARIO MAZATLÁN / SINALOA) */}
      <div className="bg-[#050404] bg-dots-pattern border-2 border-arena/20 rounded-2xl p-4 px-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg gold-border-corner">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-turquesa" />
          <span className="font-sans text-xs font-bold text-blanco uppercase tracking-wider">
            VISTA DE OPERACIONES:
          </span>
          <span className="bg-turquesa/20 text-turquesa text-xs font-mono font-bold px-3 py-1 rounded-full border border-turquesa/30">
            {filterMode === 'hoy'
              ? `PEDIDOS DE HOY (${todayStr})`
              : filterMode === 'activos'
              ? 'SOLO ACTIVOS EN COCINA'
              : filterMode === 'fecha'
              ? `FECHA: ${selectedDate}`
              : 'HISTÓRICO COMPLETO'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterMode('hoy')}
            className={`px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all border ${
              filterMode === 'hoy'
                ? 'bg-turquesa text-negro border-turquesa shadow-md'
                : 'bg-carbon text-arena/70 border-arena/20 hover:border-turquesa'
            }`}
          >
            📅 PEDIDOS DE HOY
          </button>

          <button
            onClick={() => setFilterMode('activos')}
            className={`px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all border ${
              filterMode === 'activos'
                ? 'bg-coral text-blanco border-coral shadow-md'
                : 'bg-carbon text-arena/70 border-arena/20 hover:border-coral'
            }`}
          >
            ⚡ SOLO ACTIVOS
          </button>

          <button
            onClick={() => setFilterMode('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all border ${
              filterMode === 'todos'
                ? 'bg-oro text-negro border-oro shadow-md'
                : 'bg-carbon text-arena/70 border-arena/20 hover:border-oro'
            }`}
          >
            🗓️ HISTÓRICO
          </button>

          <div className="flex items-center gap-1.5 bg-carbon border border-arena/20 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-[10px] text-arena/50 uppercase font-bold">FECHA:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setFilterMode('fecha')
              }}
              className="bg-transparent text-blanco font-mono focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* KANBAN BOARD WRAPPER */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 items-start">
          {COLUMNS.map((col) => {
            const colPedidos = displayedPedidos.filter((p) => p.estado === col.id)

            return (
              <div
                key={col.id}
                className="bg-[#050404] bg-dots-pattern border border-oro/15 rounded-xl p-4 flex flex-col gap-4 min-h-[500px] gold-border-corner"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-arena/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        col.dot === 'coral'
                          ? 'bg-coral shadow-[0_0_8px_#E8430A]'
                          : col.dot === 'oro'
                          ? 'bg-oro shadow-[0_0_8px_#C9A84C]'
                          : col.dot === 'turquesa'
                          ? 'bg-turquesa shadow-[0_0_8px_#2ABFBF]'
                          : 'bg-arena/40'
                      }`}
                    />
                    <h3 className="font-display text-xl text-blanco tracking-wider">
                      {col.label}
                    </h3>
                  </div>

                  <span className="w-6 h-6 rounded-full bg-carbon text-arena border border-arena/20 text-xs font-bold font-sans flex items-center justify-center">
                    {colPedidos.length}
                  </span>
                </div>

                {/* Droppable Container */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col gap-3 flex-1 transition-colors rounded-lg p-1 ${
                        snapshot.isDraggingOver ? 'bg-carbon/50 border border-dashed border-turquesa/30' : ''
                      }`}
                    >
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
                              className={`transition-transform ${
                                snapshotDrag.isDragging ? 'rotate-2 scale-105 z-50' : ''
                              }`}
                            >
                              {/* TARJETA KANBAN CLICKEABLE CON DETALLE PREVIEW */}
                              <div
                                onClick={() => setPreviewPedido(pedido)}
                                className="bg-[#111111] border border-arena/20 rounded-2xl p-4 flex flex-col gap-2.5 shadow-lg hover:border-turquesa cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all min-w-0 max-w-full overflow-hidden group"
                              >
                                {/* Header comanda: Order ID + Cliente + Total */}
                                <div className="flex items-start justify-between gap-2 min-w-0">
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-mono font-bold text-turquesa tracking-wider">
                                        #{pedido.id}
                                      </span>
                                      <span className="text-[10px] font-sans font-bold text-arena/40 group-hover:text-turquesa flex items-center gap-0.5 transition-colors">
                                        <Eye className="w-3 h-3" />
                                        <span>VER</span>
                                      </span>
                                    </div>
                                    <h4 className="font-sans font-bold text-sm md:text-base text-blanco truncate leading-snug group-hover:text-turquesa transition-colors">
                                      {pedido.cliente_nombre}
                                    </h4>
                                  </div>
                                  <span className="font-display text-xl text-coral font-bold shrink-0">
                                    ${pedido.total?.toFixed(0)}
                                  </span>
                                </div>

                                {/* Items de la comanda */}
                                {pedido.pedido_items && pedido.pedido_items.length > 0 && (
                                  <div className="flex flex-col gap-1 py-2 border-y border-arena/10 my-0.5">
                                    {pedido.pedido_items.map((item, i) => (
                                      <div key={i} className="flex justify-between items-center text-xs font-sans text-arena/90 gap-2 min-w-0">
                                        <span className="truncate min-w-0 flex-1">
                                          <strong className="text-turquesa mr-1">x{item.cantidad}</strong>
                                          {item.nombre_platillo}
                                        </span>
                                        <span className="text-[11px] font-mono text-arena/60 shrink-0">
                                          ${((item.precio_unitario || 0) * item.cantidad).toFixed(0)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Detalles: Hora, Teléfono, Método Pago */}
                                <div className="flex flex-col gap-1 text-[11px] font-sans text-arena/70">
                                  {pedido.hora_recogida && (
                                    <span className="flex items-center gap-1.5 text-turquesa font-semibold">
                                      <Clock className="w-3 h-3 shrink-0" />
                                      <span className="truncate">Recoge: {pedido.hora_recogida.slice(0, 5)} hrs</span>
                                    </span>
                                  )}
                                  {pedido.cliente_telefono && (
                                    <span className="flex items-center gap-1.5">
                                      <Phone className="w-3 h-3 text-arena/50 shrink-0" />
                                      <span className="truncate">{pedido.cliente_telefono}</span>
                                    </span>
                                  )}
                                  {pedido.metodo_pago && (
                                    <span className="flex items-center gap-1.5">
                                      <DollarSign className="w-3 h-3 text-oro/70 shrink-0" />
                                      <span className="uppercase font-semibold text-oro/80 truncate">Pago: {pedido.metodo_pago}</span>
                                    </span>
                                  )}
                                </div>

                                {/* Notas del pedido */}
                                {pedido.notas && (
                                  <div className="bg-coral/10 border border-coral/20 rounded-xl p-2 text-xs font-serif italic text-coral break-words overflow-hidden max-w-full">
                                    📝 "{pedido.notas}"
                                  </div>
                                )}
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

      {/* STICKY FOOTER RESUMEN DEL DÍA */}
      <div className="sticky bottom-4 z-20 bg-carbon/95 border border-oro/20 rounded-xl p-4 px-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-sans text-turquesa font-semibold uppercase tracking-wider">
            RESUMEN DE OPERACIÓN
          </span>
          <div className="h-4 w-[1px] bg-arena/20" />
          <span className="text-xs font-sans text-arena">
            Pedidos Activos: <strong className="text-blanco">{displayedPedidos.filter((p) => p.estado !== 'entregado' && p.estado !== 'cancelado').length}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-sans text-arena/60 uppercase">Ventas Entregadas (Vista Actual):</span>
          <span className="font-display text-2xl text-oro">${totalHoy.toFixed(0)}</span>
        </div>
      </div>

      {/* MODAL DETALLE Y PREVISUALIZACIÓN DE COMANDA (PREVIEW) */}
      {previewPedido && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/40 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 gold-border-corner shadow-2xl relative text-blanco flex flex-col gap-6">
            {/* Header Preview */}
            <div className="flex items-start justify-between border-b border-arena/15 pb-4">
              <div className="flex flex-col">
                <span className="text-xs font-mono font-bold text-turquesa tracking-widest uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>PREVISUALIZACIÓN DE COMANDA #{previewPedido.id}</span>
                </span>
                <h3 className="font-display text-3xl md:text-4xl text-blanco mt-1">
                  {previewPedido.cliente_nombre}
                </h3>
              </div>
              <button
                onClick={() => setPreviewPedido(null)}
                className="p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon border border-arena/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BOTONES DE CAMBIO RÁPIDO DE ESTADO */}
            <div className="flex flex-col gap-2 bg-carbon/60 p-4 rounded-2xl border border-arena/15">
              <span className="text-[11px] font-sans font-bold text-arena/70 uppercase tracking-wider">
                Cambiar Estado de la Comanda:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'nuevo', label: 'NUEVO', color: 'bg-coral text-blanco border-coral' },
                  { id: 'preparando', label: 'PREPARANDO', color: 'bg-oro text-negro border-oro' },
                  { id: 'listo', label: 'LISTO', color: 'bg-turquesa text-negro border-turquesa' },
                  { id: 'entregado', label: 'ENTREGADO', color: 'bg-arena/30 text-blanco border-arena/50' },
                ].map((st) => {
                  const isCurrent = previewPedido.estado === st.id
                  return (
                    <button
                      key={st.id}
                      onClick={() => handleStatusChange(previewPedido.id, st.id as EstadoPedido)}
                      className={`py-2 px-2 rounded-xl text-[10px] font-sans font-bold tracking-wider transition-all border ${
                        isCurrent
                          ? `${st.color} shadow-lg ring-2 ring-blanco/30 scale-105`
                          : 'bg-carbon/80 text-arena/60 border-arena/20 hover:border-blanco/40'
                      }`}
                    >
                      {st.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* DATOS DEL CLIENTE Y OPERACIÓN */}
            <div className="grid grid-cols-2 gap-4 bg-[#111111] p-4 rounded-2xl border border-arena/10 text-xs font-sans">
              <div className="flex flex-col gap-1">
                <span className="text-arena/50 uppercase font-bold">Teléfono Cliente:</span>
                <span className="font-mono text-sm text-blanco flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-turquesa" />
                  {previewPedido.cliente_telefono || 'No registrado'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-arena/50 uppercase font-bold">Hora Recogida:</span>
                <span className="font-mono text-sm text-turquesa flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {previewPedido.hora_recogida ? `${previewPedido.hora_recogida.slice(0, 5)} hrs` : 'Por acordar'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-arena/50 uppercase font-bold">Método de Pago:</span>
                <span className="font-bold text-sm text-oro uppercase flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  {previewPedido.metodo_pago || 'Efectivo'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-arena/50 uppercase font-bold">Total a Cobrar:</span>
                <span className="font-display text-xl text-coral font-bold">
                  ${previewPedido.total?.toFixed(2)} MXN
                </span>
              </div>
            </div>

            {/* DESGLOSE DE PLATILLOS DE LA COMANDA */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-arena/80 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-coral" />
                <span>Detalle de Platillos Ordenados:</span>
              </span>

              {previewPedido.pedido_items && previewPedido.pedido_items.length > 0 ? (
                <div className="bg-[#111111] border border-arena/10 rounded-2xl overflow-hidden divide-y divide-arena/10">
                  {previewPedido.pedido_items.map((item, i) => (
                    <div key={i} className="p-3.5 flex items-center justify-between text-xs font-sans">
                      <div className="flex items-center gap-3">
                        <span className="bg-turquesa/20 text-turquesa font-mono font-bold px-2 py-0.5 rounded-lg border border-turquesa/30">
                          x{item.cantidad}
                        </span>
                        <span className="font-bold text-blanco text-sm">
                          {item.nombre_platillo}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-arena/60 text-[11px]">
                          ${item.precio_unitario} c/u
                        </span>
                        <span className="font-display text-base text-coral font-bold min-w-[60px] text-right">
                          ${((item.precio_unitario || 0) * item.cantidad).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-arena/50 italic bg-carbon p-3 rounded-xl">
                  Sin detalle de platillos disponible.
                </p>
              )}
            </div>

            {/* NOTAS Y INSTRUCCIONES ESPECIALES DE COCINA */}
            {previewPedido.notas && (
              <div className="bg-coral/10 border border-coral/30 rounded-2xl p-4 flex flex-col gap-1 text-xs">
                <span className="font-sans font-bold text-coral uppercase tracking-wider">
                  📝 Notas / Instrucciones de Cocina:
                </span>
                <p className="font-serif italic text-coral text-sm leading-relaxed">
                  "{previewPedido.notas}"
                </p>
              </div>
            )}

            {/* ACCIONES RÁPIDAS DE CONTACTO Y WHATSAPP Y IMPRESIÓN */}
            <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-arena/15">
              {previewPedido.cliente_telefono && (
                <a
                  href={`https://wa.me/52${previewPedido.cliente_telefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(previewPedido.cliente_nombre)},%20te%20contactamos%20de%20*Marea%20Negra*%20sobre%20tu%20pedido%20%23${previewPedido.id}.%20Tu%20pedido%20esta%20${previewPedido.estado.toUpperCase()}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-turquesa text-negro font-sans font-bold text-xs py-3.5 px-4 rounded-xl hover:bg-blanco transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WHATSAPP AL CLIENTE</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="bg-oro text-negro font-sans font-bold text-xs py-3.5 px-4 rounded-xl hover:bg-blanco transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ TICKET (80MM)</span>
              </button>

              <button
                onClick={() => setPreviewPedido(null)}
                className="px-5 py-3.5 bg-carbon border border-arena/20 text-blanco font-sans font-bold text-xs rounded-xl hover:bg-arena/20 transition-colors"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPRESIÓN TICKET TÉRMICO POS */}
      {showPrintModal && previewPedido && (
        <TicketPrintModal
          pedido={previewPedido}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* MODAL CREAR NUEVO PEDIDO MANUAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#050404] bg-dots-pattern border border-oro/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 gold-border-corner shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-xs font-sans font-bold tracking-widest text-turquesa uppercase">
                COMANDAS DE PAGO / MOSTRADOR
              </span>
              <h3 className="font-display text-3xl text-blanco">
                REGISTRAR NUEVO PEDIDO MANUAL
              </h3>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-arena/90">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mario Valdez"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="bg-carbon border border-arena/20 rounded-xl px-4 py-3 text-base text-blanco focus:border-turquesa focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-arena/90">
                    Teléfono WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. 6691234567"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="bg-carbon border border-arena/20 rounded-xl px-4 py-3 text-base text-blanco focus:border-turquesa focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-arena/90">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                    className="bg-carbon border border-arena/20 rounded-xl px-4 py-3 text-base text-blanco focus:border-turquesa focus:outline-none"
                  >
                    <option value="efectivo">Efectivo al Recoger</option>
                    <option value="transferencia">Transferencia SPEI</option>
                    <option value="oxxo">Depósito OXXO</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-arena/90">
                    Hora de Recogida
                  </label>
                  <input
                    type="time"
                    value={horaRecogida}
                    onChange={(e) => setHoraRecogida(e.target.value)}
                    className="bg-carbon border border-arena/20 rounded-xl px-4 py-3 text-base text-blanco focus:border-turquesa focus:outline-none"
                  />
                </div>
              </div>

              {/* Selección de Platillos */}
              <div className="flex flex-col gap-3 border-t border-arena/10 pt-4">
                <span className="text-xs font-sans uppercase font-bold text-arena/90">
                  Seleccionar Platillos del Menú *
                </span>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-arena/50" />
                  <input
                    type="text"
                    placeholder="Buscar platillo por nombre..."
                    value={dishQuery}
                    onChange={(e) => setDishQuery(e.target.value)}
                    className="w-full bg-carbon border border-arena/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-blanco focus:border-turquesa focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredDishes.map((platillo) => {
                    const sel = selectedItems.find(
                      (item) => item.platillo.id === platillo.id
                    )
                    return (
                      <div
                        key={platillo.id}
                        className="bg-carbon border border-arena/10 rounded-xl p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-blanco">
                            {platillo.emoji} {platillo.nombre}
                          </span>
                          <span className="text-coral font-display">
                            ${platillo.precio}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {sel && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDish(platillo.id)}
                              className="w-6 h-6 rounded-lg bg-coral/20 text-coral font-bold flex items-center justify-center hover:bg-coral hover:text-blanco"
                            >
                              -
                            </button>
                          )}
                          {sel && (
                            <span className="font-bold text-turquesa">
                              {sel.cantidad}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAddDish(platillo)}
                            className="w-6 h-6 rounded-lg bg-turquesa/20 text-turquesa font-bold flex items-center justify-center hover:bg-turquesa hover:text-negro"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Resumen de Items Seleccionados */}
                {selectedItems.length > 0 && (
                  <div className="bg-carbon/60 border border-turquesa/30 rounded-xl p-3 flex flex-col gap-2 mt-2">
                    <span className="text-[11px] font-sans font-bold text-turquesa uppercase">
                      Items Seleccionados:
                    </span>
                    {selectedItems.map((item) => (
                      <div
                        key={item.platillo.id}
                        className="flex justify-between items-center text-xs text-arena/90"
                      >
                        <span>
                          x{item.cantidad} {item.platillo.nombre}
                        </span>
                        <span className="font-mono text-coral font-bold">
                          ${item.platillo.precio * item.cantidad}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-arena/10 text-sm">
                      <span className="font-bold text-blanco">Total Calculado:</span>
                      <span className="font-display text-2xl text-coral font-bold">
                        ${modalTotal}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-arena/90">
                  Notas Especiales / Especificaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Sin cebolla morada, extra tostadas..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="bg-carbon border border-arena/20 rounded-xl px-4 py-3 text-xs text-blanco focus:border-turquesa focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 bg-carbon border border-arena/20 text-blanco font-sans font-bold text-xs rounded-xl hover:bg-arena/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedItems.length === 0}
                  className="px-6 py-3 bg-coral text-blanco font-sans font-bold text-xs tracking-wider rounded-xl hover:bg-coral/80 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>GUARDANDO...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CREAR PEDIDO</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
