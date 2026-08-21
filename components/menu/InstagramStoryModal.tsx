'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { X, Download, Loader2, Instagram, Camera, Copy, Check, Sparkles, Flame, Image as ImageIcon, Sparkle } from 'lucide-react'
import { Platillo } from '@/lib/types/database'
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

/** Dibuja la textura de puntos dorados Dark Luxury */
function drawDotsPattern(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = 'rgba(201, 168, 76, 0.08)'
  const step = 28
  for (let x = 14; x < width; x += step) {
    for (let y = 14; y < height; y += step) {
      ctx.beginPath()
      ctx.arc(x, y, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export function InstagramStoryModal({ platillo, onClose }: InstagramStoryModalProps) {
  const [activeTemplate, setActiveTemplate] = useState<StoryTemplateId>('clasico')
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

  /** Cargar imagen cruzando CORS a través del proxy para 100% de fiabilidad en iOS / Android / macOS */
  const loadSafeImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => {
        // Fallback por si la URL directa falla
        const fallbackImg = new Image()
        fallbackImg.crossOrigin = 'anonymous'
        fallbackImg.onload = () => resolve(fallbackImg)
        fallbackImg.onerror = (err) => reject(err)
        fallbackImg.src = src
      }

      if (src.startsWith('http://') || src.startsWith('https://')) {
        img.src = `/api/image-proxy?url=${encodeURIComponent(src)}`
      } else {
        img.src = src
      }
    })

  /** Renderiza la plantilla activa directamente en Canvas 2D (1080×1920) */
  const renderCanvasStory = useCallback(async () => {
    if (!canvasRef.current) return
    setIsRendering(true)

    const canvas = canvasRef.current
    canvas.width = CANVAS_W
    canvas.height = CANVAS_H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready
      }

      // Cargar la imagen del platillo si existe
      let loadedImg: HTMLImageElement | null = null
      if (platillo.imagen_url && platillo.imagen_url.trim() !== '') {
        try {
          loadedImg = await loadSafeImage(platillo.imagen_url)
        } catch (e) {
          console.warn('No se pudo cargar la imagen, usando fallback:', e)
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // PLANTILLA 1: CLÁSICO (DARK LUXURY EQUILIBRADO)
      // ═══════════════════════════════════════════════════════════════
      if (activeTemplate === 'clasico') {
        // Fondo base
        ctx.fillStyle = '#050404'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        drawDotsPattern(ctx, CANVAS_W, CANVAS_H)

        // Foto en la parte superior (0 a 1000px)
        const photoH = 1000
        if (loadedImg) {
          ctx.save()
          drawImageCover(ctx, loadedImg, 0, 0, CANVAS_W, photoH)
          ctx.restore()
        } else {
          drawGradientFallback(ctx, photoH, platillo.emoji)
        }

        // Fusión degradada hacia #050404
        const photoGrad = ctx.createLinearGradient(0, photoH - 320, 0, photoH + 20)
        photoGrad.addColorStop(0, 'rgba(5,4,4,0)')
        photoGrad.addColorStop(0.6, 'rgba(5,4,4,0.88)')
        photoGrad.addColorStop(1, '#050404')
        ctx.fillStyle = photoGrad
        ctx.fillRect(0, photoH - 320, CANVAS_W, 340)

        // Marco dorado exterior fino
        ctx.strokeStyle = 'rgba(201,168,76,0.3)'
        ctx.lineWidth = 3.5
        drawRoundedRect(ctx, 24, 24, CANVAS_W - 48, CANVAS_H - 48, 40)
        ctx.stroke()

        // Banner de Oferta (Top Right)
        if (hasPromo) {
          ctx.save()
          const bText = `🔥 ${bannerText.toUpperCase()}`
          ctx.font = '900 30px -apple-system, BlinkMacSystemFont, sans-serif'
          const bW = ctx.measureText(bText).width + 64
          const bH = 72
          const bX = CANVAS_W - bW - 45
          const bY = 50

          ctx.shadowColor = 'rgba(232,67,10,0.65)'
          ctx.shadowBlur = 28
          const bGrad = ctx.createLinearGradient(bX, bY, bX + bW, bY + bH)
          bGrad.addColorStop(0, '#FF6B00')
          bGrad.addColorStop(0.5, '#E8430A')
          bGrad.addColorStop(1, '#FF6B00')
          ctx.fillStyle = bGrad
          drawRoundedRect(ctx, bX, bY, bW, bH, 36)
          ctx.fill()
          ctx.shadowBlur = 0

          ctx.fillStyle = '#F7F3EE'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(bText, bX + bW / 2, bY + bH / 2 + 1)
          ctx.restore()
        }

        const midX = CANVAS_W / 2

        // Ornamento — ✦ —
        ctx.fillStyle = 'rgba(201,168,76,0.5)'
        ctx.font = 'bold 30px serif'
        ctx.textAlign = 'center'
        ctx.fillText('— ✦ —', midX, 1040)

        // Logo MAREA NEGRA con sombra 3D
        ctx.textAlign = 'center'
        const logoY = 1145
        ctx.font = '900 106px "Bebas Neue", Arial, sans-serif'
        ctx.fillStyle = '#421001'
        ctx.fillText('MAREA NEGRA', midX + 10, logoY + 10)
        ctx.fillStyle = '#822204'
        ctx.fillText('MAREA NEGRA', midX + 6, logoY + 6)
        ctx.fillStyle = '#C23A0A'
        ctx.fillText('MAREA NEGRA', midX + 3, logoY + 3)
        ctx.fillStyle = '#F7F3EE'
        ctx.fillText('MAREA NEGRA', midX, logoY)

        // Subtexto AGUACHILES
        ctx.fillStyle = '#E8430A'
        ctx.font = 'bold 38px "Bebas Neue", sans-serif'
        ctx.letterSpacing = '14px'
        ctx.fillText('AGUACHILES', midX, 1200)
        ctx.letterSpacing = '0px'

        // Slogan
        ctx.font = 'bold 30px "Bebas Neue", sans-serif'
        const s1 = '¡AL VRGAZO!,'
        const sw1 = ctx.measureText(s1).width
        ctx.font = 'italic 28px "Cormorant Garamond", Georgia, serif'
        const s2 = ' como nos gusta.'
        const sw2 = ctx.measureText(s2).width
        const totalSW = sw1 + sw2
        const startSX = midX - totalSW / 2
        const sloganY = 1248

        ctx.textAlign = 'left'
        ctx.fillStyle = '#F7F3EE'
        ctx.font = 'bold 30px "Bebas Neue", sans-serif'
        ctx.fillText(s1, startSX, sloganY)
        ctx.fillStyle = '#D4C5A9'
        ctx.font = 'italic 28px "Cormorant Garamond", Georgia, serif'
        ctx.fillText(s2, startSX + sw1, sloganY)

        // Línea Divisoria Dorada 1
        const line1 = ctx.createLinearGradient(100, 0, CANVAS_W - 100, 0)
        line1.addColorStop(0, 'transparent')
        line1.addColorStop(0.5, 'rgba(201,168,76,0.45)')
        line1.addColorStop(1, 'transparent')
        ctx.fillStyle = line1
        ctx.fillRect(100, 1285, CANVAS_W - 200, 2.5)

        // Nombre del Platillo
        ctx.textAlign = 'center'
        ctx.fillStyle = '#F7F3EE'
        ctx.font = '900 78px "Bebas Neue", Arial, sans-serif'
        const dishLines = wrapTextLines(ctx, platillo.nombre.toUpperCase(), CANVAS_W - 140, 2)
        let curY = 1365
        if (dishLines.length === 1) {
          ctx.fillText(dishLines[0], midX, curY)
          curY += 60
        } else {
          ctx.fillText(dishLines[0], midX, curY)
          ctx.fillText(dishLines[1], midX, curY + 68)
          curY += 130
        }

        // Descripción
        if (platillo.descripcion && platillo.descripcion.trim()) {
          ctx.fillStyle = 'rgba(212,197,169,0.85)'
          ctx.font = 'italic 34px "Space Grotesk", Georgia, sans-serif'
          const descLines = wrapTextLines(ctx, `"${platillo.descripcion}"`, CANVAS_W - 160, 2)
          for (const dl of descLines) {
            ctx.fillText(dl, midX, curY)
            curY += 44
          }
          curY += 18
        } else {
          curY += 28
        }

        // Caja de Precio Ultra Llamativa
        const priceCardW = 720
        const priceCardH = 125
        const priceCardX = midX - priceCardW / 2
        const priceCardY = curY

        ctx.save()
        ctx.shadowColor = 'rgba(232,67,10,0.35)'
        ctx.shadowBlur = 28
        const pCardGrad = ctx.createLinearGradient(priceCardX, priceCardY, priceCardX + priceCardW, priceCardY + priceCardH)
        pCardGrad.addColorStop(0, 'rgba(232,67,10,0.25)')
        pCardGrad.addColorStop(0.5, 'rgba(8,8,8,0.95)')
        pCardGrad.addColorStop(1, 'rgba(201,168,76,0.25)')
        ctx.fillStyle = pCardGrad
        drawRoundedRect(ctx, priceCardX, priceCardY, priceCardW, priceCardH, 28)
        ctx.fill()
        ctx.strokeStyle = 'rgba(232,67,10,0.6)'
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.shadowBlur = 0

        // Contenido del Precio
        let pMainText = `$${formatPrice(pActual)}`
        ctx.font = '900 92px "Bebas Neue", Arial, sans-serif'
        const pMainW = ctx.measureText(pMainText).width

        if (hasPromo && pAnterior > pActual) {
          // Precio anterior tachado
          const pOldText = `$${formatPrice(pAnterior)}`
          ctx.font = '700 42px "Bebas Neue", Arial, sans-serif'
          const pOldW = ctx.measureText(pOldText).width

          const totalPW = pOldW + 35 + pMainW + 65
          const startPX = midX - totalPW / 2

          ctx.textAlign = 'left'
          ctx.fillStyle = 'rgba(212,197,169,0.65)'
          ctx.fillText(pOldText, startPX, priceCardY + 76)

          // Línea tachada roja
          ctx.strokeStyle = '#E8430A'
          ctx.lineWidth = 3.5
          ctx.beginPath()
          ctx.moveTo(startPX - 6, priceCardY + 62)
          ctx.lineTo(startPX + pOldW + 6, priceCardY + 62)
          ctx.stroke()

          // Precio nuevo fuego
          ctx.fillStyle = '#FF5500'
          ctx.font = '900 92px "Bebas Neue", Arial, sans-serif'
          ctx.fillText(pMainText, startPX + pOldW + 35, priceCardY + 90)

          // Moneda MXN
          ctx.fillStyle = '#D4C5A9'
          ctx.font = 'bold 26px sans-serif'
          ctx.fillText('MXN', startPX + pOldW + 35 + pMainW + 12, priceCardY + 76)
        } else {
          ctx.textAlign = 'center'
          ctx.fillStyle = '#FF5500'
          ctx.fillText(pMainText, midX - 35, priceCardY + 90)

          ctx.fillStyle = '#D4C5A9'
          ctx.font = 'bold 26px sans-serif'
          ctx.textAlign = 'left'
          ctx.fillText('MXN', midX + pMainW / 2 - 20, priceCardY + 76)
        }
        ctx.restore()

        curY += priceCardH + 35

        // Botón WhatsApp / App
        const btnW = 940
        const btnH = 110
        const btnX = midX - btnW / 2
        const btnY = curY

        ctx.save()
        ctx.shadowColor = 'rgba(42,191,191,0.4)'
        ctx.shadowBlur = 30
        const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH)
        btnGrad.addColorStop(0, '#2ABFBF')
        btnGrad.addColorStop(1, '#1A9999')
        ctx.fillStyle = btnGrad
        drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 55)
        ctx.fill()
        ctx.shadowBlur = 0

        ctx.fillStyle = '#080808'
        ctx.font = '900 36px -apple-system, BlinkMacSystemFont, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('📲 ORDENA POR WHATSAPP O EN LA APP', midX, btnY + btnH / 2 + 2)
        ctx.restore()

        // Handle de Instagram
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = 'rgba(212,197,169,0.7)'
        ctx.font = '600 28px -apple-system, sans-serif'
        ctx.letterSpacing = '4px'
        ctx.fillText(HANDLE_IG, midX, 1860)
        ctx.letterSpacing = '0px'
      }

      // ═══════════════════════════════════════════════════════════════
      // PLANTILLA 2: FULL PHOTO (FOTO 100% CON TARJETAS SÓLIDAS)
      // ═══════════════════════════════════════════════════════════════
      else if (activeTemplate === 'fullphoto') {
        // Foto cubre toda la pantalla
        if (loadedImg) {
          ctx.save()
          drawImageCover(ctx, loadedImg, 0, 0, CANVAS_W, CANVAS_H)
          ctx.restore()
        } else {
          drawGradientFallback(ctx, CANVAS_H, platillo.emoji)
        }

        // Degradados sutiles superior e inferior
        const topGrad = ctx.createLinearGradient(0, 0, 0, 360)
        topGrad.addColorStop(0, 'rgba(5,4,4,0.75)')
        topGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = topGrad
        ctx.fillRect(0, 0, CANVAS_W, 360)

        const botGrad = ctx.createLinearGradient(0, CANVAS_H - 720, 0, CANVAS_H)
        botGrad.addColorStop(0, 'transparent')
        botGrad.addColorStop(0.4, 'rgba(5,4,4,0.75)')
        botGrad.addColorStop(1, 'rgba(5,4,4,0.96)')
        ctx.fillStyle = botGrad
        ctx.fillRect(0, CANVAS_H - 720, CANVAS_W, 720)

        const midX = CANVAS_W / 2

        // Header Superior: Cápsula Logo
        const topLogoW = 460
        const topLogoH = 120
        const topLogoX = midX - topLogoW / 2
        const topLogoY = 50

        ctx.save()
        ctx.fillStyle = '#050404'
        ctx.shadowColor = 'rgba(0,0,0,0.85)'
        ctx.shadowBlur = 24
        drawRoundedRect(ctx, topLogoX, topLogoY, topLogoW, topLogoH, 60)
        ctx.fill()
        ctx.strokeStyle = 'rgba(201,168,76,0.45)'
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.shadowBlur = 0

        // Logo dentro de la cápsula
        ctx.textAlign = 'center'
        ctx.fillStyle = '#F7F3EE'
        ctx.font = '900 56px "Bebas Neue", Arial, sans-serif'
        ctx.fillText('MAREA NEGRA', midX, topLogoY + 66)
        ctx.fillStyle = '#E8430A'
        ctx.font = 'bold 26px "Bebas Neue", sans-serif'
        ctx.letterSpacing = '8px'
        ctx.fillText('AGUACHILES', midX, topLogoY + 102)
        ctx.letterSpacing = '0px'
        ctx.restore()

        // Banner de Oferta debajo del logo si aplica
        if (hasPromo) {
          ctx.save()
          const bText = `🔥 ${bannerText.toUpperCase()}`
          ctx.font = '900 30px -apple-system, sans-serif'
          const bW = ctx.measureText(bText).width + 64
          const bH = 72
          const bX = midX - bW / 2
          const bY = topLogoY + topLogoH + 20

          const bGrad = ctx.createLinearGradient(bX, bY, bX + bW, bY + bH)
          bGrad.addColorStop(0, '#FF6B00')
          bGrad.addColorStop(0.5, '#E8430A')
          bGrad.addColorStop(1, '#FF6B00')
          ctx.fillStyle = bGrad
          ctx.shadowColor = 'rgba(232,67,10,0.6)'
          ctx.shadowBlur = 24
          drawRoundedRect(ctx, bX, bY, bW, bH, 36)
          ctx.fill()
          ctx.shadowBlur = 0

          ctx.fillStyle = '#F7F3EE'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(bText, midX, bY + bH / 2 + 1)
          ctx.restore()
        }

        // Tarjeta Inferior Sólida
        const cardW = 980
        const cardH = 530
        const cardX = midX - cardW / 2
        const cardY = CANVAS_H - cardH - 55

        ctx.save()
        ctx.fillStyle = '#050404'
        ctx.shadowColor = 'rgba(0,0,0,0.95)'
        ctx.shadowBlur = 35
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 44)
        ctx.fill()
        ctx.strokeStyle = 'rgba(201,168,76,0.45)'
        ctx.lineWidth = 3.5
        ctx.stroke()
        ctx.shadowBlur = 0

        // Eyebrow label
        ctx.textAlign = 'left'
        ctx.fillStyle = '#2ABFBF'
        ctx.font = '900 26px -apple-system, sans-serif'
        ctx.letterSpacing = '3px'
        ctx.fillText('✨ MARISCOS FRESCOS DE SINALOA', cardX + 45, cardY + 65)
        ctx.letterSpacing = '0px'

        // Nombre del Platillo
        ctx.fillStyle = '#F7F3EE'
        ctx.font = '900 82px "Bebas Neue", Arial, sans-serif'
        const fullDishLines = wrapTextLines(ctx, platillo.nombre.toUpperCase(), cardW - 90, 1)
        ctx.fillText(fullDishLines[0], cardX + 45, cardY + 150)

        // Barra de Precio
        const pBarW = cardW - 90
        const pBarH = 115
        const pBarX = cardX + 45
        const pBarY = cardY + 185

        ctx.fillStyle = 'rgba(17,17,17,0.95)'
        drawRoundedRect(ctx, pBarX, pBarY, pBarW, pBarH, 24)
        ctx.fill()
        ctx.strokeStyle = 'rgba(201,168,76,0.35)'
        ctx.lineWidth = 2.5
        ctx.stroke()

        // Label precio
        ctx.fillStyle = '#C9A84C'
        ctx.font = '900 24px -apple-system, sans-serif'
        ctx.letterSpacing = '2px'
        ctx.fillText(hasPromo ? 'PRECIO PROMOCIÓN' : 'PRECIO ESPECIAL', pBarX + 28, pBarY + 48)
        ctx.letterSpacing = '0px'

        if (hasPromo && pAnterior > pActual) {
          ctx.fillStyle = 'rgba(212,197,169,0.65)'
          ctx.font = 'bold 30px "Bebas Neue", Arial, sans-serif'
          ctx.fillText(`$${formatPrice(pAnterior)} MXN`, pBarX + 28, pBarY + 88)

          // Strikethrough
          ctx.strokeStyle = '#E8430A'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(pBarX + 25, pBarY + 78)
          ctx.lineTo(pBarX + 195, pBarY + 78)
          ctx.stroke()
        }

        // Precio Principal
        ctx.textAlign = 'right'
        ctx.fillStyle = '#FFA800'
        ctx.font = '900 42px "Bebas Neue", sans-serif'
        ctx.fillText('$', pBarX + pBarW - 275, pBarY + 78)

        ctx.fillStyle = '#FF5500'
        ctx.font = '900 86px "Bebas Neue", Arial, sans-serif'
        ctx.fillText(formatPrice(pActual), pBarX + pBarW - 95, pBarY + 84)

        ctx.fillStyle = '#D4C5A9'
        ctx.font = 'bold 24px sans-serif'
        ctx.fillText('MXN', pBarX + pBarW - 30, pBarY + 76)

        // Botón CTA
        const fullBtnW = cardW - 90
        const fullBtnH = 100
        const fullBtnX = cardX + 45
        const fullBtnY = cardY + 325

        const fullBtnGrad = ctx.createLinearGradient(fullBtnX, fullBtnY, fullBtnX + fullBtnW, fullBtnY + fullBtnH)
        fullBtnGrad.addColorStop(0, '#2ABFBF')
        fullBtnGrad.addColorStop(1, '#1A9999')
        ctx.fillStyle = fullBtnGrad
        drawRoundedRect(ctx, fullBtnX, fullBtnY, fullBtnW, fullBtnH, 50)
        ctx.fill()

        ctx.fillStyle = '#080808'
        ctx.font = '900 34px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('📲 PIDE POR WHATSAPP O EN LA APP', cardX + cardW / 2, fullBtnY + fullBtnH / 2 + 2)

        // Handle
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = 'rgba(212,197,169,0.7)'
        ctx.font = '600 26px -apple-system, sans-serif'
        ctx.letterSpacing = '3px'
        ctx.fillText(HANDLE_IG, cardX + cardW / 2, cardY + cardH - 26)
        ctx.letterSpacing = '0px'
        ctx.restore()
      }

      // ═══════════════════════════════════════════════════════════════
      // PLANTILLA 3: FLASH PROMO (OFERTA GIGANTE Y FUEGO)
      // ═══════════════════════════════════════════════════════════════
      else if (activeTemplate === 'promo') {
        // Fondo degradado volcánico
        const promoBg = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
        promoBg.addColorStop(0, '#1A0702')
        promoBg.addColorStop(0.4, '#080808')
        promoBg.addColorStop(1, '#050404')
        ctx.fillStyle = promoBg
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

        const midX = CANVAS_W / 2

        // Banner Superior Fuego
        const topBanW = 980
        const topBanH = 110
        const topBanX = midX - topBanW / 2
        const topBanY = 50

        ctx.save()
        const topBanGrad = ctx.createLinearGradient(topBanX, topBanY, topBanX + topBanW, topBanY + topBanH)
        topBanGrad.addColorStop(0, '#FF6B00')
        topBanGrad.addColorStop(0.5, '#E8430A')
        topBanGrad.addColorStop(1, '#FF6B00')
        ctx.fillStyle = topBanGrad
        ctx.shadowColor = 'rgba(232,67,10,0.65)'
        ctx.shadowBlur = 28
        drawRoundedRect(ctx, topBanX, topBanY, topBanW, topBanH, 35)
        ctx.fill()
        ctx.shadowBlur = 0

        ctx.fillStyle = '#F7F3EE'
        ctx.font = '900 46px "Bebas Neue", Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`🔥 ${hasPromo ? bannerText.toUpperCase() : '¡OFERTA POR TIEMPO LIMITADO!'} 🔥`, midX, topBanY + topBanH / 2 + 2)
        ctx.restore()

        // Foto Enmarcada Central
        const frameW = 980
        const frameH = 720
        const frameX = midX - frameW / 2
        const frameY = topBanY + topBanH + 30

        ctx.save()
        drawRoundedRect(ctx, frameX, frameY, frameW, frameH, 40)
        ctx.clip()

        if (loadedImg) {
          drawImageCover(ctx, loadedImg, frameX, frameY, frameW, frameH)
        } else {
          drawGradientFallback(ctx, frameH, platillo.emoji)
        }
        ctx.restore()

        // Borde dorado foto
        ctx.strokeStyle = 'rgba(201,168,76,0.6)'
        ctx.lineWidth = 4.5
        drawRoundedRect(ctx, frameX, frameY, frameW, frameH, 40)
        ctx.stroke()

        // Badge Ahorro Flotante
        if (ahorro > 0) {
          ctx.save()
          const aText = `💥 AHORRAS $${ahorro.toFixed(0)} MXN`
          ctx.font = '900 34px -apple-system, sans-serif'
          const aW = ctx.measureText(aText).width + 60
          const aH = 76
          const aX = frameX + frameW - aW - 25
          const aY = frameY + frameH - aH - 25

          ctx.fillStyle = '#2ABFBF'
          ctx.shadowColor = 'rgba(42,191,191,0.7)'
          ctx.shadowBlur = 28
          drawRoundedRect(ctx, aX, aY, aW, aH, 38)
          ctx.fill()
          ctx.shadowBlur = 0

          ctx.fillStyle = '#080808'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(aText, aX + aW / 2, aY + aH / 2 + 1)
          ctx.restore()
        }

        // Nombre del Platillo Gigante
        ctx.textAlign = 'center'
        ctx.fillStyle = '#F7F3EE'
        ctx.font = '900 90px "Bebas Neue", Arial, sans-serif'
        ctx.fillText(platillo.nombre.toUpperCase(), midX, frameY + frameH + 95)

        // Caja de Precio Gigante Fuego
        const pFireW = 820
        const pFireH = 135
        const pFireX = midX - pFireW / 2
        const pFireY = frameY + frameH + 130

        ctx.save()
        ctx.fillStyle = 'rgba(8,8,8,0.95)'
        ctx.shadowColor = 'rgba(232,67,10,0.5)'
        ctx.shadowBlur = 35
        drawRoundedRect(ctx, pFireX, pFireY, pFireW, pFireH, 32)
        ctx.fill()
        ctx.strokeStyle = '#E8430A'
        ctx.lineWidth = 4
        ctx.stroke()
        ctx.shadowBlur = 0

        let curPX = pFireX + 45
        if (hasPromo && pAnterior > pActual) {
          ctx.textAlign = 'left'
          ctx.fillStyle = 'rgba(212,197,169,0.65)'
          ctx.font = 'bold 44px "Bebas Neue", Arial, sans-serif'
          const oldText = `$${formatPrice(pAnterior)}`
          ctx.fillText(oldText, curPX, pFireY + 84)

          ctx.strokeStyle = '#E8430A'
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(curPX - 4, pFireY + 70)
          ctx.lineTo(curPX + ctx.measureText(oldText).width + 4, pFireY + 70)
          ctx.stroke()

          curPX += ctx.measureText(oldText).width + 40
        }

        // Precio Gigante Fuego
        ctx.textAlign = 'left'
        ctx.fillStyle = '#FFA800'
        ctx.font = '900 44px "Bebas Neue", sans-serif'
        ctx.fillText('$', curPX, pFireY + 82)

        ctx.fillStyle = '#FF5500'
        ctx.font = '900 100px "Bebas Neue", Arial, sans-serif'
        ctx.fillText(formatPrice(pActual), curPX + 28, pFireY + 92)

        ctx.fillStyle = '#D4C5A9'
        ctx.font = 'bold 26px sans-serif'
        ctx.fillText('MXN', curPX + 28 + ctx.measureText(formatPrice(pActual)).width + 12, pFireY + 80)
        ctx.restore()

        // Botón Fuego
        const fireBtnW = 980
        const fireBtnH = 110
        const fireBtnX = midX - fireBtnW / 2
        const fireBtnY = pFireY + pFireH + 35

        ctx.save()
        const fireBtnGrad = ctx.createLinearGradient(fireBtnX, fireBtnY, fireBtnX + fireBtnW, fireBtnY + fireBtnH)
        fireBtnGrad.addColorStop(0, '#2ABFBF')
        fireBtnGrad.addColorStop(1, '#1A9999')
        ctx.fillStyle = fireBtnGrad
        drawRoundedRect(ctx, fireBtnX, fireBtnY, fireBtnW, fireBtnH, 55)
        ctx.fill()

        ctx.fillStyle = '#080808'
        ctx.font = '900 36px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('⚡ ORDENA ANTES DE QUE SE AGOTE', midX, fireBtnY + fireBtnH / 2 + 2)
        ctx.restore()

        // Handle
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = 'rgba(212,197,169,0.7)'
        ctx.font = '600 28px -apple-system, sans-serif'
        ctx.letterSpacing = '3px'
        ctx.fillText(`Marea Negra · ${HANDLE_IG}`, midX, CANVAS_H - 40)
        ctx.letterSpacing = '0px'
      }

      // ═══════════════════════════════════════════════════════════════
      // PLANTILLA 4: PIZARRA ORO (DARK LUXURY MARISQUERÍA)
      // ═══════════════════════════════════════════════════════════════
      else if (activeTemplate === 'pizarra') {
        ctx.fillStyle = '#050404'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

        // Doble Marco Dorado Ornamental
        ctx.strokeStyle = 'rgba(201,168,76,0.35)'
        ctx.lineWidth = 3
        drawRoundedRect(ctx, 30, 30, CANVAS_W - 60, CANVAS_H - 60, 36)
        ctx.stroke()

        const midX = CANVAS_W / 2

        // Header Ornamental
        ctx.textAlign = 'center'
        ctx.fillStyle = '#C9A84C'
        ctx.font = 'bold 30px serif'
        ctx.letterSpacing = '6px'
        ctx.fillText('— ✦ MARISCOS FRESCOS ✦ —', midX, 115)
        ctx.letterSpacing = '0px'

        ctx.fillStyle = '#F7F3EE'
        ctx.font = '900 88px "Bebas Neue", Arial, sans-serif'
        ctx.fillText('MAREA NEGRA', midX, 205)

        ctx.fillStyle = '#E8430A'
        ctx.font = 'bold 34px "Bebas Neue", sans-serif'
        ctx.letterSpacing = '10px'
        ctx.fillText('AGUACHILES & COCTELES', midX, 255)
        ctx.letterSpacing = '0px'

        // Foto Circular Central con Halo Turquesa
        const circleR = 290
        const circleCX = midX
        const circleCY = 610

        ctx.save()
        ctx.beginPath()
        ctx.arc(circleCX, circleCY, circleR, 0, Math.PI * 2)
        ctx.clip()

        if (loadedImg) {
          drawImageCover(ctx, loadedImg, circleCX - circleR, circleCY - circleR, circleR * 2, circleR * 2)
        } else {
          drawGradientFallback(ctx, circleR * 2, platillo.emoji)
        }
        ctx.restore()

        // Halo Turquesa brillante
        ctx.save()
        ctx.shadowColor = 'rgba(42,191,191,0.5)'
        ctx.shadowBlur = 35
        ctx.strokeStyle = '#2ABFBF'
        ctx.lineWidth = 8
        ctx.beginPath()
        ctx.arc(circleCX, circleCY, circleR, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()

        // Nombre del Platillo Oro
        ctx.textAlign = 'center'
        ctx.fillStyle = '#F7F3EE'
        ctx.font = '900 84px "Bebas Neue", Arial, sans-serif'
        ctx.fillText(platillo.nombre.toUpperCase(), midX, 1000)

        // Descripción
        if (platillo.descripcion) {
          ctx.fillStyle = 'rgba(212,197,169,0.85)'
          ctx.font = 'italic 34px "Space Grotesk", Georgia, sans-serif'
          const pzDesc = wrapTextLines(ctx, `"${platillo.descripcion}"`, CANVAS_W - 180, 2)
          let pyDesc = 1065
          for (const pd of pzDesc) {
            ctx.fillText(pd, midX, pyDesc)
            pyDesc += 44
          }
        }

        // Placa de Precio Dorada
        const pzCardW = 600
        const pzCardH = 120
        const pzCardX = midX - pzCardW / 2
        const pzCardY = 1215

        ctx.save()
        ctx.fillStyle = 'rgba(8,8,8,0.95)'
        ctx.shadowColor = 'rgba(201,168,76,0.35)'
        ctx.shadowBlur = 28
        drawRoundedRect(ctx, pzCardX, pzCardY, pzCardW, pzCardH, 26)
        ctx.fill()
        ctx.strokeStyle = 'rgba(201,168,76,0.7)'
        ctx.lineWidth = 3.5
        ctx.stroke()
        ctx.shadowBlur = 0

        ctx.textAlign = 'center'
        ctx.fillStyle = '#FFA800'
        ctx.font = '900 36px "Bebas Neue", sans-serif'
        ctx.fillText('$', midX - 145, pzCardY + 80)

        ctx.fillStyle = '#C9A84C'
        ctx.font = '900 92px "Bebas Neue", Arial, sans-serif'
        ctx.fillText(formatPrice(pActual), midX, pzCardY + 88)

        ctx.fillStyle = '#D4C5A9'
        ctx.font = 'bold 26px sans-serif'
        ctx.fillText('MXN', midX + 150, pzCardY + 76)
        ctx.restore()

        // Botón WhatsApp
        const pzBtnW = 940
        const pzBtnH = 110
        const pzBtnX = midX - pzBtnW / 2
        const pzBtnY = 1380

        ctx.save()
        const pzBtnGrad = ctx.createLinearGradient(pzBtnX, pzBtnY, pzBtnX + pzBtnW, pzBtnY + pzBtnH)
        pzBtnGrad.addColorStop(0, '#2ABFBF')
        pzBtnGrad.addColorStop(1, '#1A9999')
        ctx.fillStyle = pzBtnGrad
        drawRoundedRect(ctx, pzBtnX, pzBtnY, pzBtnW, pzBtnH, 55)
        ctx.fill()

        ctx.fillStyle = '#080808'
        ctx.font = '900 36px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('📲 ORDENA POR WHATSAPP O EN LA APP', midX, pzBtnY + pzBtnH / 2 + 2)
        ctx.restore()

        // Handle
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = 'rgba(212,197,169,0.7)'
        ctx.font = '600 28px -apple-system, sans-serif'
        ctx.letterSpacing = '3px'
        ctx.fillText(HANDLE_IG, midX, CANVAS_H - 70)
        ctx.letterSpacing = '0px'
      }
    } catch (err) {
      console.error('Error renderizando canvas historia:', err)
    } finally {
      setIsRendering(false)
    }
  }, [platillo, activeTemplate, bannerText, hasPromo, pActual, pAnterior, ahorro])

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

  // Renderizar canvas cada vez que cambie la plantilla o el platillo
  useEffect(() => {
    renderCanvasStory()
  }, [renderCanvasStory])

  /** Obtiene el blob PNG del canvas para descargar o copiar */
  const getStoryBlob = async (): Promise<{ blob: Blob; fileName: string } | null> => {
    if (!canvasRef.current) return null
    const canvas = canvasRef.current
    const fileName = `${platillo.nombre.replace(/\s+/g, '-').toLowerCase()}-${activeTemplate}-ig.png`

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve({ blob, fileName })
        else resolve(null)
      }, 'image/png', 1.0)
    })
  }

  /** Descarga directa al carrete / fotos */
  const handleDownloadAndSavePhotos = async () => {
    setIsExporting(true)
    try {
      const result = await getStoryBlob()
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
      const result = await getStoryBlob()
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

        {/* Panel izquierdo: Selector de Templates + Canvas HD Preview (340x604) */}
        <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
          {/* BARRA SELECTORA DE PLANTILLAS */}
          <div className="flex items-center bg-carbon border border-arena/20 rounded-xl p-1 gap-1 max-w-[340px] overflow-x-auto no-scrollbar">
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

          {/* CONTENEDOR DEL CANVAS 2D REAL A PANTALLA (340x604) */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-arena/20 bg-[#050404] flex items-center justify-center">
            {isRendering && (
              <div className="absolute inset-0 z-10 bg-black/75 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-turquesa animate-spin" />
                <span className="text-xs font-sans text-blanco">Cargando composición HD...</span>
              </div>
            )}

            <canvas
              ref={canvasRef}
              style={{
                width: 340,
                height: 604,
                display: 'block',
                backgroundColor: '#050404',
              }}
            />
          </div>

          <p className="text-[10px] text-arena/40 font-sans text-center max-w-[340px]">
            Renderizado por GPU nativo en 1080×1920 px. Lo que ves es exactamente lo que se descarga sin fallos de imagen.
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
              <span className="text-arena/60 uppercase tracking-wider">Compatibilidad</span>
              <span className="text-turquesa font-bold">iOS / Safari / macOS 100%</span>
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
            💡 En mobile presiona <strong>Descargar</strong> para guardarla directo en tu carrete de Fotos y subirla a tu Historia de Instagram.
          </p>
        </div>
      </div>
    </div>
  )
}
