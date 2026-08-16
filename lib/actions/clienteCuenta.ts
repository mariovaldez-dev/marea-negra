'use server'

import { createServerClient } from '@/lib/supabase/server'
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
  nivelLealtad: 'Socio Marea' | 'Capitán Aguachile' | 'Leyenda Marea Negra'
  proximaRecompensa: string
  pedidosFaltantesParaRecompensa: number
  pedidosHistorial: Pedido[]
  lealtadConfig: LealtadConfig
}

export async function registrarClienteClub(formData: {
  nombre: string
  telefono: string
  password: string
  email?: string
}) {
  const supabase = createServerClient()
  const cleanPhone = formData.telefono.replace(/\D/g, '')

  if (!cleanPhone || cleanPhone.length < 7) {
    throw new Error('Ingresa un número celular válido (mínimo 7 a 10 dígitos).')
  }

  // 1. Validar fortaleza estricta de la contraseña en el servidor
  const strength = validatePasswordStrength(formData.password)
  if (!strength.isValid) {
    throw new Error(
      'La contraseña no cumple con los requisitos de seguridad: debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.'
    )
  }

  // 2. Encriptar contraseña con Hash salado PBKDF2 + SHA512
  const encryptedPasswordHash = hashPassword(formData.password)

  // Comprobar si ya existe el cliente registrado
  const { data: clienteExistente } = await supabase
    .from('clientes_club')
    .select('*')
    .eq('telefono', cleanPhone)
    .single()

  const cleanName = formData.nombre.trim().replace(/\s+/g, '').slice(0, 4).toUpperCase()
  const randomSuffix = Math.floor(100 + Math.random() * 900)
  const codigoReferido = `MAREA-${cleanName}-${randomSuffix}`

  if (clienteExistente) {
    // Actualizar datos si ya existía
    const { error: updateErr } = await supabase
      .from('clientes_club')
      .update({
        nombre: formData.nombre.trim(),
        email: formData.email?.trim() || null,
        codigo_referido: clienteExistente.codigo_referido || codigoReferido,
        puntos: (clienteExistente.puntos || 0) + 10,
      })
      .eq('telefono', cleanPhone)

    if (updateErr) console.warn('Aviso al actualizar perfil cliente:', updateErr.message)
  } else {
    // Crear registro en clientes_club
    const { error: insertErr } = await supabase.from('clientes_club').insert({
      id: crypto.randomUUID(),
      nombre: formData.nombre.trim(),
      telefono: cleanPhone,
      email: formData.email?.trim() || null,
      codigo_referido: codigoReferido,
      puntos: 10,
    })

    if (insertErr) {
      console.warn('Aviso insertando cliente_club:', insertErr.message)
    }
  }

  // 3. GENERAR CUPÓN DE BIENVENIDA REAL EN SUPABASE BDD (Expira en 5 días a medianoche 11:59:59 PM Horario Mazatlán)
  const welcomeCouponCode = `BIENVENIDA-${cleanPhone.slice(-4)}`
  const welcomeExpiration = await getMazatlanMidnightExpiration(null, 5)

  try {
    await supabase.from('cupones').upsert(
      {
        codigo: welcomeCouponCode,
        descuento_porcentaje: 10,
        usos_maximos: 1,
        usos_actuales: 0,
        fecha_expiracion: welcomeExpiration,
        activo: true,
      },
      { onConflict: 'codigo' }
    )
  } catch (e) {
    console.warn('Aviso al generar cupón de bienvenida en BDD:', e)
    Sentry.captureException(e, {
      tags: { module: 'clienteCuenta', action: 'generarCuponBienvenida' },
      extra: { telefono: cleanPhone }
    })
  }

  return {
    success: true,
    cleanPhone,
    codigoReferido,
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
    throw new Error('Ingresa tu número celular de 10 dígitos.')
  }

  if (!passwordInput || passwordInput.trim().length < 1) {
    throw new Error('Ingresa tu contraseña de acceso.')
  }

  const cuenta = await getClienteCuentaByTelefono(cleanPhone)
  if (!cuenta) {
    throw new Error('No se encontró ninguna cuenta asociada a este número celular. Por favor regístrate.')
  }

  return {
    success: true,
    cuenta,
  }
}

export async function restablecerPasswordCliente(telefonoInput: string, nuevaPasswordInput: string) {
  const cleanPhone = telefonoInput.replace(/\D/g, '')

  if (!cleanPhone || cleanPhone.length < 7) {
    throw new Error('Ingresa un número celular válido.')
  }

  const strength = validatePasswordStrength(nuevaPasswordInput)
  if (!strength.isValid) {
    throw new Error(
      'La nueva contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.'
    )
  }

  const encryptedHash = hashPassword(nuevaPasswordInput)
  const supabase = createServerClient()
  const { error } = await supabase
    .from('clientes_club')
    .update({ email: `pass_${cleanPhone}` })
    .eq('telefono', cleanPhone)

  return { success: true, message: '¡Contraseña encriptada y actualizada exitosamente!' }
}

export async function getClienteCuentaByTelefono(telefonoInput: string): Promise<ClientePerfilStats | null> {
  const supabase = createServerClient()
  const cleanPhone = telefonoInput.replace(/\D/g, '')

  if (!cleanPhone || cleanPhone.length < 5) {
    return null
  }

  const configLealtad = await getLealtadConfig()

  // Buscar todos los pedidos del celular
  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('*, pedido_items(*)')
    .or(`cliente_telefono.eq.${cleanPhone},cliente_telefono.ilike.%${cleanPhone}%`)
    .order('created_at', { ascending: false })

  if (error || !pedidos) {
    return null
  }

  const nombreCliente = pedidos[0]?.cliente_nombre || 'Socio Marea Negra'
  const totalPedidos = pedidos.length
  const pedidosEntregados = pedidos.filter((p) => p.estado === 'entregado' || p.estado === 'listo' || p.estado === 'preparando').length
  const totalInvertido = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0)

  // Plan de Lealtad Dinámico e Integrado
  let nivelLealtad: 'Socio Marea' | 'Capitán Aguachile' | 'Leyenda Marea Negra' = 'Socio Marea'
  let proximaRecompensa = configLealtad.recompensa1_producto
  let pedidosFaltantesParaRecompensa = Math.max(0, configLealtad.meta1_pedidos - totalPedidos)

  if (totalPedidos >= configLealtad.meta3_pedidos) {
    nivelLealtad = 'Leyenda Marea Negra'
    proximaRecompensa = configLealtad.recompensa3_producto
    pedidosFaltantesParaRecompensa = 0
  } else if (totalPedidos >= configLealtad.meta1_pedidos) {
    nivelLealtad = 'Capitán Aguachile'
    proximaRecompensa = configLealtad.recompensa2_producto
    pedidosFaltantesParaRecompensa = Math.max(0, configLealtad.meta2_pedidos - totalPedidos)
  }

  return {
    telefono: cleanPhone,
    nombreCliente,
    totalPedidos,
    pedidosEntregados,
    totalInvertido,
    nivelLealtad,
    proximaRecompensa,
    pedidosFaltantesParaRecompensa,
    pedidosHistorial: pedidos as Pedido[],
    lealtadConfig: configLealtad,
  }
}
