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
  suave: 'Suave (Leve chile fresco)',
  medio: 'Medio (Tradicional Sinaloa)',
  bravo: 'BRAVO (Chiltepín Fuego)',
  sin_chile: 'Sin Chile (Al natural con limón)',
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

  // Genera el comprobante en estilo TICKET TÉRMICO REAL (Papel blanco de comanda)
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
      const width = 480
      const padding = 32
      let currentY = padding

      // Calcular altura exacta requerida
      let itemsBlockHeight = 0
      items.forEach((item) => {
        itemsBlockHeight += 38
        if (getItemDesc(item)) itemsBlockHeight += 16
        if (getItemPicor(item)) itemsBlockHeight += 16
        if (getItemNotas(item)) itemsBlockHeight += 18
        itemsBlockHeight += 10
      })

      const notesExtraHeight = effectiveNotas ? 55 : 0
      const discountExtraHeight = numDiscount > 0 ? 26 : 0
      const totalHeight = Math.max(560, 240 + itemsBlockHeight + notesExtraHeight + discountExtraHeight + 170)

      canvas.width = width * scale
      canvas.height = totalHeight * scale
      ctx.scale(scale, scale)

      // ── 1. FONDO DE PAPEL TÉRMICO (#FFFFFF) ──────────────────────────────────
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, totalHeight)

      // Borde exterior suave del ticket
      ctx.strokeStyle = '#E0E0E0'
      ctx.lineWidth = 1
      ctx.strokeRect(8, 8, width - 16, totalHeight - 16)

      // ── 2. ENCABEZADO DE COMANDA TÉRMICA ─────────────────────────────────────
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000000'
      ctx.font = '900 24px "Courier New", Courier, monospace, system-ui'
      ctx.fillText('MAREA NEGRA', width / 2, currentY + 20)

      ctx.fillStyle = '#444444'
      ctx.font = 'bold 11px "Courier New", Courier, monospace, system-ui'
      ctx.fillText('AGUACHILES & COCTELES · SINALOA', width / 2, currentY + 38)

      ctx.font = '10px "Courier New", Courier, monospace, system-ui'
      ctx.fillStyle = '#666666'
      ctx.fillText('Mariscos Frescos del Día · Receta Sinaloense', width / 2, currentY + 52)

      // Línea doble de ticket
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(padding, currentY + 66)
      ctx.lineTo(width - padding, currentY + 66)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(padding, currentY + 69)
      ctx.lineTo(width - padding, currentY + 69)
      ctx.stroke()

      currentY += 86

      // ── 3. FOLIO, FECHA Y DATOS DE ENTREGA ───────────────────────────────────
      ctx.textAlign = 'left'
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 18px "Courier New", Courier, monospace, system-ui'
      ctx.fillText(`FOLIO: #${pedidoId}`, padding, currentY)

      ctx.textAlign = 'right'
      ctx.font = '11px "Courier New", Courier, monospace, system-ui'
      ctx.fillStyle = '#444444'
      ctx.fillText(formattedFecha, width - padding, currentY)

      currentY += 22

      // Cliente
      ctx.textAlign = 'left'
      ctx.font = 'bold 13px "Courier New", Courier, monospace, system-ui'
      ctx.fillStyle = '#000000'
      ctx.fillText(`CLIENTE: ${clienteNombre.toUpperCase()}`, padding, currentY)

      if (clienteTelefono) {
        ctx.textAlign = 'right'
        ctx.font = '11px "Courier New", Courier, monospace, system-ui'
        ctx.fillStyle = '#333333'
        ctx.fillText(`TEL: ${clienteTelefono}`, width - padding, currentY)
      }

      currentY += 18

      // Método de Pago y Horario
      ctx.textAlign = 'left'
      ctx.font = '11px "Courier New", Courier, monospace, system-ui'
      ctx.fillStyle = '#444444'
      ctx.fillText(`PAGO: ${(metodoPago || 'Efectivo').toUpperCase()}`, padding, currentY)

      const entregaTxt = horaRecogida && horaRecogida !== 'lo_antes_posible'
        ? `HORA: ${horaRecogida.slice(0, 5)} HRS`
        : 'ENTREGA: LO ANTES POSIBLE'
      ctx.textAlign = 'right'
      ctx.fillText(entregaTxt, width - padding, currentY)

      currentY += 18

      // Línea punteada divisoria
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = '#888888'
      ctx.beginPath()
      ctx.moveTo(padding, currentY)
      ctx.lineTo(width - padding, currentY)
      ctx.stroke()
      ctx.setLineDash([])

      currentY += 16

      // ── 4. ENCABEZADO DE TABLA DE PLATILLOS ───────────────────────────────────
      ctx.textAlign = 'left'
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 11px "Courier New", Courier, monospace, system-ui'
      ctx.fillText('CANT  DESCRIPCIÓN', padding, currentY)

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
        ctx.font = 'bold 13px "Courier New", Courier, monospace, system-ui'
        ctx.fillText(`${qty}x   ${name.toUpperCase()}`, padding, currentY)

        ctx.textAlign = 'right'
        ctx.font = 'bold 13px "Courier New", Courier, monospace, system-ui'
        ctx.fillText(`$${(price * qty).toFixed(0)}`, width - padding, currentY)

        currentY += 15

        if (desc) {
          ctx.textAlign = 'left'
          ctx.fillStyle = '#555555'
          ctx.font = '10px "Courier New", Courier, monospace, system-ui'
          const shortDesc = desc.length > 48 ? desc.slice(0, 45) + '...' : desc
          ctx.fillText(`     (${shortDesc})`, padding, currentY)
          currentY += 13
        }

        if (picor) {
          ctx.textAlign = 'left'
          ctx.fillStyle = '#111111'
          ctx.font = 'bold 10px "Courier New", Courier, monospace, system-ui'
          ctx.fillText(`     • Picor: ${PICOR_LABELS[picor] || picor}`, padding, currentY)
          currentY += 13
        }

        if (itemNotes) {
          ctx.textAlign = 'left'
          ctx.fillStyle = '#000000'
          ctx.font = 'italic 10px "Courier New", Courier, monospace, system-ui'
          ctx.fillText(`     • NOTA: "${itemNotes}"`, padding, currentY)
          currentY += 14
        }

        currentY += 6
      })

      // ── 6. NOTAS GENERALES ───────────────────────────────────────────────────
      if (effectiveNotas) {
        currentY += 6
        ctx.strokeStyle = '#444444'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.strokeRect(padding, currentY, width - padding * 2, 38)
        ctx.setLineDash([])

        ctx.textAlign = 'left'
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 10px "Courier New", Courier, monospace, system-ui'
        ctx.fillText('NOTAS GENERALES DEL PEDIDO:', padding + 8, currentY + 14)

        ctx.font = '11px "Courier New", Courier, monospace, system-ui'
        ctx.fillText(`"${effectiveNotas}"`, padding + 8, currentY + 28)

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

      currentY += 18

      // ── 7. TOTALES Y DESGLOSE ────────────────────────────────────────────────
      if (numDiscount > 0) {
        ctx.textAlign = 'left'
        ctx.fillStyle = '#444444'
        ctx.font = '11px "Courier New", Courier, monospace, system-ui'
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

      // TOTAL GRANDE ENMARCADO TÉRMICO
      ctx.fillStyle = '#F5F5F5'
      ctx.fillRect(padding, currentY, width - padding * 2, 36)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1.5
      ctx.strokeRect(padding, currentY, width - padding * 2, 36)

      ctx.textAlign = 'left'
      ctx.fillStyle = '#000000'
      ctx.font = '900 16px "Courier New", Courier, monospace, system-ui'
      ctx.fillText('TOTAL:', padding + 10, currentY + 23)

      ctx.textAlign = 'right'
      ctx.font = '900 20px "Courier New", Courier, monospace, system-ui'
      ctx.fillText(`$${numTotal.toFixed(0)} MXN`, width - padding - 10, currentY + 24)

      currentY += 56

      // ── 8. PIE DE TICKET TÉRMICO ─────────────────────────────────────────────
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 11px "Courier New", Courier, monospace, system-ui'
      ctx.fillText('¡GRACIAS POR SU PREFERENCIA!', width / 2, currentY)

      ctx.fillStyle = '#666666'
      ctx.font = '10px "Courier New", Courier, monospace, system-ui'
      ctx.fillText('Muestra este ticket en barra para recoger', width / 2, currentY + 16)

      // Simulación de código de barras de comanda al pie
      currentY += 32
      const barCount = 42
      const barWidth = 4
      const startX = (width - barCount * (barWidth + 2)) / 2
      ctx.fillStyle = '#000000'
      for (let b = 0; b < barCount; b++) {
        const h = (b % 3 === 0 || b % 5 === 0) ? 22 : 16
        ctx.fillRect(startX + b * (barWidth + 2), currentY, barWidth, h)
      }

      ctx.font = '9px "Courier New", Courier, monospace, system-ui'
      ctx.fillStyle = '#888888'
      ctx.fillText(`* MN-${pedidoId}-ORDER *`, width / 2, currentY + 34)

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
          <div className="bg-white dark:bg-[#111317] border border-black/10 dark:border-white/10 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative flex flex-col items-center gap-4 text-center max-h-[92vh] overflow-y-auto">
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
                Ticket térmico oficial de barra listo para guardar como imagen o imprimir.
              </p>
            </div>

            {/* Contenedor del Ticket Térmico con sombra de papel real */}
            <div className="rounded-xl overflow-hidden border border-neutral-300 dark:border-neutral-700 shadow-2xl max-w-full bg-[#E5E5E5] p-3 flex justify-center">
              <img
                src={modalImageUrl}
                alt={`Ticket Pedido ${pedidoId}`}
                className="w-full h-auto object-contain max-h-[52vh] rounded shadow-md"
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
