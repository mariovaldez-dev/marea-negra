'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { BellRing, BellOff, Loader2 } from 'lucide-react'

export function NotificationButton() {
  const { isSupported, permission, requestPermission } = useNotifications()
  const [isLoading, setIsLoading] = useState(false)
  
  // No mostrar el botón si no es compatible o si todavía no determinamos el estado
  if (!isSupported) {
    return null
  }

  const handleActivate = async () => {
    setIsLoading(true)
    const token = await requestPermission()
    setIsLoading(false)
    if (token) {
      alert('¡Notificaciones activadas con éxito!')
    }
  }

  if (permission === 'granted') {
    return (
      <button
        onClick={handleActivate}
        disabled={isLoading}
        className="flex items-center w-full gap-2 px-3 py-2 mt-4 text-sm font-medium transition-colors border rounded-md text-turquesa border-turquesa/30 bg-turquesa/5 hover:bg-turquesa/10 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
        <span>Actualizar Push</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleActivate}
      disabled={isLoading}
      className="flex items-center w-full gap-2 px-3 py-2 mt-4 text-sm font-medium transition-colors border rounded-md text-coral border-coral/30 bg-coral/5 hover:bg-coral/10 disabled:opacity-50"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellOff className="w-4 h-4" />}
      <span>Activar notificaciones</span>
    </button>
  )
}
