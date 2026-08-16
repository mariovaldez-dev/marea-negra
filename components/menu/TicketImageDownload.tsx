'use client'

import React, { useState } from 'react'
import { Download, Camera, Check, Sparkles, X, Eye, Ticket } from 'lucide-react'

export interface TicketItem {
  nombre_platillo?: string
  precio_unitario?: number
  cantidad?: number
  nivel_picor?: string | null
  notas_item?: string | null
  descripcion?: string | null
  // Propiedades de ConfiguredCartItem para compatibilidad universal
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
  suave: '🟢 Suave (Leve chile fresco)',
  medio: '🟡 Medio Sinaloa (Tradicional de la casa)',
  bravo: '🔴 BRAVO (Chiltepín Extra Fuego)',
  sin_chile: '⚪ Sin Chile (Al natural con limón)',
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
  items,
}: TicketImageDownloadProps) {
  const [downloading, setDownloading] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState(false)

  const effectiveNotas = notasGenerales || notas || null

  const getItemName = (i: TicketItem) => i.nombre_platillo || i.platillo?.nombre || 'Platillo'
  const getItemPrice = (i: TicketItem) => (i.precio_unitario !== undefined ? i.precio_unitario : (i.platillo?.precio || 0))
  const getItemQty = (i: TicketItem) => (i.cantidad !== undefined ? i.cantidad : (i.qty || 1))
  const getItemPicor = (i: TicketItem) => i.nivel_picor || i.nivelPicor || i.picor || null
  const getItemNotas = (i: TicketItem) => i.notas_item || i.notasItem || i.notas || null
  const getItemDesc = (i: TicketItem) => i.descripcion || i.platillo?.descripcion || null

  const formattedFecha =
    fecha ||
    new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  // Calcular subtotal real sumando los precios unitarios por cantidad
  const calculatedSubtotal = items.reduce(
    (sum, item) => sum + getItemPrice(item) * getItemQty(item),
    0
  )
  const displaySubtotal = propSubtotal && propSubtotal > 0 ? propSubtotal : calculatedSubtotal
  const calculatedDiscount = Math.max(0, displaySubtotal - total)
  const displayDiscount = propDescuento && propDescuento > 0 ? propDescuento : calculatedDiscount

  // Genera la vista previa del comprobante PNG detallado
  const generatePreview = () => {
    setDownloading(true)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setDownloading(false)
      return
    }

    const scale = 2
    const width = 520
    const padding = 32
    let currentY = padding

    // Calcular altura dinámica
    let calculatedItemsHeight = 0
    items.forEach((item) => {
      calculatedItemsHeight += 45
      if (getItemPicor(item)) calculatedItemsHeight += 20
      if (getItemNotas(item)) calculatedItemsHeight += 22
      if (getItemDesc(item)) calculatedItemsHeight += 20
      calculatedItemsHeight += 12
    })

    const notesExtraHeight = effectiveNotas ? 55 : 0
    const discountExtraHeight = displayDiscount > 0 ? 30 : 0
    const totalHeight = Math.max(580, 240 + calculatedItemsHeight + notesExtraHeight + discountExtraHeight + 175)

    canvas.width = width * scale
    canvas.height = totalHeight * scale
    ctx.scale(scale, scale)

    // 1. Fondo Abisal Luxury (#080808)
    ctx.fillStyle = '#080808'
    ctx.fillRect(0, 0, width, totalHeight)

    // 2. Marco de Oro con esquinas decorativas
    ctx.strokeStyle = '#C9A84C'
    ctx.lineWidth = 2
    ctx.strokeRect(12, 12, width - 24, totalHeight - 24)

    // 3. Encabezado Restaurante
    ctx.fillStyle = '#E8430A' // Coral
    ctx.font = 'bold 34px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('MAREA NEGRA', width / 2, currentY + 32)

    ctx.fillStyle = '#2ABFBF' // Turquesa
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.fillText('AGUACHILES & COCTELES · SINALOA', width / 2, currentY + 54)

    ctx.fillStyle = '#D4C5A9'
    ctx.font = 'italic 11px system-ui, sans-serif'
    ctx.fillText('Mariscos Frescos del Día · Receta Auténtica Sinaloense', width / 2, currentY + 70)

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, currentY + 84)
    ctx.lineTo(width - padding, currentY + 84)
    ctx.stroke()

    currentY += 105

    // 4. Folio y Encabezado de Cliente
    ctx.textAlign = 'left'
    ctx.fillStyle = '#F7F3EE'
    ctx.font = 'bold 24px system-ui, sans-serif'
    ctx.fillText(`FOLIO DE PEDIDO #${pedidoId}`, padding, currentY)

    ctx.textAlign = 'right'
    ctx.fillStyle = '#E8430A'
    ctx.font = 'bold 24px system-ui, sans-serif'
    ctx.fillText(`$${total.toFixed(0)} MXN`, width - padding, currentY)

    currentY += 26
    ctx.textAlign = 'left'
    ctx.fillStyle = '#D4C5A9'
    ctx.font = 'bold 14px system-ui, sans-serif'
    ctx.fillText(`👤 Cliente: ${clienteNombre}`, padding, currentY)

    if (clienteTelefono) {
      ctx.textAlign = 'right'
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText(`📞 Celular: ${clienteTelefono}`, width - padding, currentY)
    }

    currentY += 22
    ctx.textAlign = 'left'
    ctx.fillStyle = '#2ABFBF'
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillText(`💳 Pago: ${(metodoPago || 'efectivo').toUpperCase()}`, padding, currentY)

    if (horaRecogida) {
      ctx.textAlign = 'right'
      ctx.fillStyle = '#C9A84C'
      ctx.font = 'bold 13px system-ui, sans-serif'
      ctx.fillText(`⏰ Recogida a las: ${horaRecogida.slice(0, 5)} hrs`, width - padding, currentY)
    }

    currentY += 20
    ctx.textAlign = 'left'
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(212, 197, 169, 0.6)'
    ctx.fillText(`📅 Registro: ${formattedFecha}`, padding, currentY)

    currentY += 20

    // Línea punteada
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = 'rgba(212, 197, 169, 0.3)'
    ctx.beginPath()
    ctx.moveTo(padding, currentY)
    ctx.lineTo(width - padding, currentY)
    ctx.stroke()
    ctx.setLineDash([])

    currentY += 22

    // 5. Encabezado de Tabla
    ctx.fillStyle = '#2ABFBF'
    ctx.font = 'bold 12px system-ui, sans-serif'
    ctx.fillText('CANT / DESCRIPCIÓN DE PLATILLOS', padding, currentY)
    ctx.textAlign = 'right'
    ctx.fillText('IMPORTE', width - padding, currentY)

    currentY += 18

    // 6. Detalle de Platillos
    items.forEach((item) => {
      const name = getItemName(item)
      const price = getItemPrice(item)
      const qty = getItemQty(item)
      const picor = getItemPicor(item)
      const itemNotes = getItemNotas(item)
      const desc = getItemDesc(item)

      ctx.textAlign = 'left'
      ctx.fillStyle = '#F7F3EE'
      ctx.font = 'bold 15px system-ui, sans-serif'
      const itemTitle = `${qty}x  ${name}`
      ctx.fillText(itemTitle, padding, currentY)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#E8430A'
      ctx.font = 'bold 15px system-ui, sans-serif'
      ctx.fillText(`$${(price * qty).toFixed(0)} MXN`, width - padding, currentY)

      currentY += 18

      if (desc) {
        ctx.textAlign = 'left'
        ctx.fillStyle = 'rgba(212, 197, 169, 0.7)'
        ctx.font = 'italic 11px system-ui, sans-serif'
        ctx.fillText(`    Ingredientes: ${desc}`, padding, currentY)
        currentY += 16
      }

      if (picor) {
        ctx.textAlign = 'left'
        ctx.fillStyle = '#C9A84C'
        ctx.font = 'bold 12px system-ui, sans-serif'
        ctx.fillText(`    🌶️ Picor: ${PICOR_LABELS[picor] || picor}`, padding, currentY)
        currentY += 16
      }

      if (itemNotes) {
        ctx.textAlign = 'left'
        ctx.fillStyle = '#E8430A'
        ctx.font = 'italic 12px system-ui, sans-serif'
        ctx.fillText(`    📝 Nota Chef: "${itemNotes}"`, padding, currentY)
        currentY += 16
      }

      currentY += 10
    })

    // 7. Notas Generales
    if (effectiveNotas) {
      currentY += 5
      ctx.fillStyle = 'rgba(232, 67, 10, 0.15)'
      ctx.fillRect(padding - 6, currentY - 14, width - padding * 2 + 12, 40)

      ctx.strokeStyle = '#E8430A'
      ctx.lineWidth = 1
      ctx.strokeRect(padding - 6, currentY - 14, width - padding * 2 + 12, 40)

      ctx.textAlign = 'left'
      ctx.fillStyle = '#F7F3EE'
      ctx.font = 'bold 11px system-ui, sans-serif'
      ctx.fillText('📌 NOTAS GENERALES DEL PEDIDO:', padding, currentY)

      ctx.fillStyle = '#D4C5A9'
      ctx.font = 'italic 11px system-ui, sans-serif'
      ctx.fillText(`"${effectiveNotas}"`, padding, currentY + 16)

      currentY += 45
    }

    currentY += 10
    ctx.strokeStyle = '#C9A84C'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, currentY)
    ctx.lineTo(width - padding, currentY)
    ctx.stroke()

    currentY += 22

    // 8. Desglose de Subtotal, Descuento de Cupón y Total Final
    if (displayDiscount > 0) {
      ctx.textAlign = 'left'
      ctx.fillStyle = '#D4C5A9'
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText('Subtotal de Platillos:', padding, currentY)

      ctx.textAlign = 'right'
      ctx.fillText(`$${displaySubtotal.toFixed(0)} MXN`, width - padding, currentY)

      currentY += 20

      ctx.textAlign = 'left'
      ctx.fillStyle = '#2ABFBF'
      ctx.font = 'bold 13px system-ui, sans-serif'
      const couponText = cuponCodigo ? `Descuento Cupón (${cuponCodigo}):` : 'Descuento Aplicado (10% OFF):'
      ctx.fillText(`🎁 ${couponText}`, padding, currentY)

      ctx.textAlign = 'right'
      ctx.fillText(`-$${displayDiscount.toFixed(0)} MXN`, width - padding, currentY)

      currentY += 24
    }

    // Renglón de Total Neto Final
    ctx.textAlign = 'left'
    ctx.fillStyle = '#F7F3EE'
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.fillText('TOTAL NETO A PAGAR:', padding, currentY)

    ctx.textAlign = 'right'
    ctx.fillStyle = '#C9A84C'
    ctx.font = 'bold 26px system-ui, sans-serif'
    ctx.fillText(`$${total.toFixed(0)} MXN`, width - padding, currentY)

    currentY += 38

    // 9. Pie de Comprobante
    ctx.textAlign = 'center'
    ctx.fillStyle = '#2ABFBF'
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.fillText('¡GRACIAS POR TU COMPRA EN MAREA NEGRA!', width / 2, currentY)

    ctx.fillStyle = 'rgba(212, 197, 169, 0.6)'
    ctx.font = 'italic 11px system-ui, sans-serif'
    ctx.fillText('Muestra este comprobante digital al recoger tu pedido · Sinaloa, México', width / 2, currentY + 18)

    const imageUrl = canvas.toDataURL('image/png')
    setModalImageUrl(imageUrl)
    setDownloading(false)
  }

  // Descargar o compartir la imagen al presionar explícitamente el botón "DESCARGAR PNG"
  const handleExplicitDownload = async () => {
    if (!modalImageUrl) return

    try {
      const response = await fetch(modalImageUrl)
      const blob = await response.blob()
      const file = new File([blob], `MareaNegra_Comprobante_Folio_${pedidoId}.png`, { type: 'image/png' })

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Comprobante Marea Negra #${pedidoId}`,
          text: `Ticket de Pedido #${pedidoId} - Marea Negra Mariscos`,
          files: [file],
        })
        setDownloaded(true)
        setTimeout(() => setDownloaded(false), 3000)
        return
      }
    } catch (e) {
      console.log('Uso de enlace directo:', e)
    }

    const link = document.createElement('a')
    link.download = `MareaNegra_Comprobante_Folio_${pedidoId}.png`
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
        className="w-full bg-[#111111] hover:bg-carbon border border-oro/40 text-blanco font-sans font-bold text-xs tracking-wider py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-xl transition-all group hover:border-turquesa"
      >
        <Eye className="w-5 h-5 text-oro group-hover:text-turquesa transition-colors" />
        <span>VER COMPROBANTE Y DESCARGAR COMO FOTO (PNG)</span>
      </button>

      {/* MODAL DE VISTA PREVIA Y BOTÓN EXPLÍCITO DE DESCARGA */}
      {modalImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#050404] border border-oro/40 rounded-2xl w-full max-w-md p-6 gold-border-corner shadow-2xl relative flex flex-col items-center gap-4 text-center max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalImageUrl(null)}
              className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-widest flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>VISTA PREVIA DEL COMPROBANTE</span>
              </span>
              <h3 className="font-display text-3xl text-blanco">
                TICKET FOLIO #{pedidoId}
              </h3>
              <p className="font-serif italic text-xs text-arena/80">
                Verifica la comanda y presiona <strong>"DESCARGAR PNG"</strong> para guardarla en tu dispositivo.
              </p>
            </div>

            <div className="rounded-xl overflow-hidden border border-oro/30 shadow-2xl max-w-full">
              <img
                src={modalImageUrl}
                alt={`Ticket Folio ${pedidoId}`}
                className="w-full h-auto object-contain max-h-[55vh]"
              />
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={handleExplicitDownload}
                className="flex-1 bg-turquesa text-negro font-sans font-bold text-xs py-3.5 px-4 rounded-xl hover:bg-blanco transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {downloaded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡GUARDADO!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>DESCARGAR PNG</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setModalImageUrl(null)}
                className="px-5 py-3.5 bg-carbon border border-arena/20 text-blanco font-sans font-bold text-xs rounded-xl hover:bg-arena/10"
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
