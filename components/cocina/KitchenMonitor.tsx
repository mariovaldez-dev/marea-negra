'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Pedido, EstadoPedido } from '@/lib/types/database'
import { updatePedidoEstado } from '@/lib/actions/pedidos'
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
} from 'lucide-react'

interface KitchenMonitorProps {
  initialPedidos: Pedido[]
}

const PICOR_EMOJIS: Record<string, string> = {
  suave: '🟢 Suave',
  medio: '🟡 Medio Sinaloa',
  bravo: '🔴 BRAVO (Chiltepín Extra)',
  sin_chile: '⚪ Sin Chile',
}

export function KitchenMonitor({ initialPedidos }: KitchenMonitorProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [lastNotification, setLastNotification] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const supabase = createBrowserClient()
  const { triggerOrderAlarm, playKitchenBellSound, speakNewOrderVoice, requestPermission } = useWebNotifications()

  const enableAudio = async () => {
    await requestPermission()
    triggerOrderAlarm('¡ALERTAS Y VOZ DE COCINA ACTIVADAS!', 'Se anunciarán nuevos pedidos por voz parlante.')
    setSoundEnabled(true)
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
          // Si hay un pedido nuevo que no estaba en el estado previo, hacer sonar campana y hablar voz parlante
          if (data.length > prev.length) {
            triggerOrderAlarm('¡NUEVO PEDIDO RECIBIDO! 🦐', 'Se ha registrado una nueva comanda en la cocina.')
            setLastNotification(`¡NUEVO PEDIDO #${data[0]?.id || ''}! Cliente: ${data[0]?.cliente_nombre || ''}`)
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
    // 1. Suscripción Supabase Realtime (WebSockets)
    const channel = supabase
      .channel('realtime_pantalla_cocina')
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

    // 2. Respaldo de actualización automática por Polling cada 10 segundos
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
    } catch (err) {
      console.error('Error al avanzar estado:', err)
    }
  }

  const pedidosActivos = pedidos.filter((p) =>
    ['nuevo', 'preparando'].includes(p.estado)
  )

  return (
    <div className="min-h-screen bg-negro text-blanco p-6 flex flex-col gap-6 selection:bg-coral">
      {/* HEADER FULLSCREEN MONITOR */}
      <div className="bg-carbon border border-oro/20 rounded-2xl p-4 px-6 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-coral/20 border border-coral text-coral flex items-center justify-center animate-pulse">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-blanco tracking-wider flex items-center gap-2">
              <span>MONITOR DE COCINA EN TIEMPO REAL</span>
              {isRefreshing && <RefreshCw className="w-4 h-4 animate-spin text-turquesa" />}
            </h1>
            <span className="font-serif italic text-xs text-coral">
              — Marea Negra Sinaloa · Comandas con Nivel de Picor e Instrucciones —
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchFreshPedidos}
            className="p-2.5 bg-carbon border border-arena/20 rounded-full hover:border-turquesa text-arena/80 hover:text-blanco transition-all"
            title="Actualizar ahora"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-turquesa' : ''}`} />
          </button>

          {!soundEnabled ? (
            <button
              onClick={enableAudio}
              className="bg-coral text-blanco font-sans font-bold text-xs tracking-wider px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(232,67,10,0.4)] animate-pulse flex items-center gap-2"
            >
              <VolumeX className="w-4 h-4" />
              <span>ACTIVAR ALARMA SONORA Y VOZ</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="bg-turquesa/10 border border-turquesa/30 text-turquesa px-4 py-2 rounded-full text-xs font-sans font-semibold flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <span>VOZ Y ALARMA ACTIVADAS</span>
              </div>
              <button
                type="button"
                onClick={() => speakNewOrderVoice(2)}
                className="bg-coral text-blanco font-sans font-bold text-xs px-3.5 py-2 rounded-full hover:bg-blanco hover:text-negro transition-all flex items-center gap-1.5"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>PROBAR VOZ 🗣️</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* NOTIFICACIÓN FLOTANTE AL ENTRAR PEDIDO */}
      {lastNotification && (
        <div className="bg-coral text-blanco font-sans font-bold text-sm tracking-wider px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(232,67,10,0.5)] flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 animate-bounce" />
            <span>{lastNotification}</span>
          </div>
          <button
            onClick={() => setLastNotification(null)}
            className="text-xs bg-negro/40 px-2.5 py-1 rounded hover:bg-negro/60"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* GRID DE COMANDAS ACTIVAS EN COCINA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        {pedidosActivos.map((pedido) => {
          const isNuevo = pedido.estado === 'nuevo'

          return (
            <div
              key={pedido.id}
              className={`bg-[#050404] bg-dots-pattern border rounded-2xl p-6 flex flex-col justify-between gold-border-corner transition-all ${
                isNuevo
                  ? 'border-coral shadow-[0_0_30px_rgba(232,67,10,0.25)] animate-pulse'
                  : 'border-oro/30'
              }`}
            >
              <div>
                {/* Folio y Hora */}
                <div className="flex justify-between items-start border-b border-arena/10 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] font-sans text-turquesa font-bold uppercase tracking-widest block">
                      {isNuevo ? '🚨 NUEVO PEDIDO' : '🔥 EN PREPARACIÓN'}
                    </span>
                    <h2 className="font-display text-4xl text-blanco leading-none mt-1">
                      FOLIO #{pedido.id}
                    </h2>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-sans text-arena/60 uppercase">Recogida:</span>
                    <span className="font-display text-xl text-oro">
                      {pedido.hora_recogida ? pedido.hora_recogida.slice(0, 5) : 'Inmediato'}
                    </span>
                  </div>
                </div>

                {/* Cliente */}
                <div className="mb-4">
                  <h3 className="font-sans font-bold text-lg text-blanco">
                    👤 {pedido.cliente_nombre}
                  </h3>
                  {pedido.cliente_telefono && (
                    <span className="text-xs font-sans text-arena/60">
                      📞 {pedido.cliente_telefono}
                    </span>
                  )}
                </div>

                {/* Lista de Platillos (Items Comanda con Picor y Notas) */}
                <div className="bg-carbon border border-arena/10 rounded-xl p-4 flex flex-col gap-3 mb-4">
                  <span className="text-[10px] font-sans font-bold uppercase text-turquesa tracking-wider">
                    Detalle de Preparación:
                  </span>
                  {pedido.pedido_items && pedido.pedido_items.length > 0 ? (
                    pedido.pedido_items.map((item) => (
                      <div
                        key={item.id || item.nombre_platillo}
                        className="flex flex-col gap-1 border-b border-arena/10 pb-2.5 last:border-b-0"
                      >
                        <div className="flex justify-between items-center text-base font-sans font-bold text-blanco">
                          <span>{item.nombre_platillo}</span>
                          <span className="text-lg text-coral font-display bg-coral/10 px-2 py-0.5 rounded border border-coral/30">
                            x{item.cantidad}
                          </span>
                        </div>

                        {/* Badges de Picor */}
                        {item.nivel_picor && (
                          <div className="text-xs font-sans text-oro font-semibold">
                            Picor: {PICOR_EMOJIS[item.nivel_picor] || item.nivel_picor}
                          </div>
                        )}

                        {/* Notas individuales por platillo */}
                        {item.notas_item && (
                          <div className="text-xs font-serif italic text-coral bg-coral/10 p-1.5 rounded border border-coral/20">
                            📝 Nota: "{item.notas_item}"
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs italic text-arena/60">Ver detalle en Kanban</span>
                  )}
                </div>

                {/* Notas Generales */}
                {pedido.notas && (
                  <div className="p-3 bg-coral/10 border border-coral/30 rounded-lg mb-4 text-xs font-serif italic text-coral">
                    📌 Nota General: "{pedido.notas}"
                  </div>
                )}
              </div>

              {/* Botones de Cambio de Estado en Un Toque */}
              <div className="pt-2">
                {isNuevo ? (
                  <button
                    onClick={() => handleAdvanceStatus(pedido.id, 'nuevo')}
                    className="w-full bg-coral text-blanco hover:bg-coral/80 font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-[0_0_20px_rgba(232,67,10,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <Flame className="w-5 h-5" />
                    <span>EMPEZAR PREPARACIÓN</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleAdvanceStatus(pedido.id, 'preparando')}
                    className="w-full bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-[0_0_20px_rgba(42,191,191,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>MARCAR COMO LISTO</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {pedidosActivos.length === 0 && (
        <div className="p-16 text-center bg-carbon/40 rounded-2xl border border-arena/10 flex flex-col items-center justify-center gap-3 my-auto">
          <ShoppingBag className="w-12 h-12 text-arena/30" />
          <h3 className="font-display text-3xl text-blanco">
            COCINA SIN PEDIDOS PENDIENTES
          </h3>
          <p className="font-serif italic text-sm text-arena/60">
            La pantalla se actualizará automáticamente y emitirá una alerta sonora en cuanto ingrese una comanda con picor configurado.
          </p>
        </div>
      )}
    </div>
  )
}
