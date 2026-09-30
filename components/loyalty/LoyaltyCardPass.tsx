'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ClientePerfilStats } from '@/lib/actions/clienteCuenta'
import {
  Sparkles,
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
  Zap,
} from 'lucide-react'

interface LoyaltyCardPassProps {
  perfil: ClientePerfilStats
}

export function LoyaltyCardPass({ perfil }: LoyaltyCardPassProps) {
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
    const msg = `🦐 *MI TARJETA TITANIUM VIP — MAREA NEGRA*\n\n👤 *Titular:* ${perfil.nombreCliente.toUpperCase()}\n💳 *N° de Socio:* ${numeroSocio}\n⭐ *Nivel:* ${perfil.nivelLealtad}\n🏆 *Sellos acumulados:* ${sellosActuales}/${pedidosRequeridos}\n\n📲 *Accede a tu tarjeta digital y sellos aquí:*\n${link}`
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

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(numeroSocio)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert(`Número de Socio: ${numeroSocio}`)
    }
  }

  // Generar y descargar la tarjeta con estética Apple Titanium
  const handleDownloadCard = async () => {
    setIsDownloading(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 750
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Fondo Negro Titanio Cepillado
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 750)
      bgGrad.addColorStop(0, '#121316')
      bgGrad.addColorStop(0.5, '#0A0A0C')
      bgGrad.addColorStop(1, '#18191D')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, 1200, 750)

      // Luz especular metálica
      const sheen = ctx.createRadialGradient(900, 150, 50, 900, 150, 700)
      sheen.addColorStop(0, 'rgba(201, 168, 76, 0.18)')
      sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)')
      sheen.addColorStop(1, 'transparent')
      ctx.fillStyle = sheen
      ctx.fillRect(0, 0, 1200, 750)

      // Borde exterior titanio
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 3
      ctx.strokeRect(35, 35, 1130, 680)

      // Logo MAREA NEGRA
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 54px sans-serif'
      ctx.fillText('MAREA NEGRA', 75, 125)

      ctx.fillStyle = '#A1A1AA'
      ctx.font = '18px sans-serif'
      ctx.fillText('TITANIUM CLUB · SINALOA MÉXICO', 75, 165)

      // Nivel del Socio
      ctx.fillStyle = '#C9A84C'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(`✦ ${perfil.nivelLealtad.toUpperCase()}`, 75, 245)

      // Sellos de Lealtad
      ctx.fillStyle = '#71717A'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText(`SELLOS: ${sellosActuales} DE ${pedidosRequeridos}`, 75, 330)

      for (let i = 0; i < pedidosRequeridos; i++) {
        const x = 75 + i * 85
        const y = 390
        ctx.beginPath()
        ctx.arc(x + 28, y, 28, 0, 2 * Math.PI)
        if (i < sellosActuales) {
          ctx.fillStyle = '#E8430A'
          ctx.fill()
          ctx.strokeStyle = '#C9A84C'
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 22px sans-serif'
          ctx.fillText('🦐', x + 15, y + 8)
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
          ctx.fill()
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
          ctx.lineWidth = 1.5
          ctx.stroke()
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.font = 'bold 16px sans-serif'
          ctx.fillText(String(i + 1), x + 23, y + 6)
        }
      }

      // Titular y Número de Socio
      ctx.fillStyle = '#71717A'
      ctx.font = 'bold 15px sans-serif'
      ctx.fillText('TITULAR', 75, 540)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 36px sans-serif'
      ctx.fillText(perfil.nombreCliente.toUpperCase(), 75, 590)

      ctx.fillStyle = '#71717A'
      ctx.font = 'bold 15px sans-serif'
      ctx.fillText('N° SOCIO VIP', 75, 640)

      ctx.fillStyle = '#2ABFBF'
      ctx.font = 'bold 24px monospace'
      ctx.fillText(numeroSocio, 210, 640)

      // Código QR Integrado a la derecha
      const qrImg = new window.Image()
      qrImg.crossOrigin = 'anonymous'
      qrImg.src = qrUrl

      qrImg.onload = () => {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(840, 210, 280, 280)
        ctx.drawImage(qrImg, 850, 220, 260, 260)

        ctx.fillStyle = '#C9A84C'
        ctx.font = 'bold 15px sans-serif'
        ctx.fillText('QR OFICIAL DE CANJE', 885, 525)

        const link = document.createElement('a')
        link.download = `MareaNegra_TitaniumPass_${perfil.nombreCliente.replace(/\s+/g, '_')}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        setIsDownloading(false)
      }

      qrImg.onerror = () => {
        const link = document.createElement('a')
        link.download = `MareaNegra_TitaniumPass_${perfil.nombreCliente.replace(/\s+/g, '_')}.png`
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

  // Nivel de membresía
  const getBadgeTier = () => {
    switch (perfil.nivelLealtad) {
      case 'Leyenda Marea Negra':
        return {
          title: 'LEYENDA VIP',
          badgeBg: 'bg-[#C9A84C]/15 border-[#C9A84C]/35 text-[#C9A84C]',
          icon: Crown,
        }
      case 'Capitán Aguachile':
        return {
          title: 'CAPITÁN MAREA',
          badgeBg: 'bg-[#2ABFBF]/15 border-[#2ABFBF]/35 text-[#2ABFBF]',
          icon: Award,
        }
      case 'Socio Marea':
        return {
          title: 'SOCIO MAREA',
          badgeBg: 'bg-coral/15 border-coral/35 text-coral',
          icon: Flame,
        }
      default:
        return {
          title: 'MIEMBRO CLUB',
          badgeBg: 'bg-white/10 border-white/20 text-neutral-300',
          icon: Sparkles,
        }
    }
  }

  const tier = getBadgeTier()
  const TierIcon = tier.icon

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* ── TARJETA APPLE BLACK TITANIUM CON QR INTEGRADO ─────────────────── */}
      <div
        ref={cardRef}
        className="relative w-full rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 overflow-hidden border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] flex flex-col justify-between gap-4 transition-all"
        style={{
          background: `
            radial-gradient(circle at 85% 15%, rgba(201, 168, 76, 0.18) 0%, transparent 45%),
            radial-gradient(circle at 15% 85%, rgba(232, 67, 10, 0.18) 0%, transparent 50%),
            linear-gradient(135deg, #18191E 0%, #0F1014 45%, #08080A 100%)
          `,
        }}
      >
        {/* Micro-textura y reflejo metálico */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.08),rgba(255,255,255,0))] pointer-events-none" />

        {/* 1. Header: Logo, Nivel y Badge */}
        <div className="flex items-start justify-between z-10 gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl sm:text-3xl text-white tracking-widest leading-none">
                MAREA NEGRA
              </span>
              <span className="text-[9px] font-mono text-neutral-400 border border-white/10 px-1.5 py-0.5 rounded-md bg-black/40">
                VIP PASS
              </span>
            </div>
            <span className="font-sans text-[10px] sm:text-[11px] text-neutral-400 mt-0.5">
              Membresía Digital · Sinaloa
            </span>
          </div>

          {/* Badge de Nivel */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md shadow-sm ${tier.badgeBg}`}
          >
            <TierIcon className="w-3 h-3" />
            <span className="text-[9px] sm:text-[10px] font-sans font-bold tracking-wider uppercase">
              {tier.title}
            </span>
          </div>
        </div>

        {/* 2. Cuerpo Central: Sellos de Recompensa + QR Integrado */}
        <div className="grid grid-cols-12 gap-2.5 items-center z-10 my-0.5">
          {/* Lado Izquierdo: Sellos */}
          <div className="col-span-8 flex flex-col gap-1.5">
            <div className="flex items-center justify-between pr-1">
              <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#C9A84C]" />
                <span>Sellos ({sellosActuales}/{pedidosRequeridos})</span>
              </span>
            </div>

            {/* Matriz de sellos metálicos */}
            <div className="grid grid-cols-6 gap-1 bg-black/50 p-1.5 rounded-xl border border-white/10">
              {Array.from({ length: pedidosRequeridos }).map((_, idx) => {
                const isChecked = idx < sellosActuales
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[11px] sm:text-xs transition-all ${
                      isChecked
                        ? 'bg-gradient-to-tr from-coral to-amber-500 text-white font-bold border border-white/40 shadow-[0_0_10px_rgba(232,67,10,0.5)] scale-105'
                        : 'bg-white/[0.04] border border-white/10 text-white/30'
                    }`}
                    title={isChecked ? 'Sello completado' : `Sello ${idx + 1}`}
                  >
                    {isChecked ? '🦐' : idx + 1}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lado Derecho: QR Integrado (Toca para expandir) */}
          <div className="col-span-4 flex flex-col items-center justify-center gap-1 pl-1">
            <div
              onClick={() => setShowFullQr(true)}
              className="p-1 bg-white rounded-xl shadow-md border border-white/80 cursor-pointer hover:scale-105 transition-transform active:scale-95 group/qr relative"
              title="Toca para pantalla completa"
            >
              <img
                src={qrUrl}
                alt={`QR ${perfil.nombreCliente}`}
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
              />
              <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover/qr:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <span className="text-[8px] font-sans text-neutral-400 font-semibold tracking-tight">
              Toca para QR
            </span>
          </div>
        </div>

        {/* 3. Footer: Titular y N° de Socio */}
        <div className="flex items-end justify-between z-10 pt-2 border-t border-white/10">
          <div className="flex flex-col">
            <span className="text-[8px] font-sans text-neutral-500 uppercase tracking-wider font-semibold">
              TITULAR
            </span>
            <span className="font-sans font-bold text-xs sm:text-sm text-white tracking-wide truncate max-w-[160px] sm:max-w-[220px]">
              {perfil.nombreCliente.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[8px] font-sans text-neutral-500 uppercase tracking-wider font-semibold">
              N° DE SOCIO
            </span>
            <span className="font-mono font-bold text-xs sm:text-sm text-[#2ABFBF] tracking-widest">
              {numeroSocio}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3 ACCIONES ESENCIALES (SIN BOTONES DUPLICADOS) ────────────────── */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <button
          type="button"
          onClick={handleSaveToWhatsApp}
          className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] hover:border-[#25D366] text-neutral-900 dark:text-white py-2 px-2.5 rounded-xl text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={handleShareReferral}
          className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] hover:border-coral text-neutral-900 dark:text-white py-2 px-2.5 rounded-xl text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5 text-coral" />
          <span>Invitar (10%)</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadCard}
          disabled={isDownloading}
          className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] hover:border-[#C9A84C] text-neutral-900 dark:text-white py-2 px-2.5 rounded-xl text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C9A84C]" />
          ) : (
            <Download className="w-3.5 h-3.5 text-[#C9A84C]" />
          )}
          <span>Guardar</span>
        </button>
      </div>

      {/* ── MODAL FULL SCREEN QR (BRILLO MÁXIMO PARA ESCANEAR EN CAJA) ─────── */}
      {showFullQr && (
        <div
          onClick={() => setShowFullQr(false)}
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-between p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-200 cursor-pointer select-none"
        >
          {/* Header Superior */}
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

          {/* QR Gigante */}
          <div className="flex flex-col items-center gap-4 my-auto">
            <div className="p-4 bg-white border-4 border-black rounded-3xl shadow-xl">
              <img
                src={qrUrl}
                alt={`QR ${perfil.nombreCliente}`}
                className="w-64 h-64 sm:w-80 sm:h-80 object-contain"
              />
            </div>

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

          {/* Botón Inferior */}
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
              <span>TOCA PARA CERRAR</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

