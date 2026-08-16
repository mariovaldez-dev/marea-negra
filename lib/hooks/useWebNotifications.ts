'use client'

import { useState, useEffect } from 'react'

export function useWebNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)

      // Cargar voces en español de Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices()
        }
      }

      // Registrar Service Worker para notificaciones nativas
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Service Worker de Notificaciones registrado:', reg.scope)
          })
          .catch((err) => {
            console.warn('Service worker registration failed:', err)
          })
      }
    }
  }, [])

  // Reproducir boz de alerta "¡Nuevo pedido recibido!" con Web Speech API
  const speakNewOrderVoice = (times = 3) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    try {
      window.speechSynthesis.cancel() // Limpiar discursos previos

      const text = '¡Atención! ¡Nuevo pedido recibido en Marea Negra! ¡Nuevo pedido!'
      let currentIteration = 0

      const speakNext = () => {
        if (currentIteration >= times) return

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'es-MX'
        utterance.rate = 1.05
        utterance.pitch = 1.15
        utterance.volume = 1.0

        const voices = window.speechSynthesis.getVoices()
        const esVoice =
          voices.find((v) => v.lang === 'es-MX' || v.lang === 'es_MX') ||
          voices.find((v) => v.lang.startsWith('es'))

        if (esVoice) utterance.voice = esVoice

        utterance.onend = () => {
          currentIteration++
          if (currentIteration < times) {
            setTimeout(speakNext, 700)
          }
        }

        window.speechSynthesis.speak(utterance)
      }

      speakNext()
    } catch (e) {
      console.warn('Error en Web Speech API:', e)
    }
  }

  // Reproducir campana de restaurante usando Web Audio API
  const playKitchenBellSound = () => {
    if (typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      const now = ctx.currentTime

      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(880, now)

      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(1760, now)

      gain.gain.setValueAtTime(0.7, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 1.2)
      osc2.stop(now + 1.2)

      setTimeout(() => {
        try {
          const now2 = ctx.currentTime
          const osc3 = ctx.createOscillator()
          const gain2 = ctx.createGain()
          osc3.type = 'sine'
          osc3.frequency.setValueAtTime(1108.73, now2)
          gain2.gain.setValueAtTime(0.8, now2)
          gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 1.5)
          osc3.connect(gain2)
          gain2.connect(ctx.destination)
          osc3.start(now2)
          osc3.stop(now2 + 1.5)
        } catch (e) {}
      }, 250)
    } catch (err) {
      console.warn('Audio Context error:', err)
    }
  }

  // Disparar ambas alertas: Campana + Voz Parlante + Notificación Nativa del Sistema
  const triggerOrderAlarm = (title?: string, body?: string, url = '/admin/pedidos') => {
    playKitchenBellSound()
    setTimeout(() => {
      speakNewOrderVoice(3)
    }, 800)

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title || '¡NUEVO PEDIDO RECIBIDO! 🦐', {
            body: body || 'Se ha registrado una nueva comanda en Marea Negra.',
            icon: '/favicon.ico',
            vibrate: [300, 100, 300, 100, 500],
            data: { url },
            tag: 'marea-negra-pedido-nuevo',
            renotify: true,
          } as any)
        })
      } else {
        const notif = new Notification(title || '¡NUEVO PEDIDO RECIBIDO! 🦐', {
          body: body || 'Se ha registrado una nueva comanda en Marea Negra.',
          icon: '/favicon.ico',
        })
        notif.onclick = () => {
          window.focus()
          window.location.href = url
        }
      }
    }
  }

  const requestPermission = async () => {
    if (!isSupported) {
      alert('Tu navegador no soporta notificaciones Web Push.')
      return false
    }

    try {
      const res = await Notification.requestPermission()
      setPermission(res)
      if (res === 'granted') {
        setIsSubscribed(true)
        triggerOrderAlarm(
          '🔔 ¡ALERTAS Y VOZ ACTIVADAS!',
          'Recibirás aviso de voz "¡Nuevo pedido recibido!" y campana de cocina al llegar una comanda.',
          '/admin/dashboard'
        )
        return true
      }
      return false
    } catch (e) {
      console.error('Error al solicitar permiso de notificaciones:', e)
      return false
    }
  }

  return {
    permission,
    isSupported,
    isSubscribed,
    requestPermission,
    triggerOrderAlarm,
    playKitchenBellSound,
    speakNewOrderVoice,
  }
}
