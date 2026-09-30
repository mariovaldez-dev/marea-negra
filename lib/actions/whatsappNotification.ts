'use server'

import { createServerClient } from '@/lib/supabase/server'
import { sendWhatsAppOrderReadyNotification, WhatsAppNotificationResult } from '@/lib/notifications/whatsapp'
import { registrarEnvioNotificacion } from '@/lib/actions/notificationMetrics'

export async function notificarPedidoListoCliente(pedidoId: number): Promise<WhatsAppNotificationResult> {
  try {
    const supabase = await createServerClient()
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select('id, cliente_nombre, cliente_telefono, tipo_entrega, total')
      .eq('id', pedidoId)
      .single()

    if (error || !pedido) {
      return {
        success: false,
        sentViaApi: false,
        message: '',
        error: 'No se encontró el pedido para enviar la notificación.',
      }
    }

    const result = await sendWhatsAppOrderReadyNotification(pedido)

    if (result.success) {
      registrarEnvioNotificacion({
        canal: 'whatsapp_pedido',
        destinatario: pedido.cliente_telefono,
        pedidoId: pedido.id,
        metodo: result.sentViaApi ? 'api' : 'wa_link',
      }).catch((e) => console.warn('Error metrics:', e))
    }

    return result
  } catch (err: any) {
    console.error('Error en notificarPedidoListoCliente:', err)
    return {
      success: false,
      sentViaApi: false,
      message: '',
      error: err.message || 'Error al procesar la notificación de WhatsApp.',
    }
  }
}
