'use client'

import React, { useState } from 'react'
import { CartItem, MetodoPago } from '@/lib/types/database'
import { createPublicPedido } from '@/lib/actions/publicPedidos'
import {
  X,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  User,
  Phone,
  Clock,
  CreditCard,
  FileText,
  Sparkles,
} from 'lucide-react'

interface DirectOrderModalProps {
  cart: CartItem[]
  totalPrice: number
  onClose: () => void
  onOrderCompleted: () => void
}

export function DirectOrderModal({
  cart,
  totalPrice,
  onClose,
  onOrderCompleted,
}: DirectOrderModalProps) {
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [horaRecogida, setHoraRecogida] = useState('')
  const [notas, setNotas] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedOrderNum, setCompletedOrderNum] = useState<number | null>(null)

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteNombre.trim() || !clienteTelefono.trim() || cart.length === 0) return

    setIsSubmitting(true)
    try {
      const res = await createPublicPedido({
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono,
        metodo_pago: metodoPago,
        hora_recogida: horaRecogida,
        notas,
        items: cart.map((item) => ({
          platillo_id: item.platillo.id,
          nombre_platillo: item.platillo.nombre,
          precio_unitario: item.platillo.precio,
          cantidad: item.cantidad,
        })),
      })

      if (res.pedidoId) {
        setCompletedOrderNum(res.pedidoId)
        onOrderCompleted()
      }
    } catch (err) {
      console.error('Error al realizar pedido directo:', err)
      alert('Ocurrió un error al procesar tu pedido. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#050404] dark:bg-[#050404] light:bg-white bg-dots-pattern border border-oro/30 dark:border-oro/30 light:border-arena/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 gold-border-corner shadow-2xl relative text-blanco dark:text-blanco light:text-negro">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco dark:hover:text-blanco light:hover:text-negro rounded-full hover:bg-carbon"
        >
          <X className="w-5 h-5" />
        </button>

        {completedOrderNum ? (
          /* Confirmación de Éxito */
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-turquesa/20 text-turquesa border border-turquesa/40 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase">
                ¡PEDIDO CONFIRMADO Y ENVIADO!
              </span>
              <h2 className="font-display text-4xl text-blanco dark:text-blanco light:text-negro">
                FOLIO #{completedOrderNum}
              </h2>
            </div>

            <p className="font-serif italic text-base text-arena/80 dark:text-arena/80 light:text-negro/80 max-w-md">
              Tu pedido ha sido recibido en tiempo real en la cocina de Marea Negra. Se ha notificado al chef y comenzaremos con tu preparación.
            </p>

            <div className="w-full bg-carbon dark:bg-carbon light:bg-[#EFEAE1] border border-arena/10 rounded-xl p-4 text-xs font-sans flex flex-col gap-1.5 mt-2">
              <div className="flex justify-between text-arena/70 light:text-negro/70">
                <span>Cliente:</span>
                <strong className="text-blanco dark:text-blanco light:text-negro">{clienteNombre}</strong>
              </div>
              <div className="flex justify-between text-arena/70 light:text-negro/70">
                <span>Total a Pagar:</span>
                <strong className="text-coral font-display text-lg">${totalPrice.toFixed(0)} MXN</strong>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-4 bg-turquesa text-negro font-sans font-bold text-xs tracking-wider px-8 py-3.5 rounded-full hover:bg-blanco transition-all shadow-lg"
            >
              ENTENDIDO · VOLVER AL MENÚ
            </button>
          </div>
        ) : (
          /* Formulario de Checkout Directo */
          <div>
            <div className="mb-6">
              <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                CHECKOUT EN LÍNEA PÚBLICO
              </span>
              <h2 className="font-display text-3xl text-blanco dark:text-blanco light:text-negro tracking-wide">
                CONFIRMAR TU PEDIDO
              </h2>
            </div>

            {/* Resumen rápido del Carrito */}
            <div className="bg-carbon dark:bg-carbon light:bg-[#EFEAE1] border border-arena/10 light:border-arena/30 rounded-xl p-3.5 mb-5 flex flex-col gap-2">
              <span className="text-[11px] font-sans font-semibold uppercase text-turquesa tracking-wider">
                Platillos Seleccionados
              </span>
              {cart.map((item) => (
                <div
                  key={item.platillo.id}
                  className="flex justify-between items-center text-xs text-blanco dark:text-blanco light:text-negro"
                >
                  <span>
                    {item.platillo.emoji} {item.platillo.nombre} x{item.cantidad}
                  </span>
                  <span className="font-display text-coral">
                    ${(item.platillo.precio * item.cantidad).toFixed(0)}
                  </span>
                </div>
              ))}
              <div className="border-t border-arena/10 pt-2 flex justify-between items-center font-bold text-sm">
                <span>Total a Pagar:</span>
                <span className="font-display text-2xl text-oro">${totalPrice.toFixed(0)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitOrder} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans text-arena dark:text-arena light:text-negro/80 uppercase font-semibold">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="bg-carbon dark:bg-carbon light:bg-white border border-arena/20 light:border-arena/40 rounded-lg px-3 py-2.5 text-xs text-blanco dark:text-blanco light:text-negro focus:border-turquesa focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans text-arena dark:text-arena light:text-negro/80 uppercase font-semibold">
                  Teléfono Celular de Contacto *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 6671234567"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="bg-carbon dark:bg-carbon light:bg-white border border-arena/20 light:border-arena/40 rounded-lg px-3 py-2.5 text-xs text-blanco dark:text-blanco light:text-negro focus:border-turquesa focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans text-arena dark:text-arena light:text-negro/80 uppercase font-semibold">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                    className="bg-carbon dark:bg-carbon light:bg-white border border-arena/20 light:border-arena/40 rounded-lg px-3 py-2.5 text-xs text-blanco dark:text-blanco light:text-negro focus:border-turquesa focus:outline-none"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia bancaria</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans text-arena dark:text-arena light:text-negro/80 uppercase font-semibold">
                    Hora de Recogida
                  </label>
                  <input
                    type="time"
                    value={horaRecogida}
                    onChange={(e) => setHoraRecogida(e.target.value)}
                    className="bg-carbon dark:bg-carbon light:bg-white border border-arena/20 light:border-arena/40 rounded-lg px-3 py-2.5 text-xs text-blanco dark:text-blanco light:text-negro focus:border-turquesa focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans text-arena dark:text-arena light:text-negro/80 uppercase font-semibold">
                  Notas de Preparación / Especificaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Salsa aparte, sin cebolla morada..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="bg-carbon dark:bg-carbon light:bg-white border border-arena/20 light:border-arena/40 rounded-lg p-3 text-xs text-blanco dark:text-blanco light:text-negro focus:border-turquesa focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(42,191,191,0.3)] disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ENVIANDO A COCINA...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONFIRMAR Y ORDENAR EN LÍNEA (${totalPrice.toFixed(0)})</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
