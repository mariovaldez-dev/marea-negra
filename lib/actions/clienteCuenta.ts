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
  borndate: string | null
  esMesCumpleanos: boolean
  nivelLealtad: 'Miembro Nuevo' | 'Socio Marea' | 'Capitán Aguachile' | 'Leyenda Marea Negra'
  proximaRecompensa: string | null
  pedidosFaltantesParaRecompensa: number | null
  canjesDisponibles: number
  totalCanjesRealizados: number
  historialCanjes: Array<{ id: number; recompensa: string; created_at: string }>
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

export async function cambiarPasswordCliente(
  telefonoInput: string,
  passwordActualInput: string,
  nuevaPasswordInput: string
) {
  const cleanPhone = telefonoInput.replace(/\D/g, '')

  if (!cleanPhone || cleanPhone.length < 7) {
    return { success: false, error: 'Número celular inválido.' }
  }

  const adminSupabase = createAdminClient()
  const { data: cliente, error: searchErr } = await adminSupabase
    .from('clientes_club')
    .select('id, password_hash')
    .eq('telefono', cleanPhone)
    .single()

  if (!cliente || !cliente.password_hash || searchErr) {
    return { success: false, error: 'No se encontró la cuenta del cliente.' }
  }

  // 1. Validar contraseña actual
  const isMatch = verifyPassword(passwordActualInput, cliente.password_hash)
  if (!isMatch) {
    return { success: false, error: 'Tu contraseña actual es incorrecta. Por favor verifícala.' }
  }

  // 2. Validar fortaleza de la nueva contraseña
  const strength = validatePasswordStrength(nuevaPasswordInput)
  if (!strength.isValid) {
    return {
      success: false,
      error: 'La nueva contraseña debe cumplir con los 4 requisitos: mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.',
    }
  }

  // 3. Encriptar y guardar
  const encryptedHash = hashPassword(nuevaPasswordInput)
  const { error: updateErr } = await adminSupabase
    .from('clientes_club')
    .update({ password_hash: encryptedHash })
    .eq('telefono', cleanPhone)

  if (updateErr) {
    return { success: false, error: `Error al actualizar contraseña: ${updateErr.message}` }
  }

  return { success: true, message: '¡Tu contraseña ha sido actualizada con éxito!' }
}

export async function solicitarOtpRecuperacionGratis(telefonoInput: string) {
  const cleanPhone = telefonoInput.replace(/\D/g, '')
  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, error: 'Ingresa un número celular válido de 10 dígitos.' }
  }

  const adminSupabase = createAdminClient()

  // 1. Verificar que el cliente exista
  const { data: cliente, error: clientErr } = await adminSupabase
    .from('clientes_club')
    .select('id, nombre')
    .eq('telefono', cleanPhone)
    .single()

  if (clientErr || !cliente) {
    return {
      success: false,
      error: 'No encontramos ninguna cuenta registrada con este número de celular.',
    }
  }

  // 2. Generar código aleatorio de 6 dígitos
  const codigo = Math.floor(100000 + Math.random() * 900000).toString()
  const expiraAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  // 3. Guardar en base de datos
  const { error: insertErr } = await adminSupabase.from('codigos_recuperacion').insert({
    telefono: cleanPhone,
    codigo,
    expira_at: expiraAt,
    utilizado: false,
  })

  if (insertErr) {
    console.warn('Error al registrar OTP:', insertErr.message)
  }

  const waMensaje = `🌊 *CÓDIGO DE SEGURIDAD MAREA NEGRA* 🦐
Hola *${cliente.nombre}*, tu código para restablecer tu contraseña es:

🔑 *${codigo}*

(Válido durante 15 minutos). No compartas este código con nadie.`

  return {
    success: true,
    codigo,
    nombre: cliente.nombre,
    waMensaje,
  }
}

export async function verificarOtpYCambiarPasswordGratis(
  telefonoInput: string,
  codigoInput: string,
  nuevaPasswordInput: string
) {
  const cleanPhone = telefonoInput.replace(/\D/g, '')
  const cleanCode = codigoInput.trim().replace(/\D/g, '')

  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, error: 'Número celular inválido.' }
  }

  if (cleanCode.length !== 6) {
    return { success: false, error: 'El código debe tener exactamente 6 dígitos.' }
  }

  const strength = validatePasswordStrength(nuevaPasswordInput)
  if (!strength.isValid) {
    return {
      success: false,
      error: 'La nueva contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.',
    }
  }

  const adminSupabase = createAdminClient()

  // 1. Validar código OTP en la base de datos
  const { data: otpReg, error: otpErr } = await adminSupabase
    .from('codigos_recuperacion')
    .select('id, expira_at')
    .eq('telefono', cleanPhone)
    .eq('codigo', cleanCode)
    .eq('utilizado', false)
    .gte('expira_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otpErr || !otpReg) {
    return {
      success: false,
      error: 'El código de seguridad es incorrecto o ha expirado. Por favor solicita uno nuevo.',
    }
  }

  // 2. Marcar código como utilizado
  await adminSupabase
    .from('codigos_recuperacion')
    .update({ utilizado: true })
    .eq('id', otpReg.id)

  // 3. Encriptar y actualizar la contraseña del cliente
  const encryptedHash = hashPassword(nuevaPasswordInput)
  const { error: updateErr } = await adminSupabase
    .from('clientes_club')
    .update({ password_hash: encryptedHash })
    .eq('telefono', cleanPhone)

  if (updateErr) {
    return { success: false, error: `Error al actualizar: ${updateErr.message}` }
  }

  return { success: true, message: '¡Contraseña restablecida exitosamente!' }
}

export async function verificarCumpleanosYCambiarPassword(
  telefonoInput: string,
  fechaNacimientoInput: string,
  nuevaPasswordInput: string
) {
  const cleanPhone = telefonoInput.replace(/\D/g, '')

  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, error: 'Número celular inválido.' }
  }

  if (!fechaNacimientoInput) {
    return { success: false, error: 'Ingresa tu fecha de cumpleaños registrada.' }
  }

  const strength = validatePasswordStrength(nuevaPasswordInput)
  if (!strength.isValid) {
    return {
      success: false,
      error: 'La nueva contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.',
    }
  }

  const adminSupabase = createAdminClient()

  // 1. Buscar cliente y validar fecha de nacimiento
  const { data: cliente, error: searchErr } = await adminSupabase
    .from('clientes_club')
    .select('id, borndate')
    .eq('telefono', cleanPhone)
    .single()

  if (searchErr || !cliente) {
    return { success: false, error: 'No se encontró la cuenta con este número celular.' }
  }

  if (!cliente.borndate) {
    return {
      success: false,
      error: 'Esta cuenta no tiene fecha de cumpleaños configurada. Por favor utiliza la opción de WhatsApp.',
    }
  }

  if (cliente.borndate !== fechaNacimientoInput) {
    return {
      success: false,
      error: 'La fecha de cumpleaños no coincide con la registrada en tu cuenta.',
    }
  }

  // 2. Encriptar y actualizar
  const encryptedHash = hashPassword(nuevaPasswordInput)
  const { error: updateErr } = await adminSupabase
    .from('clientes_club')
    .update({ password_hash: encryptedHash })
    .eq('telefono', cleanPhone)

  if (updateErr) {
    return { success: false, error: `Error al actualizar: ${updateErr.message}` }
  }

  return { success: true, message: '¡Identidad verificada y contraseña actualizada con éxito!' }
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

  // Consultar historial de canjes de lealtad
  const { data: canjes } = await supabase
    .from('canjes_lealtad')
    .select('*')
    .eq('telefono', cleanPhone)
    .order('created_at', { ascending: false })

  const historialCanjes = canjes || []
  const totalCanjesRealizados = historialCanjes.length

  const pedidosPorMeta = configLealtad?.meta1_pedidos || 6
  const recompensasGanadas = Math.floor(pedidosEntregados / pedidosPorMeta)
  const canjesDisponibles = Math.max(0, recompensasGanadas - totalCanjesRealizados)

  const borndate = perfilClub?.borndate || null
  let esMesCumpleanos = false

  if (borndate) {
    try {
      const hoy = new Date()
      const mesActual = hoy.getMonth() + 1 // 1 a 12
      const [_, mesCumple] = borndate.split('-')
      if (parseInt(mesCumple, 10) === mesActual) {
        esMesCumpleanos = true
      }
    } catch (e) {}
  }

  return {
    telefono: cleanPhone,
    nombreCliente,
    email,
    codigoReferido,
    puntos,
    fechaRegistro,
    borndate,
    esMesCumpleanos,
    totalPedidos,
    pedidosEntregados,
    totalInvertido,
    nivelLealtad,
    proximaRecompensa,
    pedidosFaltantesParaRecompensa,
    canjesDisponibles,
    totalCanjesRealizados,
    historialCanjes: historialCanjes.map((c) => ({
      id: c.id,
      recompensa: c.recompensa,
      created_at: c.created_at,
    })),
    pedidosHistorial,
    lealtadConfig: configLealtad,
  }
}

export async function actualizarCumpleanosCliente(telefono: string, fechaCumpleanos: string) {
  try {
    const adminSupabase = createAdminClient()
    const cleanPhone = telefono.replace(/\D/g, '')

    const { error } = await adminSupabase
      .from('clientes_club')
      .update({ borndate: fechaCumpleanos })
      .eq('telefono', cleanPhone)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al guardar fecha de cumpleaños.' }
  }
}
