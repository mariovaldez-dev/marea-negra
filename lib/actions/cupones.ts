'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getRecompensasLealtadList } from '@/lib/actions/lealtadConfig'

export interface CuponData {
  id?: number
  codigo: string
  descuento_porcentaje: number
  usos_maximos?: number | null
  usos_actuales?: number
  fecha_expiracion?: string | null
  activo?: boolean
}

export interface AvailableCouponPublic {
  codigo: string
  descuento: number
  titulo: string
  tipo: 'promocional' | 'lealtad'
}

/**
 * Genera una fecha de expiración exactamente a las 11:59:59 PM (medianoche)
 * en la zona horaria de Mazatlán, Sinaloa (America/Mazatlan -07:00).
 */
export async function getMazatlanMidnightExpiration(dateStr?: string | null, daysInFuture: number = 5): Promise<string | null> {
  if (!dateStr || !dateStr.trim()) {
    if (daysInFuture > 0) {
      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mazatlan',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      const nowMazatlanStr = formatter.format(now)
      const [year, month, day] = nowMazatlanStr.split('-').map(Number)
      const targetDate = new Date(Date.UTC(year, month - 1, day + daysInFuture))
      const targetYear = targetDate.getUTCFullYear()
      const targetMonth = String(targetDate.getUTCMonth() + 1).padStart(2, '0')
      const targetDay = String(targetDate.getUTCDate()).padStart(2, '0')
      return `${targetYear}-${targetMonth}-${targetDay}T23:59:59-07:00`
    }
    return null
  }

  if (dateStr.includes('T23:59:59')) {
    return dateStr
  }

  // Tomar YYYY-MM-DD del date input y fijar a las 23:59:59 Mazatlán (-07:00)
  const cleanDate = dateStr.slice(0, 10)
  return `${cleanDate}T23:59:59-07:00`
}

// Obtener todos los cupones promocionales para el panel de administración
export async function getCupones() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('cupones')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener cupones:', error)
    return []
  }

  return (data as CuponData[]).filter(
    (c) => !c.codigo.startsWith('LEALTAD-') && !c.codigo.startsWith('RECOMPENSA-') && c.codigo !== 'CONFIG_LEALTAD_SINALOA'
  )
}

// Crear o editar un cupón
export async function saveCupon(cupon: CuponData) {
  const supabase = createServerClient()
  const cleanCodigo = cupon.codigo.trim().toUpperCase()

  // Forzar expiración siempre a medianoche 11:59:59 PM horario Mazatlán
  const mazatlanExpiration = cupon.fecha_expiracion
    ? await getMazatlanMidnightExpiration(cupon.fecha_expiracion)
    : null

  const payload = {
    codigo: cleanCodigo,
    descuento_porcentaje: Number(cupon.descuento_porcentaje) || 10,
    usos_maximos: cupon.usos_maximos ? Number(cupon.usos_maximos) : null,
    fecha_expiracion: mazatlanExpiration,
    activo: cupon.activo !== undefined ? cupon.activo : true,
  }

  if (cupon.id) {
    const { error } = await supabase
      .from('cupones')
      .update(payload)
      .eq('id', cupon.id)

    if (error) throw new Error(`Error al actualizar cupón: ${error.message}`)
  } else {
    const { error } = await supabase
      .from('cupones')
      .insert({ ...payload, usos_actuales: 0 })

    if (error) throw new Error(`Error al crear cupón: ${error.message}`)
  }

  revalidatePath('/admin/cupones')
  revalidatePath('/pedir')
  return { success: true }
}

// Alternar estado activo / inactivo en 1 solo clic
export async function toggleCuponActivo(id: number, currentActivo: boolean) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('cupones')
    .update({ activo: !currentActivo })
    .eq('id', id)

  if (error) throw new Error(`Error al cambiar estado: ${error.message}`)

  revalidatePath('/admin/cupones')
  revalidatePath('/pedir')
  return { success: true }
}

// Eliminar un cupón
export async function deleteCupon(id: number) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('cupones')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Error al eliminar cupón: ${error.message}`)

  revalidatePath('/admin/cupones')
  return { success: true }
}

// Validar cupón en tiempo real durante el checkout público en /pedir
export async function validateCuponAction(codigoInput: string, clienteTelefono?: string) {
  const supabase = createServerClient()
  const cleanCodigo = codigoInput.trim().toUpperCase()

  if (!cleanCodigo) {
    return { valid: false, message: 'Ingresa un código de cupón.' }
  }

  // 1. Soporte para cupones N-dinámicos de lealtad por pedidos
  const recompensasLealtad = await getRecompensasLealtadList()
  const matchedLealtad = recompensasLealtad.find((r) => r.codigo === cleanCodigo)

  if (matchedLealtad) {
    let cleanPhone = (clienteTelefono || '').replace(/\D/g, '')
    let userOrderCount = 0

    if (cleanPhone) {
      const { data: pedidosCount } = await supabase
        .from('pedidos')
        .select('id')
        .or(`cliente_telefono.eq.${cleanPhone},cliente_telefono.ilike.%${cleanPhone}%`)

      userOrderCount = pedidosCount?.length || 0
    }

    if (userOrderCount < matchedLealtad.pedidos_requeridos) {
      return {
        valid: false,
        message: `Desbloqueas este cupón al acumular ${matchedLealtad.pedidos_requeridos} pedidos (llevas ${userOrderCount}).`,
      }
    }

    return {
      valid: true,
      tipo_recompensa: matchedLealtad.tipo_recompensa || 'porcentaje',
      descuento_porcentaje: matchedLealtad.descuento_porcentaje || 0,
      monto_fijo: matchedLealtad.monto_fijo || 0,
      producto_regalo: matchedLealtad.tipo_recompensa === 'producto_regalo' ? (matchedLealtad.producto_regalo || matchedLealtad.titulo) : undefined,
      message: `¡Recompensa de Lealtad Aplicada! (${matchedLealtad.titulo})`,
      codigo: cleanCodigo,
    }
  }

  // 2. Validación estándar contra catálogo de cupones promocionales en Supabase BDD
  const { data: cupon, error } = await supabase
    .from('cupones')
    .select('*')
    .eq('codigo', cleanCodigo)
    .single()

  if (error || !cupon) {
    return { valid: false, message: 'Código de cupón no válido.' }
  }

  if (!cupon.activo) {
    return { valid: false, message: 'Este cupón ya no está disponible.' }
  }

  // Verificar fecha de expiración estricta a medianoche horario Mazatlán
  if (cupon.fecha_expiracion) {
    const expDate = new Date(cupon.fecha_expiracion)
    if (new Date() > expDate) {
      return { valid: false, message: 'Este cupón expiró a las 11:59 PM (Horario Mazatlán).' }
    }
  }

  if (cupon.usos_maximos !== null && cupon.usos_maximos !== undefined) {
    if (cupon.usos_actuales >= cupon.usos_maximos) {
      return { valid: false, message: 'Este cupón ya agotó sus canjes máximos.' }
    }
  }

  return {
    valid: true,
    descuento_porcentaje: Number(cupon.descuento_porcentaje) || 10,
    message: `¡Cupón del ${cupon.descuento_porcentaje}% de descuento aplicado!`,
    codigo: cupon.codigo,
  }
}

// Incrementar atómicamente el contador de usos del cupón al realizar el pedido
export async function incrementCuponUsos(codigoInput: string) {
  const supabase = createServerClient()
  const cleanCodigo = codigoInput.trim().toUpperCase()

  const { data: cupon } = await supabase
    .from('cupones')
    .select('id, usos_actuales')
    .eq('codigo', cleanCodigo)
    .single()

  if (cupon) {
    await supabase
      .from('cupones')
      .update({ usos_actuales: (cupon.usos_actuales || 0) + 1 })
      .eq('id', cupon.id)
  }
}

// Obtener cupones públicos válidos para el selector tipo Uber Eats en checkout (Reales desde BDD)
export async function getAvailableCuponesPublic(clienteTelefono?: string): Promise<AvailableCouponPublic[]> {
  const supabase = createServerClient()
  const availableList: AvailableCouponPublic[] = []
  const now = new Date()

  // 1. Obtener cupones promocionales activos del catálogo en BDD
  const { data: dbCupones } = await supabase
    .from('cupones')
    .select('id, codigo, descuento_porcentaje, usos_maximos, usos_actuales, fecha_expiracion')
    .eq('activo', true)
    .order('descuento_porcentaje', { ascending: false })

  if (dbCupones) {
    dbCupones
      .filter((c) => !c.codigo.startsWith('LEALTAD-') && !c.codigo.startsWith('RECOMPENSA-') && c.codigo !== 'CONFIG_LEALTAD_SINALOA')
      .filter((c) => c.usos_maximos === null || (c.usos_actuales || 0) < c.usos_maximos)
      .filter((c) => !c.fecha_expiracion || new Date(c.fecha_expiracion) > now)
      .forEach((c) => {
        availableList.push({
          codigo: c.codigo,
          descuento: Number(c.descuento_porcentaje) || 10,
          titulo: `Cupón Promocional: ${c.descuento_porcentaje}% OFF`,
          tipo: 'promocional',
        })
      })
  }

  // 2. Solo si el cliente está registrado en el Club Marea Negra, consultar recompensas alcanzadas por sus compras reales en BDD
  const cleanPhone = (clienteTelefono || '').replace(/\D/g, '')
  if (cleanPhone) {
    const { data: clienteReg } = await supabase
      .from('clientes_club')
      .select('id')
      .eq('telefono', cleanPhone)
      .single()

    // Únicamente los usuarios registrados en el Club pueden recibir cupones de lealtad al llegar al límite de sus compras
    if (clienteReg) {
      const recompensasLealtad = await getRecompensasLealtadList()
      if (recompensasLealtad.length > 0) {
        const { data: pedidosCliente } = await supabase
          .from('pedidos')
          .select('id')
          .or(`cliente_telefono.eq.${cleanPhone},cliente_telefono.ilike.%${cleanPhone}%`)

        const totalOrders = pedidosCliente?.length || 0

        // Desbloquear únicamente las recompensas alcanzadas al cumplir la meta de pedidos
        recompensasLealtad.forEach((reward) => {
          if (reward.activo !== false && totalOrders >= reward.pedidos_requeridos) {
            availableList.unshift({
              codigo: reward.codigo,
              descuento: reward.descuento_porcentaje,
              titulo: `🏆 ¡Desbloqueado! ${reward.titulo}`,
              tipo: 'lealtad',
            })
          }
        })
      }
    }
  }

  return availableList
}
