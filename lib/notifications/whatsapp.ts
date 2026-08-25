// lib/notifications/whatsapp.ts
// Servicio de notificaciones automáticas de WhatsApp para clientes

export interface WhatsAppNotificationResult {
  success: boolean
  sentViaApi: boolean
  waUrl?: string
  message: string
  error?: string
}

export async function sendWhatsAppOrderReadyNotification(pedido: {
  id: number
  cliente_nombre: string
  cliente_telefono?: string | null
  tipo_entrega?: string | null
  total: number
}): Promise<WhatsAppNotificationResult> {
  const rawPhone = pedido.cliente_telefono || ''
  const cleanPhone = rawPhone.replace(/\D/g, '')

  if (!cleanPhone || cleanPhone.length < 10) {
    return {
      success: false,
      sentViaApi: false,
      message: '',
      error: 'El pedido no tiene un número de teléfono válido para WhatsApp.',
    }
  }

  const targetPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://marea-negra.com'
  const trackingUrl = `${baseUrl}/pedido/${pedido.id}`

  const messageText = `🌊 *¡TU PEDIDO DE MAREA NEGRA ESTÁ LISTO!* 🦐🔥

Hola *${pedido.cliente_nombre}*, tu orden ya salió de cocina y está fresca y lista:

🧾 *Folio de Pedido:* #${pedido.id}
💰 *Total:* $${pedido.total.toFixed(0)} MXN
${pedido.tipo_entrega === 'didi' ? '🚗 *Entrega:* Listo para entrega / chofer DiDi-Uber' : '📍 *Entrega:* Pasa a mostrador a recoger'}

👇 *Consulta tu comanda y estatus en vivo aquí:*
${trackingUrl}

¡Buen provecho y gracias por tu preferencia en *Marea Negra - Aguachiles*! 🌶️`

  // 1. Intentar envío 100% automático en background si hay Meta WhatsApp Cloud API configurada
  const apiToken = process.env.WHATSAPP_API_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID

  if (apiToken && phoneId) {
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: targetPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: messageText,
          },
        }),
      })

      if (response.ok) {
        return {
          success: true,
          sentViaApi: true,
          message: messageText,
        }
      } else {
        const errorData = await response.json()
        console.warn('WhatsApp Cloud API error:', errorData)
      }
    } catch (apiErr) {
      console.warn('Error conectando con WhatsApp Cloud API:', apiErr)
    }
  }

  // 2. Fallback con URL directa de WhatsApp
  const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(messageText)}`

  return {
    success: true,
    sentViaApi: false,
    waUrl,
    message: messageText,
  }
}
