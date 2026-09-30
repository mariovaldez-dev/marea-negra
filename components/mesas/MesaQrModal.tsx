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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
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

      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-md p-6 sm:p-7 shadow-2xl relative text-negro dark:text-blanco flex flex-col gap-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-negro/40 dark:text-arena/50 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-turquesa font-mono text-xs uppercase tracking-wider font-bold">
          <QrCode className="w-4 h-4" />
          <span>Autopedido QR para Mesa</span>
        </div>

        {/* TARJETA IMPRIMIBLE DE QR */}
        <div
          id="mesa-qr-print-card"
          className="bg-white text-black p-6 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center gap-3 border border-black/10"
        >
          <div className="flex flex-col items-center">
            <span className="font-sans font-black text-2xl tracking-tight text-black">
              MAREA NEGRA
            </span>
            <span className="font-sans font-medium text-xs text-black/60 -mt-0.5">
              Aguachiles
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-black/10 shadow-sm my-1">
            <img
              src={qrImageUrl}
              alt={`QR para ${mesa.nombre}`}
              className="w-44 h-44 object-contain rounded-xl"
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="bg-black text-white text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              📍 {mesa.nombre.toUpperCase()}
            </span>
            <p className="font-sans text-xs font-bold text-black/80 mt-1">
              ESCANEA CON TU CÁMARA PARA PEDIR
            </p>
            <p className="font-sans text-[11px] text-black/60">
              Tu orden llegará directo a tu mesa.
            </p>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 bg-coral hover:bg-coral/90 text-white font-sans font-bold text-xs py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir QR de Mesa</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-negro dark:text-blanco p-3.5 rounded-2xl transition-all flex items-center justify-center cursor-pointer active:scale-95"
              title="Copiar enlace de pedido"
            >
              {copied ? <Check className="w-4 h-4 text-[#16A34B]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[11px] font-mono text-center text-negro/40 dark:text-arena/50 truncate">
            {qrTargetUrl}
          </p>
        </div>
      </div>
    </div>
  )
}
