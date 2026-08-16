'use client'

import React from 'react'
import { Pedido } from '@/lib/types/database'
import { Printer, X } from 'lucide-react'

interface TicketPrintModalProps {
  pedido: Pedido
  onClose: () => void
}

export function TicketPrintModal({ pedido, onClose }: TicketPrintModalProps) {
  const handlePrint = () => {
    window.print()
  }

  const createdDateStr = pedido.created_at
    ? new Date(pedido.created_at).toLocaleString('es-MX', { timeZone: 'America/Mazatlan' })
    : new Date().toLocaleString('es-MX', { timeZone: 'America/Mazatlan' })

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      {/* Estilos para impresión en impresoras térmicas de 80mm */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-pos-ticket, #thermal-pos-ticket * {
            visibility: visible !important;
          }
          #thermal-pos-ticket {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/40 rounded-3xl w-full max-w-md p-6 gold-border-corner shadow-2xl relative text-blanco flex flex-col gap-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon border border-arena/20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-turquesa font-mono text-xs uppercase tracking-widest font-bold">
          <Printer className="w-4 h-4" />
          <span>IMPRESIÓN TÉRMICA TICKET 80MM</span>
        </div>

        {/* TICKET TÉRMICO CONTENEDOR */}
        <div
          id="thermal-pos-ticket"
          className="bg-white text-black p-5 rounded-2xl font-mono text-xs leading-snug shadow-inner border border-arena/30 flex flex-col gap-2"
        >
          <div className="text-center font-bold text-base tracking-wider uppercase border-b border-black/30 pb-2">
            MAREA NEGRA
            <div className="text-[10px] font-normal tracking-normal">AGUACHILES & COCTELES</div>
            <div className="text-[9px] font-normal text-black/70 mt-0.5">SINALOA, MÉXICO</div>
          </div>

          <div className="flex justify-between items-center text-xs font-bold pt-1">
            <span>TICKET #00{pedido.id}</span>
            <span className="uppercase text-[10px]">{pedido.estado}</span>
          </div>

          <div className="text-[10px] text-black/80 border-b border-black/20 pb-2">
            <div>FECHA: {createdDateStr}</div>
            <div>CLIENTE: {pedido.cliente_nombre.toUpperCase()}</div>
            {pedido.cliente_telefono && <div>TELÉFONO: {pedido.cliente_telefono}</div>}
            {pedido.hora_recogida && <div>RECOGIDA: {pedido.hora_recogida.slice(0, 5)} HRS</div>}
            <div>PAGO: {(pedido.metodo_pago || 'EFECTIVO').toUpperCase()}</div>
          </div>

          {/* TABLA ITEMS TICKET */}
          <div className="py-2 border-b border-black/30 flex flex-col gap-1.5">
            <div className="flex justify-between font-bold text-[10px] border-b border-black/20 pb-1">
              <span>CANT / PLATILLO</span>
              <span>TOTAL</span>
            </div>

            {pedido.pedido_items && pedido.pedido_items.length > 0 ? (
              pedido.pedido_items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <span className="flex-1 pr-2">
                    <strong className="mr-1">[{item.cantidad}x]</strong>
                    {item.nombre_platillo}
                  </span>
                  <span className="font-bold">
                    ${((item.precio_unitario || 0) * item.cantidad).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[10px] italic">Comanda General</div>
            )}
          </div>

          {/* TOTALES */}
          <div className="flex justify-between items-center font-bold text-sm pt-1">
            <span>TOTAL A COBRAR:</span>
            <span className="text-base">${pedido.total?.toFixed(2)} MXN</span>
          </div>

          {/* NOTAS DE COCINA */}
          {pedido.notas && (
            <div className="mt-2 p-2 border border-black/40 rounded text-[10px] italic">
              <strong>NOTAS COCINA:</strong> {pedido.notas}
            </div>
          )}

          <div className="text-center text-[9px] pt-3 border-t border-black/20 text-black/60 mt-1">
            ¡GRACIAS POR TU PREFERENCIA!
            <br />
            *** MAREA NEGRA - SINALOA ***
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handlePrint}
            className="flex-1 bg-turquesa text-negro font-sans font-bold text-xs py-3.5 px-4 rounded-xl hover:bg-blanco transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>ENVIAR A IMPRESORA (WINDOW.PRINT)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3.5 bg-carbon border border-arena/20 text-blanco font-sans font-bold text-xs rounded-xl hover:bg-arena/20"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
