'use client'

import React, { useRef, useState } from 'react'
import { Pedido } from '@/lib/types/database'
import { Printer, X, Check, Utensils, Receipt, Sparkles, MessageCircle, Copy, ExternalLink } from 'lucide-react'
import { printOrderTicket } from '@/lib/utils/printThermalTicket'
import { useWhatsAppSupport } from '@/lib/hooks/useWhatsAppSupport'

interface TicketTermicoModalProps {
  pedido: Pedido
  tipo?: 'comanda_cocina' | 'cuenta_cliente'
  onClose: () => void
}

// Helper para extraer notas limpias y exclusiones sin duplicados
function parseItemTicketNotes(rawNote?: string | null) {
  if (!rawNote) return { exclusions: [], customNote: '' }
  let workingNote = rawNote
  const exclusions: string[] = []

  const sinMatch = workingNote.match(/SIN:\s*([^·]+)/i)
  if (sinMatch) {
    sinMatch[1].split(',').forEach((s) => {
      const trimmed = s.trim()
      if (trimmed) exclusions.push(trimmed)
    })
    workingNote = workingNote.replace(/SIN:\s*[^·]+/i, '')
  }

  workingNote = workingNote.replace(/Picor:\s*[^·]+/i, '')
  const cleanNote = workingNote.replace(/[·,]/g, ' ').replace(/\s+/g, ' ').trim()
  return { exclusions, customNote: cleanNote }
}

function parseTicketGeneralNotes(rawNotes?: string | null) {
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

export function TicketTermicoModal({ pedido, tipo = 'cuenta_cliente', onClose }: TicketTermicoModalProps) {
  const ticketRef = useRef<HTMLDivElement>(null)
  const { openWhatsApp } = useWhatsAppSupport()
  const [copiedText, setCopiedText] = useState(false)

  const handlePrint = () => {
    printOrderTicket(pedido, tipo)
  }

  const items = pedido.pedido_items || []
  const subtotal = Number(pedido.total || 0)
  const propina10 = (subtotal * 0.1).toFixed(0)
  const propina15 = (subtotal * 0.15).toFixed(0)

  const fechaFormateada = new Date(pedido.created_at || Date.now()).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

  const { coupon, customerNote } = parseTicketGeneralNotes(pedido.notas)

  // Tipo de servicio
  const servicioLabel = (pedido.mesa_nombre || pedido.tipo_entrega === 'mesa')
    ? `🍽️ COMEDOR · ${pedido.mesa_nombre || 'MESA'}`
    : pedido.tipo_entrega === 'didi'
    ? '🛵 ENVÍO DIDI / UBER'
    : '🚗 RECOGER EN LOCAL'

  const handleCopiarTexto = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marea-negra.com'
    const linkRastreo = `${origin}/pedido/${pedido.id}`

    let itemsText = ''
    items.forEach((item) => {
      itemsText += `• ${item.cantidad}x *${item.nombre_platillo}* ($${((item.precio_unitario || 0) * item.cantidad).toFixed(0)})\n`
    })

    const msg = `🌊 *MAREA NEGRA - TICKET DE COMPRA* 🧾
*FOLIO #${pedido.id}* · ${fechaFormateada}
Cliente: *${pedido.cliente_nombre}*
Servicio: ${servicioLabel}

*DETALLE:*
${itemsText}
💰 *TOTAL:* $${subtotal.toFixed(0)} MXN
💳 *PAGO:* ${(pedido.metodo_pago || 'Efectivo').toUpperCase()}

👇 *Ver Ticket Digital en HD:*
${linkRastreo}

¡Muchas gracias por su preferencia! 🦐🌶️`

    try {
      await navigator.clipboard.writeText(msg)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 3000)
    } catch {
      handleEnviarWhatsApp()
    }
  }

  const handleEnviarWhatsApp = () => {
    const cleanPhone = (pedido.cliente_telefono || '').replace(/\D/g, '')
    const targetPhone = cleanPhone.startsWith('52') ? cleanPhone : cleanPhone ? `52${cleanPhone}` : ''

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marea-negra.com'
    const linkRastreo = `${origin}/pedido/${pedido.id}`

    const msg = `🌊 *MAREA NEGRA - COMPROBANTE DE COMPRA* 🧾
¡Hola *${pedido.cliente_nombre}*! Tu pedido *Folio #${pedido.id}* está listo.

💰 *Total:* $${subtotal.toFixed(0)} MXN
💳 *Método de Pago:* ${(pedido.metodo_pago || 'Efectivo').toUpperCase()}

👇 *Puedes consultar tu comprobante digital aquí:*
${linkRastreo}

¡Muchas gracias por tu preferencia! 🦐🍻`

    if (targetPhone) {
      window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank')
    } else {
      openWhatsApp(msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      {/* Estilos de respaldo para impresión directa */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #ticket-termico-print,
          #ticket-termico-print * {
            visibility: visible;
          }
          #ticket-termico-print {
            position: fixed;
            left: 0;
            top: 0;
            width: 80mm;
            max-width: 80mm;
            margin: 0;
            padding: 4mm;
            background: white !important;
            color: black !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Courier New", monospace;
            font-size: 11px;
            display: block !important;
            z-index: 999999;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-[#111111] border border-arena/40 dark:border-oro/30 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-arena/20 pb-3 no-print">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-oro/20 text-oro rounded-xl">
              {tipo === 'comanda_cocina' ? <Utensils className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
            </span>
            <div>
              <h3 className="font-display text-2xl text-blanco">
                {tipo === 'comanda_cocina' ? 'COMANDA DE COCINA (80MM)' : 'TICKET DE PEDIDO (80MM / PDF)'}
              </h3>
              <span className="text-xs text-arena/70">
                Folio #{pedido.id} · {pedido.mesa_nombre || 'Mostrador'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-arena/60 hover:text-coral rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VISTA PREVIA DEL TICKET (Diseño Térmico Profesional 80mm) */}
        <div
          id="ticket-termico-print"
          ref={ticketRef}
          className="bg-white text-black p-5 rounded-2xl border border-gray-300 font-sans text-xs shadow-lg flex flex-col gap-3 leading-tight max-w-[340px] mx-auto w-full"
        >
          {/* ENCABEZADO TICKET */}
          <div className="text-center pb-2 border-b-2 border-black flex flex-col items-center">
            <span className="font-display text-2xl font-black tracking-wider uppercase text-black leading-none">
              MAREA NEGRA
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-700 mt-1">
              AGUACHILES & COCTELES
            </span>
            <span className="text-[9px] text-gray-500">
              Sinaloa, México · Cocina de Mariscos
            </span>

            {/* BANNER DE SERVICIO */}
            <div className="w-full bg-black text-white text-center font-bold text-xs py-1.5 px-2 rounded mt-2 uppercase tracking-wide">
              {servicioLabel}
            </div>
          </div>

          {/* METADATOS DEL PEDIDO */}
          <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-gray-400 text-[11px]">
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-sm">FOLIO #{pedido.id}</span>
              <span className="text-gray-600 text-[10px]">{fechaFormateada}</span>
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-bold uppercase truncate max-w-[190px]">{pedido.cliente_nombre}</span>
            </div>

            {pedido.cliente_telefono && (
              <div className="flex justify-between items-center text-gray-600">
                <span>Teléfono:</span>
                <span className="font-mono font-medium">{pedido.cliente_telefono}</span>
              </div>
            )}

            {pedido.hora_recogida && (
              <div className="flex justify-between items-center text-gray-700">
                <span>Hora Entrega:</span>
                <span className="font-bold">{pedido.hora_recogida.slice(0, 5)} HRS</span>
              </div>
            )}
          </div>

          {/* TABLA DE PLATILLOS */}
          <div className="flex flex-col gap-2 pb-3 border-b-2 border-black">
            <div className="flex justify-between font-bold text-[10px] uppercase tracking-wider border-b border-black pb-1 text-gray-800">
              <span>CANT  DESCRIPCIÓN</span>
              <span>IMPORTE</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {items.map((item, idx) => {
                const { exclusions, customNote } = parseItemTicketNotes(item.notas_item)

                return (
                  <div key={idx} className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-start font-bold text-[11.5px] text-black">
                      <span className="pr-2">
                        <span className="font-mono mr-1.5">{item.cantidad}x</span>
                        {item.nombre_platillo}
                      </span>
                      <span className="font-mono shrink-0">
                        ${((item.precio_unitario || 0) * (item.cantidad || 1)).toFixed(0)}
                      </span>
                    </div>

                    {/* Modificadores con sangría limpia */}
                    <div className="pl-5 flex flex-col gap-0.5 text-[10px] text-gray-700">
                      {item.nivel_picor && (
                        <div>• Picor: <strong className="capitalize">{item.nivel_picor}</strong></div>
                      )}
                      {exclusions.map((excl, i) => (
                        <div key={i} className="font-bold text-black">• ✕ SIN: {excl.toUpperCase()}</div>
                      ))}
                      {customNote && (
                        <div className="italic">• Nota: {customNote}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* NOTAS ESPECIALES DEL CLIENTE */}
          {customerNote && (
            <div className="border border-black rounded p-2 text-[10.5px] bg-gray-50">
              <strong className="block text-[9px] uppercase tracking-wider text-black mb-0.5">
                INSTRUCCIONES DEL CLIENTE:
              </strong>
              <span>{customerNote}</span>
            </div>
          )}

          {/* CUPÓN APLICADO */}
          {coupon && (
            <div className="text-[10px] flex justify-between items-center border-b border-dashed border-gray-400 pb-1">
              <span className="text-gray-600">Cupón Aplicado:</span>
              <span className="font-mono font-bold uppercase">{coupon}</span>
            </div>
          )}

          {/* TOTALES (Opcional según comanda o cuenta) */}
          <div className="flex flex-col gap-1 pt-1 pb-2 border-b border-dashed border-gray-400 text-[11px]">
            <div className="flex justify-between items-baseline font-black text-base pt-1">
              <span>TOTAL A COBRAR:</span>
              <span className="font-mono text-lg">${subtotal.toFixed(0)} MXN</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Método de Pago:</span>
              <span className="font-bold uppercase">{pedido.metodo_pago || 'Efectivo'}</span>
            </div>
          </div>

          {/* PROPINA SUGERIDA (Solo en ticket de cuenta cliente) */}
          {tipo === 'cuenta_cliente' && (
            <div className="border border-dashed border-gray-400 p-2 rounded text-[10px] flex flex-col gap-1 text-gray-700 bg-gray-50">
              <span className="font-bold text-center uppercase tracking-wider text-[9px]">Propina Sugerida (Opcional)</span>
              <div className="flex justify-between">
                <span>10% ($+{propina10}):</span>
                <span className="font-bold">${(subtotal + Number(propina10)).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>15% ($+{propina15}):</span>
                <span className="font-bold">${(subtotal + Number(propina15)).toFixed(0)}</span>
              </div>
            </div>
          )}

          {/* PIE DE TICKET */}
          <div className="text-center text-[9.5px] text-gray-600 flex flex-col gap-0.5 pt-1">
            <span className="font-bold text-black">¡Muchas gracias por su preferencia!</span>
            <span>Mariscos frescos preparados al momento</span>
            <span className="text-[8px] text-gray-400 mt-1">*** MAREA NEGRA SINALOA ***</span>
          </div>
        </div>

        {/* ACCIONES DEL MODAL */}
        <div className="flex flex-col gap-2.5 no-print pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Botón Imprimir / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-coral text-blanco hover:bg-coral/90 font-sans font-bold text-xs py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>IMPRIMIR / PDF (80MM)</span>
            </button>

            {/* Botón Copiar Texto */}
            <button
              type="button"
              onClick={handleCopiarTexto}
              className="bg-carbon hover:bg-black text-arena hover:text-blanco border border-arena/20 hover:border-oro text-xs font-sans font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span className="text-emerald-400">¡COPIADO AL PORTAPAPELES!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-oro" />
                  <span>COPIAR TEXTO WHATSAPP</span>
                </>
              )}
            </button>
          </div>

          {/* Botón Enviar WhatsApp */}
          <button
            type="button"
            onClick={handleEnviarWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-sans font-bold text-xs tracking-wider py-3.5 rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>ENVIAR TICKET POR WHATSAPP AL CLIENTE</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
