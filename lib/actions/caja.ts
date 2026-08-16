'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function guardarCierreCaja(formData: {
  fecha: string
  total_efectivo: number
  total_transferencia: number
  total_oxxo: number
  total_sistema: number
  total_real: number
  diferencia: number
  notas?: string
}) {
  const supabase = createServerClient()

  // Obtener ID del perfil autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('cierres_caja')
    .upsert(
      {
        fecha: formData.fecha,
        total_efectivo: formData.total_efectivo,
        total_transferencia: formData.total_transferencia,
        total_oxxo: formData.total_oxxo,
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
