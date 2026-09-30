import { Pedido } from '@/lib/types/database'

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

export function generateTicketHtml(pedido: Pedido, tipo: 'comanda_cocina' | 'cuenta_cliente' = 'cuenta_cliente'): string {
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

  const itemsRows = items.map((item) => {
    const { exclusions, customNote: itemNote } = parseItemTicketNotes(item.notas_item)
    const itemTotal = ((item.precio_unitario || 0) * (item.cantidad || 1)).toFixed(0)

    let modifiersHtml = ''
    if (item.nivel_picor) {
      modifiersHtml += `<div style="color: #444; font-size: 11px;">• Picor: <strong>${item.nivel_picor}</strong></div>`
    }
    exclusions.forEach((excl) => {
      modifiersHtml += `<div style="color: #000; font-weight: 700; font-size: 11px;">• ✕ SIN: ${excl.toUpperCase()}</div>`
    })
    if (itemNote) {
      modifiersHtml += `<div style="color: #555; font-style: italic; font-size: 11px;">• Nota: ${itemNote}</div>`
    }

    return `
      <tr style="border-bottom: 1px dashed #d0d0d0;">
        <td style="padding: 6px 4px; vertical-align: top; width: 32px; font-weight: 700; font-size: 12px;">
          ${item.cantidad}x
        </td>
        <td style="padding: 6px 4px; vertical-align: top;">
          <div style="font-weight: 700; font-size: 12.5px; color: #000;">${item.nombre_platillo}</div>
          ${modifiersHtml ? `<div style="margin-top: 2px; padding-left: 4px;">${modifiersHtml}</div>` : ''}
        </td>
        <td style="padding: 6px 4px; vertical-align: top; text-align: right; font-weight: 700; font-size: 12px; width: 65px;">
          $${itemTotal}
        </td>
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Ticket #${pedido.id} - Marea Negra</title>
        <style>
          @page {
            size: auto;
            margin: 10mm;
          }
          @media print {
            body {
              background: #ffffff !important;
              padding: 0 !important;
            }
            .ticket-card {
              border: 1px solid #000 !important;
              box-shadow: none !important;
              margin: 0 auto !important;
              page-break-inside: avoid;
            }
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #f5f5f5;
            color: #111111;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
          .ticket-card {
            background: #ffffff;
            width: 100%;
            max-width: 360px;
            border-radius: 12px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 4px 14px rgba(0,0,0,0.08);
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
          }
          .header-brand {
            text-align: center;
            border-bottom: 2px solid #111;
            padding-bottom: 12px;
            margin-bottom: 12px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 900;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #000;
          }
          .brand-tag {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1.5px;
            color: #E8430A;
            text-transform: uppercase;
            margin-top: 2px;
          }
          .brand-loc {
            font-size: 9.5px;
            color: #666;
            margin-top: 2px;
          }
          .badge-service {
            background: #111;
            color: #fff;
            font-weight: 800;
            font-size: 11.5px;
            padding: 6px 10px;
            border-radius: 6px;
            text-align: center;
            margin-top: 8px;
            letter-spacing: 0.5px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
            margin-bottom: 12px;
            border-bottom: 1px dashed #bbb;
            padding-bottom: 8px;
          }
          .meta-table td {
            padding: 2px 0;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          .items-table th {
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 800;
            border-bottom: 1.5px solid #111;
            padding-bottom: 4px;
            color: #333;
          }
          .notes-box {
            background: #fafafa;
            border: 1px solid #111;
            border-radius: 6px;
            padding: 8px 10px;
            margin-bottom: 12px;
            font-size: 11px;
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
            border-top: 1.5px solid #111;
            padding-top: 8px;
            margin-bottom: 12px;
          }
          .totals-table td {
            padding: 3px 0;
          }
          .total-row {
            font-size: 16px;
            font-weight: 900;
            color: #000;
            border-top: 1px solid #e0e0e0;
            padding-top: 6px !important;
          }
          .propina-box {
            background: #f9f9f9;
            border: 1px dashed #999;
            border-radius: 6px;
            padding: 8px;
            margin-bottom: 12px;
            font-size: 10.5px;
          }
          .footer-text {
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px dashed #ccc;
            padding-top: 10px;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="ticket-card">
          <!-- CABECERA -->
          <div class="header-brand">
            <div class="brand-title">MAREA NEGRA</div>
            <div class="brand-tag">AGUACHILES</div>
            <div class="badge-service">${servicioLabel}</div>
          </div>

          <!-- METADATOS -->
          <table class="meta-table">
            <tr>
              <td><strong>FOLIO:</strong></td>
              <td style="text-align: right; font-weight: 800; font-size: 13px;">#${pedido.id}</td>
            </tr>
            <tr>
              <td style="color: #555;">Fecha:</td>
              <td style="text-align: right; color: #333;">${fechaFormateada}</td>
            </tr>
            <tr>
              <td style="color: #555;">Cliente:</td>
              <td style="text-align: right; font-weight: 700;">${pedido.cliente_nombre.toUpperCase()}</td>
            </tr>
            ${pedido.cliente_telefono ? `
              <tr>
                <td style="color: #555;">Teléfono:</td>
                <td style="text-align: right; font-family: monospace;">${pedido.cliente_telefono}</td>
              </tr>
            ` : ''}
            ${pedido.hora_recogida ? `
              <tr>
                <td style="color: #555;">Hora Recogida:</td>
                <td style="text-align: right; font-weight: 700;">${pedido.hora_recogida.slice(0, 5)} HRS</td>
              </tr>
            ` : ''}
          </table>

          <!-- DETALLE DE PLATILLOS -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left; width: 32px;">Cant</th>
                <th style="text-align: left;">Descripción</th>
                <th style="text-align: right; width: 65px;">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- NOTAS / INSTRUCCIONES -->
          ${customerNote ? `
            <div class="notes-box">
              <strong style="display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
                📝 INSTRUCCIONES DEL CLIENTE:
              </strong>
              <span>${customerNote}</span>
            </div>
          ` : ''}

          <!-- CUPÓN -->
          ${coupon ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; border-bottom: 1px dashed #ccc; margin-bottom: 8px;">
              <span style="color: #555;">🎟️ Cupón de Descuento:</span>
              <span style="font-weight: 800; font-family: monospace;">${coupon}</span>
            </div>
          ` : ''}

          <!-- TOTALES -->
          <table class="totals-table">
            <tr>
              <td style="color: #555;">Subtotal:</td>
              <td style="text-align: right; font-weight: 700;">$${subtotal.toFixed(0)} MXN</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL:</td>
              <td style="text-align: right; font-size: 17px; font-weight: 900; color: #E8430A;">$${subtotal.toFixed(0)} MXN</td>
            </tr>
            <tr>
              <td style="color: #777; font-size: 10.5px; padding-top: 4px;">Método de Pago:</td>
              <td style="text-align: right; font-weight: 700; text-transform: uppercase; font-size: 10.5px; padding-top: 4px;">
                ${pedido.metodo_pago || 'Efectivo'}
              </td>
            </tr>
          </table>

          <!-- PROPINA SUGERIDA -->
          ${tipo === 'cuenta_cliente' ? `
            <div class="propina-box">
              <div style="font-weight: 800; text-align: center; text-transform: uppercase; font-size: 9.5px; margin-bottom: 4px; color: #444;">
                Propina Sugerida (Opcional)
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>10% ($+${propina10}):</span>
                <strong>$${(subtotal + Number(propina10)).toFixed(0)} MXN</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>15% ($+${propina15}):</span>
                <strong>$${(subtotal + Number(propina15)).toFixed(0)} MXN</strong>
              </div>
            </div>
          ` : ''}

          <!-- PIE DE TICKET -->
          <div class="footer-text">
            <div style="font-weight: 700; color: #000; margin-bottom: 2px;">¡Muchas gracias por tu compra! 🦐</div>
            <div>Mariscos frescos preparados al momento en Sinaloa</div>
            <div style="font-size: 8.5px; color: #999; margin-top: 6px;">*** MAREA NEGRA POS ***</div>
          </div>
        </div>
      </body>
    </html>
  `
}

export function printOrderTicket(pedido: Pedido, tipo: 'comanda_cocina' | 'cuenta_cliente' = 'cuenta_cliente') {
  const fullHtml = generateTicketHtml(pedido, tipo)

  // Crear iframe oculto e inyectar el HTML completamente estructurado
  const iframe = document.createElement('iframe')
  iframe.setAttribute(
    'style',
    'position: fixed; right: 0; bottom: 0; width: 0; height: 0; border: 0; opacity: 0; pointer-events: none;'
  )
  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentWindow?.document
  if (!iframeDoc) {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(fullHtml)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
    return
  }

  iframeDoc.open()
  iframeDoc.write(fullHtml)
  iframeDoc.close()

  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      try {
        document.body.removeChild(iframe)
      } catch { }
    }, 2000)
  }, 300)
}

export interface CierrePrintData {
  fecha: string
  fondoInicial: number
  ventasEfectivo: number
  ventasTransferencia: number
  ventasOxxo: number
  totalSistema: number
  totalGastos: number
  gastosList?: Array<{ concepto: string; monto: number; metodo_pago?: string; categoria?: string }>
  efectivoFisico: number
  transferenciaFisico: number
  oxxoFisico: number
  totalReal: number
  diferencia: number
  notas?: string
}

export function generateCierreHtml(data: CierrePrintData): string {
  const horaActual = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const difSign = data.diferencia >= 0 ? '+' : ''
  const difLabel = data.diferencia === 0 ? 'CORTE CUADRADO' : data.diferencia > 0 ? 'SOBRANTE' : 'FALTANTE'

  const gastosRows = (data.gastosList || []).map((g) => `
    <tr style="border-bottom: 1px dashed #e0e0e0;">
      <td style="padding: 4px 0; font-size: 11px; color: #222;">${g.concepto} (${g.metodo_pago || 'efectivo'})</td>
      <td style="padding: 4px 0; font-size: 11px; text-align: right; color: #c00; font-weight: 700;">-$${Number(g.monto).toFixed(2)}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Corte Z - ${data.fecha} - Marea Negra</title>
        <style>
          @page {
            size: auto;
            margin: 8mm;
          }
          @media print {
            body { background: #ffffff !important; margin: 0; padding: 0; }
            .ticket-card { box-shadow: none !important; border: none !important; width: 100% !important; }
          }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body {
            background-color: #f2f2f2;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 12px;
            display: flex;
            justify-content: center;
          }
          .ticket-card {
            width: 78mm;
            max-width: 100%;
            background: #ffffff;
            color: #111111;
            padding: 14px;
            font-size: 11.5px;
            line-height: 1.35;
          }
          .header-brand { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
          .brand-title { font-size: 18px; font-weight: 900; letter-spacing: 1px; color: #000; }
          .brand-tag { font-size: 10px; font-weight: 700; color: #555; letter-spacing: 0.5px; margin-top: 1px; }
          .corte-badge {
            display: inline-block;
            background: #000;
            color: #fff;
            font-weight: 800;
            font-size: 11px;
            padding: 3px 10px;
            border-radius: 4px;
            margin-top: 6px;
            letter-spacing: 0.5px;
          }
          .meta-table { width: 100%; font-size: 11px; margin-bottom: 10px; border-bottom: 1px solid #111; padding-bottom: 6px; }
          .meta-table td { padding: 2px 0; }
          .section-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1.5px solid #111;
            padding-bottom: 3px;
            margin-top: 8px;
            margin-bottom: 6px;
          }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          .data-table td { padding: 3px 0; font-size: 11.5px; }
          .total-box {
            background: #f8f8f8;
            border: 1.5px solid #111;
            border-radius: 6px;
            padding: 8px;
            margin: 10px 0;
          }
          .footer-text {
            text-align: center;
            font-size: 9.5px;
            color: #666;
            border-top: 1px dashed #ccc;
            padding-top: 8px;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="ticket-card">
          <div class="header-brand">
            <div class="brand-title">MAREA NEGRA</div>
            <div class="brand-tag">AGUACHILES · SINALOA</div>
            <div class="corte-badge">CORTE Z · CIERRE DE CAJA</div>
          </div>

          <table class="meta-table">
            <tr>
              <td><strong>FECHA:</strong> ${data.fecha}</td>
              <td style="text-align: right;"><strong>HORA:</strong> ${horaActual}</td>
            </tr>
          </table>

          <div class="section-title">1. VENTAS REGISTRADAS (SISTEMA)</div>
          <table class="data-table">
            <tr><td>Ventas Efectivo:</td><td style="text-align: right; font-weight: 600;">$${data.ventasEfectivo.toFixed(2)}</td></tr>
            <tr><td>Transferencias:</td><td style="text-align: right; font-weight: 600;">$${data.ventasTransferencia.toFixed(2)}</td></tr>
            <tr><td>OXXO / Tarjetas:</td><td style="text-align: right; font-weight: 600;">$${data.ventasOxxo.toFixed(2)}</td></tr>
            <tr style="border-top: 1px solid #111; font-weight: 800;">
              <td style="padding-top: 4px;">TOTAL VENTAS:</td>
              <td style="text-align: right; padding-top: 4px;">$${data.totalSistema.toFixed(2)}</td>
            </tr>
          </table>

          <div class="section-title">2. FONDO & CAJA CHICA</div>
          <table class="data-table">
            <tr><td>(+) Fondo Inicial Apertura:</td><td style="text-align: right; font-weight: 600;">$${data.fondoInicial.toFixed(2)}</td></tr>
            <tr><td>(-) Gastos del Turno:</td><td style="text-align: right; font-weight: 600; color: #c00;">-$${data.totalGastos.toFixed(2)}</td></tr>
          </table>
          ${gastosRows ? `<table class="data-table" style="margin-top: 2px;">${gastosRows}</table>` : ''}

          <div class="section-title">3. ARQUEO FÍSICO CONTADO</div>
          <table class="data-table">
            <tr><td>Efectivo en Caja:</td><td style="text-align: right; font-weight: 600;">$${data.efectivoFisico.toFixed(2)}</td></tr>
            <tr><td>Transferencias Bancarias:</td><td style="text-align: right; font-weight: 600;">$${data.transferenciaFisico.toFixed(2)}</td></tr>
            <tr><td>Depósitos OXXO / Tarjetas:</td><td style="text-align: right; font-weight: 600;">$${data.oxxoFisico.toFixed(2)}</td></tr>
            <tr style="border-top: 1.5px solid #000; font-weight: 900; font-size: 13px;">
              <td style="padding-top: 5px;">TOTAL FÍSICO:</td>
              <td style="text-align: right; padding-top: 5px;">$${data.totalReal.toFixed(2)}</td>
            </tr>
          </table>

          <div class="total-box">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 800;">
              <span>DIFERENCIA / BALANCE:</span>
              <span style="color: ${data.diferencia >= 0 ? '#008000' : '#c00'};">${difSign}$${data.diferencia.toFixed(2)}</span>
            </div>
            <div style="font-size: 10px; color: #555; text-align: right; margin-top: 2px;">
              ESTADO: <strong>${difLabel}</strong>
            </div>
          </div>

          ${data.notas ? `
            <div style="background: #fafafa; border: 1px dashed #999; border-radius: 4px; padding: 6px 8px; font-size: 10.5px; margin-bottom: 8px;">
              <strong>NOTAS:</strong> ${data.notas}
            </div>
          ` : ''}

          <div class="footer-text">
            <div style="font-weight: 700; color: #000;">*** CORTE DE CAJA CONCILIADO ***</div>
            <div>Marea Negra · Sistema de Punto de Venta</div>
          </div>
        </div>
      </body>
    </html>
  `
}

export function printCierreTicket(data: CierrePrintData) {
  const fullHtml = generateCierreHtml(data)

  const iframe = document.createElement('iframe')
  iframe.setAttribute(
    'style',
    'position: fixed; right: 0; bottom: 0; width: 0; height: 0; border: 0; opacity: 0; pointer-events: none;'
  )
  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentWindow?.document
  if (!iframeDoc) {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(fullHtml)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
    return
  }

  iframeDoc.open()
  iframeDoc.write(fullHtml)
  iframeDoc.close()

  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      try {
        document.body.removeChild(iframe)
      } catch { }
    }, 2000)
  }, 300)
}

