'use client'

import React, { useState } from 'react'
import { Pedido } from '@/lib/types/database'
import { printOrderTicket } from '@/lib/utils/printThermalTicket'
import { useWhatsAppSupport } from '@/lib/hooks/useWhatsAppSupport'
import {
  Receipt,
  Printer,
  Copy,
  Check,
  MessageCircle,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react'

interface PosThermalTicketModalProps {
  isOpen: boolean
  onClose: () => void
  pedido: Pedido
}

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

export function PosThermalTicketModal({ isOpen, onClose, pedido }: PosThermalTicketModalProps) {
  const { openWhatsApp } = useWhatsAppSupport()
  const [copiedText, setCopiedText] = useState(false)

  if (!isOpen || !pedido) return null

  const items = pedido.pedido_items || []
  const subtotal = Number(pedido.total || 0)
  const propina10 = (subtotal * 0.1).toFixed(0)
  const propina15 = (subtotal * 0.15).toFixed(0)

  const fechaFormateada = new Date(pedido.created_at || Date.now()).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

  const { coupon, customerNote } = parseTicketGeneralNotes(pedido.notas)

  const servicioLabel = (pedido.mesa_nombre || pedido.tipo_entrega === 'mesa')
    ? `🍽️ COMEDOR · ${pedido.mesa_nombre || 'MESA'}`
    : pedido.tipo_entrega === 'didi'
      ? '🛵 ENVÍO DIDI / UBER'
      : '🚗 RECOGER EN LOCAL'

  // 1. IMPRIMIR / PDF
  const handleImprimir = () => {
    printOrderTicket(pedido, 'cuenta_cliente')
  }

  // 2. COPIAR TEXTO FORMATEADO PARA WHATSAPP
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

  // 3. ENVIAR DIRECTO A WHATSAPP DEL CLIENTE
  const handleEnviarWhatsApp = () => {
    const cleanPhone = (pedido.cliente_telefono || '').replace(/\D/g, '')
    const targetPhone = cleanPhone.startsWith('52') ? cleanPhone : cleanPhone ? `52${cleanPhone}` : ''

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marea-negra.com'
    const linkRastreo = `${origin}/pedido/${pedido.id}`

    const msg = `🌊 *MAREA NEGRA - COMPROBANTE DE COMPRA* 🧾
¡Hola *${pedido.cliente_nombre}*! Tu pedido *Folio #${pedido.id}* está listo.

💰 *Total a Cobrar:* $${subtotal.toFixed(0)} MXN
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-[#111111] border border-oro/30 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative gold-border-corner flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-arena/60 hover:text-coral rounded-full hover:bg-carbon transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera */}
        <div className="flex items-center gap-3 border-b border-arena/10 pb-3">
          <div className="p-2.5 bg-oro/10 border border-oro/30 rounded-2xl text-oro">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-sans font-bold text-oro uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>COMPROBANTE OFICIAL (80MM / PDF)</span>
            </span>
            <h3 className="font-display text-2xl text-blanco tracking-wide">
              TICKET DE PEDIDO #{pedido.id}
            </h3>
          </div>
        </div>

        {/* VISTA PREVIA LIMPIA DEL TICKET TÉRMICO REAL (BLANCO Y NEGRO) */}
        <div className="flex justify-center p-3 bg-[#0A0A0A] rounded-2xl border border-arena/10 max-h-[380px] overflow-y-auto shadow-inner">
          <div className="bg-white text-black p-4 rounded-xl border border-gray-300 font-sans text-xs shadow-lg flex flex-col gap-2.5 leading-tight max-w-[320px] w-full">
            {/* Header branding */}
            <div className="text-center pb-2 border-b-2 border-black flex flex-col items-center">
              <span className="font-display text-xl font-black tracking-wider uppercase text-black leading-none">
                MAREA NEGRA
              </span>
              <span className="text-[9px] font-bold tracking-widest uppercase text-gray-700 mt-0.5">
                AGUACHILES
              </span>
              <div className="w-full bg-black text-white text-center font-bold text-[10.5px] py-1 px-2 rounded mt-1.5 uppercase">
                {servicioLabel}
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-col gap-0.5 pb-1.5 border-b border-dashed border-gray-400 text-[10.5px]">
              <div className="flex justify-between font-bold">
                <span>FOLIO #{pedido.id}</span>
                <span className="text-gray-600 font-normal">{fechaFormateada}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-bold uppercase truncate max-w-[160px]">{pedido.cliente_nombre}</span>
              </div>
              {pedido.cliente_telefono && (
                <div className="flex justify-between text-gray-600">
                  <span>Teléfono:</span>
                  <span className="font-mono">{pedido.cliente_telefono}</span>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="flex flex-col gap-1.5 pb-2 border-b-2 border-black">
              <div className="flex justify-between font-bold text-[9.5px] uppercase tracking-wider border-b border-black pb-0.5 text-gray-800">
                <span>CANT  PLATILLO</span>
                <span>IMPORTE</span>
              </div>

              {items.map((item, idx) => {
                const { exclusions, customNote: itemNote } = parseItemTicketNotes(item.notas_item)

                return (
                  <div key={idx} className="flex flex-col gap-0.5 text-[11px]">
                    <div className="flex justify-between items-start font-bold text-black">
                      <span className="pr-1 truncate">
                        <span className="font-mono mr-1">{item.cantidad}x</span>
                        {item.nombre_platillo}
                      </span>
                      <span className="font-mono shrink-0">
                        ${((item.precio_unitario || 0) * (item.cantidad || 1)).toFixed(0)}
                      </span>
                    </div>

                    {item.nivel_picor && (
                      <div className="pl-4 text-[9.5px] text-gray-600">• Picor: <strong>{item.nivel_picor}</strong></div>
                    )}
                    {exclusions.map((excl, i) => (
                      <div key={i} className="pl-4 text-[9.5px] font-bold text-black">• ✕ SIN: {excl.toUpperCase()}</div>
                    ))}
                    {itemNote && (
                      <div className="pl-4 text-[9.5px] italic text-gray-600">• Nota: {itemNote}</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Notas cliente */}
            {customerNote && (
              <div className="border border-black rounded p-1.5 text-[10px] bg-gray-50">
                <strong className="block text-[8.5px] uppercase tracking-wider text-black">
                  INSTRUCCIONES:
                </strong>
                <span>{customerNote}</span>
              </div>
            )}

            {/* Totales */}
            <div className="flex flex-col gap-0.5 pt-0.5 pb-1 border-b border-dashed border-gray-400 text-[10.5px]">
              <div className="flex justify-between items-baseline font-black text-sm pt-0.5">
                <span>TOTAL:</span>
                <span className="font-mono text-base">${subtotal.toFixed(0)} MXN</span>
              </div>
              <div className="flex justify-between text-[9.5px] text-gray-600">
                <span>Pago:</span>
                <span className="font-bold uppercase">{pedido.metodo_pago || 'Efectivo'}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[8.5px] text-gray-500 pt-0.5">
              ¡Muchas gracias por su preferencia! · Marea Negra
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Botón Imprimir / PDF */}
          <button
            type="button"
            onClick={handleImprimir}
            className="bg-coral hover:bg-coral/90 text-blanco font-sans font-bold text-xs py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
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

        {/* Botón WhatsApp */}
        <button
          type="button"
          onClick={handleEnviarWhatsApp}
          className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>ENVIAR TICKET POR WHATSAPP AL CLIENTE</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
