'use client'

import React from 'react'
import { useWebNotifications } from '@/lib/hooks/useWebNotifications'
import { BellRing, CheckCircle2, Volume2, Megaphone, Sparkles } from 'lucide-react'

export function NotificationPermissionBanner() {
  const {
    permission,
    isSupported,
    requestPermission,
    playKitchenBellSound,
    speakNewOrderVoice,
    triggerOrderAlarm,
  } = useWebNotifications()

  if (!isSupported) return null

  if (permission === 'granted') {
    return (
      <div className="bg-turquesa/10 border border-turquesa/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-turquesa shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-turquesa/20 rounded-xl">
            <BellRing className="w-6 h-6 text-turquesa animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>VOZ DE ALERTA Y CAMPANA ACTIVADAS EN ESTE DISPOSITIVO</span>
            </span>
            <p className="font-serif italic text-xs text-arena/80">
              Escucharás la voz 🗣️ <strong>"¡Atención! ¡Nuevo pedido recibido!"</strong> y campana al entrar comandas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={playKitchenBellSound}
            className="px-3.5 py-2 bg-carbon border border-turquesa/40 text-blanco font-sans font-bold text-xs rounded-xl hover:bg-turquesa hover:text-negro transition-all flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5 text-oro" />
            <span>CAMPANA 🔔</span>
          </button>

          <button
            type="button"
            onClick={() => speakNewOrderVoice(2)}
            className="px-3.5 py-2 bg-coral text-blanco font-sans font-bold text-xs rounded-xl hover:bg-blanco hover:text-negro transition-all flex items-center gap-1.5 shadow-lg"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>PROBAR VOZ 🗣️</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#050404] bg-dots-pattern border border-oro/40 rounded-2xl p-6 gold-border-corner shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5 text-blanco">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-coral/20 border border-coral/40 rounded-2xl text-coral shadow-lg">
          <Megaphone className="w-7 h-7 animate-bounce" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ALERTAS CON VOZ Y NOTIFICACIÓN NATIVA DE NAVEGADOR</span>
          </span>
          <h3 className="font-display text-2xl text-blanco tracking-wide">
            ¿ACTIVAR VOZ PARLANTE Y AVISOS DE NUEVOS PEDIDOS?
          </h3>
          <p className="font-serif italic text-xs text-arena/80 max-w-xl">
            El sistema anunciará con voz parlante en español 🗣️ <strong>"¡Atención! ¡Nuevo pedido recibido!"</strong> y campana cada que ingrese una comanda a Marea Negra.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={requestPermission}
        className="w-full md:w-auto bg-turquesa text-negro font-sans font-bold text-xs tracking-wider px-6 py-4 rounded-xl hover:bg-blanco transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(42,191,191,0.4)] whitespace-nowrap active:scale-95"
      >
        <BellRing className="w-5 h-5 stroke-[2.5]" />
        <span>ACTIVAR VOZ Y AVISOS AHORA</span>
      </button>
    </div>
  )
}
