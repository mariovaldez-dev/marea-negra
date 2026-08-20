'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Pedido } from '@/lib/types/database'
import { TicketImageDownload } from '@/components/menu/TicketImageDownload'
import { ComprobanteUploader } from '@/components/menu/ComprobanteUploader'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import {
  Clock,
  Flame,
  CheckCircle2,
  PackageCheck,
  ChevronLeft,
  Phone,
  User,
  ShoppingBag,
  RefreshCw,
  Sparkles,
  Gift,
  XCircle,
} from 'lucide-react'

const PICOR_LABELS: Record<string, string> = {
  suave: '🟢 Suave',
  medio: '🟡 Medio Sinaloa',
  bravo: '🔴 BRAVO (Chiltepín)',
  sin_chile: '⚪ Sin Chile',
}

export default function OrderStatusPage() {
  const params = useParams()
  const router = useRouter()
  const pedidoId = params.id as string

  const [pedido, setPedido] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient()

  const fetchPedidoDetail = async () => {
    try {
      const { data, error: err } = await supabase
        .from('pedidos')
        .select('*, pedido_items(*, platillos(nombre, descripcion, precio))')
        .eq('id', pedidoId)
        .single()

      if (err || !data) {
        const { data: fallbackData } = await supabase
          .from('pedidos')
          .select('*, pedido_items(*)')
          .eq('id', pedidoId)
          .single()

        if (fallbackData) {
          setPedido(fallbackData)
        } else {
          setError('No se encontró el pedido con el folio especificado.')
        }
      } else {
        setPedido(data)
      }
    } catch (e) {
      setError('Error al consultar el pedido.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPedidoDetail()

    const channel = supabase
      .channel(`realtime_pedido_${pedidoId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${pedidoId}` },
        (payload) => {
          const updated = payload.new as Pedido
          setPedido((prev: any) => (prev ? { ...prev, ...updated } : updated))
        }
      )
      .subscribe()

    const interval = setInterval(() => {
      fetchPedidoDetail()
    }, 8000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [pedidoId, supabase])

  const getStepProgressIndex = (estado?: string) => {
    switch (estado) {
      case 'nuevo':
        return 1
      case 'preparando':
        return 2
      case 'listo':
        return 3
      case 'entregado':
        return 4
      default:
        return 1
    }
  }

  const currentStepIdx = getStepProgressIndex(pedido?.estado)

  const formattedTicketItems = (pedido?.pedido_items || []).map((item: any) => ({
    nombre_platillo: item.nombre_platillo || item.platillos?.nombre || 'Platillo',
    precio_unitario: item.precio_unitario || item.platillos?.precio || 0,
    cantidad: item.cantidad || 1,
    nivel_picor: item.nivel_picor,
    notas_item: item.notas_item,
    descripcion: item.platillos?.descripcion || null,
  }))

  // Subtotal y Descuento de Cupón directos de la base de datos o calculados
  const calculatedSubtotal = formattedTicketItems.reduce(
    (sum: number, item: any) => sum + item.precio_unitario * item.cantidad,
    0
  )
  const rawSubtotal = (pedido?.subtotal && pedido.subtotal > 0) ? pedido.subtotal : calculatedSubtotal
  const orderTotal = pedido?.total || 0
  const discountAmount = (pedido?.descuento !== undefined && pedido?.descuento !== null && pedido?.descuento > 0)
    ? pedido.descuento
    : Math.max(0, rawSubtotal - orderTotal)

  let couponCodeMatch: string | null = pedido?.cupon_codigo || null
  if (!couponCodeMatch && pedido?.notas && pedido.notas.includes('[Cupón:')) {
    const match = pedido.notas.match(/\[Cupón:\s*([^\s\]]+)/)
    if (match) couponCodeMatch = match[1]
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/micuenta')
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F0E8] dark:bg-negro text-negro dark:text-blanco flex flex-col justify-between selection:bg-coral transition-colors duration-300">
      {/* HEADER STATUS */}
      <header className="sticky top-0 z-40 bg-[#F4F0E8] dark:bg-negro border-b border-arena/30 dark:border-arena/10 px-6 py-3 safe-header transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-xs md:text-sm font-sans font-bold text-negro/70 dark:text-arena/70 hover:text-coral flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>

          <h1 className="font-display text-2xl md:text-3xl text-coral tracking-wider">
            MAREA NEGRA
          </h1>

          <ThemeToggle />
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL DE SEGUIMIENTO */}
      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8 w-full flex-1 flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col gap-6 animate-pulse w-full">
            {/* Skeleton Card de Folio & Etapas */}
            <div className="bg-white dark:bg-[#050404] border border-arena/30 dark:border-oro/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
              <div className="flex justify-between items-center border-b border-arena/20 dark:border-arena/10 pb-3">
                <div className="h-3 w-40 bg-turquesa/20 rounded-full" />
                <div className="h-3 w-28 bg-arena/20 dark:bg-carbon rounded-full" />
              </div>

              <div className="flex flex-col items-center gap-2 py-2">
                <div className="h-12 w-56 bg-arena/30 dark:bg-carbon rounded-xl" />
                <div className="h-4 w-40 bg-arena/20 dark:bg-carbon/70 rounded-full" />
              </div>

              {/* Grid 4 Etapas */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {[1, 2, 3, 4].map((st) => (
                  <div key={st} className="h-16 bg-[#F4F0E8] dark:bg-carbon rounded-xl border border-arena/20 dark:border-arena/10" />
                ))}
              </div>
            </div>

            {/* Skeleton Botón de Descarga */}
            <div className="h-14 bg-arena/20 dark:bg-carbon rounded-2xl border border-arena/20 dark:border-arena/10" />

            {/* Skeleton Detalle de Items */}
            <div className="bg-white dark:bg-carbon border border-arena/30 dark:border-arena/10 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <div className="h-4 w-44 bg-turquesa/20 rounded-full" />
              <div className="flex flex-col gap-4 pt-2 divide-y divide-arena/10">
                {[1, 2].map((n) => (
                  <div key={n} className="pt-3 first:pt-0 flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                      <div className="h-5 w-48 bg-arena/30 dark:bg-negro rounded-lg" />
                      <div className="h-3 w-32 bg-arena/20 dark:bg-negro/60 rounded-full" />
                    </div>
                    <div className="h-6 w-20 bg-coral/20 rounded-lg" />
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-arena/20 flex justify-between items-center">
                <div className="h-4 w-32 bg-arena/30 dark:bg-negro rounded-full" />
                <div className="h-8 w-28 bg-oro/20 rounded-lg" />
              </div>
            </div>
          </div>
        ) : error || !pedido ? (
          <div className="bg-white dark:bg-carbon border border-coral/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 shadow-xl">
            <ShoppingBag className="w-12 h-12 text-coral" />
            <h2 className="font-display text-3xl text-coral">FOLIO NO ENCONTRADO</h2>
            <p className="font-serif italic text-sm text-negro/70 dark:text-arena/70">{error}</p>
            <button
              onClick={() => router.push('/pedir')}
              className="mt-2 bg-coral text-blanco font-sans font-bold text-xs px-6 py-3 rounded-full"
            >
              HACER UN NUEVO PEDIDO
            </button>
          </div>
        ) : (
          <>
            {/* CARD ENCABEZADO CON ESTADO EN VIVO */}
            <div className={`bg-white dark:bg-[#050404] bg-dots-pattern border rounded-2xl p-6 shadow-2xl gold-border-corner flex flex-col gap-4 text-center ${
              pedido.estado === 'cancelado' ? 'border-coral/50' : 'border-oro/30'
            }`}>
              <div className="flex justify-between items-center border-b border-arena/10 pb-3">
                <span className={`text-xs font-sans font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                  pedido.estado === 'cancelado' ? 'text-coral' : 'text-turquesa'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{pedido.estado === 'cancelado' ? 'PEDIDO CANCELADO' : 'SEGUIMIENTO EN TIEMPO REAL'}</span>
                </span>
                <span className="text-xs font-sans font-bold text-arena/70">
                  {pedido.hora_recogida ? `Recogida: ${pedido.hora_recogida.slice(0, 5)} hrs` : 'Inmediato'}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <h2 className="font-display text-5xl md:text-6xl text-negro dark:text-blanco tracking-wide">
                  FOLIO #{pedido.id}
                </h2>
                <span className="font-serif italic text-base text-negro/70 dark:text-arena/70">
                  Cliente: <strong>{pedido.cliente_nombre}</strong>
                </span>
              </div>

              {/* BANNER SI ESTÁ CANCELADO */}
              {pedido.estado === 'cancelado' ? (
                <div className="p-4 bg-coral/10 border border-coral/30 rounded-2xl text-center flex flex-col items-center gap-2 shadow-inner mt-2">
                  <div className="w-10 h-10 rounded-full bg-coral/20 flex items-center justify-center text-coral">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <span className="font-display text-2xl text-coral tracking-wider">
                    PEDIDO CANCELADO / RECHAZADO
                  </span>
                  <p className="font-sans text-xs text-negro/80 dark:text-arena/80 max-w-md">
                    Esta comanda fue cancelada y no está siendo procesada en cocina. Si tienes dudas, contáctanos por WhatsApp o realiza una nueva orden.
                  </p>
                  <button
                    onClick={() => router.push('/pedir')}
                    className="mt-2 bg-coral text-blanco font-sans font-bold text-xs px-5 py-2.5 rounded-full hover:bg-coral/90 transition-all shadow-md"
                  >
                    REALIZAR NUEVO PEDIDO
                  </button>
                </div>
              ) : (
                /* BARRA DE ETAPAS EN VIVO NORMAL */
                <div className="grid grid-cols-4 gap-2 pt-4">
                  {[
                    { step: 1, label: '1. RECIBIDO', icon: Clock, desc: 'En cola' },
                    { step: 2, label: '2. PREPARANDO', icon: Flame, desc: 'En cocina' },
                    { step: 3, label: '3. ¡LISTO!', icon: CheckCircle2, desc: 'Listo' },
                    { step: 4, label: '4. ENTREGADO', icon: PackageCheck, desc: 'Completado' },
                  ].map((st) => {
                    const Icon = st.icon
                    const isActive = currentStepIdx === st.step
                    const isDone = currentStepIdx > st.step

                    return (
                      <div
                        key={st.step}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-coral/10 border-coral text-coral shadow-lg animate-pulse'
                            : isDone
                            ? 'bg-turquesa/10 border-turquesa text-turquesa'
                            : 'bg-[#F4F0E8] dark:bg-carbon border-arena/20 text-arena/40'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />
                        <span className="text-[10px] font-sans font-bold tracking-wider">{st.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* BOTÓN PARA DESCARGAR COMPROBANTE EN FOTO (PNG) - SOLO SI NO ESTÁ CANCELADO */}
            {pedido.estado !== 'cancelado' && (
              <>
                <TicketImageDownload
                  pedidoId={pedido.id}
                  clienteNombre={pedido.cliente_nombre}
                  clienteTelefono={pedido.cliente_telefono}
                  metodoPago={pedido.metodo_pago}
                  horaRecogida={pedido.hora_recogida}
                  notasGenerales={pedido.notas}
                  subtotal={rawSubtotal}
                  descuento={discountAmount}
                  cuponCodigo={couponCodeMatch}
                  total={orderTotal}
                  items={formattedTicketItems}
                />

                {/* SECCIÓN ADJUNTAR FICHA O COMPROBANTE PDF DE PAGO (TRANSFERENCIA / OXXO) */}
                {(pedido.metodo_pago === 'transferencia' || pedido.metodo_pago === 'oxxo') && (
                  <ComprobanteUploader
                    pedidoId={pedido.id}
                    currentComprobanteUrl={pedido.comprobante_url}
                    onSuccess={(url) => {
                      setPedido((prev: any) => (prev ? { ...prev, comprobante_url: url } : prev))
                    }}
                  />
                )}
              </>
            )}

            {/* DETALLE COMPLETO DE LA COMANDA */}
            <div className="bg-white dark:bg-carbon border border-arena/30 dark:border-arena/10 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-wider">
                Detalle del Pedido #{pedido.id}:
              </span>

              <div className="flex flex-col gap-3 divide-y divide-arena/10">
                {formattedTicketItems.map((item: any, idx: number) => (
                  <div key={idx} className="pt-3 first:pt-0 flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-sans font-bold text-base text-negro dark:text-blanco">
                        {item.nombre_platillo} x{item.cantidad}
                      </span>
                      {item.descripcion && (
                        <span className="text-xs font-sans text-arena/70">
                          {item.descripcion}
                        </span>
                      )}
                      {item.nivel_picor && (
                        <span className="text-xs font-sans text-oro font-semibold mt-0.5">
                          Picor: {PICOR_LABELS[item.nivel_picor] || item.nivel_picor}
                        </span>
                      )}
                      {item.notas_item && (
                        <span className="text-xs font-serif italic text-coral mt-0.5">
                          📝 "{item.notas_item}"
                        </span>
                      )}
                    </div>

                    <span className="font-display text-2xl text-coral">
                      ${(item.precio_unitario * item.cantidad).toFixed(0)} MXN
                    </span>
                  </div>
                ))}
              </div>

              {/* DESGLOSE DE SUBTOTAL, DESCUENTO Y TOTAL NETO */}
              <div className="pt-4 border-t border-arena/20 flex flex-col gap-2">
                {discountAmount > 0 && (
                  <>
                    <div className="flex justify-between items-center text-sm font-sans text-arena/80">
                      <span>Subtotal de Platillos:</span>
                      <span>${rawSubtotal.toFixed(0)} MXN</span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-sans font-bold text-turquesa">
                      <span className="flex items-center gap-1">
                        <Gift className="w-4 h-4" />
                        <span>Descuento Cupón {couponCodeMatch ? `(${couponCodeMatch})` : 'Aplicado'}:</span>
                      </span>
                      <span>-${discountAmount.toFixed(0)} MXN (-10%)</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center font-bold text-base pt-2 border-t border-arena/10">
                  <span>TOTAL NETO A PAGAR:</span>
                  <span className="font-display text-4xl text-oro">${orderTotal.toFixed(0)} MXN</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
