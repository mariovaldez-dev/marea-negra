'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getClienteCuentaByTelefono, ClientePerfilStats } from '@/lib/actions/clienteCuenta'
import { revalidatePath } from 'next/cache'

export async function getClienteFromQrCode(qrData: string): Promise<{
  success: boolean
  cliente?: ClientePerfilStats | null
  error?: string
}> {
  try {
    if (!qrData || typeof qrData !== 'string') {
      return { success: false, error: 'Código QR no válido o vacío' }
    }

    let targetPhone = ''

    // Formato estándar: "MAREA_SOCIO:6671234567:Nombre"
    if (qrData.startsWith('MAREA_SOCIO:')) {
      const parts = qrData.split(':')
      if (parts.length >= 2) {
        targetPhone = parts[1].replace(/\D/g, '')
      }
    } else {
      // Intento directo por teléfono o código
      targetPhone = qrData.replace(/\D/g, '')
    }

    if (!targetPhone || targetPhone.length < 7) {
      // Buscar por código de referido
      const supabase = createAdminClient()
      const { data: byReferido } = await supabase
        .from('clientes_club')
        .select('telefono')
        .ilike('codigo_referido', `%${qrData.trim()}%`)
        .single()

      if (byReferido?.telefono) {
        targetPhone = byReferido.telefono
      } else {
        return { success: false, error: 'No se reconoció el número de socio en el código QR.' }
      }
    }

    const perfil = await getClienteCuentaByTelefono(targetPhone)

    if (!perfil) {
      return { success: false, error: `Cliente con teléfono ${targetPhone} no registrado en el Club.` }
    }

    return { success: true, cliente: perfil }
  } catch (err: any) {
    console.error('Error al procesar QR de socio:', err)
    return { success: false, error: err?.message || 'Error al consultar datos del socio.' }
  }
}

// Bonificar puntos directamente sin crear pedidos en 0
export async function bonificarPuntosSocio(telefono: string, puntosExtra: number = 10): Promise<{
  success: boolean
  puntosTotales?: number
  error?: string
}> {
  try {
    const supabase = createAdminClient()
    const cleanPhone = telefono.replace(/\D/g, '')

    const { data: cliente, error: errCli } = await supabase
      .from('clientes_club')
      .select('*')
      .eq('telefono', cleanPhone)
      .single()

    if (errCli || !cliente) {
      return { success: false, error: 'Cliente no encontrado en el Club.' }
    }

    const nuevoTotalPuntos = Number(cliente.puntos || 0) + puntosExtra

    const { error: updateErr } = await supabase
      .from('clientes_club')
      .update({
        puntos: nuevoTotalPuntos,
      })
      .eq('telefono', cleanPhone)

    if (updateErr) {
      throw new Error(`Error al actualizar puntos: ${updateErr.message}`)
    }

    // Limpiar cualquier pedido en 0 de pruebas que se hubiera registrado previamente con notas de sello
    await supabase
      .from('pedidos')
      .delete()
      .eq('cliente_telefono', cleanPhone)
      .eq('total', 0)
      .ilike('notas', '%Sello de lealtad validado%')

    revalidatePath('/admin/clientes')
    revalidatePath('/admin/mesas')
    revalidatePath('/admin/caja')
    revalidatePath('/micuenta')

    return {
      success: true,
      puntosTotales: nuevoTotalPuntos,
    }
  } catch (err: any) {
    console.error('Error al bonificar puntos:', err)
    return { success: false, error: err?.message || 'No se pudieron bonificar los puntos.' }
  }
}

// Canjear y registrar la entrega de una recompensa / platillo gratis
export async function canjearPremioLealtad(formData: {
  telefono: string
  nombreCliente: string
  recompensa: string
  pedidoId?: number
  notas?: string
}): Promise<{
  success: boolean
  mensaje?: string
  error?: string
}> {
  try {
    const supabase = createAdminClient()
    const cleanPhone = formData.telefono.replace(/\D/g, '')

    // 1. Validar que el cliente tenga recompensas disponibles
    const perfil = await getClienteCuentaByTelefono(cleanPhone)
    if (!perfil) {
      return { success: false, error: 'Cliente no encontrado.' }
    }

    if (perfil.canjesDisponibles <= 0) {
      return {
        success: false,
        error: `El cliente aún no tiene recompensas disponibles para canjear (lleva ${perfil.pedidosEntregados % (perfil.lealtadConfig?.meta1_pedidos || 6)} de ${perfil.lealtadConfig?.meta1_pedidos || 6} pedidos).`,
      }
    }

    // 2. Registrar en canjes_lealtad
    const { error: insertErr } = await supabase
      .from('canjes_lealtad')
      .insert({
        telefono: cleanPhone,
        nombre_cliente: formData.nombreCliente || perfil.nombreCliente,
        recompensa: formData.recompensa,
        pedido_id: formData.pedidoId || null,
        notas: formData.notas || 'Recompensa entregada en sucursal Marea Negra',
      })

    if (insertErr) {
      throw new Error(`Error al registrar canje: ${insertErr.message}`)
    }

    revalidatePath('/admin/clientes')
    revalidatePath('/admin/mesas')
    revalidatePath('/admin/caja')
    revalidatePath('/micuenta')

    return {
      success: true,
      mensaje: `¡Premio "${formData.recompensa}" canjeado exitosamente para ${perfil.nombreCliente}!`,
    }
  } catch (err: any) {
    console.error('Error al canjear premio:', err)
    return { success: false, error: err?.message || 'No se pudo procesar el canje.' }
  }
}
