'use server'

import { createServerClient } from '@/lib/supabase/server'
import { GastoCaja, CategoriaGasto } from '@/lib/types/database'
import { getMazatlanDateString } from '@/lib/utils/date'
import { revalidatePath } from 'next/cache'

export async function getGastosDeFecha(fecha?: string): Promise<GastoCaja[]> {
  const supabase = await createServerClient()
  const targetFecha = fecha || getMazatlanDateString()

  try {
    const { data, error } = await supabase
      .from('gastos_caja')
      .select('*')
      .eq('fecha', targetFecha)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Aviso al obtener gastos de caja:', error)
      return []
    }

    return (data as GastoCaja[]) || []
  } catch (err) {
    console.error('Error al obtener gastos de caja:', err)
    return []
  }
}

export async function registrarGastoCaja(formData: {
  fecha?: string
  concepto: string
  categoria: CategoriaGasto
  monto: number
  metodo_pago?: 'efectivo' | 'transferencia'
  comprobante_url?: string
}) {
  const supabase = await createServerClient()
  const fecha = formData.fecha || getMazatlanDateString()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('gastos_caja')
    .insert({
      fecha,
      concepto: formData.concepto,
      categoria: formData.categoria || 'insumos_urgentes',
      monto: formData.monto,
      metodo_pago: formData.metodo_pago || 'efectivo',
      comprobante_url: formData.comprobante_url || null,
      registrado_por: user?.id || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Error al registrar gasto: ${error.message}`)
  }

  revalidatePath('/admin/caja')
  revalidatePath('/admin/dashboard')
  return { success: true, data }
}

export async function eliminarGastoCaja(id: number) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('gastos_caja').delete().eq('id', id)

  if (error) {
    throw new Error(`Error al eliminar gasto: ${error.message}`)
  }

  revalidatePath('/admin/caja')
  return { success: true }
}
