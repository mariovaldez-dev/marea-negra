'use client'

import React, { useState, useEffect } from 'react'
import { Mesa } from '@/lib/types/database'
import { Printer, X, QrCode, Sparkles } from 'lucide-react'

interface MesasPrintAllQrModalProps {
  mesas: Mesa[]
  onClose: () => void
}

export function MesasPrintAllQrModal({ mesas, onClose }: MesasPrintAllQrModalProps) {
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Estilos para impresión en hoja A4 / Carta */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-all-mesas-container,
          #print-all-mesas-container * {
            visibility: visible !important;
          }
          #print-all-mesas-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 10mm !important;
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8mm !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/40 rounded-3xl w-full max-w-4xl p-6 md:p-8 gold-border-corner shadow-2xl relative text-blanco flex flex-col gap-6 max-h-[90vh] overflow-y-auto no-print">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-arena/20 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-oro/20 text-oro rounded-2xl border border-oro/30">
              <QrCode className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-display text-3xl text-blanco">
                GENERADOR DE QR PARA TODAS LAS MESAS
              </h3>
              <span className="text-xs text-arena/70">
                Formato de corte para stands de acrílico y madera ({mesas.length} Mesas)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-oro text-negro hover:bg-blanco font-sans font-bold text-xs py-3 px-5 rounded-2xl shadow-lg transition-all flex items-center gap-2 border border-oro/40"
            >
              <Printer className="w-4 h-4" />
              <span>IMPRIMIR PLANILLA COMPLETA</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon border border-arena/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENEDOR DE TARJETAS QR PARA TODAS LAS MESAS */}
        <div
          id="print-all-mesas-container"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4 bg-white/5 rounded-2xl border border-arena/20"
        >
          {mesas.map((mesa) => {
            const qrTargetUrl = `${baseUrl}/pedir?mesa=${encodeURIComponent(mesa.nombre)}&mesa_id=${mesa.id}`
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=12&data=${encodeURIComponent(qrTargetUrl)}`

            return (
              <div
                key={mesa.id}
                className="bg-white text-black p-5 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center gap-2 border-2 border-black/20"
              >
                <div className="flex flex-col items-center">
                  <span className="font-display text-2xl tracking-wider text-black">
                    MAREA NEGRA
                  </span>
                  <span className="font-serif italic text-[10px] text-black/70 -mt-1">
                    Aguachiles · Sinaloa
                  </span>
                </div>

                <div className="p-2 bg-black/5 rounded-2xl border border-black/10 shadow-inner my-1">
                  <img
                    src={qrImageUrl}
                    alt={`QR para ${mesa.nombre}`}
                    className="w-36 h-36 object-contain rounded-xl"
                  />
                </div>

                <div className="bg-black text-white font-display text-lg px-4 py-1 rounded-full uppercase tracking-wider shadow">
                  🍽️ {mesa.nombre}
                </div>

                <div className="flex flex-col text-[9px] font-sans text-black/80 leading-tight">
                  <span className="font-bold">1. ESCANEA PARA VER LA CARTA</span>
                  <span>2. PIDE EN LÍNEA O ACUMULA SELLOS VIP</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
