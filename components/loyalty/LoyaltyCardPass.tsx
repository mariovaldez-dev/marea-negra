'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ClientePerfilStats } from '@/lib/actions/clienteCuenta'
import {
  Sparkles,
  RotateCw,
  Download,
  Check,
  Award,
  Crown,
  Flame,
  ShieldCheck,
  Copy,
  Loader2,
  QrCode,
  X,
  Sun,
  Maximize2,
  MessageCircle,
  Share2,
  Cake,
  Gift,
} from 'lucide-react'

interface LoyaltyCardPassProps {
  perfil: ClientePerfilStats
}

export function LoyaltyCardPass({ perfil }: LoyaltyCardPassProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showFullQr, setShowFullQr] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const wakeLockRef = useRef<any>(null)

  const pedidosRequeridos = perfil.lealtadConfig?.meta1_pedidos || 6
  const sellosActuales = (perfil.pedidosEntregados || 0) % pedidosRequeridos
  const totalCiclos = Math.floor((perfil.pedidosEntregados || 0) / pedidosRequeridos)

  const numeroSocio = `MN-${perfil.telefono.slice(-4)}-${perfil.codigoReferido ? perfil.codigoReferido.slice(0, 4) : 'VIP'}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=15&data=${encodeURIComponent(
    `MAREA_SOCIO:${perfil.telefono}:${perfil.nombreCliente}`
  )}`

  // 1. Guardar tarjeta y acceso directo en su propio WhatsApp
  const handleSaveToWhatsApp = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marea-negra.com'
    const link = `${origin}/micuenta`
    const msg = `🦐 *MI TARJETA DE LEALTAD VIP — MAREA NEGRA*\n\n👤 *Titular:* ${perfil.nombreCliente.toUpperCase()}\n💳 *N° de Socio:* ${numeroSocio}\n⭐ *Nivel:* ${perfil.nivelLealtad}\n🏆 *Sellos acumulados:* ${sellosActuales}/${pedidosRequeridos}\n\n📲 *Accede a tu tarjeta digital y sellos aquí:*\n${link}`
    window.open(`https://wa.me/52${perfil.telefono}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // 2. Invitar a un amigo por WhatsApp (Referidos Virales)
  const handleShareReferral = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marea-negra.com'
    const link = `${origin}/pedir?ref=${perfil.codigoReferido || numeroSocio}`
    const msg = `¡Compa, tienes que probar los aguachiles y cocteles de *Marea Negra*! 🦐🔥\n\nUsa mi código de socio *${perfil.codigoReferido || numeroSocio}* para recibir *10% de descuento* en tu primer pedido.\n\n👇 Pide directo desde el menú aquí:\n${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // Mantener la pantalla encendida (WakeLock) mientras el QR full page está abierto
  useEffect(() => {
    if (showFullQr && 'wakeLock' in navigator) {
      try {
        navigator.wakeLock.request('screen').then((lock) => {
          wakeLockRef.current = lock
        }).catch((err) => {
          console.warn('Wake Lock no disponible:', err)
        })
      } catch (e) { }
    } else if (!showFullQr && wakeLockRef.current) {
      try {
        wakeLockRef.current.release()
        wakeLockRef.current = null
      } catch (e) { }
    }

    return () => {
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release()
          wakeLockRef.current = null
        } catch (e) { }
      }
    }
  }, [showFullQr])

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(numeroSocio)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert(`Número de Socio: ${numeroSocio}`)
    }
  }

  // Generar y descargar la tarjeta con los colores exactos de Marea Negra
  const handleDownloadCard = async () => {
    setIsDownloading(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 750
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 1. Fondo Negro Profundo #080808
      ctx.fillStyle = '#080808'
      ctx.fillRect(0, 0, 1200, 750)

      // 2. Blob Azul Marino #0D3B5E en top-right
      const oceanBlob = ctx.createRadialGradient(1050, 150, 50, 1050, 150, 600)
      oceanBlob.addColorStop(0, 'rgba(13, 59, 94, 0.95)')
      oceanBlob.addColorStop(0.5, 'rgba(13, 59, 94, 0.4)')
      oceanBlob.addColorStop(1, 'transparent')
      ctx.fillStyle = oceanBlob
      ctx.fillRect(0, 0, 1200, 750)

      // 3. Blob Coral #E8430A en bottom-left
      const coralBlob = ctx.createRadialGradient(150, 650, 50, 150, 650, 550)
      coralBlob.addColorStop(0, 'rgba(232, 67, 10, 0.45)')
      coralBlob.addColorStop(0.6, 'rgba(232, 67, 10, 0.15)')
      coralBlob.addColorStop(1, 'transparent')
      ctx.fillStyle = coralBlob
      ctx.fillRect(0, 0, 1200, 750)

      // 4. Marco Oro #C9A84C y Acento Turquesa #2ABFBF
      ctx.strokeStyle = '#C9A84C'
      ctx.lineWidth = 6
      ctx.strokeRect(35, 35, 1130, 680)

      ctx.strokeStyle = 'rgba(42, 191, 191, 0.4)'
      ctx.lineWidth = 2
      ctx.strokeRect(48, 48, 1104, 654)

      // 5. Logo MAREA NEGRA en Blanco #F7F3EE
      ctx.fillStyle = '#F7F3EE'
      ctx.font = 'bold 58px sans-serif'
      ctx.fillText('MAREA NEGRA', 75, 125)

      ctx.fillStyle = '#D4C5A9'
      ctx.font = 'italic 24px serif'
      ctx.fillText('Aguachiles · Sinaloa México', 75, 165)

      // 6. Chip de Contactless EMV en Oro
      const chipGrad = ctx.createLinearGradient(75, 230, 180, 310)
      chipGrad.addColorStop(0, '#F3E5AB')
      chipGrad.addColorStop(0.5, '#C9A84C')
      chipGrad.addColorStop(1, '#8C6D23')
      ctx.fillStyle = chipGrad
      ctx.fillRect(75, 230, 105, 80)

      ctx.strokeStyle = '#080808'
      ctx.lineWidth = 2
      ctx.strokeRect(75, 256, 105, 28)

      // 7. Nivel del Socio en Turquesa #2ABFBF
      ctx.fillStyle = '#2ABFBF'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(`✦ ${perfil.nivelLealtad.toUpperCase()}`, 205, 275)

      // 8. Sellos de Lealtad (Camarones)
      ctx.fillStyle = '#D4C5A9'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText(`SELLOS ACUMULADOS: ${sellosActuales} DE ${pedidosRequeridos}`, 75, 380)

      for (let i = 0; i < pedidosRequeridos; i++) {
        const x = 75 + i * 85
        const y = 440
        ctx.beginPath()
        ctx.arc(x + 30, y, 30, 0, 2 * Math.PI)
        if (i < sellosActuales) {
          ctx.fillStyle = '#E8430A'
          ctx.fill()
          ctx.strokeStyle = '#C9A84C'
          ctx.lineWidth = 3
          ctx.stroke()
          ctx.fillStyle = '#F7F3EE'
          ctx.font = 'bold 22px sans-serif'
          ctx.fillText('🦐', x + 16, y + 8)
        } else {
          ctx.fillStyle = '#111111'
          ctx.fill()
          ctx.strokeStyle = 'rgba(212, 197, 169, 0.4)'
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.fillStyle = 'rgba(247, 243, 238, 0.4)'
          ctx.font = 'bold 18px sans-serif'
          ctx.fillText(String(i + 1), x + 24, y + 6)
        }
      }

      // 9. Titular y Número de Socio
      ctx.fillStyle = 'rgba(212, 197, 169, 0.8)'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText('TITULAR DE LA MEMBRESÍA', 75, 570)

      ctx.fillStyle = '#F7F3EE'
      ctx.font = 'bold 36px sans-serif'
      ctx.fillText(perfil.nombreCliente.toUpperCase(), 75, 620)

      ctx.fillStyle = 'rgba(212, 197, 169, 0.8)'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText('N° DE SOCIO VIP', 75, 665)

      ctx.fillStyle = '#C9A84C'
      ctx.font = 'bold 26px monospace'
      ctx.fillText(numeroSocio, 235, 665)

      // 10. Código QR
      const qrImg = new window.Image()
      qrImg.crossOrigin = 'anonymous'
      qrImg.src = qrUrl

      qrImg.onload = () => {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(840, 210, 280, 280)
        ctx.drawImage(qrImg, 850, 220, 260, 260)

        ctx.fillStyle = '#2ABFBF'
        ctx.font = 'bold 16px sans-serif'
        ctx.fillText('CÓDIGO DE ESCANEO QR', 870, 525)

        const link = document.createElement('a')
        link.download = `MareaNegra_TarjetaVIP_${perfil.nombreCliente.replace(/\s+/g, '_')}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        setIsDownloading(false)
      }

      qrImg.onerror = () => {
        const link = document.createElement('a')
        link.download = `MareaNegra_TarjetaVIP_${perfil.nombreCliente.replace(/\s+/g, '_')}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        setIsDownloading(false)
      }
    } catch (err) {
      console.error('Error al generar tarjeta:', err)
      alert('Ocurrió un error al descargar la tarjeta.')
      setIsDownloading(false)
    }
  }

  // Nivel de membresía con colores exactos del Design System
  const getBadgeTier = () => {
    switch (perfil.nivelLealtad) {
      case 'Leyenda Marea Negra':
        return {
          title: 'LEYENDA VIP',
          badgeBg: 'bg-oro/15 border-oro/60 text-oro',
          icon: Crown,
        }
      case 'Capitán Aguachile':
        return {
          title: 'CAPITÁN MAREA',
          badgeBg: 'bg-turquesa/15 border-turquesa/60 text-turquesa',
          icon: Award,
        }
      case 'Socio Marea':
        return {
          title: 'SOCIO MAREA',
          badgeBg: 'bg-coral/15 border-coral/60 text-coral',
          icon: Flame,
        }
      default:
        return {
          title: 'MIEMBRO CLUB',
          badgeBg: 'bg-arena/15 border-arena/40 text-arena',
          icon: Sparkles,
        }
    }
  }

  const tier = getBadgeTier()
  const TierIcon = tier.icon

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* CONTENEDOR 3D FLIP CARD */}
      <div className="w-full perspective-1000">
        <div
          onClick={handleFlip}
          className={`relative w-full aspect-[1.586/1] rounded-3xl cursor-pointer transition-transform duration-700 transform-style-3d shadow-[0_20px_50px_rgba(0,0,0,0.9)] ${isFlipped ? 'rotate-y-180' : ''
            }`}
        >
          {/* FRENTE DE LA TARJETA */}
          <div
            ref={cardRef}
            className="absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden border-2 border-oro/60 bg-[#E8430A] backface-hidden shadow-[0_20px_50px_rgba(232,67,10,0.35)]"
            style={{
              background: `
                radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.25) 0%, transparent 45%),
                radial-gradient(circle at 15% 85%, rgba(0, 0, 0, 0.4) 0%, transparent 60%),
                linear-gradient(135deg, #FF5722 0%, #E8430A 40%, #B83204 75%, #6B1A00 100%)
              `,
            }}
          >
            {/* Brillos y halos dinámicos */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-black/40 rounded-full blur-3xl pointer-events-none" />

            {/* Cabecera Tarjeta: Logo y Nivel */}
            <div className="flex items-start justify-between z-10">
              <div className="flex flex-col">
                <span className="font-display text-2xl sm:text-3xl text-white tracking-widest leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                  MAREA NEGRA
                </span>
                <span className="font-serif italic text-[11px] sm:text-xs text-amber-100 tracking-wider mt-0.5 drop-shadow">
                  Aguachiles · Sinaloa
                </span>
              </div>

              {/* Badge de Nivel */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/30 bg-black/30 backdrop-blur-md shadow-lg text-white`}
              >
                <TierIcon className="w-3.5 h-3.5 text-oro" />
                <span className="text-[10px] font-sans font-bold tracking-widest uppercase">
                  {tier.title}
                </span>
              </div>
            </div>

            {/* Centro: Chip Contactless y Sellos de Recompensa */}
            <div className="flex items-center justify-between z-10 my-auto py-1">
              {/* Chip Dorado */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-7 rounded-md bg-gradient-to-br from-[#FFF0C2] via-[#E5C158] to-[#8C6D23] border border-white/60 shadow-lg flex flex-col justify-around p-1">
                  <div className="w-full h-[1px] bg-black/40" />
                  <div className="w-full h-[1px] bg-black/40" />
                  <div className="w-full h-[1px] bg-black/40" />
                </div>
                <span className="text-white text-xs font-mono font-bold tracking-tighter drop-shadow">
                  )))
                </span>
              </div>

              {/* Sellos Visuales en la Tarjeta */}
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-2xl border border-white/20 backdrop-blur-md shadow-inner">
                {Array.from({ length: pedidosRequeridos }).map((_, idx) => {
                  const isChecked = idx < sellosActuales
                  return (
                    <div
                      key={idx}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all ${
                        isChecked
                          ? 'bg-amber-400 text-black font-bold border border-white shadow-[0_0_12px_rgba(255,215,0,0.8)] scale-110'
                          : 'bg-black/50 border border-white/20 text-white/40'
                      }`}
                      title={isChecked ? 'Sello obtenido' : 'Sello pendiente'}
                    >
                      {isChecked ? '🦐' : idx + 1}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Tarjeta: Nombre de Socio y Número VIP */}
            <div className="flex items-end justify-between z-10 pt-1.5 border-t border-white/20">
              <div className="flex flex-col">
                <span className="text-[9px] font-sans text-amber-100 uppercase tracking-wider font-semibold drop-shadow">
                  TITULAR DE LA MEMBRESÍA
                </span>
                <span className="font-sans font-bold text-sm sm:text-base text-white tracking-wide truncate max-w-[200px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  {perfil.nombreCliente.toUpperCase()}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[9px] font-sans text-amber-100 uppercase tracking-wider font-semibold drop-shadow">
                  N° DE SOCIO
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-widest drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  {numeroSocio}
                </span>
              </div>
            </div>

            {/* Indicador de voltear */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8px] font-sans text-amber-100/70 uppercase tracking-widest pointer-events-none">
              <RotateCw className="w-2.5 h-2.5" />
              <span>Toca para voltear tarjeta</span>
            </div>
          </div>

          {/* REVERSO DE LA TARJETA (CÓDIGO QR Y BENEFICIOS) */}
          <div
            className="absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden border-2 border-oro/60 bg-[#9C2700] rotate-y-180 backface-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            style={{
              background: `
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 20% 80%, rgba(0, 0, 0, 0.5) 0%, transparent 60%),
                linear-gradient(135deg, #C73504 0%, #8A1F00 50%, #4D1000 100%)
              `,
            }}
          >
            <div className="flex items-center justify-between border-b border-white/20 pb-2">
              <span className="font-display text-lg text-white tracking-wider drop-shadow">
                MAREA NEGRA VIP PASS
              </span>
              <span className="text-[10px] font-mono text-amber-300 font-bold">
                +52 {perfil.telefono}
              </span>
            </div>

            {/* Centro del Reverso: QR para escaneo en caja */}
            <div className="flex items-center gap-4 my-auto">
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFullQr(true)
                }}
                className="p-2 bg-white rounded-2xl shadow-xl shrink-0 border-2 border-white cursor-pointer hover:scale-105 transition-transform"
                title="Toca para pantalla completa con brillo 100%"
              >
                <img
                  src={qrUrl}
                  alt={`QR Socio ${perfil.nombreCliente}`}
                  className="w-20 h-20 object-contain"
                />
              </div>

              <div className="flex flex-col gap-1 text-xs">
                <span className="font-bold text-amber-300 text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Código de Socio Escaneable</span>
                </span>
                <p className="text-[11px] text-amber-100 leading-snug">
                  Muestra este código al mesero o en caja para acumular sellos en cada consumo.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono bg-black/40 px-2.5 py-0.5 rounded text-amber-300 border border-white/20">
                    {sellosActuales}/{pedidosRequeridos} Sellos
                  </span>
                  {totalCiclos > 0 && (
                    <span className="text-[10px] font-sans text-white font-bold bg-amber-500/30 px-2 py-0.5 rounded border border-amber-400/40">
                      🏆 {totalCiclos} Premios
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Reverso: Beneficios */}
            <div className="flex items-center justify-between pt-2 border-t border-arena/20 text-[10px] text-arena/70">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFullQr(true)
                }}
                className="text-turquesa hover:underline flex items-center gap-1 font-bold"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Pantalla completa</span>
              </button>
              <span className="text-turquesa flex items-center gap-1 font-serif italic">
                <RotateCw className="w-2.5 h-2.5" />
                <span>Voltear</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ACCIONES PRINCIPALES */}
      <div className="flex flex-col gap-3 w-full">
        {/* BOTÓN VER QR PANTALLA COMPLETA CON BRILLO MÁXIMO */}
        <button
          type="button"
          onClick={() => setShowFullQr(true)}
          className="w-full bg-oro text-negro hover:bg-blanco font-sans font-bold text-xs sm:text-sm tracking-wider py-4 px-6 rounded-2xl shadow-[0_0_25px_rgba(201,168,76,0.35)] transition-all flex items-center justify-center gap-2.5"
        >
          <QrCode className="w-5 h-5 stroke-[2.5]" />
          <span>VER QR EN PANTALLA COMPLETA (BRILLO 100%)</span>
        </button>

        {/* ACCIONES DE WHATSAPP: GUARDAR ACCESO E INVITAR AMIGO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleSaveToWhatsApp}
            className="bg-[#25D366] text-white hover:bg-[#1EBE5D] font-sans font-bold text-xs py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>ENVIAR A MI WHATSAPP</span>
          </button>

          <button
            type="button"
            onClick={handleShareReferral}
            className="bg-coral text-blanco hover:bg-coral/80 font-sans font-bold text-xs py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Share2 className="w-4 h-4" />
            <span>INVITAR AMIGO (10% OFF)</span>
          </button>
        </div>

        {/* ACCIONES SECUNDARIAS: DESCARGAR Y COPIAR NÚMERO */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadCard}
            disabled={isDownloading}
            className="bg-white dark:bg-carbon border border-arena/30 dark:border-arena/20 hover:border-turquesa text-turquesa py-3 px-3 rounded-xl text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>GUARDAR FOTO</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="bg-white dark:bg-carbon border border-arena/30 dark:border-arena/20 hover:border-oro text-negro dark:text-arena hover:text-coral dark:hover:text-blanco py-3 px-3 rounded-xl text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-turquesa" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡COPIADO!' : 'COPIAR N°'}</span>
          </button>
        </div>
      </div>

      {/* MODAL FULL SCREEN QR (FONDO BLANCO PURO / BRILLO MÁXIMO EMITIDO POR PANTALLA) */}
      {showFullQr && (
        <div
          onClick={() => setShowFullQr(false)}
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-between p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-200 cursor-pointer select-none"
        >
          {/* Header Superior del Escáner */}
          <div className="w-full max-w-sm flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-100 border border-amber-300 rounded-full text-amber-950 text-xs font-sans font-bold shadow-sm">
              <Sun className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>BRILLO AL 100% PARA ESCANEAR</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowFullQr(false)
              }}
              className="p-3 bg-black/10 hover:bg-black/20 text-black rounded-full transition-all"
              title="Cerrar pantalla de escaneo"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Centro: Código QR Gigante Nítido sobre Blanco Puro */}
          <div className="flex flex-col items-center gap-4 my-auto">
            <div className="p-4 bg-white border-4 border-black rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.2)]">
              <img
                src={qrUrl}
                alt={`QR ${perfil.nombreCliente}`}
                className="w-64 h-64 sm:w-80 sm:h-80 object-contain"
              />
            </div>

            {/* Datos del Socio para Confirmación Visual */}
            <div className="flex flex-col items-center text-center text-black">
              <span className="font-display text-3xl sm:text-4xl tracking-wider text-black font-bold">
                {perfil.nombreCliente.toUpperCase()}
              </span>
              <span className="font-mono text-base font-bold text-coral tracking-widest mt-0.5">
                {numeroSocio}
              </span>
              <span className="text-xs font-sans text-black/70 font-semibold mt-1">
                {sellosActuales} de {pedidosRequeridos} Sellos de Lealtad · +52 {perfil.telefono}
              </span>
            </div>
          </div>

          {/* Botón Inferior para Salir */}
          <div className="w-full max-w-sm pb-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowFullQr(false)
              }}
              className="w-full bg-black text-white hover:bg-neutral-800 font-sans font-bold text-sm tracking-wider py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4 stroke-[3]" />
              <span>TOCA PARA CERRAR Y VOLVER</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
