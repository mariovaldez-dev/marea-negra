'use client'

import React, { useRef } from 'react'
import { Pedido } from '@/lib/types/database'
import { Printer, X } from 'lucide-react'
import { printOrderTicket } from '@/lib/utils/printThermalTicket'

interface TicketPrintModalProps {
  pedido: Pedido
  onClose: () => void
}

export function TicketPrintModal({ pedido, onClose }: TicketPrintModalProps) {
  const ticketRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    printOrderTicket(pedido, 'cuenta_cliente')
  }

  const createdDateStr = pedido.created_at
    ? new Date(pedido.created_at).toLocaleString('es-MX', { timeZone: 'America/Mazatlan' })
    : new Date().toLocaleString('es-MX', { timeZone: 'America/Mazatlan' })

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      {/* Estilos para impresión en impresoras térmicas de 80mm */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #thermal-pos-ticket, #thermal-pos-ticket * {
            visibility: visible !important;
          }
          #thermal-pos-ticket {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 4mm !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            display: block !important;
            z-index: 999999;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/40 rounded-3xl w-full max-w-md p-6 gold-border-corner shadow-2xl relative text-blanco flex flex-col gap-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon border border-arena/20 no-print"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-turquesa font-mono text-xs uppercase tracking-widest font-bold no-print">
          <Printer className="w-4 h-4" />
          <span>IMPRESIÓN TÉRMICA TICKET 80MM</span>
        </div>

        {/* TICKET TÉRMICO CONTENEDOR */}
        <div
          id="thermal-pos-ticket"
          ref={ticketRef}
          className="bg-white text-black p-5 rounded-2xl border border-gray-300 font-sans text-xs shadow-lg flex flex-col gap-3 leading-tight max-w-[340px] mx-auto w-full"
        >
          {/* ENCABEZADO TICKET */}
          <div className="text-center pb-2 border-b-2 border-black flex flex-col items-center">
            <span className="font-display text-2xl font-black tracking-wider uppercase text-black leading-none">
              MAREA NEGRA
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-700 mt-1">
              AGUACHILES
            </span>

            {/* BANNER DE SERVICIO */}
            <div className="w-full bg-black text-white text-center font-bold text-xs py-1.5 px-2 rounded mt-2 uppercase tracking-wide">
              {pedido.mesa_nombre ? `🍽️ MESA · ${pedido.mesa_nombre}` : pedido.tipo_entrega === 'didi' ? '🛵 ENVÍO DIDI / UBER' : '🚗 RECOGER EN LOCAL'}
            </div>
          </div>

          {/* METADATOS DEL PEDIDO */}
          <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-gray-400 text-[11px]">
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-sm">FOLIO #{pedido.id}</span>
              <span className="text-gray-600 text-[10px]">{createdDateStr}</span>
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-bold uppercase truncate max-w-[190px]">{pedido.cliente_nombre}</span>
            </div>

            {pedido.cliente_telefono && (
              <div className="flex justify-between items-center text-gray-600">
                <span>Teléfono:</span>
                <span className="font-mono font-medium">{pedido.cliente_telefono}</span>
              </div>
            )}

            {pedido.hora_recogida && (
              <div className="flex justify-between items-center text-gray-700">
                <span>Hora Entrega:</span>
                <span className="font-bold">{pedido.hora_recogida.slice(0, 5)} HRS</span>
              </div>
            )}
          </div>

          {/* TABLA DE PLATILLOS */}
          <div className="flex flex-col gap-2 pb-3 border-b-2 border-black">
            <div className="flex justify-between font-bold text-[10px] uppercase tracking-wider border-b border-black pb-1 text-gray-800">
              <span>CANT  DESCRIPCIÓN</span>
              <span>IMPORTE</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {pedido.pedido_items && pedido.pedido_items.length > 0 ? (
                pedido.pedido_items.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-start font-bold text-[11.5px] text-black">
                      <span className="pr-2">
                        <span className="font-mono mr-1.5">{item.cantidad}x</span>
                        {item.nombre_platillo}
                      </span>
                      <span className="font-mono shrink-0">
                        ${((item.precio_unitario || 0) * (item.cantidad || 1)).toFixed(0)}
                      </span>
                    </div>

                    {item.notas_item && (
                      <div className="pl-5 text-[10px] text-gray-700 italic">
                        • {item.notas_item}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-[10px] italic py-1">Comanda General</div>
              )}
            </div>
          </div>

          {/* NOTAS ESPECIALES */}
          {pedido.notas && (
            <div className="border border-black rounded p-2 text-[10.5px] bg-gray-50">
              <strong className="block text-[9px] uppercase tracking-wider text-black mb-0.5">
                INSTRUCCIONES / NOTAS:
              </strong>
              <span>{pedido.notas}</span>
            </div>
          )}

          {/* TOTALES */}
          <div className="flex flex-col gap-1 pt-1 pb-2 border-b border-dashed border-gray-400 text-[11px]">
            <div className="flex justify-between items-baseline font-black text-base pt-1">
              <span>TOTAL A COBRAR:</span>
              <span className="font-mono text-lg">${(pedido.total || 0).toFixed(0)} MXN</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Método de Pago:</span>
              <span className="font-bold uppercase">{pedido.metodo_pago || 'Efectivo'}</span>
            </div>
          </div>

          {/* PIE DE TICKET */}
          <div className="text-center text-[9.5px] text-gray-600 flex flex-col gap-0.5 pt-1">
            <span className="font-bold text-black">¡Muchas gracias por su preferencia!</span>
            <span>Mariscos frescos preparados al momento</span>
            <span className="text-[8px] text-gray-400 mt-1">*** MAREA NEGRA SINALOA ***</span>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex items-center gap-3 mt-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 bg-coral text-blanco font-sans font-bold text-xs py-3.5 px-4 rounded-xl hover:bg-coral/90 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>IMPRIMIR TICKET (80MM)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3.5 bg-carbon border border-arena/20 text-blanco font-sans font-bold text-xs rounded-xl hover:bg-arena/20 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
