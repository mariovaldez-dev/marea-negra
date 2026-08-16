'use client'

import React from 'react'
import type { DiaHorario } from '@/lib/actions/negocioEstado'
import { Lock, Clock, MessageCircle, X, Sparkles, Calendar } from 'lucide-react'

const FALLBACK_HORARIOS: DiaHorario[] = [
  { id: 'lunes', nombre: 'Lunes', abierto: true, apertura: '11:00', cierre: '20:00' },
  { id: 'martes', nombre: 'Martes', abierto: true, apertura: '11:00', cierre: '20:00' },
  { id: 'miercoles', nombre: 'Miércoles', abierto: true, apertura: '11:00', cierre: '20:00' },
  { id: 'jueves', nombre: 'Jueves', abierto: true, apertura: '11:00', cierre: '20:00' },
  { id: 'viernes', nombre: 'Viernes', abierto: true, apertura: '11:00', cierre: '21:00' },
  { id: 'sabado', nombre: 'Sábado', abierto: true, apertura: '11:00', cierre: '21:00' },
  { id: 'domingo', nombre: 'Domingo', abierto: true, apertura: '11:00', cierre: '20:00' },
]

interface RestauranteCerradoModalProps {
  mensajeCerrado?: string
  horariosDias?: DiaHorario[]
  onClose: () => void
}

export function RestauranteCerradoModal({
  mensajeCerrado,
  horariosDias = FALLBACK_HORARIOS,
  onClose,
}: RestauranteCerradoModalProps) {
  // Identificar el día actual en Sinaloa (Mazatlán)
  const getMazatlanDayId = () => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Mazatlan',
        weekday: 'long',
      }
      const dayStr = new Intl.DateTimeFormat('es-MX', options).format(new Date()).toLowerCase()
      if (dayStr.includes('mar')) return 'martes'
      if (dayStr.includes('mié') || dayStr.includes('mie')) return 'miercoles'
      if (dayStr.includes('jue')) return 'jueves'
      if (dayStr.includes('vie')) return 'viernes'
      if (dayStr.includes('sáb') || dayStr.includes('sab')) return 'sabado'
      if (dayStr.includes('dom')) return 'domingo'
      return 'lunes'
    } catch (e) {
      return 'lunes'
    }
  }

  const todayId = getMazatlanDayId()

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#050404] bg-dots-pattern border-2 border-coral/50 rounded-3xl w-full max-w-lg p-6 md:p-8 gold-border-corner shadow-2xl relative text-blanco flex flex-col gap-6 text-center">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon border border-arena/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-coral/15 border-2 border-coral/40 text-coral flex items-center justify-center shadow-[0_0_20px_rgba(232,67,10,0.3)] animate-pulse">
            <Lock className="w-8 h-8" />
          </div>

          <span className="text-[10px] font-sans font-bold tracking-widest text-coral uppercase bg-coral/10 px-3 py-1 rounded-full border border-coral/30">
            🔴 FUERA DE HORARIO DE SERVICIO
          </span>

          <h2 className="font-display text-3xl md:text-4xl text-blanco tracking-wide">
            RESTAURANTE CERRADO POR EL MOMENTO
          </h2>

          <p className="font-serif italic text-sm text-arena/80 leading-relaxed max-w-md">
            {mensajeCerrado ||
              'Por el momento nuestra cocina se encuentra cerrada y no estamos recibiendo nuevos pedidos en línea.'}
          </p>
        </div>

        {/* TABLA DE HORARIOS DE ATENCIÓN */}
        <div className="bg-[#111111] border border-arena/15 rounded-2xl p-4 flex flex-col gap-3 text-xs font-sans">
          <div className="flex items-center justify-between border-b border-arena/10 pb-2 text-turquesa font-bold">
            <span className="flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Calendar className="w-4 h-4 text-turquesa" />
              <span>Horarios de Atención (Mazatlán):</span>
            </span>
            <span className="text-[10px] text-arena/40 font-mono">HOY DESTACADO</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {horariosDias.map((dia) => {
              const isToday = dia.id === todayId
              return (
                <div
                  key={dia.id}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all ${isToday
                    ? 'bg-turquesa/15 border border-turquesa/40 text-blanco font-bold'
                    : 'text-arena/70'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    {isToday && <span className="w-2 h-2 rounded-full bg-turquesa animate-ping" />}
                    <span>{dia.nombre}</span>
                  </span>

                  {dia.abierto ? (
                    <span className="font-mono text-[11px] text-oro font-semibold">
                      {dia.apertura} - {dia.cierre} hrs
                    </span>
                  ) : (
                    <span className="text-coral text-[10px] font-bold uppercase">Cerrado</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ACCIONES DEL MODAL */}
        <div className="flex flex-col gap-3 pt-2">
          <a
            href="https://wa.me/526691234567?text=Hola%20Marea%20Negra!%20Quisiera%20consultar%20su%20horario%20de%20atencion%20y%20proxima%20apertura."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-coral text-blanco font-sans font-bold text-xs tracking-wider py-4 rounded-xl hover:bg-white hover:text-negro transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <MessageCircle className="w-4 h-4 fill-blanco hover:fill-negro" />
            <span>ENVIAR MENSAJE DE CONSULTA A WHATSAPP</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full bg-carbon border border-arena/20 hover:border-turquesa text-blanco font-sans font-bold text-xs py-3.5 rounded-xl transition-all"
          >
            EXPLORAR MENÚ EN MODO CONSULTA
          </button>
        </div>
      </div>
    </div>
  )
}
