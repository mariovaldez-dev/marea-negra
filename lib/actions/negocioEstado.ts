'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface DiaHorario {
  id: string // 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
  nombre: string
  abierto: boolean
  apertura: string // HH:mm
  cierre: string // HH:mm
}

export interface ConfigHorariosNegocio {
  abierto_manual: boolean
  modo_automatico: boolean
  mensaje_cerrado: string
  horarios_dias: DiaHorario[]
}

export interface EstadoRestaurante {
  abierto: boolean
  mensaje_cerrado: string
  es_modo_automatico?: boolean
  horarios_dias?: DiaHorario[]
}

const CONFIG_CUPON_KEY = 'CONFIG_NEGOCIO_ESTADO'
const CONFIG_CUPON_FULL_KEY = 'CONFIG_NEGOCIO_FULL_JSON'

const DEFAULT_HORARIOS: DiaHorario[] = [
  { id: 'lunes', nombre: 'Lunes', abierto: true, apertura: '11:00', cierre: '20:00' },
  { id: 'martes', nombre: 'Martes', abierto: true, apertura: '11:00', cierre: '20:00' },
  { id: 'miercoles', nombre: 'Miércoles', abierto: true, apertura: '11:00', cierre: '20:00' },
  { id: 'jueves', nombre: 'Jueves', abierto: true, apertura: '11:00', cierre: '20:00' },
  { id: 'viernes', nombre: 'Viernes', abierto: true, apertura: '11:00', cierre: '21:00' },
  { id: 'sabado', nombre: 'Sábado', abierto: true, apertura: '11:00', cierre: '21:00' },
  { id: 'domingo', nombre: 'Domingo', abierto: true, apertura: '11:00', cierre: '20:00' },
]

export async function getDefaultHorarios(): Promise<DiaHorario[]> {
  return DEFAULT_HORARIOS
}

// Función auxiliar para determinar si la hora actual de Mazatlán cae dentro del horario del día
function calcularAperturaPorHorario(horarios: DiaHorario[]): boolean {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Mazatlan',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
    const formatter = new Intl.DateTimeFormat('es-MX', options)
    const parts = formatter.formatToParts(new Date())

    const weekdayStr = (parts.find((p) => p.type === 'weekday')?.value || '').toLowerCase()
    const hourStr = parts.find((p) => p.type === 'hour')?.value || '00'
    const minuteStr = parts.find((p) => p.type === 'minute')?.value || '00'

    const currentTimeMin = parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10)

    // Identificar día de la semana
    let dayId = 'lunes'
    if (weekdayStr.includes('mar')) dayId = 'martes'
    else if (weekdayStr.includes('mié') || weekdayStr.includes('mie')) dayId = 'miercoles'
    else if (weekdayStr.includes('jue')) dayId = 'jueves'
    else if (weekdayStr.includes('vie')) dayId = 'viernes'
    else if (weekdayStr.includes('sáb') || weekdayStr.includes('sab')) dayId = 'sabado'
    else if (weekdayStr.includes('dom')) dayId = 'domingo'

    const configDia = horarios.find((h) => h.id === dayId)
    if (!configDia || !configDia.abierto) return false

    const [apHour, apMin] = configDia.apertura.split(':').map((n) => parseInt(n, 10))
    const [ciHour, ciMin] = configDia.cierre.split(':').map((n) => parseInt(n, 10))

    const aperturaMin = apHour * 60 + apMin
    const cierreMin = ciHour * 60 + ciMin

    return currentTimeMin >= aperturaMin && currentTimeMin <= cierreMin
  } catch (e) {
    return true
  }
}

// Obtener la configuración completa y calcular estado en tiempo real (Mazatlán)
export async function getConfigHorariosNegocio(): Promise<ConfigHorariosNegocio> {
  const supabase = createServerClient()

  // 1. Intentar desde tabla 'configuracion_negocio'
  try {
    const { data, error } = await supabase
      .from('configuracion_negocio')
      .select('*')
      .eq('id', 1)
      .single()

    if (!error && data) {
      return {
        abierto_manual: data.abierto !== false,
        modo_automatico: data.modo_automatico === true,
        mensaje_cerrado:
          data.mensaje_cerrado ||
          'Por el momento nuestro restaurante se encuentra cerrado. Consulta nuestro horario de atención o regresa pronto.',
        horarios_dias: Array.isArray(data.horarios_dias) ? data.horarios_dias : DEFAULT_HORARIOS,
      }
    }
  } catch (e) {}

  // 2. Fallback dual desde 'cupones'
  try {
    const { data: cuponConfig } = await supabase
      .from('cupones')
      .select('*')
      .eq('codigo', CONFIG_CUPON_FULL_KEY)
      .single()

    if (cuponConfig && cuponConfig.notas) {
      const parsed = JSON.parse(cuponConfig.notas)
      return {
        abierto_manual: parsed.abierto_manual !== false,
        modo_automatico: parsed.modo_automatico === true,
        mensaje_cerrado:
          parsed.mensaje_cerrado ||
          'Por el momento nuestro restaurante se encuentra cerrado. Consulta nuestro horario de atención o regresa pronto.',
        horarios_dias: Array.isArray(parsed.horarios_dias) ? parsed.horarios_dias : DEFAULT_HORARIOS,
      }
    }
  } catch (e) {}

  return {
    abierto_manual: true,
    modo_automatico: false,
    mensaje_cerrado:
      'Por el momento nuestro restaurante se encuentra cerrado. Consulta nuestro horario de atención o regresa pronto.',
    horarios_dias: DEFAULT_HORARIOS,
  }
}

// Obtener el estado calculado (Abierto o Cerrado) para las vistas cliente / admin
export async function getEstadoRestaurante(): Promise<EstadoRestaurante> {
  const config = await getConfigHorariosNegocio()

  let isAbierto = config.abierto_manual

  if (config.modo_automatico) {
    isAbierto = config.abierto_manual && calcularAperturaPorHorario(config.horarios_dias)
  }

  return {
    abierto: isAbierto,
    mensaje_cerrado: config.mensaje_cerrado,
    es_modo_automatico: config.modo_automatico,
    horarios_dias: config.horarios_dias,
  }
}

// Guardar la configuración completa de horarios y switch manual
export async function saveConfigHorariosNegocio(config: ConfigHorariosNegocio) {
  const supabase = createServerClient()

  let mainSaved = false

  // 1. Guardar en 'configuracion_negocio'
  try {
    const { error: errConfig } = await supabase.from('configuracion_negocio').upsert(
      {
        id: 1,
        abierto: config.abierto_manual,
        modo_automatico: config.modo_automatico,
        mensaje_cerrado: config.mensaje_cerrado,
        horarios_dias: config.horarios_dias,
      },
      { onConflict: 'id' }
    )
    if (errConfig) {
      console.error('❌ Error Supabase configuracion_negocio:', errConfig)
    } else {
      mainSaved = true
    }
  } catch (err) {
    console.error('❌ Error capturado en configuracion_negocio:', err)
  }

  // 2. Guardar respaldo dual en la tabla 'cupones' (código reservado 'CONFIG_NEGOCIO_FULL_JSON')
  try {
    const isCalculatedOpen = config.modo_automatico
      ? config.abierto_manual && calcularAperturaPorHorario(config.horarios_dias)
      : config.abierto_manual

    const { error: err1 } = await supabase.from('cupones').upsert(
      {
        codigo: CONFIG_CUPON_FULL_KEY,
        descuento_porcentaje: isCalculatedOpen ? 100 : 0,
        activo: isCalculatedOpen,
        notas: JSON.stringify(config),
        usos_maximos: 999999,
        fecha_expiracion: null,
      },
      { onConflict: 'codigo' }
    )
    if (err1) throw new Error(err1.message)

    // Respaldo secundario para compatibilidad estricta
    const { error: err2 } = await supabase.from('cupones').upsert(
      {
        codigo: CONFIG_CUPON_KEY,
        descuento_porcentaje: isCalculatedOpen ? 100 : 0,
        activo: isCalculatedOpen,
        usos_maximos: 999999,
        fecha_expiracion: null,
      },
      { onConflict: 'codigo' }
    )
    if (err2) throw new Error(err2.message)
    
    // Si cupones se guardó bien, consideramos éxito aunque negocio fallara (fallback)
    mainSaved = true 
  } catch (errCupon: any) {
    console.error('❌ Aviso en respaldo dual cupones:', errCupon.message)
  }

  if (!mainSaved) {
    throw new Error('No se pudo guardar la configuración en la base de datos ni en el fallback. Verifica que las tablas configuracion_negocio o cupones existan y tengan políticas de RLS correctas.')
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/horarios')
  revalidatePath('/admin/menu')
  revalidatePath('/pedir')
  revalidatePath('/')
  return { success: true }
}

// Cambiar el estado de abierto/cerrado manual (1 clic desde el header admin)
export async function toggleEstadoRestaurante(abierto: boolean, mensaje_cerrado?: string) {
  const currentConfig = await getConfigHorariosNegocio()
  const updatedConfig: ConfigHorariosNegocio = {
    ...currentConfig,
    abierto_manual: abierto,
    mensaje_cerrado: mensaje_cerrado || currentConfig.mensaje_cerrado,
  }
  return await saveConfigHorariosNegocio(updatedConfig)
}
