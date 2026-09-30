'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Pedido, EstadoPedido } from '@/lib/types/database'
import { updatePedidoEstado } from '@/lib/actions/pedidos'
import { descontarInventarioPorPedido } from '@/lib/actions/recetas'
import { notificarPedidoListoCliente } from '@/lib/actions/whatsappNotification'
import { useWebNotifications } from '@/lib/hooks/useWebNotifications'
import {
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  Flame,
  ShoppingBag,
  Bell,
  RefreshCw,
  Megaphone,
  X,
  Printer,
  User,
  Phone,
  Ban,
  Ticket,
  FileText,
  Maximize2,
  Minimize2,
  Check,
  ChefHat,
  Utensils,
  Sparkles,
} from 'lucide-react'
import dynamic from 'next/dynamic'

const TicketTermicoModal = dynamic(
  () => import('@/components/print/TicketTermicoModal').then((mod) => mod.TicketTermicoModal),
  { ssr: false }
)

interface KitchenMonitorProps {
  initialPedidos: Pedido[]
}

const PICOR_EMOJIS: Record<string, string> = {
  suave: 'Suave',
  medio: 'Medio Sinaloa',
  bravo: 'BRAVO (Extra Chiltepín)',
  sin_chile: 'Sin Chile',
}

// Helper para extraer notas limpias, cupones y exclusiones sin duplicidad
function parseItemNotes(rawNote?: string | null) {
  if (!rawNote) return { exclusions: [], customNote: '' }

  let workingNote = rawNote
  const exclusions: string[] = []

  // Extraer SIN: ...
  const sinMatch = workingNote.match(/SIN:\s*([^·]+)/i)
  if (sinMatch) {
    sinMatch[1].split(',').forEach((s) => {
      const trimmed = s.trim()
      if (trimmed) exclusions.push(trimmed)
    })
    workingNote = workingNote.replace(/SIN:\s*[^·]+/i, '')
  }

  // Remover "Picor: ..." ya que se muestra en su propio badge
  workingNote = workingNote.replace(/Picor:\s*[^·]+/i, '')

  // Limpiar separadores y espacios
  const cleanNote = workingNote.replace(/[·,]/g, ' ').replace(/\s+/g, ' ').trim()

  return { exclusions, customNote: cleanNote }
}

function parseGeneralNotes(rawNotes?: string | null) {
  if (!rawNotes) return { coupon: null, customerNote: null }

  let working = rawNotes
  let coupon: string | null = null

  const couponMatch = working.match(/\[Cupón:\s*([^\]]+)\]/i)
  if (couponMatch) {
    coupon = couponMatch[1].trim()
    working = working.replace(/\[Cupón:\s*[^\]]+\]/i, '')
  }

  const customerNote = working.trim() || null
  return { coupon, customerNote }
}

export function KitchenMonitor({ initialPedidos }: KitchenMonitorProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [pedidoToReject, setPedidoToReject] = useState<Pedido | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Pedido | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [lastNotification, setLastNotification] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [filterTab, setFilterTab] = useState<'todos' | 'nuevos' | 'preparando' | 'listos'>('todos')

  const supabase = createBrowserClient()
  const { triggerOrderAlarm, speakNewOrderVoice, requestPermission } = useWebNotifications()

  // Actualizar el reloj cada 15 segundos para recalcular minutos en cocina
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 15000)
    return () => clearInterval(timer)
  }, [])

  const enableAudio = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      await requestPermission()
    }
    triggerOrderAlarm('¡ALERTAS Y VOZ DE COCINA ACTIVADAS!', 'Se anunciarán nuevos pedidos por voz parlante.')
    setSoundEnabled(true)
    localStorage.setItem('marea_kitchen_sound', 'true')
  }

  const disableAudio = () => {
    setSoundEnabled(false)
    localStorage.setItem('marea_kitchen_sound', 'false')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Error al activar pantalla completa:', err)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Error al salir de pantalla completa:', err)
      })
      setIsFullscreen(false)
    }
  }

  // Función para consultar los pedidos más recientes de la base de datos
  const fetchFreshPedidos = async () => {
    setIsRefreshing(true)
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, pedido_items(*)')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPedidos((prev) => {
          if (data.length > prev.length) {
            if (soundEnabled || localStorage.getItem('marea_kitchen_sound') === 'true') {
              triggerOrderAlarm('¡NUEVO PEDIDO RECIBIDO! 🦐', 'Se ha registrado una nueva comanda en la cocina.')
            }
            setLastNotification(`¡Nueva Comanda #${data[0]?.id || ''}! Cliente: ${data[0]?.cliente_nombre || ''}`)
          }
          return data
        })
      }
    } catch (e) {
      console.error('Error fetching fresh pedidos:', e)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const savedSound = localStorage.getItem('marea_kitchen_sound')
    if (savedSound === 'true') {
      setSoundEnabled(true)
    }

    const channel = supabase
      .channel('realtime_pantalla_cocina_bento')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchFreshPedidos()
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Pedido
            setPedidos((prev) =>
              prev.map((p) => (p.id === updatedOrder.id ? { ...p, ...updatedOrder } : p))
            )
          }
        }
      )
      .subscribe()

    const interval = setInterval(() => {
      fetchFreshPedidos()
    }, 10000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [supabase])

  const handleAdvanceStatus = async (pedidoId: number, currentEstado: EstadoPedido) => {
    let nextEstado: EstadoPedido = 'preparando'
    if (currentEstado === 'nuevo') nextEstado = 'preparando'
    else if (currentEstado === 'preparando') nextEstado = 'listo'
    else if (currentEstado === 'listo') nextEstado = 'entregado'

    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, estado: nextEstado } : p))
    )

    try {
      await updatePedidoEstado(pedidoId, nextEstado)

      // 1. Descuento automático de inventario por receta
      if (nextEstado === 'preparando' || nextEstado === 'listo') {
        descontarInventarioPorPedido(pedidoId).catch((e) =>
          console.warn('Auto stock discount error:', e)
        )
      }

      // 2. Notificación automática por WhatsApp al cliente cuando el pedido esté LISTO
      if (nextEstado === 'listo') {
        notificarPedidoListoCliente(pedidoId).then((res) => {
          if (res.success) {
            if (res.sentViaApi) {
              setLastNotification(`✅ WhatsApp enviado automáticamente a ${pedidos.find((p) => p.id === pedidoId)?.cliente_nombre || 'cliente'}`)
            } else if (res.waUrl && typeof window !== 'undefined') {
              window.open(res.waUrl, '_blank', 'noopener,noreferrer')
            }
          }
        }).catch((e) => console.warn('Error enviando WhatsApp automático:', e))
      }
    } catch (err) {
      console.error('Error al avanzar estado:', err)
    }
  }

  const handleReject = async (pedidoId: number) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, estado: 'cancelado' } : p))
    )
    try {
      await updatePedidoEstado(pedidoId, 'cancelado')
    } catch (err) {
      console.error('Error al rechazar comanda:', err)
    }
  }

  // Filtrado de pedidos según la pestaña activa
  const pedidosActivosTotal = pedidos.filter((p) => ['nuevo', 'preparando', 'listo'].includes(p.estado))
  const countNuevos = pedidos.filter((p) => p.estado === 'nuevo').length
  const countPreparando = pedidos.filter((p) => p.estado === 'preparando').length
  const countListos = pedidos.filter((p) => p.estado === 'listo').length

  const visiblePedidos = pedidos.filter((p) => {
    if (filterTab === 'nuevos') return p.estado === 'nuevo'
    if (filterTab === 'preparando') return p.estado === 'preparando'
    if (filterTab === 'listos') return p.estado === 'listo'
    return ['nuevo', 'preparando', 'listo'].includes(p.estado)
  })

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col gap-6 animate-in fade-in duration-300 pb-12">
      {/* ========================================================= */}
      {/* 1. CABECERA BENTO DEL MONITOR KDS                         */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Brand / Live indicator */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-coral/10 border border-coral/20 text-coral flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-[#16A34B] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wider text-negro/50 dark:text-arena/60 uppercase">
                Sistema KDS · En Vivo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-negro dark:text-blanco uppercase flex items-center gap-2">
              <span>Monitor de Cocina</span>
              {isRefreshing && <RefreshCw className="w-4 h-4 animate-spin text-turquesa" />}
            </h1>
          </div>
        </div>

        {/* Center: Segmented Filter Controls */}
        <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/5 dark:border-white/5 overflow-x-auto self-start lg:self-auto max-w-full">
          <button
            type="button"
            onClick={() => setFilterTab('todos')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-bold transition-all whitespace-nowrap active:scale-95 ${
              filterTab === 'todos'
                ? 'bg-negro text-blanco dark:bg-blanco dark:text-negro shadow-sm'
                : 'text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco'
            }`}
          >
            Todos ({pedidosActivosTotal.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('nuevos')}
            className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
              filterTab === 'nuevos'
                ? 'bg-coral text-white shadow-sm'
                : 'text-negro/60 dark:text-arena/60 hover:text-coral'
            }`}
          >
            <span>Nuevos</span>
            <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-mono">
              {countNuevos}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('preparando')}
            className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
              filterTab === 'preparando'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-negro/60 dark:text-arena/60 hover:text-amber-500'
            }`}
          >
            <span>En Fuego</span>
            <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-mono">
              {countPreparando}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('listos')}
            className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
              filterTab === 'listos'
                ? 'bg-[#16A34B] text-white shadow-sm'
                : 'text-negro/60 dark:text-arena/60 hover:text-[#16A34B]'
            }`}
          >
            <span>Listos</span>
            <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-mono">
              {countListos}
            </span>
          </button>
        </div>

        {/* Right Actions: Voice & Alarm Toggle, Fullscreen, Refresh */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {!soundEnabled ? (
            <button
              type="button"
              onClick={enableAudio}
              className="bg-coral hover:bg-coral/90 text-white font-sans font-bold text-xs tracking-wide px-4 py-2.5 rounded-full shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              title="Activar voz y timbres parlantes"
            >
              <VolumeX className="w-4 h-4" />
              <span>Activar Alarma</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={disableAudio}
                className="bg-[#16A34B] text-white font-sans font-bold text-xs px-3.5 py-2.5 rounded-full flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Voz y timbres activados. Clic para silenciar."
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">Voz Activa</span>
              </button>
              <button
                type="button"
                onClick={() => speakNewOrderVoice(countNuevos || 1)}
                className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-negro dark:text-blanco font-sans font-bold text-xs px-3 py-2.5 rounded-full transition-all flex items-center gap-1 cursor-pointer"
                title="Probar sintetizador de voz"
              >
                <Megaphone className="w-3.5 h-3.5 text-coral" />
                <span className="hidden sm:inline">Probar</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-negro dark:text-blanco rounded-full transition-all cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla Completa KDS'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={fetchFreshPedidos}
            disabled={isRefreshing}
            className="p-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-negro dark:text-blanco rounded-full transition-all cursor-pointer"
            title="Refrescar comandas"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-turquesa' : ''}`} />
          </button>
        </div>
      </div>

      {/* NOTIFICACIÓN FLOTANTE AL ENTRAR PEDIDO */}
      {lastNotification && (
        <div className="bg-coral text-white font-sans font-bold text-sm tracking-wide px-6 py-3.5 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 animate-bounce" />
            <span>{lastNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setLastNotification(null)}
            className="text-xs bg-black/20 hover:bg-black/40 text-white px-3 py-1 rounded-full font-sans transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. GRID BENTO DE COMANDAS ACTIVAS EN COCINA               */}
      {/* ========================================================= */}
      {visiblePedidos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 flex-1">
          {visiblePedidos.map((pedido) => {
            const isNuevo = pedido.estado === 'nuevo'
            const isPreparando = pedido.estado === 'preparando'
            const isListo = pedido.estado === 'listo'

            const diffMs = currentTime.getTime() - new Date(pedido.created_at || Date.now()).getTime()
            const minutosEspera = Math.max(0, Math.floor(diffMs / 60000))

            // Semáforo de tiempos limpio con colores sólidos
            let timerBadge = `${minutosEspera} min`
            let timerStyle = 'bg-[#16A34B] text-white'

            if (minutosEspera >= 13) {
              timerBadge = `⚠️ Retraso +${minutosEspera} min`
              timerStyle = 'bg-coral text-white animate-pulse shadow-coral/30'
            } else if (minutosEspera >= 7) {
              timerBadge = `⏱️ ${minutosEspera} min`
              timerStyle = 'bg-amber-500 text-white'
            }

            const { coupon, customerNote } = parseGeneralNotes(pedido.notas)

            return (
              <div
                key={pedido.id}
                className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden"
              >
                {/* Status indicator bar superior */}
                <div
                  className={`absolute top-0 left-0 right-0 h-2 ${
                    isNuevo ? 'bg-coral' : isPreparando ? 'bg-amber-500' : 'bg-[#16A34B]'
                  }`}
                />

                <div className="flex flex-col gap-4">
                  {/* Cabecera: Estado, Tiempo y Folio */}
                  <div className="flex justify-between items-start gap-2 pt-1">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm ${
                            isNuevo
                              ? 'bg-coral text-white'
                              : isPreparando
                              ? 'bg-amber-500 text-white'
                              : 'bg-[#16A34B] text-white'
                          }`}
                        >
                          {isNuevo ? 'Nuevo' : isPreparando ? 'En Fuego' : 'Listo'}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-sm ${timerStyle}`}>
                          {timerBadge}
                        </span>
                      </div>

                      <h2 className="font-sans font-black text-2xl sm:text-3xl text-negro dark:text-blanco tracking-tight">
                        FOLIO #{pedido.id}
                      </h2>
                    </div>

                    {/* Modalidad / Destino Capsule */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {(pedido.mesa_nombre || pedido.tipo_entrega === 'mesa') ? (
                        <span className="bg-coral text-white text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                          <span>🍽️</span>
                          <span>{pedido.mesa_nombre || 'MESA'}</span>
                        </span>
                      ) : pedido.tipo_entrega === 'didi' ? (
                        <span className="bg-[#ECC94B] text-negro text-xs font-mono font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                          <span>🛵</span>
                          <span>DIDI / UBER</span>
                        </span>
                      ) : (
                        <span className="bg-[#16A34B] text-white text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                          <span>🚗</span>
                          <span>{pedido.hora_recogida ? pedido.hora_recogida.slice(0, 5) : 'Llevar'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Datos del Cliente */}
                  <div className="flex items-center justify-between text-xs text-negro/70 dark:text-arena/80 pb-3 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-negro dark:text-blanco shrink-0">
                        {pedido.cliente_nombre.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="font-sans font-bold text-sm text-negro dark:text-blanco truncate">
                        {pedido.cliente_nombre}
                      </span>
                    </div>
                    {pedido.cliente_telefono && (
                      <div className="flex items-center gap-1 text-negro/50 dark:text-arena/60 font-mono text-[11px] shrink-0">
                        <Phone className="w-3 h-3 text-turquesa" />
                        <span>{pedido.cliente_telefono}</span>
                      </div>
                    )}
                  </div>

                  {/* Lista de Platillos (Items de la Comanda) */}
                  <div className="flex flex-col gap-2.5 bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-turquesa tracking-wider">
                        Platillos a Preparar:
                      </span>
                      <span className="text-xs font-mono font-bold text-negro/60 dark:text-arena/70">
                        {pedido.pedido_items?.reduce((s, i) => s + i.cantidad, 0) || 0} pzs
                      </span>
                    </div>

                    <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
                      {pedido.pedido_items && pedido.pedido_items.length > 0 ? (
                        pedido.pedido_items.map((item) => {
                          const { exclusions, customNote } = parseItemNotes(item.notas_item)

                          return (
                            <div
                              key={item.id || item.nombre_platillo}
                              className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-sans font-bold text-sm text-negro dark:text-blanco">
                                  {item.nombre_platillo}
                                </span>
                                <span className="font-mono text-xs font-bold text-white bg-coral px-2.5 py-0.5 rounded-full shrink-0 shadow-sm">
                                  x{item.cantidad}
                                </span>
                              </div>

                              {/* Modificadores: Picor y Exclusiones */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                {item.nivel_picor && (
                                  <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-md bg-[#ECC94B] text-[#3A2D00] shadow-sm">
                                    🌶️ {PICOR_EMOJIS[item.nivel_picor] || item.nivel_picor}
                                  </span>
                                )}

                                {exclusions.map((excl, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-md bg-red-600 text-white shadow-sm"
                                  >
                                    ✕ Sin {excl}
                                  </span>
                                ))}

                                {customNote && (
                                  <span className="text-[10px] font-sans italic px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-negro/80 dark:text-arena/90 border border-black/5 dark:border-white/5">
                                    Nota: {customNote}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <span className="text-xs italic text-negro/40 dark:text-arena/40 py-1">Sin detalles</span>
                      )}
                    </div>
                  </div>

                  {/* Instrucciones especiales del cliente */}
                  {customerNote && (
                    <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 text-xs font-sans text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold text-amber-600 dark:text-amber-400 block text-[10px] uppercase tracking-wider">
                          Instrucciones Especiales:
                        </span>
                        <span className="leading-snug">{customerNote}</span>
                      </div>
                    </div>
                  )}

                  {/* Cupón aplicado (si existe) */}
                  {coupon && (
                    <div className="flex items-center gap-1.5 text-xs font-sans text-turquesa bg-turquesa/10 px-3 py-1.5 rounded-xl border border-turquesa/20">
                      <Ticket className="w-3.5 h-3.5 text-turquesa" />
                      <span>Cupón activo: <strong className="font-mono text-turquesa font-bold">{coupon}</strong></span>
                    </div>
                  )}
                </div>

                {/* Botones de Acción de Estado */}
                <div className="pt-5 flex flex-col gap-2">
                  {isNuevo ? (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(pedido.id, 'nuevo')}
                      className="w-full bg-coral hover:bg-coral/90 text-white font-sans font-bold text-xs tracking-wider py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99] cursor-pointer"
                    >
                      <Flame className="w-4 h-4" />
                      <span>EMPEZAR PREPARACIÓN</span>
                    </button>
                  ) : isPreparando ? (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(pedido.id, 'preparando')}
                      className="w-full bg-[#16A34B] hover:bg-[#16A34B]/90 text-white font-sans font-bold text-xs tracking-wider py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99] cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>MARCAR COMO LISTO</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(pedido.id, 'listo')}
                      className="w-full bg-turquesa hover:bg-turquesa/90 text-negro font-sans font-bold text-xs tracking-wider py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99] cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>ENTREGAR COMANDA</span>
                    </button>
                  )}

                  {/* Acciones Secundarias (Ticket & Rechazar) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(pedido)}
                      className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-negro/80 dark:text-arena/90 font-sans font-bold text-xs py-2.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5 text-oro" />
                      <span>Imprimir Ticket</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPedidoToReject(pedido)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-sans font-bold text-xs py-2.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Estado Vacío Bento */
        <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] p-16 text-center shadow-sm flex flex-col items-center justify-center gap-3 my-auto min-h-[380px]">
          <div className="w-16 h-16 rounded-3xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-negro/40 dark:text-arena/40">
            <ChefHat className="w-8 h-8 text-turquesa" />
          </div>
          <h3 className="font-sans font-black text-2xl sm:text-3xl text-negro dark:text-blanco tracking-tight">
            COCINA AL DÍA · SIN COMANDAS PENDIENTES
          </h3>
          <p className="font-sans text-xs sm:text-sm text-negro/50 dark:text-arena/60 max-w-md">
            La pantalla se actualizará en tiempo real y emitirá una alerta sonora con voz parlante en cuanto ingrese un nuevo pedido.
          </p>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL DE TICKET TÉRMICO (80MM)                         */}
      {/* ========================================================= */}
      {selectedTicket && (
        <TicketTermicoModal
          pedido={selectedTicket}
          tipo="comanda_cocina"
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* ========================================================= */}
      {/* 4. MODAL PARA RECHAZAR PEDIDO EN COCINA                   */}
      {/* ========================================================= */}
      {pedidoToReject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl p-7 text-center">
            <div className="w-14 h-14 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mx-auto mb-4 border border-coral/20">
              <Ban className="w-7 h-7" />
            </div>
            <h3 className="font-sans font-black text-2xl text-negro dark:text-blanco mb-2 tracking-tight">
              ¿Rechazar Comanda #{pedidoToReject.id}?
            </h3>
            <p className="font-sans text-xs text-negro/60 dark:text-arena/60 mb-6">
              El pedido de <strong>{pedidoToReject.cliente_nombre}</strong> pasará a estado cancelado y se notificará al sistema en tiempo real.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  handleReject(pedidoToReject.id)
                  setPedidoToReject(null)
                }}
                className="w-full py-3.5 font-sans font-bold text-xs text-white bg-coral hover:bg-coral/90 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                CONFIRMAR RECHAZO
              </button>
              <button
                type="button"
                onClick={() => setPedidoToReject(null)}
                className="w-full py-3 font-sans font-bold text-xs text-negro dark:text-blanco bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl transition-all cursor-pointer"
              >
                Volver a Cocina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
