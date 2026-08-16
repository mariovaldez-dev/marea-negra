'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { createBrowserClient } from '@/lib/supabase/client'
import { updateComprobantePedido } from '@/lib/actions/publicPedidos'
import { Upload, FileText, CheckCircle2, Loader2, ExternalLink, ShieldCheck, X } from 'lucide-react'

interface ComprobanteUploaderProps {
  pedidoId: number
  currentComprobanteUrl?: string | null
  onSuccess?: (url: string) => void
}

export function ComprobanteUploader({
  pedidoId,
  currentComprobanteUrl,
  onSuccess,
}: ComprobanteUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(currentComprobanteUrl || null)
  const [error, setError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('')

  const supabase = createBrowserClient()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const lowerName = file.name.toLowerCase()
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf')
    const isImage =
      ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type) ||
      lowerName.endsWith('.heic') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.webp')

    if (!isPdf && !isImage) {
      setError('Formato no soportado. Usa PDF o imágenes (JPG, PNG, WebP, HEIC).')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('El archivo supera el límite de 15MB.')
      return
    }

    setError(null)
    setUploading(true)
    setStatusText('Procesando comprobante de pago...')

    try {
      let blobToUpload: Blob = file
      let contentType = file.type || (isPdf ? 'application/pdf' : 'image/jpeg')
      let extension = isPdf ? 'pdf' : 'jpg'

      // Si es foto HEIC de iPhone, convertir a JPEG
      if (isImage && (lowerName.endsWith('.heic') || lowerName.endsWith('.heif') || file.type.includes('heic'))) {
        setStatusText('Decodificando formato iPhone HEIC...')
        try {
          const heic2any = (await import('heic2any')).default
          const res = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
          blobToUpload = Array.isArray(res) ? res[0] : res
          contentType = 'image/jpeg'
          extension = 'jpg'
        } catch (e) {
          console.warn('Fallback a archivo original HEIC:', e)
        }
      }

      setStatusText('Subiendo comprobante a servidor seguro...')
      const filename = `comprobante_pago_${pedidoId}_${Date.now()}.${extension}`
      const { error: uploadErr } = await supabase.storage
        .from('platillos')
        .upload(filename, blobToUpload, {
          contentType,
          upsert: true,
        })

      if (uploadErr) throw uploadErr

      const { data: publicUrlData } = supabase.storage
        .from('platillos')
        .getPublicUrl(filename)

      const finalUrl = publicUrlData.publicUrl

      // Vincular comprobante en la base de datos
      await updateComprobantePedido(pedidoId, finalUrl)

      setComprobanteUrl(finalUrl)
      if (onSuccess) onSuccess(finalUrl)
    } catch (err: any) {
      console.error('Error al subir comprobante:', err)
      setError(err.message || 'Ocurrió un error al subir tu comprobante de pago.')
    } finally {
      setUploading(false)
    }
  }

  const isPdfFile = comprobanteUrl?.toLowerCase().includes('.pdf')

  return (
    <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-turquesa/40 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>COMPROBANTE DE PAGO POR TRANSFERENCIA / OXXO</span>
        </span>
        <h4 className="font-display text-xl text-negro dark:text-blanco">
          ADJUNTA TU FICHA O PDF DE PAGO
        </h4>
        <p className="font-serif italic text-xs text-negro/70 dark:text-arena/70">
          Sube tu foto de la app bancaria o comprobante en formato **PNG, JPG o PDF**.
        </p>
      </div>

      {comprobanteUrl ? (
        <div className="bg-[#F4F0E8] dark:bg-carbon border border-arena/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-turquesa/20 text-turquesa rounded-xl border border-turquesa/30">
              {isPdfFile ? <FileText className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6 text-turquesa" />}
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-xs text-negro dark:text-blanco flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-turquesa" />
                <span>COMPROBANTE RECIBIDO EXITO</span>
              </span>
              <span className="text-[11px] font-serif italic text-negro/60 dark:text-arena/60">
                {isPdfFile ? 'Documento PDF de Transferencia' : 'Imagen de Ficha de Pago'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={comprobanteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-turquesa text-negro font-sans font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-blanco transition-all flex items-center gap-1.5 shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>VER ADJUNTO</span>
            </a>
          </div>
        </div>
      ) : (
        <label className="border-2 border-dashed border-turquesa/40 hover:border-turquesa rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-turquesa/5 hover:bg-turquesa/10 transition-all text-center">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.pdf"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-8 h-8 text-turquesa animate-spin" />
              <span className="text-xs font-sans text-turquesa font-bold">
                {statusText}
              </span>
            </div>
          ) : (
            <>
              <div className="p-3 bg-carbon rounded-full text-turquesa border border-turquesa/30 shadow-md">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-sans text-negro dark:text-blanco font-bold">
                SUBIR FICHA DE PAGO (FOTO O PDF)
              </span>
              <span className="text-[10px] text-negro/60 dark:text-arena/60 font-serif italic">
                Formatos permitidos: PDF, JPG, PNG o HEIC (Máximo 15MB)
              </span>
            </>
          )}
        </label>
      )}

      {error && (
        <div className="bg-coral/10 border border-coral/30 text-coral p-3 rounded-xl text-xs font-sans font-bold">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}
