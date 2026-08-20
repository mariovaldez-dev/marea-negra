import { Platillo } from '@/lib/types/database'

export const DIAS_SEMANA_PROMO = [
  { id: 'lunes', label: 'Lun', nombre: 'Lunes' },
  { id: 'martes', label: 'Mar', nombre: 'Martes' },
  { id: 'miercoles', label: 'Mié', nombre: 'Miércoles' },
  { id: 'jueves', label: 'Jue', nombre: 'Jueves' },
  { id: 'viernes', label: 'Vie', nombre: 'Viernes' },
  { id: 'sabado', label: 'Sáb', nombre: 'Sábado' },
  { id: 'domingo', label: 'Dom', nombre: 'Domingo' },
]

/**
 * Convierte de forma segura cualquier valor numérico o string de PostgreSQL (DECIMAL/NUMERIC) a número JS.
 */
export function parsePrice(val: number | string | null | undefined): number {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  const parsed = parseFloat(String(val))
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Formatea un precio a entero sin decimales (ej. 320).
 */
export function formatPrice(val: number | string | null | undefined): string {
  return parsePrice(val).toFixed(0)
}

/**
 * Normaliza y convierte de forma segura cualquier formato de array de días (Postgres text[], JSON string, CSV o Array).
 */
export function parseDiasPromo(dias: any): string[] {
  if (!dias) return []
  if (Array.isArray(dias)) {
    return dias
      .map((d) =>
        String(d)
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
      )
      .filter(Boolean)
  }
  if (typeof dias === 'string') {
    // Manejar formato Postgres "{lunes,viernes}" o JSON '["lunes"]' o separado por comas
    const cleaned = dias.replace(/^\{|\}$|^\[|\]$/g, '')
    if (!cleaned.trim()) return []
    return cleaned
      .split(',')
      .map((d) =>
        d
          .replace(/["']/g, '')
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
      )
      .filter(Boolean)
  }
  return []
}

/**
 * Obtiene el identificador del día de la semana actual en la zona horaria de Sinaloa (America/Mazatlan).
 */
export function getCurrentDayId(): string {
  try {
    const formatter = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mazatlan',
      weekday: 'long',
    })
    const dayStr = formatter.format(new Date()).toLowerCase()
    
    // Normalizar acentos (miércoles -> miercoles, sábado -> sabado)
    return dayStr
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  } catch (e) {
    const dayIndex = new Date().getDay() // 0 = Domingo, 1 = Lunes, etc.
    const mapIndex: Record<number, string> = {
      0: 'domingo',
      1: 'lunes',
      2: 'martes',
      3: 'miercoles',
      4: 'jueves',
      5: 'viernes',
      6: 'sabado',
    }
    return mapIndex[dayIndex] || 'lunes'
  }
}

/**
 * Determina si un platillo está configurado como promocional (por switch es_promocion, etiqueta o precio anterior).
 */
export function isPromoItem(platillo: Partial<Platillo>): boolean {
  if (!platillo) return false
  const pAnterior = parsePrice(platillo.precio_anterior)
  const pActual = parsePrice(platillo.precio)
  const esPromoRaw = platillo.es_promocion
  const esPromoFlag =
    esPromoRaw === true ||
    String(esPromoRaw).toLowerCase() === 'true' ||
    String(esPromoRaw) === 't' ||
    String(esPromoRaw) === '1'

  return Boolean(
    esPromoFlag ||
    (platillo.etiqueta_promo && platillo.etiqueta_promo.trim() !== '') ||
    (pAnterior > pActual && pAnterior > 0)
  )
}

/**
 * Determina si la promoción de un platillo se encuentra activa el día de HOY.
 */
export function isPromoActiveToday(platillo: Partial<Platillo>): boolean {
  if (!isPromoItem(platillo)) return false

  const dias = parseDiasPromo(platillo.dias_promo)
  // Si no se configuraron días específicos o está vacío, aplica todos los días por defecto
  if (dias.length === 0) return true

  const today = getCurrentDayId().toLowerCase().trim()

  return dias.some(
    (d) => d === today || d === today.substring(0, 3) || today.startsWith(d)
  )
}

/**
 * Genera de forma inteligente el texto dinámico del banner por días.
 * Ej: "2x1 · TODOS LOS VIERNES", "OFERTA LUNES Y MARTES", "OFERTA FIN DE SEMANA"
 */
export function getPromoBannerText(platillo: Partial<Platillo>): string {
  if (!isPromoItem(platillo)) return ''

  const dias = parseDiasPromo(platillo.dias_promo)
  let textoDias = ''

  if (dias.length === 0 || dias.length === 7) {
    textoDias = 'TODOS LOS DÍAS'
  } else if (dias.length === 1) {
    const diaObj = DIAS_SEMANA_PROMO.find((d) => d.id === dias[0])
    textoDias = `TODOS LOS ${diaObj?.nombre.toUpperCase() || dias[0].toUpperCase()}S`
  } else if (dias.length === 2 && dias.includes('sabado') && dias.includes('domingo')) {
    textoDias = 'FIN DE SEMANA'
  } else if (dias.length === 2 && dias.includes('lunes') && dias.includes('martes')) {
    textoDias = 'LUNES Y MARTES'
  } else {
    const nombres = dias
      .map((dId) => DIAS_SEMANA_PROMO.find((d) => d.id === dId)?.nombre.toUpperCase())
      .filter(Boolean)

    if (nombres.length === 2) {
      textoDias = `${nombres[0]} Y ${nombres[1]}`
    } else if (nombres.length > 2) {
      const ult = nombres.pop()
      textoDias = `${nombres.join(', ')} Y ${ult}`
    } else {
      textoDias = 'DÍAS SELECCIONADOS'
    }
  }

  const customLabel = platillo.etiqueta_promo?.trim()
  if (customLabel) {
    return `${customLabel.toUpperCase()} · ${textoDias}`
  }

  return `OFERTA ${textoDias}`
}
