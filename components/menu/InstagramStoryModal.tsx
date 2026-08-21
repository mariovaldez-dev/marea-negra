'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { X, Download, Loader2, Instagram, Camera, Copy, Check, Sparkles } from 'lucide-react'
import { Platillo } from '@/lib/types/database'
import { isPromoItem, isPromoActiveToday, getPromoBannerText, parsePrice, formatPrice } from '@/lib/utils/promo'

interface InstagramStoryModalProps {
  platillo: Platillo
  onClose: () => void
}

const HANDLE_IG = '@mareanegra.aguachiles'
const CANVAS_W = 1080
const CANVAS_H = 1920

/** Dibuja una imagen sobre el canvas aplicando object-fit: cover */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const naturalW = img.naturalWidth || img.width || 1
  const naturalH = img.naturalHeight || img.height || 1
  const imgRatio = naturalW / naturalH
  const targetRatio = dw / dh

  let sWidth = naturalW
  let sHeight = naturalH
  let sx = 0
  let sy = 0

  if (imgRatio > targetRatio) {
    sWidth = naturalH * targetRatio
    sx = (naturalW - sWidth) / 2
  } else {
    sHeight = naturalW / targetRatio
    sy = (naturalH - sHeight) / 2
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh)
}

/** Dibuja un rectángulo redondeado */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/** Divide texto en líneas según un ancho máximo en píxeles */
function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
      if (lines.length === maxLines - 1) break
    } else {
      currentLine = testLine
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine)
  }
  return lines
}

export function InstagramStoryModal({ platillo, onClose }: InstagramStoryModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isRendering, setIsRendering] = useState(true)
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

  /** Cargar imagen cruzando CORS */
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`No se pudo cargar imagen: ${src}`))
      img.src = src
    })

  /** Dibuja la historia completa en Canvas 2D nativo sin desfases ni html2canvas */
  const renderStoryCanvas = useCallback(async () => {
    if (!canvasRef.current) return
    setIsRendering(true)

    const canvas = canvasRef.current
    canvas.width = CANVAS_W
    canvas.height = CANVAS_H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      // 1. Asegurar fuentes cargadas
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready
      }

      // 2. Fondo Base Negro
      ctx.fillStyle = '#080808'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // 3. Foto del Platillo (Top 54% del Canvas = 1040px)
      const topSectionHeight = 1040
      if (platillo.imagen_url && platillo.imagen_url.trim() !== '') {
        try {
          const img = await loadImage(platillo.imagen_url)
          ctx.save()
          drawImageCover(ctx, img, 0, 0, CANVAS_W, topSectionHeight)
          ctx.restore()
        } catch {
          // Fallback en caso de error de red
          drawGradientFallback(ctx, topSectionHeight, platillo.emoji)
        }
      } else {
        drawGradientFallback(ctx, topSectionHeight, platillo.emoji)
      }

      // 4. Overlay gradiente oscuro suave entre foto y textos
      const photoGrad = ctx.createLinearGradient(0, topSectionHeight - 340, 0, topSectionHeight + 40)
      photoGrad.addColorStop(0, 'rgba(8,8,8,0)')
      photoGrad.addColorStop(0.5, 'rgba(8,8,8,0.75)')
      photoGrad.addColorStop(0.9, 'rgba(8,8,8,0.98)')
      photoGrad.addColorStop(1, '#080808')
      ctx.fillStyle = photoGrad
      ctx.fillRect(0, topSectionHeight - 340, CANVAS_W, 380)

      // 5. Badge de Promoción (Esquina superior derecha)
      if (hasPromo) {
        ctx.save()
        const badgeText = `🔥 ${bannerText.toUpperCase()}`
        ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        const badgeTextW = ctx.measureText(badgeText).width
        const badgeW = badgeTextW + 44
        const badgeH = 54
        const badgeX = CANVAS_W - badgeW - 40
        const badgeY = 50

        // Sombra y gradiente
        ctx.shadowColor = 'rgba(232,67,10,0.6)'
        ctx.shadowBlur = 24
        const bGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH)
        bGrad.addColorStop(0, '#E8430A')
        bGrad.addColorStop(1, '#C9A84C')
        ctx.fillStyle = bGrad
        drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 27)
        ctx.fill()
        ctx.shadowBlur = 0

        // Texto Badge
        ctx.fillStyle = '#F7F3EE'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1)
        ctx.restore()
      }

      // ── PANEL INFERIOR DE TEXTOS Y MARCA (Y = 1040 a 1920) ──
      const midX = CANVAS_W / 2

      // 6. Ornamento — ✦ —
      ctx.fillStyle = 'rgba(201,168,76,0.5)'
      ctx.font = 'bold 24px serif'
      ctx.textAlign = 'center'
      ctx.fillText('— ✦ —', midX, 1070)

      // 7. BRAND LOGO: MAREA NEGRA con sombra 3D Coral
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      const logoY = 1150
      ctx.font = '900 76px "Bebas Neue", -apple-system, sans-serif'

      // Capas de sombra 3D
      ctx.fillStyle = '#421001'
      ctx.fillText('MAREA NEGRA', midX + 9, logoY + 9)
      ctx.fillStyle = '#822204'
      ctx.fillText('MAREA NEGRA', midX + 6, logoY + 6)
      ctx.fillStyle = '#C23A0A'
      ctx.fillText('MAREA NEGRA', midX + 3, logoY + 3)
      ctx.fillStyle = '#F7F3EE'
      ctx.fillText('MAREA NEGRA', midX, logoY)

      // 8. SUBTEXTO: AGUACHILES
      ctx.fillStyle = '#E8430A'
      ctx.font = 'bold 30px "Bebas Neue", sans-serif'
      ctx.letterSpacing = '10px'
      ctx.fillText('AGUACHILES', midX, 1195)
      ctx.letterSpacing = '0px'

      // 9. SLOGAN: ¡AL VRGAZO!, como nos gusta.
      ctx.font = 'bold 24px "Bebas Neue", sans-serif'
      const linePart1 = '¡AL VRGAZO!,'
      const w1 = ctx.measureText(linePart1).width
      ctx.font = 'italic 22px "Cormorant Garamond", Georgia, serif'
      const linePart2 = ' como nos gusta.'
      const w2 = ctx.measureText(linePart2).width
      const totalSloganW = w1 + w2
      const startSloganX = midX - totalSloganW / 2
      const sloganY = 1235

      ctx.textAlign = 'left'
      ctx.fillStyle = '#F7F3EE'
      ctx.font = 'bold 24px "Bebas Neue", sans-serif'
      ctx.fillText(linePart1, startSloganX, sloganY)

      ctx.fillStyle = '#D4C5A9'
      ctx.font = 'italic 22px "Cormorant Garamond", Georgia, serif'
      ctx.fillText(linePart2, startSloganX + w1, sloganY)

      // 10. LÍNEA DIVISORIA DORADA 1
      const line1Grad = ctx.createLinearGradient(120, 0, CANVAS_W - 120, 0)
      line1Grad.addColorStop(0, 'transparent')
      line1Grad.addColorStop(0.5, 'rgba(201,168,76,0.45)')
      line1Grad.addColorStop(1, 'transparent')
      ctx.fillStyle = line1Grad
      ctx.fillRect(120, 1265, CANVAS_W - 240, 2)

      // 11. NOMBRE DEL PLATILLO (Ajuste automático a 1 o 2 líneas si es largo)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#F7F3EE'
      ctx.font = '900 56px "Bebas Neue", Arial, sans-serif'
      const dishTitleLines = wrapTextLines(ctx, platillo.nombre.toUpperCase(), CANVAS_W - 160, 2)

      let currentY = 1330
      if (dishTitleLines.length === 1) {
        ctx.fillText(dishTitleLines[0], midX, currentY)
        currentY += 45
      } else {
        ctx.fillText(dishTitleLines[0], midX, currentY)
        ctx.fillText(dishTitleLines[1], midX, currentY + 50)
        currentY += 95
      }

      // 12. DESCRIPCIÓN DEL PLATILLO
      if (platillo.descripcion && platillo.descripcion.trim()) {
        ctx.fillStyle = 'rgba(212,197,169,0.85)'
        ctx.font = 'italic 26px "Space Grotesk", Georgia, sans-serif'
        const descLines = wrapTextLines(ctx, `"${platillo.descripcion}"`, CANVAS_W - 180, 2)
        for (const line of descLines) {
          ctx.fillText(line, midX, currentY)
          currentY += 34
        }
        currentY += 10
      } else {
        currentY += 20
      }

      // 13. PRECIO
      ctx.textAlign = 'center'
      let priceText = `$${formatPrice(pActual)}`
      ctx.font = '900 86px "Bebas Neue", Arial, sans-serif'
      const priceW = ctx.measureText(priceText).width

      // Si tiene precio anterior tachado
      if (hasPromo && pAnterior > pActual) {
        ctx.font = '700 36px "Bebas Neue", Arial, sans-serif'
        const oldPriceText = `$${formatPrice(pAnterior)}`
        const oldPriceW = ctx.measureText(oldPriceText).width
        const combinedW = oldPriceW + 20 + priceW + 50
        const startPriceX = midX - combinedW / 2

        // Precio anterior
        ctx.textAlign = 'left'
        ctx.fillStyle = 'rgba(212,197,169,0.55)'
        ctx.fillText(oldPriceText, startPriceX, currentY + 15)
        // Tachadura
        ctx.strokeStyle = 'rgba(232,67,10,0.8)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(startPriceX - 4, currentY + 5)
        ctx.lineTo(startPriceX + oldPriceW + 4, currentY + 5)
        ctx.stroke()

        // Precio nuevo
        ctx.fillStyle = '#E8430A'
        ctx.font = '900 86px "Bebas Neue", Arial, sans-serif'
        ctx.fillText(priceText, startPriceX + oldPriceW + 20, currentY + 20)

        // Moneda MXN
        ctx.fillStyle = '#D4C5A9'
        ctx.font = 'bold 24px -apple-system, sans-serif'
        ctx.fillText('MXN', startPriceX + oldPriceW + 20 + priceW + 8, currentY + 10)
      } else {
        // Precio normal centrado
        ctx.fillStyle = '#E8430A'
        ctx.fillText(priceText, midX - 25, currentY + 20)

        ctx.fillStyle = '#D4C5A9'
        ctx.font = 'bold 24px -apple-system, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText('MXN', midX + priceW / 2 - 15, currentY + 10)
      }

      currentY += 75

      // 14. LÍNEA DIVISORIA DORADA 2
      const line2Grad = ctx.createLinearGradient(160, 0, CANVAS_W - 160, 0)
      line2Grad.addColorStop(0, 'transparent')
      line2Grad.addColorStop(0.5, 'rgba(201,168,76,0.35)')
      line2Grad.addColorStop(1, 'transparent')
      ctx.fillStyle = line2Grad
      ctx.fillRect(160, currentY, CANVAS_W - 320, 2)

      // 15. BOTÓN CTA WHATSAPP / APP
      const btnW = 760
      const btnH = 80
      const btnX = midX - btnW / 2
      const btnY = currentY + 35

      ctx.save()
      ctx.shadowColor = 'rgba(42,191,191,0.35)'
      ctx.shadowBlur = 28
      const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH)
      btnGrad.addColorStop(0, '#2ABFBF')
      btnGrad.addColorStop(1, '#1A9999')
      ctx.fillStyle = btnGrad
      drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 40)
      ctx.fill()
      ctx.shadowBlur = 0

      // Texto botón
      ctx.fillStyle = '#080808'
      ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('📲 ORDENA POR WHATSAPP O EN LA APP', midX, btnY + btnH / 2 + 1)
      ctx.restore()

      // 16. HANDLE DE INSTAGRAM
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = 'rgba(212,197,169,0.7)'
      ctx.font = '600 22px -apple-system, sans-serif'
      ctx.letterSpacing = '4px'
      ctx.fillText(HANDLE_IG, midX, 1865)
      ctx.letterSpacing = '0px'
    } catch (err) {
      console.error('Error renderizando canvas historia:', err)
    } finally {
      setIsRendering(false)
    }
  }, [platillo, bannerText, hasPromo, pActual, pAnterior])

  /** Fallback decorativo para platillos sin imagen */
  const drawGradientFallback = (
    ctx: CanvasRenderingContext2D,
    height: number,
    emoji?: string | null
  ) => {
    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_W, height)
    bgGrad.addColorStop(0, '#0D3B5E')
    bgGrad.addColorStop(0.6, '#080808')
    bgGrad.addColorStop(1, '#1A0A05')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, CANVAS_W, height)

    ctx.save()
    ctx.font = '160px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(42,191,191,0.5)'
    ctx.shadowBlur = 40
    ctx.fillText(emoji || '🦐', CANVAS_W / 2, height / 2)
    ctx.restore()
  }

  // Renderizar canvas cada vez que cambie el platillo
  useEffect(() => {
    renderStoryCanvas()
  }, [renderStoryCanvas])

  /** Obtiene el blob PNG del canvas para descargar o copiar */
  const getCanvasBlob = async (): Promise<{ blob: Blob; fileName: string } | null> => {
    if (!canvasRef.current) return null
    const canvas = canvasRef.current
    const fileName = `${platillo.nombre.replace(/\s+/g, '-').toLowerCase()}-historia-ig.png`

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve({ blob, fileName })
        else resolve(null)
      }, 'image/png', 1.0)
    })
  }

  /** Descarga directa al carrete / carpeta de descargas */
  const handleDownloadAndSavePhotos = async () => {
    setIsExporting(true)
    try {
      const result = await getCanvasBlob()
      if (!result) return

      const { blob, fileName } = result

      // 1. Descarga directa en macOS / navegador
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
      const result = await getCanvasBlob()
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

        {/* Panel izquierdo: Preview del Canvas 2D en vivo (340x604) */}
        <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-xs font-sans text-arena/60 uppercase tracking-widest">
            <Camera className="w-3.5 h-3.5 text-turquesa" />
            <span>Historia Ultra HD (9:16 · 1080×1920)</span>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-arena/20 bg-[#080808] flex items-center justify-center">
            {isRendering && (
              <div className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-turquesa animate-spin" />
                <span className="text-xs font-sans text-blanco">Generando composición HD...</span>
              </div>
            )}

            {/* Canvas Nativo escalado visualmente con máxima nitidez */}
            <canvas
              ref={canvasRef}
              style={{
                width: 340,
                height: 604,
                display: 'block',
                backgroundColor: '#080808',
              }}
            />
          </div>

          <p className="text-[10px] text-arena/40 font-sans text-center max-w-[340px]">
            Renderizado por GPU en 1080×1920 px. Lo que ves es exactamente lo que se descarga y copia.
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
              <span className="text-arena/60 uppercase tracking-wider">Motor</span>
              <span className="text-turquesa font-bold">Canvas 2D Ultra HD</span>
            </div>
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="text-arena/60 uppercase tracking-wider">Formato de salida</span>
              <span className="text-blanco font-bold">PNG Sin Pérdida</span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownloadAndSavePhotos}
              disabled={isExporting || isRendering}
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
              disabled={isExporting || isRendering}
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
