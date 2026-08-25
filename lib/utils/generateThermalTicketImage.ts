// lib/utils/generateThermalTicketImage.ts
// Generador de E-Receipt / Ticket Digital Luxury (80mm) con espacio aireado y estética Marea Negra

export interface ThermalTicketItem {
  nombre: string
  cantidad: number
  precioUnitario: number
  detalle?: string | null
}

export interface ThermalTicketData {
  folio: string | number
  clienteNombre: string
  clienteTelefono?: string | null
  tipoEntrega?: string | null
  fechaHora?: string | null
  metodoPago?: string | null
  items: ThermalTicketItem[]
  subtotal: number
  descuento?: number
  cuponCodigo?: string | null
  total: number
  notas?: string | null
  mesa?: string | null
}

export function generateThermalTicketCanvas(data: ThermalTicketData): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const scale = 2 // Renderizado Retina Ultra-HD
  const width = 450 // Ancho óptimo con excelente respiración visual
  const padding = 28
  let y = 36

  // 1. Calcular altura dinámica con espaciado generoso
  let itemsHeight = 0
  data.items.forEach((item) => {
    itemsHeight += 44 // Fila del platillo espaciada
    if (item.detalle) itemsHeight += 22 // Notas/picor
    itemsHeight += 10 // Margen entre items
  })

  const itemsMinHeight = Math.max(itemsHeight, data.items.length === 0 ? 60 : 0)
  const notasHeight = data.notas ? 75 : 0
  const descuentoHeight = data.descuento && data.descuento > 0 ? 32 : 0
  const totalHeight = 440 + itemsMinHeight + notasHeight + descuentoHeight + 150

  canvas.width = width * scale
  canvas.height = totalHeight * scale
  ctx.scale(scale, scale)

  // 2. Fondo Negro Abisal Luxury con esquinas redondeadas suaves
  ctx.fillStyle = '#090605'
  roundRect(ctx, 0, 0, width, totalHeight, 24)
  ctx.fill()

  // Marco exterior elegante en Oro suave
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.3)'
  ctx.lineWidth = 1.5
  roundRect(ctx, 6, 6, width - 12, totalHeight - 12, 20)
  ctx.stroke()

  // Sello decorativo en esquinas
  dibujarEsquinasOro(ctx, width, totalHeight)

  // 3. Encabezado del Restaurante
  ctx.textAlign = 'center'

  // Badge Superior
  ctx.fillStyle = 'rgba(42, 191, 191, 0.12)'
  roundRect(ctx, width / 2 - 95, y, 190, 24, 12)
  ctx.fill()
  ctx.strokeStyle = 'rgba(42, 191, 191, 0.35)'
  ctx.lineWidth = 1
  roundRect(ctx, width / 2 - 95, y, 190, 24, 12)
  ctx.stroke()

  ctx.fillStyle = '#2ABFBF'
  ctx.font = 'bold 10px system-ui, -apple-system, sans-serif'
  ctx.fillText('🌊 COMPROBANTE OFICIAL', width / 2, y + 16)
  y += 42

  // Título Marea Negra
  ctx.fillStyle = '#F7F3EE'
  ctx.font = 'bold 28px "Impact", system-ui, sans-serif'
  ctx.fillText('MAREA NEGRA', width / 2, y + 6)
  y += 36

  ctx.fillStyle = '#E8430A' // Coral
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.fillText('AGUACHILES & MARISCOS', width / 2, y)
  y += 22

  ctx.fillStyle = '#D4C5A9' // Arena
  ctx.font = 'italic 12px Georgia, serif'
  ctx.fillText('Culiacán, Sinaloa · Sabor Auténtico', width / 2, y)
  y += 28

  // Línea dorada degradada
  dibujarReglaGradiente(ctx, width, padding, y)
  y += 24

  // 4. Tarjeta de Datos del Pedido (Folio, Cliente, Fecha)
  const cardY = y
  const cardHeight = 84
  ctx.fillStyle = '#140F0D'
  roundRect(ctx, padding, cardY, width - padding * 2, cardHeight, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(212, 197, 169, 0.15)'
  ctx.lineWidth = 1
  roundRect(ctx, padding, cardY, width - padding * 2, cardHeight, 14)
  ctx.stroke()

  // Fila 1: Folio y Fecha
  ctx.textAlign = 'left'
  ctx.fillStyle = '#C9A84C' // Oro
  ctx.font = 'bold 16px system-ui, sans-serif'
  ctx.fillText(`FOLIO #${data.folio}`, padding + 16, cardY + 28)

  const fechaTexto =
    data.fechaHora ||
    new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  ctx.textAlign = 'right'
  ctx.fillStyle = '#D4C5A9'
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText(fechaTexto, width - padding - 16, cardY + 28)

  // Fila 2: Cliente
  ctx.textAlign = 'left'
  ctx.fillStyle = '#F7F3EE'
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.fillText(`Cliente: ${data.clienteNombre.slice(0, 26)}`, padding + 16, cardY + 52)

  // Fila 3: Modalidad
  let modalidadTxt = 'Para Recoger en Local'
  if (data.mesa) modalidadTxt = `🍽️ ${data.mesa}`
  else if (data.tipoEntrega === 'didi') modalidadTxt = '🛵 Envío por DiDi'

  ctx.fillStyle = '#2ABFBF'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText(modalidadTxt, padding + 16, cardY + 72)

  y += cardHeight + 28

  // 5. Encabezado de la Tabla de Platillos
  ctx.fillStyle = '#1C1512'
  roundRect(ctx, padding, y, width - padding * 2, 28, 8)
  ctx.fill()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#D4C5A9'
  ctx.font = 'bold 10px system-ui, sans-serif'
  ctx.fillText('CANT', padding + 12, y + 18)
  ctx.fillText('PLATILLO', padding + 60, y + 18)

  ctx.textAlign = 'right'
  ctx.fillText('IMPORTE', width - padding - 14, y + 18)
  y += 42

  // 6. Lista de Platillos
  if (data.items.length === 0) {
    ctx.textAlign = 'center'
    ctx.fillStyle = '#D4C5A9'
    ctx.font = 'italic 12px Georgia, serif'
    ctx.fillText('Orden de consumo general', width / 2, y + 15)
    y += 40
  } else {
    data.items.forEach((item) => {
      // Badge de Cantidad
      ctx.fillStyle = 'rgba(42, 191, 191, 0.15)'
      roundRect(ctx, padding + 8, y - 13, 34, 22, 7)
      ctx.fill()

      ctx.textAlign = 'center'
      ctx.fillStyle = '#2ABFBF'
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.fillText(`${item.cantidad}x`, padding + 25, y + 3)

      // Nombre del Platillo
      ctx.textAlign = 'left'
      ctx.fillStyle = '#F7F3EE'
      ctx.font = 'bold 13px system-ui, sans-serif'
      const nombreTruncado = item.nombre.length > 24 ? `${item.nombre.slice(0, 23)}...` : item.nombre
      ctx.fillText(nombreTruncado, padding + 56, y + 3)

      // Importe alineado a la derecha
      ctx.textAlign = 'right'
      ctx.fillStyle = '#E8430A' // Coral
      ctx.font = 'bold 14px system-ui, sans-serif'
      const importe = (item.cantidad * item.precioUnitario).toFixed(2)
      ctx.fillText(`$${importe}`, width - padding - 14, y + 3)
      y += 22

      // Detalle / Picor si existe
      if (item.detalle) {
        ctx.textAlign = 'left'
        ctx.fillStyle = '#D4C5A9'
        ctx.font = 'italic 11px Georgia, serif'
        ctx.fillText(`↳ ${item.detalle.slice(0, 40)}`, padding + 56, y)
        y += 18
      }

      y += 10
    })
  }

  y += 14
  dibujarReglaGradiente(ctx, width, padding, y)
  y += 26

  // 7. Totales y Descuentos
  ctx.textAlign = 'left'
  ctx.fillStyle = '#D4C5A9'
  ctx.font = '13px system-ui, sans-serif'
  ctx.fillText('Subtotal:', padding + 20, y)
  ctx.textAlign = 'right'
  ctx.fillText(`$${data.subtotal.toFixed(2)} MXN`, width - padding - 14, y)
  y += 24

  if (data.descuento && data.descuento > 0) {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#2ABFBF'
    ctx.font = 'bold 12px system-ui, sans-serif'
    ctx.fillText(`Descuento ${data.cuponCodigo ? `(${data.cuponCodigo})` : 'VIP'}:`, padding + 20, y)
    ctx.textAlign = 'right'
    ctx.fillText(`-$${data.descuento.toFixed(2)} MXN`, width - padding - 14, y)
    y += 26
  }

  // Caja de TOTAL NETO
  const totalBoxY = y + 4
  const totalBoxHeight = 54
  ctx.fillStyle = 'rgba(201, 168, 76, 0.12)'
  roundRect(ctx, padding, totalBoxY, width - padding * 2, totalBoxHeight, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.55)'
  ctx.lineWidth = 1.5
  roundRect(ctx, padding, totalBoxY, width - padding * 2, totalBoxHeight, 14)
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#F7F3EE'
  ctx.font = 'bold 14px system-ui, sans-serif'
  ctx.fillText('TOTAL PAGADO:', padding + 18, totalBoxY + 34)

  ctx.textAlign = 'right'
  ctx.fillStyle = '#C9A84C' // Oro brillante
  ctx.font = 'bold 22px system-ui, sans-serif'
  ctx.fillText(`$${data.total.toFixed(2)} MXN`, width - padding - 18, totalBoxY + 35)

  y += totalBoxHeight + 28

  // Badge de Método de Pago
  const pagoTexto = (data.metodoPago || 'EFECTIVO').toUpperCase()
  ctx.fillStyle = 'rgba(16, 185, 129, 0.12)'
  roundRect(ctx, width / 2 - 105, y, 210, 26, 13)
  ctx.fill()
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)'
  ctx.lineWidth = 1
  roundRect(ctx, width / 2 - 105, y, 210, 26, 13)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#34D399'
  ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.fillText(`PAGADO CON: ${pagoTexto} ✓`, width / 2, y + 18)
  y += 44

  // 8. Notas generales si existen
  if (data.notas) {
    ctx.fillStyle = 'rgba(232, 67, 10, 0.08)'
    roundRect(ctx, padding, y, width - padding * 2, 48, 12)
    ctx.fill()
    ctx.strokeStyle = 'rgba(232, 67, 10, 0.25)'
    ctx.lineWidth = 1
    roundRect(ctx, padding, y, width - padding * 2, 48, 12)
    ctx.stroke()

    ctx.textAlign = 'left'
    ctx.fillStyle = '#E8430A'
    ctx.font = 'bold 11px system-ui, sans-serif'
    ctx.fillText('📝 NOTA DE COCINA:', padding + 14, y + 18)

    ctx.fillStyle = '#D4C5A9'
    ctx.font = 'italic 11px Georgia, serif'
    ctx.fillText(`"${data.notas.slice(0, 48)}"`, padding + 14, y + 36)
    y += 62
  }

  // 9. Pie de Ticket con Agradecimiento y Google Maps
  dibujarReglaGradiente(ctx, width, padding, y)
  y += 26

  ctx.textAlign = 'center'
  ctx.fillStyle = '#F7F3EE'
  ctx.font = 'bold 14px system-ui, sans-serif'
  ctx.fillText('¡MUCHAS GRACIAS POR SU COMPRA! 🦐', width / 2, y)
  y += 22

  ctx.fillStyle = '#C9A84C'
  ctx.font = '14px system-ui, sans-serif'
  ctx.fillText('⭐⭐⭐⭐⭐', width / 2, y)
  y += 20

  ctx.fillStyle = '#2ABFBF'
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText('Califícanos en Google Maps', width / 2, y)
  y += 18

  ctx.fillStyle = '#D4C5A9'
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText('https://marea-negra-aguachiles.vercel.app', width / 2, y)

  return canvas
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2
  if (h < 2 * r) r = h / 2
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function dibujarReglaGradiente(
  ctx: CanvasRenderingContext2D,
  width: number,
  padding: number,
  y: number
) {
  const gradient = ctx.createLinearGradient(padding, y, width - padding, y)
  gradient.addColorStop(0, 'rgba(201, 168, 76, 0)')
  gradient.addColorStop(0.5, 'rgba(201, 168, 76, 0.6)')
  gradient.addColorStop(1, 'rgba(201, 168, 76, 0)')
  ctx.strokeStyle = gradient
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding, y)
  ctx.lineTo(width - padding, y)
  ctx.stroke()
}

function dibujarEsquinasOro(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = '#C9A84C'
  ctx.lineWidth = 2
  const len = 14

  // Top Left
  ctx.beginPath()
  ctx.moveTo(12, 12 + len)
  ctx.lineTo(12, 12)
  ctx.lineTo(12 + len, 12)
  ctx.stroke()

  // Top Right
  ctx.beginPath()
  ctx.moveTo(width - 12 - len, 12)
  ctx.lineTo(width - 12, 12)
  ctx.lineTo(width - 12, 12 + len)
  ctx.stroke()

  // Bottom Left
  ctx.beginPath()
  ctx.moveTo(12, height - 12 - len)
  ctx.lineTo(12, height - 12)
  ctx.lineTo(12 + len, height - 12)
  ctx.stroke()

  // Bottom Right
  ctx.beginPath()
  ctx.moveTo(width - 12 - len, height - 12)
  ctx.lineTo(width - 12, height - 12)
  ctx.lineTo(width - 12, height - 12 - len)
  ctx.stroke()
}

export async function getThermalTicketBlob(data: ThermalTicketData): Promise<Blob | null> {
  const canvas = generateThermalTicketCanvas(data)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95)
  })
}
