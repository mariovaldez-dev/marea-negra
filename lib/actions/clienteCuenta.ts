'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { Pedido } from '@/lib/types/database'
import { getLealtadConfig, LealtadConfig } from '@/lib/actions/lealtadConfig'
import { getMazatlanMidnightExpiration } from '@/lib/actions/cupones'
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/security/passwordHash'
import * as Sentry from '@sentry/nextjs'

export interface ClientePerfilStats {
  telefono: string
  nombreCliente: string
  totalPedidos: number
  pedidosEntregados: number
  totalInvertido: number
  email: string | null
  codigoReferido: string | null
  puntos: number
  fechaRegistro: string | null
  nivelLealtad: 'Miembro Nuevo' | 'Socio Marea' | 'Capitán Aguachile' | 'Leyenda Marea Negra'
  proximaRecompensa: string | null
  pedidosFaltantesParaRecompensa: number | null
  pedidosHistorial: Pedido[]
  lealtadConfig: LealtadConfig | null
}

export async function registrarClienteClub(formData: {
  nombre: string
  telefono: string
  password: string
  email?: string
}) {
  const adminSupabase = createAdminClient()
  const cleanPhone = formData.telefono.replace(/\D/g, '')

  if (!cleanPhone || cleanPhone.length < 7) {
    return { success: false, error: 'Ingresa un número celular válido (mínimo 7 a 10 dígitos).' }
  }

  // 1. Validar fortaleza estricta de la contraseña
  const strength = validatePasswordStrength(formData.password)
  if (!strength.isValid) {
    return {
      success: false,
      error: 'La contraseña no cumple con los requisitos de seguridad: debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.'
    }
  }

  // 2. Encriptar contraseña con Hash salado PBKDF2 + SHA512
  const encryptedPasswordHash = hashPassword(formData.password)

  // Comprobar si ya existe el cliente registrado
  const { data: clienteExistente } = await adminSupabase
    .from('clientes_club')
    .select('*')
    .eq('telefono', cleanPhone)
    .single()

  const cleanName = formData.nombre.trim().replace(/\s+/g, '').slice(0, 4).toUpperCase()
  const randomSuffix1 = Math.floor(100 + Math.random() * 900)
  const randomSuffix2 = Math.floor(100 + Math.random() * 900)

  const codigoReferido = clienteExistente?.codigo_referido || `MAREA-${cleanName}-${randomSuffix1}`

  if (clienteExistente) {
    const { error: updateErr } = await adminSupabase
      .from('clientes_club')
      .update({
        nombre: formData.nombre.trim(),
        email: formData.email?.trim() || null,
        codigo_referido: codigoReferido,
        password_hash: encryptedPasswordHash,
        puntos: (clienteExistente.puntos || 0) + 10,
      })
      .eq('telefono', cleanPhone)

    if (updateErr) return { success: false, error: `Error al actualizar cuenta: ${updateErr.message}` }
  } else {
    const { error: insertErr } = await adminSupabase.from('clientes_club').insert({
      id: crypto.randomUUID(),
      nombre: formData.nombre.trim(),
      telefono: cleanPhone,
      email: formData.email?.trim() || null,
      codigo_referido: codigoReferido,
      password_hash: encryptedPasswordHash,
      puntos: 10,
    })

    if (insertErr) return { success: false, error: `Error al crear cuenta: ${insertErr.message}` }
  }

  // 3. GENERAR CUPONES CON ADMIN CLIENT (Bypasseando RLS)
  const welcomeCouponCode = `BIENVENIDO-${cleanName}-${randomSuffix2}`
  const welcomeExpiration = await getMazatlanMidnightExpiration(null, 5)

  try {
    // Cupón de bienvenida (1 solo uso)
    await adminSupabase.from('cupones').upsert({
      codigo: welcomeCouponCode,
      descuento_porcentaje: 10,
      usos_maximos: 1,
      usos_actuales: 0,
      fecha_expiracion: welcomeExpiration,
      activo: true,
    }, { onConflict: 'codigo' })

    // Cupón de referidos (5 usos máximo)
    await adminSupabase.from('cupones').upsert({
      codigo: codigoReferido,
      descuento_porcentaje: 10,
      usos_maximos: 5,
      usos_actuales: 0,
      activo: true,
    }, { onConflict: 'codigo' })

  } catch (e) {
    console.warn('Aviso al generar cupones en BDD:', e)
    Sentry.captureException(e, {
      tags: { module: 'clienteCuenta', action: 'generarCupones' },
      extra: { telefono: cleanPhone }
    })
  }

  return {
    success: true,
    cleanPhone,
    codigoReferido,
    welcomeCouponCode,
    welcomeCoupon: {
      codigo: welcomeCouponCode,
      descuento: 10,
      fechaExpiracion: welcomeExpiration,
      titulo: 'Cupón de Bienvenida 10% OFF (Expira en 5 días a las 11:59 PM Mazatlán)',
    },
  }
}

export async function loginClienteConPassword(telefonoInput: string, passwordInput: string) {
  const cleanPhone = telefonoInput.replace(/\D/g, '')

  if (!cleanPhone) {
    return { success: false, error: 'Ingresa tu número celular de 10 dígitos.' }
  }

  if (!passwordInput || passwordInput.trim().length < 1) {
    return { success: false, error: 'Ingresa tu contraseña de acceso.' }
  }

  // Buscar si el cliente existe en el club y obtener su hash
  const adminSupabase = createAdminClient()
  const { data: clienteReg } = await adminSupabase
    .from('clientes_club')
    .select('password_hash')
    .eq('telefono', cleanPhone)
    .single()

  if (!clienteReg || !clienteReg.password_hash) {
    return { success: false, error: 'No se encontró ninguna cuenta asociada a este número celular. Por favor regístrate.' }
  }

  // Verificar el Hash de la contraseña
  const isValid = verifyPassword(passwordInput, clienteReg.password_hash)
  if (!isValid) {
    return { success: false, error: 'Número de teléfono o contraseña incorrecta. Por favor intenta de nuevo.' }
  }

  const cuenta = await getClienteCuentaByTelefono(cleanPhone)

  return {
    success: true,
    cuenta,
  }
}

export async function restablecerPasswordCliente(telefonoInput: string, nuevaPasswordInput: string) {
  const cleanPhone = telefonoInput.replace(/\D/g, '')

  if (!cleanPhone || cleanPhone.length < 7) {
    return { success: false, error: 'Ingresa un número celular válido (mínimo 7 a 10 dígitos).' }
  }

  const strength = validatePasswordStrength(nuevaPasswordInput)
  if (!strength.isValid) {
    return {
      success: false,
      error: 'La nueva contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.'
    }
  }

  const adminSupabase = createAdminClient()

  // 1. Verificar si el usuario existe
  const { data: cliente, error: searchErr } = await adminSupabase
    .from('clientes_club')
    .select('id')
    .eq('telefono', cleanPhone)
    .single()

  if (!cliente || searchErr) {
    return {
      success: false,
      error: 'No se encontró ninguna cuenta asociada a este número celular.'
    }
  }

  // 2. Encriptar y actualizar password_hash
  const encryptedHash = hashPassword(nuevaPasswordInput)
  const { error: updateErr } = await adminSupabase
    .from('clientes_club')
    .update({ password_hash: encryptedHash })
    .eq('telefono', cleanPhone)

  if (updateErr) {
    return {
      success: false,
      error: `Error al actualizar contraseña: ${updateErr.message}`
    }
  }

  return { success: true, message: '¡Contraseña actualizada exitosamente!' }
}

export async function getClienteCuentaByTelefono(telefonoInput: string): Promise<ClientePerfilStats | null> {
  const supabase = createServerClient()
  const cleanPhone = telefonoInput.replace(/\D/g, '')

  if (!cleanPhone || cleanPhone.length < 5) {
    return null
  }

  const configLealtad = await getLealtadConfig()

  // Buscar el perfil en la base de datos oficial del club
  const { data: perfilClub } = await supabase
    .from('clientes_club')
    .select('*')
    .eq('telefono', cleanPhone)
    .single()

  // Buscar todos los pedidos del celular
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*, pedido_items(*)')
    .or(`cliente_telefono.eq.${cleanPhone},cliente_telefono.ilike.%${cleanPhone}%`)
    .order('created_at', { ascending: false })

  if (!perfilClub && (!pedidos || pedidos.length === 0)) {
    return null
  }

  const pedidosHistorial = pedidos || []
  const nombreCliente = perfilClub?.nombre || pedidosHistorial[0]?.cliente_nombre || 'Socio Marea Negra'
  const email = perfilClub?.email || null
  const codigoReferido = perfilClub?.codigo_referido || null
  const puntos = perfilClub?.puntos || 0
  const fechaRegistro = perfilClub?.created_at || null

  const totalPedidos = pedidosHistorial.length
  const pedidosEntregados = pedidosHistorial.filter((p) => p.estado === 'entregado' || p.estado === 'listo' || p.estado === 'preparando').length
  const totalInvertido = pedidosHistorial.reduce((acc, p) => acc + Number(p.total || 0), 0)

  // Plan de Lealtad Dinámico e Integrado
  let nivelLealtad: 'Miembro Nuevo' | 'Socio Marea' | 'Capitán Aguachile' | 'Leyenda Marea Negra' = 'Miembro Nuevo'
  let proximaRecompensa: string | null = null
  let pedidosFaltantesParaRecompensa: number | null = null

  if (configLealtad) {
    proximaRecompensa = configLealtad.recompensa1_producto
    pedidosFaltantesParaRecompensa = Math.max(0, configLealtad.meta1_pedidos - totalPedidos)

    if (totalPedidos >= configLealtad.meta3_pedidos) {
      nivelLealtad = 'Leyenda Marea Negra'
      proximaRecompensa = configLealtad.recompensa3_producto
      pedidosFaltantesParaRecompensa = 0
    } else if (totalPedidos >= configLealtad.meta1_pedidos) {
      nivelLealtad = 'Capitán Aguachile'
      proximaRecompensa = configLealtad.recompensa2_producto
      pedidosFaltantesParaRecompensa = Math.max(0, configLealtad.meta2_pedidos - totalPedidos)
    } else if (totalPedidos > 0) {
      nivelLealtad = 'Socio Marea'
    }
  } else if (totalPedidos > 0) {
    nivelLealtad = 'Socio Marea'
  }

  return {
    telefono: cleanPhone,
    nombreCliente,
    email,
    codigoReferido,
    puntos,
    fechaRegistro,
    totalPedidos,
    pedidosEntregados,
    totalInvertido,
    nivelLealtad,
    proximaRecompensa,
    pedidosFaltantesParaRecompensa,
    pedidosHistorial,
    lealtadConfig: configLealtad,
  }
}
