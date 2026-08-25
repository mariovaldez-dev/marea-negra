'use client'

import React, { useState } from 'react'
import { registrarResenaPedido } from '@/lib/actions/resenas'
import { useWhatsAppSupport } from '@/lib/hooks/useWhatsAppSupport'
import {
  Star,
  Sparkles,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  ExternalLink,
  ChevronRight,
  Heart,
  RotateCcw,
} from 'lucide-react'

interface ReviewRatingWidgetProps {
  pedidoId: number
  clienteNombre?: string
  clienteTelefono?: string
  folioPedido?: string
}

const MOTIVOS_INCONFORMIDAD = [
  '⏱️ Demora en la entrega',
  '🦐 Sabor o temperatura',
  '📦 Faltó un ingrediente / tostadas',
  '👨‍🍳 Atención recibida',
  'Otro motivo',
]

export function ReviewRatingWidget({
  pedidoId,
  clienteNombre = 'Cliente',
  clienteTelefono = '',
  folioPedido,
}: ReviewRatingWidgetProps) {
  const { openWhatsApp } = useWhatsAppSupport()

  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [motivo, setMotivo] = useState<string>('')
  const [comentario, setComentario] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [canalFinal, setCanalFinal] = useState<'google_maps' | 'whatsapp_soporte' | 'interno'>('interno')

  const activeRating = hoverRating || rating

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return '¡Una chulada de mariscos! 🦐🔥'
      case 4:
        return '¡Muy rico y fresco! 👍'
      case 3:
        return 'Aceptable, pero puede mejorar 🌊'
      case 2:
        return 'Hubo detalles a corregir 🛠️'
      case 1:
        return 'Lamentamos mucho la experiencia 😔'
      default:
        return 'Toca las estrellas para calificar'
    }
  }

  // 1. ENVIAR A GOOGLE MAPS (5 ESTRELLAS)
  const handleEnviarGoogleMaps = async () => {
    setSubmitting(true)
    try {
      await registrarResenaPedido({
        pedidoId,
        clienteTelefono,
        calificacion: 5,
        comentario,
        canalDestino: 'google_maps',
      })
      setCanalFinal('google_maps')
      setEnviado(true)

      // Abrir enlace oficial de Google Maps o búsqueda
      const mapsUrl =
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_REVIEW_URL ||
        'https://www.google.com/maps/search/?api=1&query=Marea+Negra+Aguachiles+Sinaloa'
      window.open(mapsUrl, '_blank')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // 2. ENVIAR A WHATSAPP DE GERENCIA (1 A 3 ESTRELLAS)
  const handleEnviarSoporteWhatsApp = async () => {
    setSubmitting(true)
    try {
      await registrarResenaPedido({
        pedidoId,
        clienteTelefono,
        calificacion: rating,
        motivo,
        comentario,
        canalDestino: 'whatsapp_soporte',
      })
      setCanalFinal('whatsapp_soporte')
      setEnviado(true)

      const folio = folioPedido || `#${pedidoId}`
      const mensaje = `🌊 *ATENCIÓN AL CLIENTE MAREA NEGRA* ⚠️
Hola, soy *${clienteNombre}*, recibí el pedido *${folio}* y tuve un detalle con mi orden:

📌 *Motivo:* ${motivo || 'Revisión de pedido'}
${comentario ? `📝 *Comentario:* ${comentario}\n` : ''}
Me gustaría que me apoyaran con una solución por favor.`

      openWhatsApp(mensaje)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // 3. REGISTRAR 4 ESTRELLAS DIRECTO
  const handleEnviarCuatroEstrellas = async () => {
    setSubmitting(true)
    try {
      await registrarResenaPedido({
        pedidoId,
        clienteTelefono,
        calificacion: 4,
        comentario,
        canalDestino: 'interno',
      })
      setCanalFinal('interno')
      setEnviado(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#080504] border-2 border-oro/30 rounded-3xl p-6 sm:p-8 gold-border-corner shadow-2xl relative overflow-hidden transition-all">
      <div className="absolute top-0 right-0 w-48 h-48 bg-oro/5 rounded-full filter blur-2xl pointer-events-none" />

      {/* ESTADO DE AGRADECIMIENTO ENVIADO */}
      {enviado ? (
        <div className="flex flex-col items-center text-center gap-3 py-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg">
            <Heart className="w-8 h-8 fill-current text-emerald-500 animate-pulse" />
          </div>

          <span className="text-xs font-sans font-bold uppercase tracking-widest text-turquesa">
            RETROALIMENTACIÓN RECIBIDA
          </span>
          <h3 className="font-display text-3xl sm:text-4xl text-negro dark:text-blanco tracking-wide">
            ¡MUCHAS GRACIAS POR TU OPINIÓN!
          </h3>

          <p className="font-serif italic text-sm text-negro/70 dark:text-arena/70 max-w-md">
            {canalFinal === 'google_maps'
              ? 'Tu reseña nos ayuda a seguir preparando los mejores mariscos de Sinaloa. ¡Te esperamos pronto!'
              : canalFinal === 'whatsapp_soporte'
              ? 'Nuestro equipo de gerencia ya tiene tu reporte para atenderte personalmente.'
              : 'Guardamos tus comentarios para seguir mejorando día con día.'}
          </p>

          <button
            onClick={() => setEnviado(false)}
            className="mt-2 text-xs font-sans font-bold text-arena/60 hover:text-oro flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Modificar mi calificación</span>
          </button>
        </div>
      ) : (
        /* FORMULARIO DE CALIFICACIÓN */
        <div className="flex flex-col items-center text-center gap-5">
          <div>
            <span className="text-[10px] sm:text-xs font-sans font-bold uppercase tracking-widest text-turquesa flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EXPERIENCIA MAREA NEGRA</span>
            </span>
            <h3 className="font-display text-2xl sm:text-4xl text-negro dark:text-blanco tracking-wide mt-1">
              ¿QUÉ TAL ESTUVIERON TUS MARISCOS?
            </h3>
          </div>

          {/* 5 ESTRELLAS / CAMARONES INTERACTIVOS */}
          <div className="flex items-center gap-2 sm:gap-3 py-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= activeRating
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 sm:p-2 transition-all transform hover:scale-125 focus:outline-none"
                  aria-label={`Calificar con ${star} estrellas`}
                >
                  <Star
                    className={`w-8 h-8 sm:w-10 sm:h-10 transition-all duration-200 ${
                      isFilled
                        ? 'text-oro fill-oro drop-shadow-[0_0_12px_rgba(201,168,76,0.6)]'
                        : 'text-arena/30 dark:text-arena/20 stroke-[1.5]'
                    }`}
                  />
                </button>
              )
            })}
          </div>

          {/* MENSAJE DINÁMICO SEGÚN ESTRELLAS */}
          <p
            className={`font-serif italic text-sm transition-all ${
              rating === 5
                ? 'text-oro font-bold text-base scale-105'
                : rating > 0 && rating <= 3
                ? 'text-coral font-bold'
                : 'text-negro/70 dark:text-arena/70'
            }`}
          >
            {getRatingLabel(activeRating)}
          </p>

          {/* CASO 1: 5 ESTRELLAS -> DESVÍO A GOOGLE MAPS */}
          {rating === 5 && (
            <div className="w-full max-w-md bg-[#F4F0E8] dark:bg-carbon border border-oro/30 rounded-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 shadow-xl">
              <div className="flex items-center justify-center gap-2 text-oro font-display text-lg">
                <Sparkles className="w-5 h-5" />
                <span>¡NOS ALEGRA UN MONTÓN!</span>
              </div>
              <p className="text-xs font-sans text-negro/80 dark:text-arena/80 leading-relaxed">
                ¿Nos apoyarías compartiendo tu experiencia en <strong>Google Maps</strong>? Ayudarás a que más amantes del marisco conozcan Marea Negra.
              </p>

              <button
                onClick={handleEnviarGoogleMaps}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-oro to-[#E5C158] text-negro font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg hover:shadow-oro/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Star className="w-4 h-4 fill-current" />
                    <span>PUBLICAR RESEÑA EN GOOGLE MAPS</span>
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* CASO 2: 4 ESTRELLAS -> AGRADECIMIENTO Y MEJORA */}
          {rating === 4 && (
            <div className="w-full max-w-md bg-[#F4F0E8] dark:bg-carbon border border-arena/20 rounded-2xl p-5 flex flex-col gap-3 animate-in fade-in shadow-lg">
              <p className="text-xs font-sans text-negro/80 dark:text-arena/80">
                ¡Gracias! ¿Hay algún detalle que te gustaría que mejoremos en tu próximo pedido?
              </p>
              <textarea
                rows={2}
                placeholder="Comentarios opcionales..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="w-full bg-white dark:bg-negro border border-arena/30 dark:border-arena/10 rounded-xl p-3 text-xs text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEnviarCuatroEstrellas}
                  disabled={submitting}
                  className="flex-1 bg-turquesa text-negro font-sans font-bold text-xs py-3 rounded-xl hover:bg-blanco transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ENVIAR OPINIÓN</span>
                </button>
                <button
                  onClick={handleEnviarGoogleMaps}
                  className="bg-carbon text-oro border border-oro/30 text-xs font-sans font-bold px-4 py-3 rounded-xl hover:bg-oro hover:text-negro transition-all flex items-center gap-1.5"
                  title="Ir a Google Maps"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Google Maps</span>
                </button>
              </div>
            </div>
          )}

          {/* CASO 3: 1 A 3 ESTRELLAS -> DESVÍO A WHATSAPP DE GERENCIA */}
          {rating >= 1 && rating <= 3 && (
            <div className="w-full max-w-md bg-coral/5 border border-coral/30 rounded-2xl p-5 flex flex-col gap-4 text-left animate-in fade-in zoom-in-95 shadow-xl">
              <div className="flex items-center gap-2 text-coral font-sans font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>QUEREMOS RESOLVERLO CONTIGO DE INMEDIATO</span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-sans font-bold text-negro/80 dark:text-arena/90">
                  ¿Qué inconveniente ocurrió con tu orden? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {MOTIVOS_INCONFORMIDAD.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMotivo(m)}
                      className={`text-left text-xs font-sans p-2.5 rounded-xl border transition-all ${
                        motivo === m
                          ? 'bg-coral text-white border-coral font-bold shadow-md'
                          : 'bg-white dark:bg-carbon text-negro/70 dark:text-arena/70 border-arena/20 hover:border-coral'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={2}
                placeholder="Cuéntanos más detalles para apoyarte mejor..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="w-full bg-white dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl p-3 text-xs text-negro dark:text-blanco focus:border-coral focus:outline-none"
              />

              <button
                onClick={handleEnviarSoporteWhatsApp}
                disabled={submitting || !motivo}
                className="w-full bg-coral hover:bg-coral/90 text-white font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span>RESOLVER POR WHATSAPP CON GERENCIA</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
