'use client'

import React, { useState } from 'react'
import { Download, Check, Sparkles, X, Eye, Ticket, Share2, Receipt } from 'lucide-react'

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
  suave: 'Suave (Leve chile fresco)',
  medio: 'Medio (Tradicional Sinaloa)',
  bravo: 'BRAVO (Chiltepín Extra Fuego)',
  sin_chile: 'Sin Chile (Al natural con limón)',
}

export function TicketImageDownload({
  pedidoId,
  clienteNombre,
  clienteTelefono,
  metodoPago = 'efectivo',
  horaRecogida,
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

  // Generar imagen digital en alta definición usando HTML5 Canvas con alto contraste
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
      const width = 560
      const padding = 36
      let currentY = padding

      // Calcular altura requerida con espaciados seguros
      let itemsBlockHeight = 0
      items.forEach((item) => {
        itemsBlockHeight += 42
        if (getItemDesc(item)) itemsBlockHeight += 18
        if (getItemPicor(item)) itemsBlockHeight += 18
        if (getItemNotas(item)) itemsBlockHeight += 20
        itemsBlockHeight += 14
      })

      const notesExtraHeight = effectiveNotas ? 65 : 0
      const discountExtraHeight = numDiscount > 0 ? 30 : 0
      const totalHeight = Math.max(620, 260 + itemsBlockHeight + notesExtraHeight + discountExtraHeight + 190)

      canvas.width = width * scale
      canvas.height = totalHeight * scale
      ctx.scale(scale, scale)

      // ── 1. FONDO PRINCIPAL DEL TICKET (High Contrast Titanium Dark) ──────────
      const bgGradient = ctx.createLinearGradient(0, 0, 0, totalHeight)
      bgGradient.addColorStop(0, '#0F1117')
      bgGradient.addColorStop(1, '#0A0C10')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, totalHeight)

      // Borde exterior con acento sutil
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(10, 10, width - 20, totalHeight - 20)

      // ── 2. ENCABEZADO DE MARCA ───────────────────────────────────────────────
      // Logo y Título
      ctx.textAlign = 'center'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif'
      ctx.fillText('MAREA NEGRA', width / 2, currentY + 24)

      // Subtítulo
      ctx.fillStyle = '#2ABFBF'
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
      ctx.fillText('AGUACHILES & COCTELES · SINALOA', width / 2, currentY + 44)

      ctx.fillStyle = '#A3A3A3'
      ctx.font = '11px system-ui, -apple-system, sans-serif'
      ctx.fillText('Mariscos Frescos del Día · Comprobante Digital', width / 2, currentY + 60)

      // Línea divisoria superior
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding, currentY + 76)
      ctx.lineTo(width - padding, currentY + 76)
      ctx.stroke()

      currentY += 96

      // ── 3. CARD DE RESUMEN DEL PEDIDO ────────────────────────────────────────
      // Caja destacada para el folio y datos de entrega
      const summaryBoxY = currentY
      const summaryBoxH = 92
      ctx.fillStyle = '#171A21'
      ctx.fillRect(padding - 4, summaryBoxY, width - padding * 2 + 8, summaryBoxH)
      ctx.strokeStyle = 'rgba(42, 191, 191, 0.3)'
      ctx.strokeRect(padding - 4, summaryBoxY, width - padding * 2 + 8, summaryBoxH)

      // Folio
      ctx.textAlign = 'left'
      ctx.fillStyle = '#2ABFBF'
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
      ctx.fillText(`FOLIO #${pedidoId}`, padding + 10, summaryBoxY + 28)

      // Total en cabecera
      ctx.textAlign = 'right'
      ctx.fillStyle = '#E8430A'
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
      ctx.fillText(`$${numTotal.toFixed(0)} MXN`, width - padding - 10, summaryBoxY + 28)

      // Datos Cliente
      ctx.textAlign = 'left'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
      ctx.fillText(`👤 Cliente: ${clienteNombre}`, padding + 10, summaryBoxY + 54)

      if (clienteTelefono) {
        ctx.textAlign = 'right'
        ctx.fillStyle = '#D4D4D4'
        ctx.font = '12px system-ui, -apple-system, sans-serif'
        ctx.fillText(`📞 ${clienteTelefono}`, width - padding - 10, summaryBoxY + 54)
      }

      // Método de Pago y Hora
      ctx.textAlign = 'left'
      ctx.fillStyle = '#A3A3A3'
      ctx.font = '11px system-ui, -apple-system, sans-serif'
      ctx.fillText(`💳 Pago: ${(metodoPago || 'Efectivo').toUpperCase()}`, padding + 10, summaryBoxY + 74)

      if (horaRecogida && horaRecogida !== 'lo_antes_posible') {
        ctx.textAlign = 'right'
        ctx.fillStyle = '#E5B842'
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
        ctx.fillText(`⏰ Hora: ${horaRecogida.slice(0, 5)} hrs`, width - padding - 10, summaryBoxY + 74)
      } else {
        ctx.textAlign = 'right'
        ctx.fillStyle = '#2ABFBF'
        ctx.font = '11px system-ui, -apple-system, sans-serif'
        ctx.fillText(`⏰ Lo antes posible`, width - padding - 10, summaryBoxY + 74)
      }

      currentY += summaryBoxH + 24

      // ── 4. ENCABEZADO DE TABLA DE PLATILLOS ───────────────────────────────────
      ctx.textAlign = 'left'
      ctx.fillStyle = '#A3A3A3'
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
      ctx.fillText('CANT · DETALLE DE LA COMANDA', padding, currentY)

      ctx.textAlign = 'right'
      ctx.fillText('IMPORTE', width - padding, currentY)

      currentY += 12

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.beginPath()
      ctx.moveTo(padding, currentY)
      ctx.lineTo(width - padding, currentY)
      ctx.stroke()

      currentY += 18

      // ── 5. LISTA DE PLATILLOS ────────────────────────────────────────────────
      items.forEach((item) => {
        const name = getItemName(item)
        const price = getItemPrice(item)
        const qty = getItemQty(item)
        const picor = getItemPicor(item)
        const itemNotes = getItemNotas(item)
        const desc = getItemDesc(item)

        // Nombre y Cantidad
        ctx.textAlign = 'left'
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
        ctx.fillText(`${qty}x  ${name}`, padding, currentY)

        // Precio
        ctx.textAlign = 'right'
        ctx.fillStyle = '#E8430A'
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
        ctx.fillText(`$${(price * qty).toFixed(0)} MXN`, width - padding, currentY)

        currentY += 16

        // Descripción
        if (desc) {
          ctx.textAlign = 'left'
          ctx.fillStyle = '#737373'
          ctx.font = '10px system-ui, -apple-system, sans-serif'
          const shortDesc = desc.length > 55 ? desc.slice(0, 52) + '...' : desc
          ctx.fillText(`     ${shortDesc}`, padding, currentY)
          currentY += 14
        }

        // Picor
        if (picor) {
          ctx.textAlign = 'left'
          ctx.fillStyle = '#E5B842'
          ctx.font = '11px system-ui, -apple-system, sans-serif'
          ctx.fillText(`     🌶️ Picor: ${PICOR_LABELS[picor] || picor}`, padding, currentY)
          currentY += 15
        }

        // Notas especiales del platillo
        if (itemNotes) {
          ctx.textAlign = 'left'
          ctx.fillStyle = '#2ABFBF'
          ctx.font = 'italic 11px system-ui, -apple-system, sans-serif'
          ctx.fillText(`     📝 Nota: "${itemNotes}"`, padding, currentY)
          currentY += 16
        }

        currentY += 8
      })

      // ── 6. NOTAS GENERALES ───────────────────────────────────────────────────
      if (effectiveNotas) {
        currentY += 8
        ctx.fillStyle = 'rgba(232, 67, 10, 0.12)'
        ctx.fillRect(padding - 4, currentY, width - padding * 2 + 8, 44)
        ctx.strokeStyle = 'rgba(232, 67, 10, 0.4)'
        ctx.strokeRect(padding - 4, currentY, width - padding * 2 + 8, 44)

        ctx.textAlign = 'left'
        ctx.fillStyle = '#E8430A'
        ctx.font = 'bold 10px system-ui, -apple-system, sans-serif'
        ctx.fillText('📌 NOTAS GENERALES DE COCINA:', padding + 6, currentY + 16)

        ctx.fillStyle = '#FFFFFF'
        ctx.font = '11px system-ui, -apple-system, sans-serif'
        ctx.fillText(`"${effectiveNotas}"`, padding + 6, currentY + 32)

        currentY += 56
      } else {
        currentY += 10
      }

      // Línea punteada de desglose
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
      ctx.beginPath()
      ctx.moveTo(padding, currentY)
      ctx.lineTo(width - padding, currentY)
      ctx.stroke()
      ctx.setLineDash([])

      currentY += 24

      // ── 7. TOTALES Y DESCUENTOS ──────────────────────────────────────────────
      if (numDiscount > 0) {
        ctx.textAlign = 'left'
        ctx.fillStyle = '#A3A3A3'
        ctx.font = '12px system-ui, -apple-system, sans-serif'
        ctx.fillText('Subtotal Comanda:', padding, currentY)

        ctx.textAlign = 'right'
        ctx.fillText(`$${numSubtotal.toFixed(0)} MXN`, width - padding, currentY)

        currentY += 20

        ctx.textAlign = 'left'
        ctx.fillStyle = '#2ABFBF'
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
        ctx.fillText(`🎁 Descuento ${cuponCodigo ? `(${cuponCodigo})` : ''}:`, padding, currentY)

        ctx.textAlign = 'right'
        ctx.fillText(`-$${numDiscount.toFixed(0)} MXN`, width - padding, currentY)

        currentY += 24
      }

      // Total a Pagar
      ctx.textAlign = 'left'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
      ctx.fillText('TOTAL A PAGAR:', padding, currentY)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#E5B842'
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif'
      ctx.fillText(`$${numTotal.toFixed(0)} MXN`, width - padding, currentY)

      currentY += 40

      // ── 8. PIE DE TICKET Y FECHA ─────────────────────────────────────────────
      ctx.textAlign = 'center'
      ctx.fillStyle = '#2ABFBF'
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
      ctx.fillText('¡GRACIAS POR TU PREFERENCIA EN MAREA NEGRA!', width / 2, currentY)

      ctx.fillStyle = '#737373'
      ctx.font = '10px system-ui, -apple-system, sans-serif'
      ctx.fillText(`Emitido: ${formattedFecha} · Muestra este ticket en barra`, width / 2, currentY + 16)

      const imageUrl = canvas.toDataURL('image/png')
      setModalImageUrl(imageUrl)
    } catch (err) {
      console.error('Error al generar preview del comprobante:', err)
    } finally {
      setDownloading(false)
    }
  }

  // Descarga directa o compartir en móviles
  const handleExplicitDownload = async () => {
    if (!modalImageUrl) return

    try {
      const response = await fetch(modalImageUrl)
      const blob = await response.blob()
      const file = new File([blob], `MareaNegra_Ticket_${pedidoId}.png`, { type: 'image/png' })

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Ticket Marea Negra #${pedidoId}`,
          text: `Comprobante de Pedido #${pedidoId} · Marea Negra`,
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
    link.download = `MareaNegra_Ticket_${pedidoId}.png`
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
        <Receipt className="w-4 h-4 text-[#2ABFBF]" />
        <span>{downloading ? 'GENERANDO TICKET...' : 'VER COMPROBANTE Y DESCARGAR FOTO (PNG)'}</span>
      </button>

      {/* MODAL DE VISTA PREVIA DUAL-THEME BENTO */}
      {modalImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111317] border border-black/10 dark:border-white/10 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative flex flex-col items-center gap-4 text-center max-h-[90vh] overflow-y-auto">
            {/* Botón Cerrar */}
            <button
              onClick={() => setModalImageUrl(null)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Modal */}
            <div className="flex flex-col gap-1 pr-6">
              <span className="text-[11px] font-sans font-bold text-[#2ABFBF] uppercase tracking-wider flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>COMPROBANTE DIGITAL OFICIAL</span>
              </span>
              <h3 className="font-display text-2xl sm:text-3xl text-neutral-900 dark:text-white">
                TICKET PEDIDO #{pedidoId}
              </h3>
              <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400">
                Guarda este ticket en tus fotos o compártelo para recoger tu orden en barra.
              </p>
            </div>

            {/* Imagen del Comprobante Generado */}
            <div className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-xl max-w-full bg-[#0F1117]">
              <img
                src={modalImageUrl}
                alt={`Ticket Pedido ${pedidoId}`}
                className="w-full h-auto object-contain max-h-[50vh]"
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center gap-2.5 w-full pt-2">
              <button
                type="button"
                onClick={handleExplicitDownload}
                className="flex-1 bg-[#2ABFBF] text-black font-sans font-bold text-xs py-3.5 px-4 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
              >
                {downloaded ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>¡DESCARGADO!</span>
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
