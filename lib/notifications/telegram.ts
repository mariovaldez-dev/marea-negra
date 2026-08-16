export async function sendTelegramOrderNotification(pedido: {
  id: number
  cliente_nombre: string
  cliente_telefono?: string | null
  metodo_pago?: string | null
  tipo_entrega?: string | null
  hora_recogida?: string | null
  total: number
  notas?: string | null
  items: {
    nombre_platillo: string
    cantidad: number
    precio_unitario: number
    nivel_picor?: string | null
    notas_item?: string | null
  }[]
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn(
      'Telegram Notification Skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in .env.local'
    )
    return
  }

  const picorEmojis: Record<string, string> = {
    suave: '🟢 Suave',
    medio: '🟡 Medio Sinaloa',
    bravo: '🔴 Bravo (Chiltepín)',
    sin_chile: '⚪ Sin Chile',
  }

  let itemsText = ''
  pedido.items.forEach((item) => {
    const picorStr = item.nivel_picor ? picorEmojis[item.nivel_picor] || item.nivel_picor : '🟡 Medio'
    itemsText += `• *${item.nombre_platillo}* x${item.cantidad} ($${(item.precio_unitario * item.cantidad).toFixed(0)})\n  └ Picor: ${picorStr}${item.notas_item ? `\n  └ Nota: "${item.notas_item}"` : ''}\n`
  })

  const text = `🚨 *¡NUEVO PEDIDO RECIBIDO! #${pedido.id}*
  
👤 *Cliente:* ${pedido.cliente_nombre}
📞 *Teléfono:* ${pedido.cliente_telefono || 'No especificado'}
🚚 *Tipo de Entrega:* ${pedido.tipo_entrega === 'didi' ? 'Mandar por DiDi/Uber' : 'Recoger en Local'}
⏰ *Hora:* ${pedido.hora_recogida ? `${pedido.hora_recogida.slice(0, 5)} hrs` : 'Lo antes posible'}
💳 *Método de Pago:* ${pedido.metodo_pago ? pedido.metodo_pago.toUpperCase() : 'Efectivo'}

📋 *DETALLE DE COMANDA:*
${itemsText}
💰 *TOTAL A COBRAR:* $${pedido.total.toFixed(0)} MXN
${pedido.notas ? `\n📝 *Notas Generales:* ${pedido.notas}` : ''}
`

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    })

    if (!response.ok) {
      const errData = await response.json()
      console.error('Error enviando notificación a Telegram:', errData)
    }
  } catch (error) {
    console.error('Excepción al enviar notificación de Telegram:', error)
  }
}
