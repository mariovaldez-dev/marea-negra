'use client'

import React, { useState, useEffect } from 'react'
import {
  ThermalTicketData,
  generateThermalTicketCanvas,
  getThermalTicketBlob,
} from '@/lib/utils/generateThermalTicketImage'
import { useWhatsAppSupport } from '@/lib/hooks/useWhatsAppSupport'
import {
  Receipt,
  Download,
  Copy,
  Share2,
  Check,
  MessageCircle,
  X,
  Sparkles,
  Printer,
  Loader2,
  ExternalLink,
} from 'lucide-react'

interface PosThermalTicketModalProps {
  isOpen: boolean
  onClose: () => void
  data: ThermalTicketData
}

export function PosThermalTicketModal({ isOpen, onClose, data }: PosThermalTicketModalProps) {
  const { openWhatsApp } = useWhatsAppSupport()
  const [ticketImageUrl, setTicketImageUrl] = useState<string | null>(null)
  const [copiedImage, setCopiedImage] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const canvas = generateThermalTicketCanvas(data)
      const url = canvas.toDataURL('image/png')
      setTicketImageUrl(url)
      setCopiedImage(false)
      setDownloaded(false)
    } else {
      setTicketImageUrl(null)
    }
  }, [isOpen, data])

  if (!isOpen || !ticketImageUrl) return null

  // 1. COPIAR IMAGEN AL PORTAPAPELES PARA PEGAR EN WHATSAPP WEB
  const handleCopiarImagen = async () => {
    try {
      const blob = await getThermalTicketBlob(data)
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({
            'image/png': blob,
          }),
        ])
        setCopiedImage(true)
        setTimeout(() => setCopiedImage(false), 3000)
      } else {
        // Fallback: descargar
        handleDescargarPng()
      }
    } catch (err) {
      console.warn('Clipboard image copy fallback:', err)
      handleDescargarPng()
    }
  }

  // 2. DESCARGAR IMAGEN PNG
  const handleDescargarPng = () => {
    const link = document.createElement('a')
    link.download = `ticket_pos_marea_negra_${data.folio}.png`
    link.href = ticketImageUrl
    link.click()
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }

  // 3. COMPARTIR ARCHIVO POR WHATSAPP EN MÓVIL
  const handleCompartirMovil = async () => {
    setSharing(true)
    try {
      const blob = await getThermalTicketBlob(data)
      if (blob && navigator.share && navigator.canShare) {
        const file = new File([blob], `ticket_${data.folio}.png`, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Ticket Marea Negra #${data.folio}`,
            text: `¡Hola ${data.clienteNombre}! Adjuntamos tu ticket de compra de Marea Negra - Aguachiles 🦐`,
            files: [file],
          })
        } else {
          handleCompartirTextoWhatsApp()
        }
      } else {
        handleCompartirTextoWhatsApp()
      }
    } catch (err) {
      console.warn('Share error:', err)
      handleCompartirTextoWhatsApp()
    } finally {
      setSharing(false)
    }
  }

  // 4. COMPARTIR TEXTO + LINK POR WHATSAPP
  const handleCompartirTextoWhatsApp = () => {
    const cleanPhone = (data.clienteTelefono || '').replace(/\D/g, '')
    const targetPhone = cleanPhone.startsWith('52') ? cleanPhone : cleanPhone ? `52${cleanPhone}` : ''

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marea-negra.com'
    const linkRastreo = `${origin}/pedido/${data.folio}`

    const msg = `🌊 *MAREA NEGRA - COMPROBANTE DE COMPRA* 🧾🦐
¡Hola *${data.clienteNombre}*, tu pedido *#${data.folio}* ha sido entregado con éxito!

💰 *Total Pagado:* $${data.total.toFixed(0)} MXN
💳 *Método:* ${(data.metodoPago || 'Efectivo').toUpperCase()} ✓

👇 *Puedes ver y descargar tu Ticket Digital en HD aquí:*
${linkRastreo}

¡Muchas gracias por tu preferencia, que lo disfrutes compa! 🌶️🍻`

    if (targetPhone) {
      window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank')
    } else {
      openWhatsApp(msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-[#111111] border border-oro/30 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl relative gold-border-corner flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
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
              <span>IMAGEN DE TICKET REAL (80MM)</span>
            </span>
            <h3 className="font-display text-2xl text-blanco tracking-wide">
              TICKET TÉRMICO POS
            </h3>
          </div>
        </div>

        {/* Vista previa del ticket térmico en proporciones reales */}
        <div className="flex justify-center p-3 bg-[#0A0A0A] rounded-2xl border border-arena/10 overflow-hidden shadow-inner max-h-[380px] overflow-y-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ticketImageUrl}
            alt={`Ticket térmico #${data.folio}`}
            className="w-full max-w-[280px] shadow-2xl rounded-sm border border-neutral-300"
          />
        </div>

        {/* Acciones de Envío y Copiado para WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Botón Copiar Imagen */}
          <button
            type="button"
            onClick={handleCopiarImagen}
            className="bg-carbon hover:bg-black text-arena hover:text-blanco border border-arena/20 hover:border-turquesa text-xs font-sans font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
          >
            {copiedImage ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span className="text-emerald-400">¡IMAGEN COPIADA!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-turquesa" />
                <span>COPIAR IMAGEN (PEGAR EN WA)</span>
              </>
            )}
          </button>

          {/* Botón Descargar PNG */}
          <button
            type="button"
            onClick={handleDescargarPng}
            className="bg-carbon hover:bg-black text-arena hover:text-blanco border border-arena/20 hover:border-oro text-xs font-sans font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
          >
            {downloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span className="text-emerald-400">¡DESCARGADO!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-oro" />
                <span>DESCARGAR PNG</span>
              </>
            )}
          </button>
        </div>

        {/* Botón Principal: Compartir por WhatsApp Móvil o Enviar Link */}
        <button
          type="button"
          onClick={handleCompartirMovil}
          disabled={sharing}
          className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {sharing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>ENVIAR TICKET POR WHATSAPP AL CLIENTE</span>
              <ExternalLink className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
