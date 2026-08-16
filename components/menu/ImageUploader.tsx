'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { createBrowserClient } from '@/lib/supabase/client'
import { Upload, X, Link as LinkIcon, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react'

interface ImageUploaderProps {
  currentUrl?: string | null
  onImageChange: (url: string | null) => void
  dishId?: number | string
}

export function ImageUploader({
  currentUrl,
  onImageChange,
  dishId = 'temp',
}: ImageUploaderProps) {
  const [mode, setMode] = useState<'file' | 'url'>('file')
  const [urlInput, setUrlInput] = useState(currentUrl || '')
  const [uploading, setUploading] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)

  const supabase = createBrowserClient()

  // Convertir archivo (incluyendo HEIC de iPhone) a WebP usando HTML5 Canvas y heic2any
  const processAndConvertToWebP = async (file: File): Promise<Blob> => {
    let sourceBlob: Blob = file
    const isHeic =
      file.type.includes('heic') ||
      file.type.includes('heif') ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif')

    // 1. Si es formato iPhone HEIC/HEIF, convertir primero a JPEG en el navegador
    if (isHeic) {
      setStatusText('Decodificando formato iPhone HEIC...')
      try {
        const heic2any = (await import('heic2any')).default
        const conversionResult = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.85,
        })
        sourceBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult
      } catch (heicErr) {
        console.error('Error al decodificar HEIC:', heicErr)
        throw new Error('No se pudo procesar la imagen HEIC de iPhone. Intenta exportarla en JPG.')
      }
    }

    // 2. Convertir Blob a WebP usando HTML5 Canvas API
    setStatusText('Comprimiendo a WebP...')
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      const objectUrl = URL.createObjectURL(sourceBlob)
      img.src = objectUrl

      img.onload = () => {
        const canvas = document.createElement('canvas')
        // Limitar resolución máxima a 1200px manteniendo proporción
        let width = img.naturalWidth || img.width || 800
        let height = img.naturalHeight || img.height || 600
        const maxDim = 1200

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('No se pudo inicializar el contexto de Canvas'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl)
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Error al convertir la imagen a formato WebP'))
            }
          },
          'image/webp',
          0.85
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Error al cargar los datos de la imagen'))
      }
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const lowerName = file.name.toLowerCase()
    const isSupported =
      ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type) ||
      lowerName.endsWith('.heic') ||
      lowerName.endsWith('.heif') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.webp')

    if (!isSupported) {
      setError('Formato no soportado. Usa JPG, PNG, WebP o HEIC (iPhone).')
      return
    }

    // Permitir hasta 15MB (fotos de cámara de iPhone alta resolución)
    if (file.size > 15 * 1024 * 1024) {
      setError('El archivo supera el límite de 15MB.')
      return
    }

    setError(null)
    setUploading(true)
    setProgress(25)
    setStatusText('Procesando archivo...')

    try {
      // 1. Convertir a WebP (con soporte HEIC)
      setProgress(50)
      const webpBlob = await processAndConvertToWebP(file)

      // 2. Mostrar preview local del Blob WebP
      const tempPreview = URL.createObjectURL(webpBlob)
      setPreview(tempPreview)

      // 3. Subir a Supabase Storage bucket 'platillos'
      setProgress(75)
      setStatusText('Subiendo a Supabase Storage...')
      const filename = `platillo_${dishId}_${Date.now()}.webp`
      const { data, error: uploadErr } = await supabase.storage
        .from('platillos')
        .upload(filename, webpBlob, {
          contentType: 'image/webp',
          upsert: true,
        })

      if (uploadErr) {
        throw uploadErr
      }

      // 4. Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from('platillos')
        .getPublicUrl(filename)

      const finalUrl = publicUrlData.publicUrl
      setProgress(100)
      setPreview(finalUrl)
      onImageChange(finalUrl)
    } catch (err: any) {
      setError(err.message || 'Error al procesar y subir la imagen')
      setPreview(currentUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return
    setError(null)
    setPreview(urlInput)
    onImageChange(urlInput)
  }

  const handleRemove = () => {
    setPreview(null)
    setUrlInput('')
    onImageChange(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-sans font-semibold text-negro/80 dark:text-arena uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-turquesa" />
          <span>Imagen del Platillo</span>
        </label>
        <div className="flex items-center gap-1 bg-[#F4F0E8] dark:bg-carbon p-0.5 rounded-lg border border-arena/30 dark:border-arena/10 transition-colors">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`px-2.5 py-1 text-xs font-sans rounded transition-colors ${
              mode === 'file'
                ? 'bg-turquesa text-negro font-bold'
                : 'text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco'
            }`}
          >
            Subir Foto / HEIC
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 text-xs font-sans rounded transition-colors ${
              mode === 'url'
                ? 'bg-turquesa text-negro font-bold'
                : 'text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco'
            }`}
          >
            URL Externa
          </button>
        </div>
      </div>

      {/* Preview Actual si existe */}
      {preview ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-arena/30 dark:border-arena/20 group shadow-lg">
          <Image
            src={preview}
            alt="Preview platillo"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-negro/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleRemove}
              className="p-2.5 bg-coral text-blanco rounded-full hover:bg-coral/80 transition-colors shadow-lg"
              title="Eliminar imagen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : mode === 'file' ? (
        /* Área Drag & Drop / Click para archivo con soporte HEIC iPhone */
        <label className="border-2 border-dashed border-arena/40 dark:border-arena/20 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-turquesa/50 bg-[#F4F0E8]/50 dark:bg-carbon/50 transition-all text-center">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-8 h-8 text-turquesa animate-spin" />
              <span className="text-xs font-sans text-turquesa font-bold">
                {statusText} ({progress}%)
              </span>
              {/* Barra de progreso */}
              <div className="w-56 h-2 bg-arena/20 dark:bg-carbon rounded-full overflow-hidden border border-arena/20 mt-1">
                <div
                  className="h-full bg-gradient-to-r from-coral to-turquesa transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 bg-white dark:bg-carbon rounded-full text-turquesa border border-arena/30 dark:border-arena/10 shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-sans text-negro dark:text-arena font-bold">
                Sube fotos en JPG, PNG, WebP o iPhone HEIC (Máx 15MB)
              </span>
              <span className="text-[10px] text-negro/60 dark:text-arena/60 font-serif italic">
                Sombra, optimización y compresión a WebP automáticos
              </span>
            </>
          )}
        </label>
      ) : (
        /* Campo de URL externa */
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-lg px-3 py-2 text-xs text-negro dark:text-blanco focus:outline-none focus:border-turquesa"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-4 py-2 bg-turquesa text-negro font-bold text-xs rounded-lg hover:bg-blanco transition-colors"
          >
            Usar URL
          </button>
        </div>
      )}

      {error && (
        <span className="text-xs font-sans text-coral font-bold bg-coral/10 p-2 rounded-lg border border-coral/30">
          ⚠️ {error}
        </span>
      )}
    </div>
  )
}
