/**
 * Utilidades centralizadas de fecha y zona horaria para Marea Negra.
 * La zona horaria oficial del negocio es Mazatlán / Culiacán, Sinaloa (America/Mazatlan - UTC-7).
 */

export const BUSINESS_TIMEZONE = 'America/Mazatlan'

/**
 * Obtiene la fecha en formato ISO estándar 'YYYY-MM-DD' en la zona horaria del negocio (Sinaloa).
 * Si no se pasa argumento, devuelve la fecha de "HOY" en Sinaloa.
 * Si se pasa un string ISO en UTC (ej. Supabase `created_at`), lo convierte correctamente a la fecha local en Sinaloa.
 */
export function getMazatlanDateString(dateInput?: string | Date | null): string {
  try {
    const d = !dateInput ? new Date() : typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) {
      return ''
    }
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: BUSINESS_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(d)
  } catch (e) {
    console.error('Error al formatear fecha Mazatlán:', e)
    return new Date().toISOString().slice(0, 10)
  }
}

/**
 * Comprueba si una fecha o timestamp UTC (como `pedido.created_at`) corresponde al día de HOY en Sinaloa.
 */
export function isTodayInMazatlan(dateInput: string | Date | null): boolean {
  if (!dateInput) return false
  const orderDateStr = getMazatlanDateString(dateInput)
  const todayStr = getMazatlanDateString()
  return orderDateStr === todayStr
}

/**
 * Formatea una fecha o timestamp para visualización legible en español (es-MX) en la zona horaria de Sinaloa.
 */
export function formatMazatlanDate(
  dateInput: string | Date | null,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }
): string {
  if (!dateInput) return ''
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: BUSINESS_TIMEZONE,
      ...options,
    }).format(d)
  } catch (e) {
    return ''
  }
}

/**
 * Formatea una fecha y hora completa en español (es-MX) en la zona horaria de Sinaloa.
 */
export function formatMazatlanDateTime(
  dateInput: string | Date | null,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }
): string {
  if (!dateInput) return ''
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: BUSINESS_TIMEZONE,
      ...options,
    }).format(d)
  } catch (e) {
    return ''
  }
}
