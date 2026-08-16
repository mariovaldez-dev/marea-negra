/**
 * Obtiene el número de WhatsApp del negocio desde la variable de entorno NEXT_PUBLIC_WHATSAPP_NUMBER.
 * Si no está definida en .env.local, utiliza el fallback por defecto '526671234567'.
 */
export function getWhatsAppNumber(): string {
  const envNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  if (!envNumber) return '526671234567'
  const clean = envNumber.replace(/\D/g, '')
  return clean.startsWith('52') ? clean : `52${clean}`
}

/**
 * Genera una URL wa.me lista para enviar mensajes directamente por WhatsApp al número del restaurante.
 */
export function generateWhatsAppMessageUrl(message: string, customPhone?: string): string {
  const phone = customPhone ? (customPhone.startsWith('52') ? customPhone : `52${customPhone}`) : getWhatsAppNumber()
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
