'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'

export interface MetricasMensajeria {
  totalMesWhatsApp: number
  totalMesSms: number
  totalMesCampanas: number
  totalHistoricoWhatsApp: number
  totalHistoricoSms: number
  limiteGratisWhatsApp: number
  limiteGratisSms: number
  porcentajeWhatsApp: number
  porcentajeSms: number
  ultimosEnvios: Array<{
    id: number
    canal: string
    destinatario: string | null
    metodo: string | null
    pedido_id: number | null
    created_at: string
  }>
}

export async function registrarEnvioNotificacion(params: {
  canal: 'whatsapp_pedido' | 'whatsapp_campana' | 'sms_otp' | 'otro'
  destinatario?: string | null
  pedidoId?: number | null
  metodo?: string | null
}) {
  try {
    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase.from('registro_notificaciones').insert({
      canal: params.canal,
      destinatario: params.destinatario || null,
      pedido_id: params.pedidoId || null,
      metodo: params.metodo || 'api',
    })

    if (error) {
      console.warn('Error registrando métrica de notificación:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.warn('Error inesperado registrando notificación:', err)
    return { success: false, error: err.message }
  }
}

export async function getMetricasMensajeria(): Promise<MetricasMensajeria> {
  const supabase = await createServerClient()

  // Calcular inicio del mes actual (Mazatlán / México)
  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  try {
    // 1. Consultar envíos del mes actual
    const { data: enviosMes, error: errMes } = await supabase
      .from('registro_notificaciones')
      .select('id, canal, destinatario, metodo, pedido_id, created_at')
      .gte('created_at', inicioMes)
      .order('created_at', { ascending: false })

    // 2. Consultar conteos históricos
    const { data: todosEnvios } = await supabase
      .from('registro_notificaciones')
      .select('canal')

    const itemsMes = enviosMes || []
    const itemsHistorico = todosEnvios || []

    const totalMesWhatsApp = itemsMes.filter((i) => i.canal === 'whatsapp_pedido').length
    const totalMesCampanas = itemsMes.filter((i) => i.canal === 'whatsapp_campana').length
    const totalMesSms = itemsMes.filter((i) => i.canal === 'sms_otp').length

    const totalHistoricoWhatsApp = itemsHistorico.filter((i) =>
      ['whatsapp_pedido', 'whatsapp_campana'].includes(i.canal)
    ).length
    const totalHistoricoSms = itemsHistorico.filter((i) => i.canal === 'sms_otp').length

    const limiteGratisWhatsApp = 1000
    const limiteGratisSms = 10000

    const totalWhatsAppMesTotal = totalMesWhatsApp + totalMesCampanas

    const porcentajeWhatsApp = Math.min(
      100,
      Math.round((totalWhatsAppMesTotal / limiteGratisWhatsApp) * 100)
    )
    const porcentajeSms = Math.min(
      100,
      Math.round((totalMesSms / limiteGratisSms) * 100)
    )

    return {
      totalMesWhatsApp: totalWhatsAppMesTotal,
      totalMesSms,
      totalMesCampanas,
      totalHistoricoWhatsApp,
      totalHistoricoSms,
      limiteGratisWhatsApp,
      limiteGratisSms,
      porcentajeWhatsApp,
      porcentajeSms,
      ultimosEnvios: itemsMes.slice(0, 10),
    }
  } catch (e) {
    console.error('Error obteniendo métricas de mensajería:', e)
    return {
      totalMesWhatsApp: 0,
      totalMesSms: 0,
      totalMesCampanas: 0,
      totalHistoricoWhatsApp: 0,
      totalHistoricoSms: 0,
      limiteGratisWhatsApp: 1000,
      limiteGratisSms: 10000,
      porcentajeWhatsApp: 0,
      porcentajeSms: 0,
      ultimosEnvios: [],
    }
  }
}
