'use client'

import React, { useState } from 'react'
import { Download, Check, Sparkles, X, Eye, Receipt, Printer, Share2 } from 'lucide-react'

export interface TicketItem {
  nombre_platillo?: string
  precio_unitario?: number
  cantidad?: number
  nivel_picor?: string | null
  notas_item?: string | null
  descripcion?: string | null
  platillo?: {
    nombre?: string
    precio?: number
    descripcion?: string | null
  }
  qty?: number
  picor?: string | null
  notas?: string | null
  [key: string]: any
}

interface TicketImageDownloadProps {
  pedidoId: number | string
  clienteNombre: string
  clienteTelefono?: string | null
  metodoPago?: string | null
  horaRecogida?: string | null
  tipoEntrega?: string | null
  notasGenerales?: string | null
  notas?: string | null
  total: number
  subtotal?: number | null
  descuento?: number | null
  cuponCodigo?: string | null
  fecha?: string | null
  items: TicketItem[]
}

const PICOR_LABELS: Record<string, string> = {
  suave: 'Suave (Leve chile)',
  medio: 'Medio (Tradicional Sinaloa)',
  bravo: 'BRAVO (Chiltepín Fuego)',
  sin_chile: 'Sin Chile (Limón y sal)',
}

export function TicketImageDownload({
  pedidoId,
  clienteNombre,
  clienteTelefono,
  metodoPago = 'efectivo',
  horaRecogida,
  tipoEntrega,
  notasGenerales,
  notas,
  total,
  subtotal: propSubtotal,
  descuento: propDescuento,
  cuponCodigo,
  fecha,
  items = [],
}: TicketImageDownloadProps) {
  const [downloading, setDownloading] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState(false)

  const effectiveNotas = notasGenerales || notas || null

  const getItemName = (i: TicketItem) => i.nombre_platillo || i.platillo?.nombre || 'Platillo'
  const getItemPrice = (i: TicketItem) => Number(i.precio_unitario !== undefined ? i.precio_unitario : (i.platillo?.precio || 0)) || 0
  const getItemQty = (i: TicketItem) => Number(i.cantidad !== undefined ? i.cantidad : (i.qty || 1)) || 1
  const getItemPicor = (i: TicketItem) => i.nivel_picor || i.nivelPicor || i.picor || null
  const getItemNotas = (i: TicketItem) => i.notas_item || i.notasItem || i.notas || null
  const getItemDesc = (i: TicketItem) => i.descripcion || i.platillo?.descripcion || null

  const numTotal = Number(total) || 0

  const formattedFecha =
    fecha ||
    new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const calculatedSubtotal = items.reduce(
    (sum, item) => sum + getItemPrice(item) * getItemQty(item),
    0
  )
  const numSubtotal = propSubtotal && Number(propSubtotal) > 0 ? Number(propSubtotal) : calculatedSubtotal
  const calculatedDiscount = Math.max(0, numSubtotal - numTotal)
  const numDiscount = propDescuento && Number(propDescuento) > 0 ? Number(propDescuento) : calculatedDiscount

  // Genera el ticket térmico en alta definición con proporciones profesionales de 80mm
  const generatePreview = () => {
    setDownloading(true)

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setDownloading(false)
        return
      }

      const scale = 2
      const width = 400
      const padding = 22
      let currentY = 24

      // Calcular altura exacta compacta
      let itemsHeight = 0
      items.forEach((item) => {
        itemsHeight += 38
        if (getItemDesc(item)) itemsHeight += 16
        if (getItemPicor(item)) itemsHeight += 16
        if (getItemNotas(item)) itemsHeight += 18
        itemsHeight += 6
      })

      const notesHeight = effectiveNotas ? 52 : 0
      const discountHeight = numDiscount > 0 ? 36 : 0
      const totalHeight = 150 + itemsHeight + notesHeight + discountHeight + 175

      canvas.width = width * scale
      canvas.height = totalHeight * scale
      ctx.scale(scale, scale)

      // ── 1. FONDO DE PAPEL TÉRMICO (#FFFFFF) ──────────────────────────────────
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, totalHeight)

      // Borde exterior del ticket
      ctx.strokeStyle = '#D4D4D4'
      ctx.lineWidth = 1
      ctx.strokeRect(4, 4, width - 8, totalHeight - 8)

      // ── 2. ENCABEZADO DE COMANDA TÉRMICA ─────────────────────────────────────
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000000'
      ctx.font = '900 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText('MAREA NEGRA', width / 2, currentY + 16)

      ctx.fillStyle = '#404040'
      ctx.font = 'bold 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText('AGUACHILES & COCTELES · SINALOA', width / 2, currentY + 34)

      ctx.font = '10px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillStyle = '#737373'
      ctx.fillText('Mariscos Frescos del Día · Comprobante Digital', width / 2, currentY + 48)

      // Doble línea de ticket térmico
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(padding, currentY + 60)
      ctx.lineTo(width - padding, currentY + 60)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(padding, currentY + 63)
      ctx.lineTo(width - padding, currentY + 63)
      ctx.stroke()

      currentY += 80

      // ── 3. FOLIO, FECHA Y CLIENTE ────────────────────────────────────────────
      ctx.textAlign = 'left'
      ctx.fillStyle = '#000000'
      ctx.font = '900 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(`FOLIO #${pedidoId}`, padding, currentY)

      ctx.textAlign = 'right'
      ctx.font = '11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillStyle = '#525252'
      ctx.fillText(formattedFecha, width - padding, currentY)

      currentY += 20

      // Datos Cliente
      ctx.textAlign = 'left'
      ctx.font = 'bold 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillStyle = '#171717'
      ctx.fillText(`CLIENTE: ${clienteNombre.toUpperCase()}`, padding, currentY)

      if (clienteTelefono) {
        ctx.textAlign = 'right'
        ctx.font = '12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillStyle = '#525252'
        ctx.fillText(`TEL: ${clienteTelefono}`, width - padding, currentY)
      }

      currentY += 18

      // Método de Pago y Horario
      ctx.textAlign = 'left'
      ctx.font = '11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillStyle = '#525252'
      ctx.fillText(`PAGO: ${(metodoPago || 'Efectivo').toUpperCase()}`, padding, currentY)

      const entregaTxt = horaRecogida && horaRecogida !== 'lo_antes_posible'
        ? `HORA: ${horaRecogida.slice(0, 5)} HRS`
        : 'ENTREGA: LO ANTES POSIBLE'
      ctx.textAlign = 'right'
      ctx.fillText(entregaTxt, width - padding, currentY)

      currentY += 16

      // Línea punteada divisoria
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = '#A3A3A3'
      ctx.beginPath()
      ctx.moveTo(padding, currentY)
      ctx.lineTo(width - padding, currentY)
      ctx.stroke()
      ctx.setLineDash([])

      currentY += 16

      // ── 4. ENCABEZADO DE TABLA ───────────────────────────────────────────────
      ctx.textAlign = 'left'
      ctx.fillStyle = '#000000'
      ctx.font = '900 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText('CANT   PLATILLO', padding, currentY)

      ctx.textAlign = 'right'
      ctx.fillText('IMPORTE', width - padding, currentY)

      currentY += 10

      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding, currentY)
      ctx.lineTo(width - padding, currentY)
      ctx.stroke()

      currentY += 16

      // ── 5. DETALLE DE ITEMS ──────────────────────────────────────────────────
      items.forEach((item) => {
        const name = getItemName(item)
        const price = getItemPrice(item)
        const qty = getItemQty(item)
        const picor = getItemPicor(item)
        const itemNotes = getItemNotas(item)
        const desc = getItemDesc(item)

        ctx.textAlign = 'left'
        ctx.fillStyle = '#000000'
        ctx.font = '900 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillText(`${qty}x   ${name.toUpperCase()}`, padding, currentY)

        ctx.textAlign = 'right'
        ctx.font = '900 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillText(`$${(price * qty).toFixed(0)}`, width - padding, currentY)

        currentY += 16

        if (desc) {
          ctx.textAlign = 'left'
          ctx.fillStyle = '#666666'
          ctx.font = '10px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          const shortDesc = desc.length > 44 ? desc.slice(0, 41) + '...' : desc
          ctx.fillText(`      (${shortDesc})`, padding, currentY)
          currentY += 14
        }

        if (picor) {
          ctx.textAlign = 'left'
          ctx.fillStyle = '#171717'
          ctx.font = 'bold 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          ctx.fillText(`      • Picor: ${PICOR_LABELS[picor] || picor}`, padding, currentY)
          currentY += 14
        }

        if (itemNotes) {
          ctx.textAlign = 'left'
          ctx.fillStyle = '#E8430A'
          ctx.font = 'italic 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          ctx.fillText(`      • NOTA: "${itemNotes}"`, padding, currentY)
          currentY += 15
        }

        currentY += 4
      })

      // ── 6. NOTAS GENERALES ───────────────────────────────────────────────────
      if (effectiveNotas) {
        currentY += 6
        ctx.fillStyle = '#FAFAFA'
        ctx.fillRect(padding, currentY, width - padding * 2, 40)
        ctx.strokeStyle = '#525252'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.strokeRect(padding, currentY, width - padding * 2, 40)
        ctx.setLineDash([])

        ctx.textAlign = 'left'
        ctx.fillStyle = '#000000'
        ctx.font = '900 10px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillText('NOTAS GENERALES DEL PEDIDO:', padding + 8, currentY + 15)

        ctx.font = '11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillStyle = '#262626'
        ctx.fillText(`"${effectiveNotas}"`, padding + 8, currentY + 30)

        currentY += 48
      } else {
        currentY += 6
      }

      // Línea divisoria previa a totales
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = '#000000'
      ctx.beginPath()
      ctx.moveTo(padding, currentY)
      ctx.lineTo(width - padding, currentY)
      ctx.stroke()
      ctx.setLineDash([])

      currentY += 16

      // ── 7. TOTALES Y DESGLOSE ────────────────────────────────────────────────
      if (numDiscount > 0) {
        ctx.textAlign = 'left'
        ctx.fillStyle = '#525252'
        ctx.font = '11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillText('SUBTOTAL:', padding, currentY)

        ctx.textAlign = 'right'
        ctx.fillText(`$${numSubtotal.toFixed(0)} MXN`, width - padding, currentY)

        currentY += 16

        ctx.textAlign = 'left'
        ctx.fillText(`DESCUENTO ${cuponCodigo ? `(${cuponCodigo})` : ''}:`, padding, currentY)

        ctx.textAlign = 'right'
        ctx.fillText(`-$${numDiscount.toFixed(0)} MXN`, width - padding, currentY)

        currentY += 18
      }

      // TOTAL GRANDE ENMARCADO TÉRMICO (CAJA DESTACADA)
      ctx.fillStyle = '#171717'
      ctx.fillRect(padding, currentY, width - padding * 2, 42)

      ctx.textAlign = 'left'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText('TOTAL A PAGAR:', padding + 12, currentY + 26)

      ctx.textAlign = 'right'
      ctx.font = '900 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(`$${numTotal.toFixed(0)} MXN`, width - padding - 12, currentY + 27)

      currentY += 60

      // ── 8. PIE DE TICKET TÉRMICO ─────────────────────────────────────────────
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText('¡GRACIAS POR SU PREFERENCIA!', width / 2, currentY)

      ctx.fillStyle = '#737373'
      ctx.font = '10px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText('Muestra este comprobante en barra · Sinaloa, México', width / 2, currentY + 16)

      // Simulación de código de barras compacto
      currentY += 28
      const barCount = 38
      const barWidth = 4
      const startX = (width - barCount * (barWidth + 2)) / 2
      ctx.fillStyle = '#000000'
      for (let b = 0; b < barCount; b++) {
        const h = (b % 3 === 0 || b % 5 === 0) ? 20 : 14
        ctx.fillRect(startX + b * (barWidth + 2), currentY, barWidth, h)
      }

      ctx.font = 'bold 9px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillStyle = '#737373'
      ctx.fillText(`* MN-${pedidoId}-ORDER *`, width / 2, currentY + 32)

      const imageUrl = canvas.toDataURL('image/png')
      setModalImageUrl(imageUrl)
    } catch (err) {
      console.error('Error al generar ticket térmico:', err)
    } finally {
      setDownloading(false)
    }
  }

  const handleExplicitDownload = async () => {
    if (!modalImageUrl) return

    try {
      const response = await fetch(modalImageUrl)
      const blob = await response.blob()
      const file = new File([blob], `Ticket_MareaNegra_Folio_${pedidoId}.png`, { type: 'image/png' })

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Ticket Comanda Marea Negra #${pedidoId}`,
          text: `Ticket de Pedido #${pedidoId} · Marea Negra Mariscos`,
          files: [file],
        })
        setDownloaded(true)
        setTimeout(() => setDownloaded(false), 3000)
        return
      }
    } catch (e) {
      console.log('Descarga fallback:', e)
    }

    const link = document.createElement('a')
    link.download = `Ticket_MareaNegra_Folio_${pedidoId}.png`
    link.href = modalImageUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }

  return (
    <>
      <button
        type="button"
        onClick={generatePreview}
        disabled={downloading}
        className="w-full bg-white dark:bg-[#171A21] hover:bg-neutral-50 dark:hover:bg-[#1E222B] border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-sans font-bold text-xs tracking-wider py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
      >
        <Printer className="w-4 h-4 text-coral" />
        <span>{downloading ? 'GENERANDO TICKET...' : 'VER COMPROBANTE Y DESCARGAR TICKET (PNG)'}</span>
      </button>

      {/* MODAL DE VISTA PREVIA DEL TICKET TÉRMICO */}
      {modalImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111317] border border-black/10 dark:border-white/10 rounded-3xl w-full max-w-sm sm:max-w-md p-5 sm:p-6 shadow-2xl relative flex flex-col items-center gap-4 text-center max-h-[92vh] overflow-y-auto">
            {/* Botón Cerrar */}
            <button
              onClick={() => setModalImageUrl(null)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Modal */}
            <div className="flex flex-col gap-1 pr-6">
              <span className="text-[11px] font-sans font-bold text-coral uppercase tracking-wider flex items-center justify-center gap-1">
                <Printer className="w-3.5 h-3.5" />
                <span>TICKET DE COMANDA IMPRESA</span>
              </span>
              <h3 className="font-display text-2xl sm:text-3xl text-neutral-900 dark:text-white">
                FOLIO #{pedidoId}
              </h3>
              <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400">
                Comprobante térmico listo para guardar en fotos o imprimir.
              </p>
            </div>

            {/* Contenedor del Ticket Térmico sin márgenes excesivos */}
            <div className="w-full flex justify-center py-1">
              <img
                src={modalImageUrl}
                alt={`Ticket Pedido ${pedidoId}`}
                className="w-full max-w-[340px] h-auto object-contain rounded-xl border border-black/10 dark:border-white/15 shadow-2xl"
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center gap-2.5 w-full pt-2">
              <button
                type="button"
                onClick={handleExplicitDownload}
                className="flex-1 bg-coral text-white font-sans font-bold text-xs py-3.5 px-4 rounded-xl hover:bg-neutral-900 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
              >
                {downloaded ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>¡TICKET GUARDADO!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>DESCARGAR FOTO (PNG)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setModalImageUrl(null)}
                className="px-4 py-3.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-neutral-700 dark:text-neutral-300 font-sans font-bold text-xs rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
