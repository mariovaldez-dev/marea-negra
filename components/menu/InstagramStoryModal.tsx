'use client'

import React, { useRef, useState, useEffect } from 'react'
import { X, Download, Loader2, Instagram, Camera } from 'lucide-react'
import { Platillo } from '@/lib/types/database'
import { isPromoItem, isPromoActiveToday, getPromoBannerText, parsePrice, formatPrice } from '@/lib/utils/promo'

interface InstagramStoryModalProps {
  platillo: Platillo
  onClose: () => void
}

const HANDLE_IG = '@mareanegra.sinaloa'
const WHATSAPP_NUM = '6671234567'

export function InstagramStoryModal({ platillo, onClose }: InstagramStoryModalProps) {
  const storyRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const hasPromo = isPromoItem(platillo)
  const promoActive = isPromoActiveToday(platillo)
  const bannerText = getPromoBannerText(platillo)
  const pActual = parsePrice(platillo.precio)
  const pAnterior = parsePrice(platillo.precio_anterior)
  const ahorro = hasPromo && pAnterior > pActual ? pAnterior - pActual : 0

  // Bloquear scroll de fondo
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleDownload = async () => {
    if (!storyRef.current) return
    setIsExporting(true)
    try {
      // Carga dinámica para evitar SSR issues
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(storyRef.current, {
        scale: 2,           // 2x resolución para que quede HD
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#080808',
        logging: false,
        width: storyRef.current.offsetWidth,
        height: storyRef.current.offsetHeight,
      })

      const link = document.createElement('a')
      link.download = `${platillo.nombre.replace(/\s+/g, '-').toLowerCase()}-historia-ig.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (err) {
      console.error('Error al exportar historia:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
      <div className="flex flex-col lg:flex-row items-start gap-6 w-full max-w-4xl my-auto">

        {/* Panel izquierdo: Preview de la historia */}
        <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-xs font-sans text-arena/60 uppercase tracking-widest">
            <Camera className="w-3.5 h-3.5" />
            <span>Preview Historia IG (9:16)</span>
          </div>

          {/* Story container: proporciones 9:16 — 360×640 en pantalla */}
          <div
            ref={storyRef}
            className="relative overflow-hidden rounded-2xl shadow-2xl"
            style={{
              width: 360,
              height: 640,
              backgroundColor: '#080808',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {/* ── FONDO: imagen del platillo o gradiente fallback ── */}
            {platillo.imagen_url ? (
              <>
                <img
                  src={platillo.imagen_url}
                  alt={platillo.nombre}
                  onLoad={() => setImgLoaded(true)}
                  crossOrigin="anonymous"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '58%',
                    objectFit: 'cover',
                  }}
                />
                {/* Overlay gradiente que une imagen con fondo negro */}
                <div style={{
                  position: 'absolute',
                  top: '40%',
                  left: 0,
                  right: 0,
                  height: '25%',
                  background: 'linear-gradient(to bottom, transparent, #080808)',
                }} />
              </>
            ) : (
              /* Fallback sin imagen: gradiente oscuro + emoji */
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '58%',
                background: 'linear-gradient(135deg, #0D3B5E 0%, #080808 60%, #1a0a05 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: 100, filter: 'drop-shadow(0 0 30px rgba(42,191,191,0.4))' }}>
                  {platillo.emoji || '🦐'}
                </span>
              </div>
            )}

            {/* ── BADGE DE PROMO (esquina superior derecha) ── */}
            {hasPromo && (
              <div style={{
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
              }}>
                <span style={{ fontSize: 11 }}>🔥</span>
                <span style={{
                  color: '#F7F3EE',
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  {bannerText}
                </span>
              </div>
            )}

            {/* ── CONTENIDO INFERIOR ── */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '24px 22px 20px',
              background: 'linear-gradient(to top, #080808 80%, transparent)',
            }}>
              {/* Ornamento separador */}
              <div style={{
                textAlign: 'center',
                color: '#C9A84C',
                opacity: 0.5,
                fontSize: 11,
                letterSpacing: 4,
                marginBottom: 10,
              }}>
                — ✦ —
              </div>

              {/* Logo MAREA NEGRA */}
              <div style={{ textAlign: 'center', marginBottom: 6 }}>
                <div style={{
                  color: '#F7F3EE',
                  fontSize: 32,
                  fontWeight: 900,
                  letterSpacing: 6,
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}>
                  MAREA NEGRA
                </div>
                <div style={{
                  color: '#E8430A',
                  fontSize: 10,
                  fontStyle: 'italic',
                  letterSpacing: 3,
                  marginTop: 2,
                }}>
                  Aguachiles & Cocteles · Sinaloa
                </div>
              </div>

              {/* Línea dorada */}
              <div style={{
                height: 1,
                background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
                margin: '10px 0',
                opacity: 0.4,
              }} />

              {/* Nombre del platillo */}
              <div style={{
                color: '#F7F3EE',
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: 3,
                textTransform: 'uppercase',
                lineHeight: 1.1,
                marginBottom: 6,
              }}>
                {platillo.nombre}
              </div>

              {/* Descripción */}
              {platillo.descripcion && (
                <div style={{
                  color: '#D4C5A9',
                  fontSize: 11,
                  fontStyle: 'italic',
                  opacity: 0.8,
                  marginBottom: 10,
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                } as React.CSSProperties}>
                  {platillo.descripcion}
                </div>
              )}

              {/* Precio */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                {hasPromo && pAnterior > pActual && (
                  <span style={{
                    color: '#D4C5A9',
                    fontSize: 14,
                    textDecoration: 'line-through',
                    opacity: 0.6,
                  }}>
                    ${formatPrice(pAnterior)}
                  </span>
                )}
                <span style={{
                  color: '#E8430A',
                  fontSize: 38,
                  fontWeight: 900,
                  letterSpacing: 2,
                  lineHeight: 1,
                }}>
                  ${formatPrice(pActual)}
                </span>
                <span style={{ color: '#D4C5A9', fontSize: 12, opacity: 0.7 }}>MXN</span>
              </div>

              {/* Ahorro */}
              {ahorro > 0 && (
                <div style={{
                  color: '#2ABFBF',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}>
                  ¡Ahorras ${ahorro.toFixed(0)} MXN!
                </div>
              )}

              {/* Línea dorada */}
              <div style={{
                height: 1,
                background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
                margin: '10px 0',
                opacity: 0.3,
              }} />

              {/* CTA WhatsApp */}
              <div style={{
                background: 'linear-gradient(135deg, #2ABFBF, #1a9999)',
                borderRadius: 50,
                padding: '10px 18px',
                textAlign: 'center',
                marginBottom: 12,
                boxShadow: '0 0 20px rgba(42,191,191,0.3)',
              }}>
                <span style={{
                  color: '#080808',
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}>
                  📲 Ordena por WhatsApp
                </span>
              </div>

              {/* Handle Instagram */}
              <div style={{
                textAlign: 'center',
                color: '#D4C5A9',
                fontSize: 10,
                opacity: 0.6,
                letterSpacing: 2,
              }}>
                {HANDLE_IG}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-arena/40 font-sans text-center max-w-[360px]">
            La imagen se exportará en alta resolución (720×1280 px) lista para Instagram Stories.
          </p>
        </div>

        {/* Panel derecho: Controles */}
        <div className="flex flex-col gap-4 w-full lg:w-80 shrink-0">
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
          <div className="bg-carbon border border-arena/10 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="text-arena/60 uppercase tracking-wider">Formato</span>
              <span className="text-blanco font-bold">1080×1920 px (9:16)</span>
            </div>
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="text-arena/60 uppercase tracking-wider">Plataforma</span>
              <span className="text-blanco font-bold">Instagram Stories / Reels</span>
            </div>
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="text-arena/60 uppercase tracking-wider">Formato de archivo</span>
              <span className="text-blanco font-bold">PNG (Alta Resolución)</span>
            </div>
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="text-arena/60 uppercase tracking-wider">Imagen del platillo</span>
              <span className={`font-bold ${platillo.imagen_url ? 'text-turquesa' : 'text-arena/50'}`}>
                {platillo.imagen_url ? '✓ Con foto' : '× Sin foto (emoji)'}
              </span>
            </div>
          </div>

          {/* Botón Descargar */}
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full bg-gradient-to-r from-coral to-oro text-negro font-sans font-black text-sm tracking-wider py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(232,67,10,0.3)] hover:shadow-[0_0_40px_rgba(232,67,10,0.5)] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>GENERANDO PNG...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>DESCARGAR PNG</span>
              </>
            )}
          </button>

          <p className="text-[10px] font-sans text-arena/40 text-center leading-relaxed">
            Descarga la imagen y súbela manualmente a Instagram Stories o Reels desde tu teléfono.
          </p>
        </div>
      </div>
    </div>
  )
}
