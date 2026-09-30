'use client'

import React, { useState, useEffect } from 'react'
import { Mesa } from '@/lib/types/database'
import { Printer, X, QrCode } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
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

      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-4xl p-6 md:p-8 shadow-2xl relative text-negro dark:text-blanco flex flex-col gap-6 max-h-[90vh] overflow-y-auto no-print">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-coral/10 text-coral rounded-2xl border border-coral/20">
              <QrCode className="w-6 h-6" />
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-turquesa uppercase block">
                Plantilla Imprimible
              </span>
              <h2 className="font-sans font-black text-2xl text-negro dark:text-blanco tracking-tight">
                Imprimir Códigos QR de Todas las Mesas ({mesas.length})
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-coral hover:bg-coral/90 text-white font-sans font-bold text-xs py-3 px-5 rounded-2xl transition-all flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Todo (A4 / Carta)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-negro/40 dark:text-arena/50 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PREVIEW EN PANTALLA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {mesas.map((mesa) => {
            const qrTargetUrl = `${baseUrl}/pedir?mesa=${encodeURIComponent(mesa.nombre)}&mesa_id=${mesa.id}`
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(qrTargetUrl)}`

            return (
              <div
                key={mesa.id}
                className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2"
              >
                <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  📍 {mesa.nombre}
                </span>
                <div className="p-2 bg-white rounded-xl border border-black/10 shadow-sm my-1">
                  <img
                    src={qrImageUrl}
                    alt={`QR ${mesa.nombre}`}
                    className="w-36 h-36 object-contain"
                  />
                </div>
                <span className="text-[11px] font-sans font-medium text-negro/60 dark:text-arena/60">
                  Escanea para pedir en {mesa.nombre}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* CONTENEDOR OCULTO PARA IMPRESIÓN */}
      <div id="print-all-mesas-container" className="hidden">
        {mesas.map((mesa) => {
          const qrTargetUrl = `${baseUrl}/pedir?mesa=${encodeURIComponent(mesa.nombre)}&mesa_id=${mesa.id}`
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(qrTargetUrl)}`

          return (
            <div
              key={mesa.id}
              style={{
                pageBreakInside: 'avoid',
                border: '2px solid black',
                padding: '8mm',
                borderRadius: '6mm',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
                color: 'black',
                marginBottom: '5mm',
              }}
            >
              <h2 style={{ fontSize: '18pt', fontWeight: '900', margin: '0 0 2mm 0' }}>
                MAREA NEGRA
              </h2>
              <span style={{ fontSize: '9pt', fontStyle: 'italic', marginBottom: '3mm' }}>
                Aguachiles & Cocteles · Sinaloa
              </span>

              <div style={{ padding: '3mm', border: '1px solid #ccc', borderRadius: '4mm', margin: '2mm 0' }}>
                <img
                  src={qrImageUrl}
                  alt={`QR ${mesa.nombre}`}
                  style={{ width: '45mm', height: '45mm', objectFit: 'contain' }}
                />
              </div>

              <span
                style={{
                  backgroundColor: 'black',
                  color: 'white',
                  fontSize: '11pt',
                  fontWeight: 'bold',
                  padding: '2mm 5mm',
                  borderRadius: '10mm',
                  textTransform: 'uppercase',
                  marginTop: '2mm',
                }}
              >
                📍 {mesa.nombre}
              </span>
              <p style={{ fontSize: '9pt', fontWeight: 'bold', margin: '3mm 0 0 0' }}>
                ESCANEA CON TU CÁMARA PARA ORDENAR
              </p>
              <p style={{ fontSize: '8pt', color: '#555', margin: '1mm 0 0 0' }}>
                Tu comanda se preparará al instante.
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
