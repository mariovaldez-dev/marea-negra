'use client'

import React, { useRef, useState, useEffect } from 'react'
import { X, Download, Loader2, Instagram, Camera, Copy, Check, Sparkles } from 'lucide-react'
import { toBlob } from 'html-to-image'
import { Platillo } from '@/lib/types/database'
import { isPromoItem, isPromoActiveToday, getPromoBannerText, parsePrice, formatPrice } from '@/lib/utils/promo'
import { BrandLogo } from '../ui/BrandLogo'

interface InstagramStoryModalProps {
  platillo: Platillo
  onClose: () => void
}

const HANDLE_IG = '@mareanegra.aguachiles'

export function InstagramStoryModal({ platillo, onClose }: InstagramStoryModalProps) {
  const storyDomRef = useRef<HTMLDivElement>(null)

  const [isExporting, setIsExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  const hasPromo = isPromoItem(platillo)
  const pActual = parsePrice(platillo.precio)
  const pAnterior = parsePrice(platillo.precio_anterior)
  const ahorro = hasPromo && pAnterior > pActual ? pAnterior - pActual : 0
  const bannerText = getPromoBannerText(platillo)

  // Bloquear scroll de fondo
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  /** Genera el Blob PNG en Ultra HD (1080×1920) usando el motor nativo del navegador (html-to-image) */
  const generateStoryBlob = async (): Promise<{ blob: Blob; fileName: string } | null> => {
    if (!storyDomRef.current) return null
    const fileName = `${platillo.nombre.replace(/\s+/g, '-').toLowerCase()}-historia-ig.png`

    try {
      // 1. Asegurar fuentes web listas
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready
      }

      // 2. Renderizado nativo del DOM a 3x escala (360x640 -> 1080x1920)
      const blob = await toBlob(storyDomRef.current, {
        pixelRatio: 3,
        quality: 1.0,
        cacheBust: true,
        backgroundColor: '#080808',
      })

      if (blob) {
        return { blob, fileName }
      }
      return null
    } catch (err) {
      console.error('Error generando imagen DOM:', err)
      return null
    }
  }

  /** Descarga directa al carrete / carpeta de descargas */
  const handleDownloadAndSavePhotos = async () => {
    setIsExporting(true)
    try {
      const result = await generateStoryBlob()
      if (!result) return

      const { blob, fileName } = result

      // 1. Descarga directa en macOS / Navegador
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = fileName
      link.href = blobUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500)

      // 2. Web Share API para Guardar en Fotos en iOS / macOS Safari
      const file = new File([blob], fileName, { type: 'image/png' })
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Historia Instagram - ${platillo.nombre}`,
            text: `Historia de Instagram para ${platillo.nombre} de Marea Negra`,
          })
          setShared(true)
          setTimeout(() => setShared(false), 3000)
        } catch {
          // Share omitido o cancelado
        }
      }
    } catch (err) {
      console.error('Error al exportar historia:', err)
    } finally {
      setIsExporting(false)
    }
  }

  /** Copia la imagen PNG directamente al portapapeles (Cmd + V) */
  const handleCopyToClipboard = async () => {
    setIsExporting(true)
    try {
      const result = await generateStoryBlob()
      if (!result) return

      if (typeof navigator !== 'undefined' && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': result.blob })
        ])
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      } else {
        handleDownloadAndSavePhotos()
      }
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 w-full max-w-4xl my-auto">

        {/* Panel izquierdo: Preview del Diseño DOM Real (360x640) */}
        <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-xs font-sans text-arena/60 uppercase tracking-widest">
            <Camera className="w-3.5 h-3.5 text-turquesa" />
            <span>Vista Historia IG (9:16 · 1080×1920)</span>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-arena/20 bg-[#080808] flex items-center justify-center">
            {/* CONTENEDOR DEL DISEÑO DOM (JSX + TAILWIND) */}
            <div
              ref={storyDomRef}
              className="relative overflow-hidden select-none"
              style={{
                width: 360,
                height: 640,
                backgroundColor: '#080808',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {/* 1. Fondo Imagen del Platillo */}
              {platillo.imagen_url ? (
                <>
                  <img
                    src={platillo.imagen_url}
                    alt={platillo.nombre}
                    crossOrigin="anonymous"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '52%',
                      objectFit: 'cover',
                    }}
                  />
                  {/* Gradiente de fusión suave */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '36%',
                      left: 0,
                      right: 0,
                      height: '18%',
                      background: 'linear-gradient(to bottom, transparent, #080808)',
                    }}
                  />
                </>
              ) : (
                /* Fallback sin foto */
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '52%',
                    background: 'linear-gradient(135deg, #0D3B5E 0%, #080808 60%, #1A0A05 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 90, filter: 'drop-shadow(0 0 30px rgba(42,191,191,0.4))' }}>
                    {platillo.emoji || '🦐'}
                  </span>
                </div>
              )}

              {/* 2. Badge de Oferta (esquina superior derecha) */}
              {hasPromo && (
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    background: 'linear-gradient(135deg, #E8430A, #C9A84C)',
                    borderRadius: 30,
                    padding: '5px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: '0 0 20px rgba(232,67,10,0.5)',
                    zIndex: 10,
                  }}
                >
                  <span style={{ fontSize: 11 }}>🔥</span>
                  <span
                    style={{
                      color: '#F7F3EE',
                      fontSize: 9,
                      fontWeight: 900,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    {bannerText}
                  </span>
                </div>
              )}

              {/* 3. Panel Inferior de Información y Branding */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '14px 20px 14px',
                  background: 'linear-gradient(to top, #080808 88%, rgba(8,8,8,0.75) 96%, transparent)',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 10,
                }}
              >
                {/* Ornamento */}
                <div
                  style={{
                    textAlign: 'center',
                    color: '#C9A84C',
                    opacity: 0.4,
                    fontSize: 9,
                    letterSpacing: 3,
                    marginBottom: 2,
                  }}
                >
                  — ✦ —
                </div>

                {/* Logo Oficial con Slogan y Subtexto */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  <BrandLogo
                    size="story"
                    withSubtext
                    withSlogan
                    align="center"
                    href={null}
                  />
                </div>

                {/* Línea Divisoria Dorada 1 */}
                <div
                  style={{
                    width: '100%',
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)',
                    marginTop: 4,
                    marginBottom: 6,
                    display: 'block',
                  }}
                />

                {/* Nombre del Platillo */}
                <div
                  style={{
                    color: '#F7F3EE',
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                    textAlign: 'center',
                    marginBottom: 3,
                  }}
                >
                  {platillo.nombre}
                </div>

                {/* Descripción Limpia */}
                {platillo.descripcion && (
                  <div
                    style={{
                      color: '#D4C5A9',
                      fontSize: 10.5,
                      fontStyle: 'italic',
                      opacity: 0.85,
                      textAlign: 'center',
                      marginBottom: 6,
                      lineHeight: 1.3,
                      display: 'block',
                    }}
                  >
                    {platillo.descripcion.length > 95
                      ? `"${platillo.descripcion.slice(0, 95)}..."`
                      : `"${platillo.descripcion}"`}
                  </div>
                )}

                {/* Precios */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  {hasPromo && pAnterior > pActual && (
                    <span
                      style={{
                        color: '#D4C5A9',
                        fontSize: 13,
                        textDecoration: 'line-through',
                        opacity: 0.6,
                      }}
                    >
                      ${formatPrice(pAnterior)}
                    </span>
                  )}
                  <span
                    style={{
                      color: '#E8430A',
                      fontSize: 32,
                      fontWeight: 900,
                      letterSpacing: 1.5,
                      lineHeight: 1,
                    }}
                  >
                    ${formatPrice(pActual)}
                  </span>
                  <span style={{ color: '#D4C5A9', fontSize: 11, opacity: 0.7 }}>MXN</span>
                </div>

                {/* Línea Divisoria Dorada 2 */}
                <div
                  style={{
                    width: '100%',
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)',
                    marginTop: 2,
                    marginBottom: 6,
                    display: 'block',
                  }}
                />

                {/* Botón WhatsApp / App */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #2ABFBF, #1a9999)',
                    borderRadius: 50,
                    padding: '7px 12px',
                    textAlign: 'center',
                    marginBottom: 5,
                    boxShadow: '0 0 16px rgba(42,191,191,0.25)',
                  }}
                >
                  <span
                    style={{
                      color: '#080808',
                      fontSize: 10.5,
                      fontWeight: 900,
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                    }}
                  >
                    📲 Ordena por WhatsApp o en la APP
                  </span>
                </div>

                {/* Handle de Instagram */}
                <div
                  style={{
                    textAlign: 'center',
                    color: '#D4C5A9',
                    fontSize: 9.5,
                    opacity: 0.65,
                    letterSpacing: 2,
                  }}
                >
                  {HANDLE_IG}
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-arena/40 font-sans text-center max-w-[340px]">
            Exportación nativa por motor del navegador en Ultra HD (1080×1920 px).
          </p>
        </div>

        {/* Panel derecho: Controles y Acciones */}
        <div className="flex flex-col gap-4 w-full max-w-[340px] lg:w-80 shrink-0">
          {/* Header */}
          <div className="bg-[#0C0806] border border-oro/15 rounded-2xl p-5 relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Instagram className="w-4 h-4 text-coral" />
              <span className="text-xs font-sans font-bold text-turquesa tracking-widest uppercase">
                Historia de Instagram
              </span>
            </div>
            <h2 className="font-display text-2xl text-blanco tracking-wide leading-tight">
              {platillo.nombre}
            </h2>
            {hasPromo && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-sans font-bold text-coral">
                <span>🔥</span>
                <span>{bannerText}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-carbon border border-arena/10 rounded-xl p-4 flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="text-arena/60 uppercase tracking-wider">Formato</span>
              <span className="text-blanco font-bold">1080×1920 px (9:16)</span>
            </div>
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="text-arena/60 uppercase tracking-wider">Diseño</span>
              <span className="text-turquesa font-bold">Componentes React / DOM</span>
            </div>
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="text-arena/60 uppercase tracking-wider">Calidad de salida</span>
              <span className="text-blanco font-bold">PNG Ultra HD (3x)</span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownloadAndSavePhotos}
              disabled={isExporting}
              className="w-full bg-gradient-to-r from-coral to-oro text-negro font-sans font-black text-sm tracking-wider py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(232,67,10,0.3)] hover:shadow-[0_0_40px_rgba(232,67,10,0.5)] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>GENERANDO EN ALTA RESOLUCIÓN...</span>
                </>
              ) : shared ? (
                <>
                  <Check className="w-4 h-4 text-negro stroke-[3]" />
                  <span>¡GUARDADO CON ÉXITO!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>DESCARGAR / GUARDAR EN FOTOS</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyToClipboard}
              disabled={isExporting}
              className="w-full bg-carbon text-blanco hover:text-turquesa border border-arena/20 hover:border-turquesa/50 font-sans font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-turquesa" />
                  <span className="text-turquesa">¡COPIADO! LISTO PARA PEGAR (CMD+V)</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-turquesa" />
                  <span>COPIAR IMAGEN (CMD + V)</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] font-sans text-arena/40 text-center leading-relaxed">
            💡 En macOS presiona <strong>Copiar Imagen</strong> y pega directo con <kbd className="bg-carbon px-1.5 py-0.5 rounded border border-arena/20 text-blanco">Cmd + V</kbd> en Instagram Web o WhatsApp.
          </p>
        </div>
      </div>
    </div>
  )
}
