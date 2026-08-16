'use client'

import { useState, useEffect } from 'react'
import { app } from '@/lib/firebase/client'
import { getMessaging, getToken, onMessage, isSupported as firebaseIsSupported } from 'firebase/messaging'

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [toastMessage, setToastMessage] = useState<{title: string, body: string} | null>(null)
  const [messagingInstance, setMessagingInstance] = useState<any>(null)

  useEffect(() => {
    // Verificar si el navegador soporta Service Workers y Notifications
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      firebaseIsSupported().then((supported) => {
        if (supported && app) {
          setIsSupported(true)
          setPermission(Notification.permission)
          setMessagingInstance(getMessaging(app))
        }
      })
    }
  }, [])

  useEffect(() => {
    if (isSupported && messagingInstance && permission === 'granted') {
      const unsubscribe = onMessage(messagingInstance, (payload) => {
        console.log('[useNotifications] Foreground message received: ', payload)
        
        // Extraer título y body (puede venir en notification o data)
        const title = payload.notification?.title || payload.data?.title || 'Nuevo Mensaje'
        const body = payload.notification?.body || payload.data?.body || ''
        
        // Mostrar en estado interno para Toast (podrías usar react-hot-toast si lo prefieres)
        setToastMessage({ title, body })

        // Auto-ocultar toast después de 5s
        setTimeout(() => setToastMessage(null), 5000)
      })

      return () => {
        unsubscribe()
      }
    }
  }, [isSupported, messagingInstance, permission])

  const requestPermission = async () => {
    if (!isSupported || !messagingInstance) return null

    try {
      // 1. Pedir permiso
      const currentPermission = await Notification.requestPermission()
      setPermission(currentPermission)

      if (currentPermission !== 'granted') {
        console.warn('Permiso de notificaciones denegado.')
        return null
      }

      // 2. Construir URL con configuración de Firebase para el Service Worker
      const swUrl = new URL('/firebase-messaging-sw.js', window.location.href)
      swUrl.searchParams.append('apiKey', process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '')
      swUrl.searchParams.append('authDomain', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '')
      swUrl.searchParams.append('projectId', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '')
      swUrl.searchParams.append('storageBucket', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '')
      swUrl.searchParams.append('messagingSenderId', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '')
      swUrl.searchParams.append('appId', process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '')

      const swRegistration = await navigator.serviceWorker.register(swUrl.toString())

      // 3. Obtener Token
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      const currentToken = await getToken(messagingInstance, { 
        vapidKey,
        serviceWorkerRegistration: swRegistration
      })

      if (currentToken) {
        // 3. Guardar token en el backend
        await fetch('/api/fcm/save-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken })
        })

        return currentToken
      } else {
        console.warn('No se pudo obtener el token de registro FCM. Solicita permiso para generar uno.')
        return null
      }
    } catch (error) {
      console.error('Error al pedir permiso u obtener token:', error)
      return null
    }
  }

  return {
    isSupported,
    permission,
    requestPermission,
    toastMessage,
    clearToast: () => setToastMessage(null)
  }
}
