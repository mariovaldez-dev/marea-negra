'use client'

import React, { useState, useEffect } from 'react'
import { Mesa } from '@/lib/types/database'
import { Printer, X, Download, QrCode, Copy, Check, Sparkles } from 'lucide-react'

interface MesaQrModalProps {
  mesa: Mesa
  onClose: () => void
}

export function MesaQrModal({ mesa, onClose }: MesaQrModalProps) {
  const [copied, setCopied] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  const qrTargetUrl = `${baseUrl}/pedir?mesa=${encodeURIComponent(mesa.nombre)}&mesa_id=${mesa.id}`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=15&data=${encodeURIComponent(qrTargetUrl)}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrTargetUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      alert('Enlace: ' + qrTargetUrl)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      {/* Estilos para impresión de plantilla QR */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #mesa-qr-print-card, #mesa-qr-print-card * {
            visibility: visible !important;
          }
          #mesa-qr-print-card {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 90mm !important;
            padding: 10mm !important;
            background: white !important;
            color: black !important;
            border: 2px solid black !important;
            box-shadow: none !important;
            text-align: center !important;
          }
        }
      `}</style>

      <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/40 rounded-3xl w-full max-w-md p-6 md:p-8 gold-border-corner shadow-2xl relative text-blanco flex flex-col gap-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon border border-arena/20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-turquesa font-mono text-xs uppercase tracking-widest font-bold">
          <QrCode className="w-4 h-4" />
          <span>AUTOPEDIDO QR PARA MESA</span>
        </div>

        {/* TARJETA IMPRIMIBLE DE QR */}
        <div
          id="mesa-qr-print-card"
          className="bg-white text-black p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center gap-3 border-2 border-black/10"
        >
          <div className="flex flex-col items-center">
            <span className="font-display text-2xl tracking-wider text-black">
              MAREA NEGRA
            </span>
            <span className="font-serif italic text-xs text-black/70 -mt-1">
              Aguachiles · Sinaloa
            </span>
          </div>

          <div className="p-2 bg-black/5 rounded-2xl border border-black/10 shadow-inner my-1">
            {/* Imagen del QR */}
            <img
              src={qrImageUrl}
              alt={`QR para ${mesa.nombre}`}
              className="w-48 h-48 object-contain rounded-xl"
            />
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="bg-black text-white text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              📍 {mesa.nombre.toUpperCase()}
            </span>
            <p className="font-sans text-xs font-bold text-black/80 mt-1">
              ESCANEA CON TU CÁMARA PARA PEDIR
            </p>
            <p className="font-serif italic text-[11px] text-black/60">
              Tu orden llegará directo a tu mesa.
            </p>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 bg-turquesa text-negro font-sans font-bold text-xs py-3.5 px-4 rounded-xl hover:bg-blanco transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Printer className="w-4 h-4" />
              <span>IMPRIMIR PARA MESA (WINDOW.PRINT)</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="bg-carbon border border-arena/20 text-blanco p-3.5 rounded-xl hover:border-turquesa transition-all flex items-center justify-center"
              title="Copiar enlace de pedido"
            >
              {copied ? <Check className="w-4 h-4 text-turquesa" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[11px] font-mono text-center text-arena/50 truncate">
            {qrTargetUrl}
          </p>
        </div>
      </div>
    </div>
  )
}
