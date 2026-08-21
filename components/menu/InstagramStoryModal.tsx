'use client'

import React, { useRef, useState, useEffect } from 'react'
import { toBlob } from 'html-to-image'
import { X, Download, Loader2, Instagram, Camera, Copy, Check, Sparkles, Flame, Image as ImageIcon, Sparkle } from 'lucide-react'
import { Platillo } from '@/lib/types/database'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { isPromoItem, isPromoActiveToday, getPromoBannerText, parsePrice, formatPrice } from '@/lib/utils/promo'

interface InstagramStoryModalProps {
  platillo: Platillo
  onClose: () => void
}

type StoryTemplateId = 'clasico' | 'fullphoto' | 'promo' | 'pizarra'

interface TemplateOption {
  id: StoryTemplateId
  name: string
  icon: React.ReactNode
  tag: string
}

const TEMPLATES: TemplateOption[] = [
  { id: 'clasico', name: 'Clásico', icon: <Sparkles className="w-3.5 h-3.5" />, tag: 'Equilibrado' },
  { id: 'fullphoto', name: 'Full Foto', icon: <ImageIcon className="w-3.5 h-3.5" />, tag: 'Visual 100%' },
  { id: 'promo', name: 'Flash Promo', icon: <Flame className="w-3.5 h-3.5" />, tag: 'Impacto' },
  { id: 'pizarra', name: 'Pizarra Oro', icon: <Sparkle className="w-3.5 h-3.5" />, tag: 'Dark Luxury' },
]

const HANDLE_IG = '@mareanegra.aguachiles'

export function InstagramStoryModal({ platillo, onClose }: InstagramStoryModalProps) {
  const [activeTemplate, setActiveTemplate] = useState<StoryTemplateId>('clasico')
  const storyDomRef = useRef<HTMLDivElement>(null)

  const [isExporting, setIsExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [base64Image, setBase64Image] = useState<string | null>(null)
  const [imageReady, setImageReady] = useState(false)

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

  // Convertir imagen a Base64 usando el proxy seguro para evitar CORS y pantallas negras en iOS/Android
  useEffect(() => {
    let isMounted = true

    if (!platillo.imagen_url || platillo.imagen_url.trim() === '') {
      setImageReady(true)
      return
    }

    const fetchImageBase64 = async () => {
      try {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(platillo.imagen_url!)}`
        const res = await fetch(proxyUrl)
        if (res.ok) {
          const blob = await res.blob()
          const reader = new FileReader()
          reader.onloadend = () => {
            if (isMounted && typeof reader.result === 'string') {
              setBase64Image(reader.result)
              setImageReady(true)
            }
          }
          reader.readAsDataURL(blob)
          return
        }
      } catch (proxyErr) {
        console.warn('Proxy fetch falló, intentando fallback directo:', proxyErr)
      }

      // Fallback directo
      try {
        const resDirect = await fetch(platillo.imagen_url!, { mode: 'cors' })
        const blobDirect = await resDirect.blob()
        const reader = new FileReader()
        reader.onloadend = () => {
          if (isMounted && typeof reader.result === 'string') {
            setBase64Image(reader.result)
            setImageReady(true)
          }
        }
        reader.readAsDataURL(blobDirect)
      } catch (err) {
        console.error('Error cargando base64 de imagen:', err)
        if (isMounted) {
          setBase64Image(platillo.imagen_url)
          setImageReady(true)
        }
      }
    }

    fetchImageBase64()
    return () => {
      isMounted = false
    }
  }, [platillo.imagen_url])

  const displayImgSrc: string | undefined = (base64Image || platillo.imagen_url) || undefined

  /** Genera el Blob PNG en Ultra HD (1080×1920) */
  const generateStoryBlob = async (): Promise<{ blob: Blob; fileName: string } | null> => {
    if (!storyDomRef.current) return null
    const fileName = `${platillo.nombre.replace(/\s+/g, '-').toLowerCase()}-${activeTemplate}-ig.png`

    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready
      }

      // Esperar brevemente para asegurar que el DOM esté completamente pintado
      await new Promise((r) => setTimeout(r, 80))

      const blob = await toBlob(storyDomRef.current, {
        pixelRatio: 3, // 360x640 * 3 = 1080x1920 Ultra HD
        quality: 1.0,
        cacheBust: false, // Importante: false para no romper los strings Base64
        backgroundColor: '#050404',
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

      // 1. Descarga directa
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
          // Share omitido
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

        {/* Panel izquierdo: Selector de Templates + Canvas DOM Preview (360x640) */}
        <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
          {/* BARRA SELECTORA DE PLANTILLAS */}
          <div className="flex items-center bg-carbon border border-arena/20 rounded-xl p-1 gap-1 max-w-[360px] overflow-x-auto no-scrollbar">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setActiveTemplate(tmpl.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all whitespace-nowrap ${
                  activeTemplate === tmpl.id
                    ? 'bg-turquesa text-negro shadow-md'
                    : 'text-arena/70 hover:text-blanco'
                }`}
              >
                {tmpl.icon}
                <span>{tmpl.name}</span>
              </button>
            ))}
          </div>

          {/* CONTENEDOR DEL DISEÑO DOM REAL A EXPORTAR (360x640) */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-arena/20 bg-[#050404] flex items-center justify-center">
            {!imageReady && platillo.imagen_url && (
              <div className="absolute inset-0 z-30 bg-black/75 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-turquesa animate-spin" />
                <span className="text-xs font-sans text-blanco">Preparando diseño HD...</span>
              </div>
            )}

            <div
              ref={storyDomRef}
              className="relative overflow-hidden select-none"
              style={{
                width: 360,
                height: 640,
                backgroundColor: '#050404',
                backgroundImage: 'radial-gradient(rgba(201, 168, 76, 0.08) 1.2px, transparent 1.2px)',
                backgroundSize: '18px 18px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {/* Marco Perimetral Luxury */}
              <div
                style={{
                  position: 'absolute',
                  inset: 6,
                  border: '1px solid rgba(201,168,76,0.22)',
                  borderRadius: 14,
                  pointerEvents: 'none',
                  zIndex: 20,
                }}
              />

              {/* ═══════════════════════════════════════════════════════════
                  PLANTILLA 1: CLÁSICO (DARK LUXURY EQUILIBRADO)
              ═══════════════════════════════════════════════════════════ */}
              {activeTemplate === 'clasico' && (
                <>
                  {platillo.imagen_url ? (
                    <>
                      <img
                        src={displayImgSrc}
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
                      <div
                        style={{
                          position: 'absolute',
                          top: '34%',
                          left: 0,
                          right: 0,
                          height: '20%',
                          background: 'linear-gradient(to bottom, transparent, #050404)',
                        }}
                      />
                    </>
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '52%',
                        background: 'linear-gradient(135deg, #0D3B5E 0%, #050404 60%, #1A0A05 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: 90, filter: 'drop-shadow(0 0 20px rgba(42,191,191,0.5))' }}>
                        {platillo.emoji || '🦐'}
                      </span>
                    </div>
                  )}

                  {/* Banner de Oferta Activa */}
                  {hasPromo && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'linear-gradient(135deg, #FF6B00, #E8430A, #FF6B00)',
                        borderRadius: 30,
                        padding: '5px 14px',
                        color: '#F7F3EE',
                        fontSize: 10.5,
                        fontWeight: 900,
                        letterSpacing: 0.8,
                        boxShadow: '0 0 20px rgba(232,67,10,0.6)',
                        zIndex: 15,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🔥 {bannerText}
                    </div>
                  )}

                  {/* Tarjeta de Contenido Inferior */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '52%',
                      padding: '12px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      zIndex: 10,
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          color: '#C9A84C',
                          fontSize: 10,
                          letterSpacing: 3,
                          opacity: 0.7,
                          marginBottom: 2,
                        }}
                      >
                        — ✦ —
                      </div>
                      <BrandLogo size="md" withSubtext align="center" href={null} />
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: 1,
                        background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)',
                        margin: '3px 0',
                        display: 'block',
                      }}
                    />

                    <div
                      className="font-display"
                      style={{
                        color: '#F7F3EE',
                        fontSize: 26,
                        fontWeight: 900,
                        letterSpacing: 1.5,
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        lineHeight: 1.05,
                      }}
                    >
                      {platillo.nombre}
                    </div>

                    {platillo.descripcion && (
                      <div
                        style={{
                          color: '#D4C5A9',
                          fontSize: 10.5,
                          fontStyle: 'italic',
                          opacity: 0.85,
                          textAlign: 'center',
                          marginBottom: 4,
                          lineHeight: 1.3,
                          display: 'block',
                        }}
                      >
                        {platillo.descripcion.length > 95
                          ? `"${platillo.descripcion.slice(0, 95)}..."`
                          : `"${platillo.descripcion}"`}
                      </div>
                    )}

                    {/* BLOQUE DE PRECIO ULTRA LLAMATIVO (CLÁSICO) */}
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '3px 0 5px' }}>
                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(232,67,10,0.18) 0%, rgba(8,8,8,0.9) 50%, rgba(201,168,76,0.18) 100%)',
                          border: '1.5px solid rgba(232,67,10,0.5)',
                          borderRadius: 16,
                          padding: '5px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          boxShadow: '0 0 25px rgba(232,67,10,0.25), inset 0 0 15px rgba(201,168,76,0.1)',
                        }}
                      >
                        {hasPromo && pAnterior > pActual && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span
                              style={{
                                color: '#D4C5A9',
                                fontSize: 12,
                                textDecoration: 'line-through',
                                textDecorationColor: '#E8430A',
                                opacity: 0.65,
                                lineHeight: 1,
                              }}
                            >
                              ${formatPrice(pAnterior)}
                            </span>
                            {ahorro > 0 && (
                              <span
                                style={{
                                  background: '#2ABFBF',
                                  color: '#080808',
                                  fontSize: 8,
                                  fontWeight: 900,
                                  padding: '1px 5px',
                                  borderRadius: 6,
                                  marginTop: 2,
                                  letterSpacing: 0.5,
                                }}
                              >
                                -${ahorro.toFixed(0)}
                              </span>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                          <span
                            style={{
                              color: '#FFA800',
                              fontSize: 16,
                              fontWeight: 900,
                              fontFamily: 'var(--font-bebas), sans-serif',
                            }}
                          >
                            $
                          </span>
                          <span
                            className="font-display"
                            style={{
                              color: '#FF5500',
                              fontSize: 38,
                              fontWeight: 900,
                              letterSpacing: 1,
                              lineHeight: 1,
                              filter: 'drop-shadow(0 0 12px rgba(232,67,10,0.6))',
                            }}
                          >
                            {formatPrice(pActual)}
                          </span>
                          <span
                            style={{
                              color: '#D4C5A9',
                              fontSize: 10.5,
                              fontWeight: 800,
                              opacity: 0.8,
                              marginLeft: 3,
                            }}
                          >
                            MXN
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: 1,
                        background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)',
                        margin: '2px 0 5px',
                        display: 'block',
                      }}
                    />

                    <div
                      style={{
                        background: 'linear-gradient(135deg, #2ABFBF, #1a9999)',
                        borderRadius: 50,
                        padding: '7px 12px',
                        textAlign: 'center',
                        marginBottom: 4,
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
                          whiteSpace: 'nowrap',
                        }}
                      >
                        📲 Ordena por WhatsApp o en la APP
                      </span>
                    </div>

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
                </>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  PLANTILLA 2: FULL PHOTO (FOTO AL 100% + TARJETA SÓLIDA)
              ═══════════════════════════════════════════════════════════ */}
              {activeTemplate === 'fullphoto' && (
                <>
                  {platillo.imagen_url ? (
                    <img
                      src={displayImgSrc}
                      alt={platillo.nombre}
                      crossOrigin="anonymous"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, #0D3B5E 0%, #080808 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: 120 }}>{platillo.emoji || '🦐'}</span>
                    </div>
                  )}

                  {/* Gradiente sutil superior e inferior para legibilidad sin oscurecer la foto */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, rgba(5,4,4,0.55) 0%, transparent 20%, transparent 65%, rgba(5,4,4,0.85) 100%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Header Flotante con Logo */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 18,
                      left: 18,
                      right: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        background: '#050404',
                        border: '1px solid rgba(201,168,76,0.4)',
                        padding: '6px 16px',
                        borderRadius: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
                      }}
                    >
                      <BrandLogo size="xs" withSubtext align="center" href={null} />
                    </div>

                    {hasPromo && (
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #FF6B00, #E8430A, #FF6B00)',
                          borderRadius: 30,
                          padding: '5px 14px',
                          color: '#F7F3EE',
                          fontSize: 10.5,
                          fontWeight: 900,
                          letterSpacing: 0.8,
                          boxShadow: '0 0 20px rgba(232,67,10,0.6)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          whiteSpace: 'nowrap',
                          maxWidth: '90%',
                          textAlign: 'center',
                        }}
                      >
                        🔥 {bannerText}
                      </div>
                    )}
                  </div>

                  {/* Tarjeta Flotante en la Base */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 18,
                      left: 16,
                      right: 16,
                      background: '#050404',
                      borderRadius: 22,
                      padding: '14px 16px',
                      border: '1.5px solid rgba(201,168,76,0.45)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.9)',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                    }}
                  >
                    <div
                      style={{
                        color: '#2ABFBF',
                        fontSize: 9.5,
                        fontWeight: 900,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                      }}
                    >
                      ✨ Mariscos Frescos de Sinaloa
                    </div>

                    <div
                      className="font-display"
                      style={{
                        color: '#F7F3EE',
                        fontSize: 24,
                        fontWeight: 900,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        lineHeight: 1.1,
                      }}
                    >
                      {platillo.nombre}
                    </div>

                    {/* PRECIO FULL FOTO */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(17,17,17,0.95)',
                        border: '1px solid rgba(201,168,76,0.35)',
                        borderRadius: 14,
                        padding: '6px 14px',
                        margin: '2px 0',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#C9A84C', fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>
                          {hasPromo ? 'Precio Promoción' : 'Precio Especial'}
                        </span>
                        {hasPromo && pAnterior > pActual && (
                          <span
                            style={{
                              color: '#D4C5A9',
                              fontSize: 11.5,
                              textDecoration: 'line-through',
                              textDecorationColor: '#E8430A',
                              opacity: 0.65,
                            }}
                          >
                            ${formatPrice(pAnterior)} MXN
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                        <span style={{ color: '#FFA800', fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-bebas), sans-serif' }}>
                          $
                        </span>
                        <span
                          className="font-display"
                          style={{
                            color: '#FF5500',
                            fontSize: 36,
                            fontWeight: 900,
                            lineHeight: 1,
                            filter: 'drop-shadow(0 0 10px rgba(232,67,10,0.5))',
                          }}
                        >
                          {formatPrice(pActual)}
                        </span>
                        <span style={{ color: '#D4C5A9', fontSize: 10.5, fontWeight: 700, marginLeft: 2 }}>
                          MXN
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'linear-gradient(135deg, #2ABFBF, #1a9999)',
                        borderRadius: 50,
                        padding: '8px 12px',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 3,
                        boxShadow: '0 0 20px rgba(42,191,191,0.3)',
                      }}
                    >
                      <span
                        style={{
                          color: '#080808',
                          fontSize: 10.5,
                          fontWeight: 900,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        📲 Pide por WhatsApp o en la APP
                      </span>
                    </div>

                    <div
                      style={{
                        textAlign: 'center',
                        color: '#D4C5A9',
                        fontSize: 9,
                        opacity: 0.6,
                        letterSpacing: 2,
                        marginTop: 1,
                      }}
                    >
                      {HANDLE_IG}
                    </div>
                  </div>
                </>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  PLANTILLA 3: FLASH PROMO (OFERTA GIGANTE Y FUEGO)
              ═══════════════════════════════════════════════════════════ */}
              {activeTemplate === 'promo' && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'radial-gradient(circle at 50% 10%, #3D1000 0%, #080808 60%, #050404 100%)',
                    }}
                  />

                  {/* Banner de Oferta Gigante */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 18,
                      left: 14,
                      right: 14,
                      background: 'linear-gradient(135deg, #FF6B00, #E8430A, #FF6B00)',
                      borderRadius: 14,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 0 20px rgba(232,67,10,0.5)',
                      zIndex: 15,
                    }}
                  >
                    <span className="font-display" style={{ color: '#F7F3EE', fontSize: 16, letterSpacing: 2 }}>
                      🔥 {hasPromo ? bannerText.toUpperCase() : '¡OFERTA POR TIEMPO LIMITADO!'} 🔥
                    </span>
                  </div>

                  {/* Foto Centrada Enmarcada */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 68,
                      left: 14,
                      right: 14,
                      height: '42%',
                      borderRadius: 16,
                      overflow: 'hidden',
                      border: '2px solid rgba(201,168,76,0.4)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    }}
                  >
                    {platillo.imagen_url ? (
                      <img
                        src={displayImgSrc}
                        alt={platillo.nombre}
                        crossOrigin="anonymous"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: '#0D3B5E',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: 80 }}>{platillo.emoji || '🦐'}</span>
                      </div>
                    )}

                    {ahorro > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          background: '#2ABFBF',
                          color: '#080808',
                          fontWeight: 900,
                          fontSize: 11,
                          padding: '4px 10px',
                          borderRadius: 8,
                          boxShadow: '0 0 15px rgba(42,191,191,0.6)',
                        }}
                      >
                        💥 AHORRAS ${ahorro.toFixed(0)} MXN
                      </div>
                    )}
                  </div>

                  {/* Bloque de Información Fuego */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '46%',
                      padding: '14px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      className="font-display"
                      style={{
                        color: '#F7F3EE',
                        fontSize: 30,
                        fontWeight: 900,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        lineHeight: 1,
                      }}
                    >
                      {platillo.nombre}
                    </div>

                    {/* Caja de Precio Fuego Gigante */}
                    <div
                      style={{
                        background: '#080808',
                        border: '2px solid #E8430A',
                        borderRadius: 18,
                        padding: '6px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        boxShadow: '0 0 30px rgba(232,67,10,0.4), inset 0 0 20px rgba(232,67,10,0.15)',
                        margin: '4px 0',
                      }}
                    >
                      {hasPromo && pAnterior > pActual && (
                        <span
                          style={{
                            color: '#D4C5A9',
                            fontSize: 16,
                            textDecoration: 'line-through',
                            textDecorationColor: '#E8430A',
                            opacity: 0.65,
                          }}
                        >
                          ${formatPrice(pAnterior)}
                        </span>
                      )}

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                        <span style={{ color: '#FFA800', fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-bebas), sans-serif' }}>
                          $
                        </span>
                        <span
                          className="font-display"
                          style={{
                            color: '#FF5500',
                            fontSize: 50,
                            fontWeight: 900,
                            lineHeight: 1,
                            filter: 'drop-shadow(0 0 15px rgba(232,67,10,0.8))',
                          }}
                        >
                          {formatPrice(pActual)}
                        </span>
                        <span style={{ color: '#D4C5A9', fontSize: 12, fontWeight: 800, marginLeft: 2 }}>
                          MXN
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #2ABFBF, #1a9999)',
                        borderRadius: 50,
                        padding: '9px 14px',
                        textAlign: 'center',
                        boxShadow: '0 0 20px rgba(42,191,191,0.4)',
                      }}
                    >
                      <span
                        style={{
                          color: '#080808',
                          fontSize: 11.5,
                          fontWeight: 900,
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                        }}
                      >
                        ⚡ Ordena antes de que se agote
                      </span>
                    </div>

                    <div
                      style={{
                        color: '#D4C5A9',
                        fontSize: 9.5,
                        opacity: 0.65,
                        letterSpacing: 2,
                      }}
                    >
                      Marea Negra · {HANDLE_IG}
                    </div>
                  </div>
                </>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  PLANTILLA 4: PIZARRA ORO (DARK LUXURY MARISQUERÍA)
              ═══════════════════════════════════════════════════════════ */}
              {activeTemplate === 'pizarra' && (
                <>
                  {/* Doble Marco Dorado Ornamental */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 10,
                      border: '1px solid rgba(201,168,76,0.35)',
                      borderRadius: 12,
                      pointerEvents: 'none',
                      zIndex: 20,
                    }}
                  />

                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      padding: '24px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'center',
                      zIndex: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: '#C9A84C',
                          fontSize: 10,
                          letterSpacing: 3,
                          textTransform: 'uppercase',
                          marginBottom: 2,
                        }}
                      >
                        — ✦ Mariscos Frescos ✦ —
                      </div>
                      <BrandLogo size="md" withSubtext align="center" href={null} />
                    </div>

                    {/* Foto Circular con Halo Turquesa */}
                    <div
                      style={{
                        width: 170,
                        height: 170,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid #2ABFBF',
                        boxShadow: '0 0 25px rgba(42,191,191,0.4)',
                        position: 'relative',
                      }}
                    >
                      {platillo.imagen_url ? (
                        <img
                          src={displayImgSrc}
                          alt={platillo.nombre}
                          crossOrigin="anonymous"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            background: '#0D3B5E',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span style={{ fontSize: 70 }}>{platillo.emoji || '🦐'}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ width: '100%' }}>
                      <div
                        className="font-display"
                        style={{
                          color: '#F7F3EE',
                          fontSize: 26,
                          fontWeight: 900,
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                        }}
                      >
                        {platillo.nombre}
                      </div>

                      {platillo.descripcion && (
                        <div
                          style={{
                            color: '#D4C5A9',
                            fontSize: 10,
                            fontStyle: 'italic',
                            opacity: 0.85,
                            marginTop: 2,
                          }}
                        >
                          "{platillo.descripcion.slice(0, 80)}"
                        </div>
                      )}
                    </div>

                    {/* Placa de Precio Dorada */}
                    <div
                      style={{
                        background: 'rgba(8,8,8,0.95)',
                        border: '1.5px solid rgba(201,168,76,0.7)',
                        borderRadius: 14,
                        padding: '6px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 0 20px rgba(201,168,76,0.25)',
                      }}
                    >
                      <span style={{ color: '#FFA800', fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-bebas), sans-serif' }}>
                        $
                      </span>
                      <span
                        className="font-display"
                        style={{
                          color: '#C9A84C',
                          fontSize: 38,
                          fontWeight: 900,
                          lineHeight: 1,
                        }}
                      >
                        {formatPrice(pActual)}
                      </span>
                      <span style={{ color: '#D4C5A9', fontSize: 10.5, fontWeight: 700 }}>
                        MXN
                      </span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #2ABFBF, #1a9999)',
                        borderRadius: 50,
                        padding: '7px 12px',
                        textAlign: 'center',
                        boxShadow: '0 0 15px rgba(42,191,191,0.25)',
                      }}
                    >
                      <span
                        style={{
                          color: '#080808',
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: 1.2,
                          textTransform: 'uppercase',
                        }}
                      >
                        📲 Ordena por WhatsApp o en la APP
                      </span>
                    </div>

                    <div
                      style={{
                        color: '#D4C5A9',
                        fontSize: 9,
                        opacity: 0.6,
                        letterSpacing: 2,
                      }}
                    >
                      {HANDLE_IG}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="text-[10px] text-arena/40 font-sans text-center max-w-[360px]">
            Diseño original con tipografía de marca Bebas Neue, Space Grotesk y Cormorant Garamond.
          </p>
        </div>

        {/* Panel derecho: Controles y Acciones */}
        <div className="flex flex-col gap-4 w-full max-w-[360px] lg:w-80 shrink-0">
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
                Creador de Historias IG
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
              <span className="text-arena/60 uppercase tracking-wider">Plantilla</span>
              <span className="text-turquesa font-bold">
                {TEMPLATES.find((t) => t.id === activeTemplate)?.name} ({TEMPLATES.find((t) => t.id === activeTemplate)?.tag})
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="text-arena/60 uppercase tracking-wider">Formato</span>
              <span className="text-blanco font-bold">1080×1920 px (9:16)</span>
            </div>
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="text-arena/60 uppercase tracking-wider">Resolución</span>
              <span className="text-turquesa font-bold">Ultra HD 3x</span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownloadAndSavePhotos}
              disabled={isExporting || (!imageReady && !!platillo.imagen_url)}
              className="w-full bg-gradient-to-r from-coral to-oro text-negro font-sans font-black text-sm tracking-wider py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(232,67,10,0.3)] hover:shadow-[0_0_40px_rgba(232,67,10,0.5)] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>EXPORTANDO...</span>
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
              disabled={isExporting || (!imageReady && !!platillo.imagen_url)}
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
            💡 En mobile presiona <strong>Descargar</strong> para guardarla directo en tu carrete de Fotos y subirla a tu Historia de Instagram.
          </p>
        </div>
      </div>
    </div>
  )
}
