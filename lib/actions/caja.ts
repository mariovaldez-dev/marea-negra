'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function abrirCajaTurno(formData: {
  fecha: string
  fondo_inicial: number
  monto_apertura_desglose?: any
  notas_apertura?: string
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('cierres_caja')
    .upsert(
      {
        fecha: formData.fecha,
        estado: 'abierta',
        fondo_inicial: formData.fondo_inicial || 0,
        monto_apertura_desglose: formData.monto_apertura_desglose || null,
        notas_apertura: formData.notas_apertura || null,
        hora_apertura: new Date().toISOString(),
        abierto_por: user?.id || null,
        total_efectivo: 0,
        total_transferencia: 0,
        total_oxxo: 0,
        total_sistema: 0,
        total_real: formData.fondo_inicial || 0,
        diferencia: 0,
      },
      { onConflict: 'fecha' }
    )
    .select()
    .single()

  if (error) {
    throw new Error(`Error al abrir caja de turno: ${error.message}`)
  }

  revalidatePath('/admin/caja')
  revalidatePath('/admin/dashboard')
  return { success: true, data }
}

export async function reabrirCajaTurno(fecha: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('cierres_caja')
    .update({
      estado: 'abierta',
      hora_cierre: null,
    })
    .eq('fecha', fecha)
    .select()
    .single()

  if (error) {
    throw new Error(`Error al reabrir caja: ${error.message}`)
  }

  revalidatePath('/admin/caja')
  revalidatePath('/admin/dashboard')
  return { success: true, data }
}

export async function guardarCierreCaja(formData: {
  fecha: string
  total_efectivo: number
  total_transferencia: number
  total_oxxo: number
  fondo_inicial?: number
  total_gastos?: number
  desglose_billetes?: any
  total_sistema: number
  total_real: number
  diferencia: number
  notas?: string
  cerrar_turno?: boolean
}) {
  const supabase = await createServerClient()

  // Obtener ID del perfil autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const estadoFinal = formData.cerrar_turno ? 'cerrada' : 'abierta'

  const { data, error } = await supabase
    .from('cierres_caja')
    .upsert(
      {
        fecha: formData.fecha,
        estado: estadoFinal,
        hora_cierre: formData.cerrar_turno ? new Date().toISOString() : undefined,
        total_efectivo: formData.total_efectivo,
        total_transferencia: formData.total_transferencia,
        total_oxxo: formData.total_oxxo,
        fondo_inicial: formData.fondo_inicial || 0,
        total_gastos: formData.total_gastos || 0,
        desglose_billetes: formData.desglose_billetes || null,
        total_sistema: formData.total_sistema,
        total_real: formData.total_real,
        diferencia: formData.diferencia,
        notas: formData.notas || null,
        cerrado_por: user?.id || null,
      },
      { onConflict: 'fecha' }
    )
    .select()
    .single()

  if (error) {
    throw new Error(`Error al guardar el cierre de caja: ${error.message}`)
  }

  revalidatePath('/admin/caja')
  revalidatePath('/admin/dashboard')
  return { success: true, data }
}

