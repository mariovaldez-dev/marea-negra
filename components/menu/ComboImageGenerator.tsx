'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Sparkles, Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { Platillo } from '@/lib/types/database'
import { createBrowserClient } from '@/lib/supabase/client'

interface ComboImageGeneratorProps {
  /** Platillos con foto disponibles para seleccionar */
  allPlatillos: Platillo[]
  /** ID del combo al que se le va a asignar la imagen */
  comboPlatilloId?: number
  /** Nombre del combo para mostrar en UI */
  comboNombre: string
  /** Callback cuando se genera y/o guarda la imagen */
  onImageSaved: (url: string) => void
  onClose: () => void
}

const MAX_SELECT = 3
const CANVAS_W = 1080
const CANVAS_H = 1080

export function ComboImageGenerator({
  allPlatillos,
  comboPlatilloId,
  comboNombre,
  onImageSaved,
  onClose,
}: ComboImageGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  const [selected, setSelected] = useState<Platillo[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Solo platillos que tienen imagen
  const platillosConFoto = allPlatillos.filter(
    (p) => p.imagen_url && p.imagen_url.trim() !== ''
  )

  // Bloquear scroll de fondo
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const toggleSelect = (platillo: Platillo) => {
    setPreviewUrl(null)
    setSelected((prev) => {
      const already = prev.find((p) => p.id === platillo.id)
      if (already) return prev.filter((p) => p.id !== platillo.id)
      if (prev.length >= MAX_SELECT) return prev
      return [...prev, platillo]
    })
  }

  /** Carga una imagen de forma segura cruzando CORS */
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`No se pudo cargar: ${src}`))
      img.src = src
    })

  const generateCollage = async () => {
    if (selected.length < 2) {
      setError('Selecciona al menos 2 platillos.')
      return
    }
    if (!canvasRef.current) return

    setIsGenerating(true)
    setError(null)
    setPreviewUrl(null)

    try {
      const canvas = canvasRef.current
      canvas.width = CANVAS_W
      canvas.height = CANVAS_H
      const ctx = canvas.getContext('2d')!

      // ── Fondo negro base ──
      ctx.fillStyle = '#080808'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // ── Cargar imágenes ──
      const imgs = await Promise.all(
        selected.map((p) => loadImage(p.imagen_url!))
      )

      const count = imgs.length

      // ── Diseño del collage según número de fotos ──
      if (count === 2) {
        // Dos fotos: izquierda | derecha, cada una 50% de ancho
        const half = CANVAS_W / 2
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, half - 2, CANVAS_H)
        ctx.clip()
        ctx.drawImage(imgs[0], 0, 0, half - 2, CANVAS_H)
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.rect(half + 2, 0, half - 2, CANVAS_H)
        ctx.clip()
        ctx.drawImage(imgs[1], half + 2, 0, half - 2, CANVAS_H)
        ctx.restore()

        // Línea divisoria dorada
        ctx.fillStyle = '#C9A84C'
        ctx.fillRect(half - 2, 0, 4, CANVAS_H)
      } else {
        // Tres fotos: top grande (2/3 de alto) + dos abajo (1/3)
        const topH = Math.round(CANVAS_H * 0.6)
        const botH = CANVAS_H - topH - 4
        const halfW = CANVAS_W / 2

        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, CANVAS_W, topH)
        ctx.clip()
        ctx.drawImage(imgs[0], 0, 0, CANVAS_W, topH)
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.rect(0, topH + 4, halfW - 2, botH)
        ctx.clip()
        ctx.drawImage(imgs[1], 0, topH + 4, halfW - 2, botH)
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.rect(halfW + 2, topH + 4, halfW - 2, botH)
        ctx.clip()
        ctx.drawImage(imgs[2], halfW + 2, topH + 4, halfW - 2, botH)
        ctx.restore()

        // Separadores dorados
        ctx.fillStyle = '#C9A84C'
        ctx.fillRect(0, topH, CANVAS_W, 4)
        ctx.fillRect(halfW - 2, topH + 4, 4, botH)
      }

      // ── Overlay gradiente oscuro en la parte inferior ──
      const grad = ctx.createLinearGradient(0, CANVAS_H * 0.55, 0, CANVAS_H)
      grad.addColorStop(0, 'rgba(8,8,8,0)')
      grad.addColorStop(0.4, 'rgba(8,8,8,0.75)')
      grad.addColorStop(1, 'rgba(8,8,8,0.96)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // ── Ornamento — ✦ — ──
      ctx.fillStyle = 'rgba(201,168,76,0.5)'
      ctx.font = 'bold 28px serif'
      ctx.textAlign = 'center'
      ctx.fillText('— ✦ —', CANVAS_W / 2, CANVAS_H - 310)

      // ── Logo MAREA NEGRA ──
      ctx.fillStyle = '#F7F3EE'
      ctx.font = '900 90px Arial, sans-serif'
      ctx.letterSpacing = '10px'
      ctx.fillText('MAREA NEGRA', CANVAS_W / 2, CANVAS_H - 230)

      // ── Subtítulo italic ──
      ctx.fillStyle = '#E8430A'
      ctx.font = 'italic 500 30px Georgia, serif'
      ctx.letterSpacing = '4px'
      ctx.fillText('Aguachiles & Cocteles · Sinaloa', CANVAS_W / 2, CANVAS_H - 185)

      // ── Línea dorada ──
      const lineGrad = ctx.createLinearGradient(200, 0, CANVAS_W - 200, 0)
      lineGrad.addColorStop(0, 'transparent')
      lineGrad.addColorStop(0.5, 'rgba(201,168,76,0.6)')
      lineGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = lineGrad
      ctx.fillRect(140, CANVAS_H - 165, CANVAS_W - 280, 2)

      // ── Nombre del combo ──
      ctx.fillStyle = '#F7F3EE'
      ctx.font = '900 56px Arial, sans-serif'
      ctx.letterSpacing = '4px'

      // Dividir en 2 líneas si es muy largo
      const maxW = CANVAS_W - 120
      const words = comboNombre.toUpperCase().split(' ')
      let line1 = ''
      let line2 = ''
      let currentLine = ''
      ctx.font = '900 56px Arial, sans-serif'
      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word
        if (ctx.measureText(test).width > maxW && currentLine) {
          if (!line1) line1 = currentLine
          else line2 = currentLine
          currentLine = word
        } else {
          currentLine = test
        }
      }
      if (!line1) { line1 = currentLine }
      else { line2 = currentLine }

      if (line2) {
        ctx.fillText(line1, CANVAS_W / 2, CANVAS_H - 110)
        ctx.fillText(line2, CANVAS_W / 2, CANVAS_H - 48)
      } else {
        ctx.fillText(line1, CANVAS_W / 2, CANVAS_H - 78)
      }

      // ── Platillos incluidos (pequeño) ──
      ctx.fillStyle = 'rgba(212,197,169,0.6)'
      ctx.font = 'italic 24px Georgia, serif'
      ctx.letterSpacing = '1px'
      const subtext = selected.map((p) => p.nombre).join(' + ')
      const maxSubW = CANVAS_W - 160
      if (ctx.measureText(subtext).width <= maxSubW) {
        ctx.fillText(subtext, CANVAS_W / 2, CANVAS_H - 30)
      }

      // ── Marca de agua esquina inferior derecha ──
      ctx.fillStyle = 'rgba(201,168,76,0.3)'
      ctx.font = '300 20px Arial, sans-serif'
      ctx.textAlign = 'right'
      ctx.letterSpacing = '2px'
      ctx.fillText('@mareanegra.sinaloa', CANVAS_W - 30, CANVAS_H - 20)

      // Generar preview
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      setPreviewUrl(dataUrl)
    } catch (err: any) {
      console.error(err)
      setError(`Error al generar: ${err.message}. Algunas imágenes pueden no cargar por CORS.`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!previewUrl || !canvasRef.current) return
    setIsSaving(true)

    try {
      const canvas = canvasRef.current
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('Canvas vacío'))), 'image/jpeg', 0.92)
      )

      const supabase = createBrowserClient()
      const filename = comboPlatilloId
        ? `${comboPlatilloId}.jpg`
        : `combo-${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('platillos')
        .upload(filename, blob, { upsert: true, contentType: 'image/jpeg' })

      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage
        .from('platillos')
        .getPublicUrl(filename)

      onImageSaved(urlData.publicUrl)
      onClose()
    } catch (err: any) {
      setError(`Error al guardar: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
      {/* Canvas oculto para renderizado HD */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-[#050404] border border-oro/15 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl gold-border-corner relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-arena/10">
          <div>
            <span className="text-xs font-sans font-bold text-turquesa tracking-widest uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Generador de Imagen
            </span>
            <h2 className="font-display text-2xl text-blanco tracking-wide mt-0.5">
              {comboNombre.toUpperCase()}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Izquierda: Selector de platillos */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-sans text-arena/70 mb-3">
                Selecciona <strong className="text-blanco">2 o 3 platillos</strong> con foto para crear el collage del combo:
              </p>
              <div className="text-[10px] font-sans text-arena/40 mb-2 uppercase tracking-wider">
                {selected.length} / {MAX_SELECT} seleccionados
              </div>

              {platillosConFoto.length === 0 ? (
                <div className="text-xs font-sans text-arena/50 text-center py-8">
                  No hay platillos con fotos cargadas aún.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                  {platillosConFoto.map((p) => {
                    const isSelected = selected.some((s) => s.id === p.id)
                    const isDisabled = !isSelected && selected.length >= MAX_SELECT
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => !isDisabled && toggleSelect(p)}
                        disabled={isDisabled}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${
                          isSelected
                            ? 'border-coral shadow-[0_0_15px_rgba(232,67,10,0.4)]'
                            : isDisabled
                            ? 'border-arena/5 opacity-30 cursor-not-allowed'
                            : 'border-arena/10 hover:border-turquesa/50 cursor-pointer'
                        }`}
                      >
                        <img
                          src={p.imagen_url!}
                          alt={p.nombre}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-negro/80 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-[10px] font-sans font-bold text-blanco leading-tight line-clamp-2">
                            {p.nombre}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-coral rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3 text-blanco stroke-[3]" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Orden seleccionados */}
            {selected.length > 0 && (
              <div className="bg-carbon border border-arena/10 rounded-xl p-3 flex flex-col gap-2">
                <p className="text-[10px] font-sans text-arena/50 uppercase tracking-wider mb-1">
                  Orden en el collage:
                </p>
                {selected.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs font-sans">
                    <span className="text-oro font-bold w-4 shrink-0">{i + 1}.</span>
                    <span className="text-blanco flex-1 truncate">{p.nombre}</span>
                    <button
                      type="button"
                      onClick={() => toggleSelect(p)}
                      className="text-coral/50 hover:text-coral transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botón generar */}
            <button
              type="button"
              onClick={generateCollage}
              disabled={selected.length < 2 || isGenerating}
              className="w-full bg-gradient-to-r from-turquesa to-azul text-negro font-sans font-black text-xs tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(42,191,191,0.2)] hover:shadow-[0_0_30px_rgba(42,191,191,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>GENERANDO COLLAGE...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>GENERAR COLLAGE</span>
                </>
              )}
            </button>

            {error && (
              <p className="text-xs font-sans text-coral bg-coral/10 border border-coral/20 rounded-lg p-3 leading-relaxed">
                {error}
              </p>
            )}
          </div>

          {/* Derecha: Preview y botón guardar */}
          <div className="flex flex-col gap-4">
            <div className="text-[10px] font-sans text-arena/50 uppercase tracking-wider">
              Vista previa del collage
            </div>

            {previewUrl ? (
              <>
                <div className="rounded-xl overflow-hidden border border-oro/20 shadow-xl">
                  <img
                    src={previewUrl}
                    alt="Preview collage"
                    className="w-full aspect-square object-cover"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-coral to-oro text-negro font-sans font-black text-xs tracking-wider py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(232,67,10,0.3)] hover:shadow-[0_0_35px_rgba(232,67,10,0.5)] transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>GUARDANDO EN SUPABASE...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>USAR COMO IMAGEN DEL COMBO</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] font-sans text-arena/40 text-center leading-relaxed">
                  La imagen se guardará en Supabase Storage y se asignará automáticamente al combo.
                </p>
              </>
            ) : (
              <div className="aspect-square rounded-xl border border-arena/10 bg-carbon flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-10 h-10 text-arena/20" />
                <p className="text-xs font-sans text-arena/30 text-center max-w-[200px] leading-relaxed">
                  Selecciona los platillos y presiona "Generar Collage" para ver la vista previa
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
