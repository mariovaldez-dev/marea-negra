'use client'

import { useCallback } from 'react'

export function useWhatsAppSupport() {
  const openWhatsApp = useCallback((customMessage?: string) => {
    const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
    const cleanNumber = rawNumber.replace(/\D/g, '')
    const targetPhone = cleanNumber.startsWith('52') ? cleanNumber : `52${cleanNumber}`
    const defaultMsg = 'Hola Marea Negra, solicito información sobre mis datos personales y ejercer mis derechos de privacidad (BAJA CLUB).'
    const text = encodeURIComponent(customMessage || defaultMsg)

    if (typeof window !== 'undefined') {
      const url = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${text}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const solicitarBajaPrivacidad = useCallback(() => {
    openWhatsApp('Hola Marea Negra, solicito ejercer mis derechos ARCO para la BAJA de mis datos personales del Club de Lealtad.')
  }, [openWhatsApp])

  return {
    openWhatsApp,
    solicitarBajaPrivacidad,
  }
}
