'use client'

import React, { useRef } from 'react'
import { Pedido } from '@/lib/types/database'
import { Printer, X, Check, Utensils, Receipt, Sparkles } from 'lucide-react'

interface TicketTermicoModalProps {
  pedido: Pedido
  tipo: 'comanda_cocina' | 'cuenta_cliente'
  onClose: () => void
}

export function TicketTermicoModal({ pedido, tipo, onClose }: TicketTermicoModalProps) {
  const ticketRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const items = pedido.pedido_items || []
  const subtotal = Number(pedido.total || 0)
  const propina10 = (subtotal * 0.1).toFixed(0)
  const propina15 = (subtotal * 0.15).toFixed(0)

  const fechaFormateada = new Date(pedido.created_at || Date.now()).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Estilos para impresión térmica sin márgenes ni elementos de la web */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-termico-print,
          #ticket-termico-print * {
            visibility: visible;
          }
          #ticket-termico-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 2mm;
            background: white !important;
            color: black !important;
            font-family: monospace, 'Courier New', Courier;
            font-size: 12px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-[#0C0A08] border border-arena/40 dark:border-oro/30 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto no-print">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-arena/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-oro/20 text-oro rounded-xl">
              {tipo === 'comanda_cocina' ? <Utensils className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
            </span>
            <div>
              <h3 className="font-display text-2xl text-negro dark:text-blanco">
                {tipo === 'comanda_cocina' ? 'TICKET DE COCINA / BARRA' : 'TICKET DE CUENTA (80MM)'}
              </h3>
              <span className="text-xs text-arena/70">
                Folio #{pedido.id} · {pedido.mesa_nombre || 'Mostrador'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-arena/60 hover:text-coral rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VISTA PREVIA DEL TICKET (Diseño Térmico Monocromático 80mm) */}
        <div
          id="ticket-termico-print"
          ref={ticketRef}
          className="bg-white text-black p-5 rounded-xl border border-dashed border-gray-400 font-mono text-xs shadow-inner flex flex-col gap-3 leading-tight"
        >
          {/* ENCABEZADO TICKET */}
          <div className="text-center flex flex-col items-center gap-1 border-b border-dashed border-gray-400 pb-3">
            <span className="font-bold text-base tracking-widest uppercase">
              MAREA NEGRA
            </span>
            <span className="text-[11px] font-bold">
              AGUACHILES
            </span>
            <span className="text-[10px] text-gray-700">
              Sinaloa, México · Tel: 667-000-0000
            </span>
            <div className="text-[10px] text-gray-700 mt-1">
              Fecha: {fechaFormateada}
            </div>
            <div className="font-bold text-sm bg-black text-white px-3 py-0.5 mt-1 rounded">
              FOLIO: #{pedido.id}
            </div>
          </div>

          {/* DATOS DE LA MESA / CLIENTE */}
          <div className="flex flex-col gap-0.5 border-b border-dashed border-gray-400 pb-2 text-[11px]">
            <div className="flex justify-between">
              <span className="font-bold">MESA/SERVICIO:</span>
              <span className="font-bold uppercase">{pedido.mesa_nombre || pedido.tipo_entrega || 'Mostrador'}</span>
            </div>
            <div className="flex justify-between">
              <span>CLIENTE:</span>
              <span className="font-bold truncate">{pedido.cliente_nombre}</span>
            </div>
            {pedido.cliente_telefono && (
              <div className="flex justify-between text-gray-600">
                <span>TELÉFONO:</span>
                <span>+52 {pedido.cliente_telefono}</span>
              </div>
            )}
            {pedido.hora_recogida && (
              <div className="flex justify-between text-gray-700">
                <span>HORA ENTREGA:</span>
                <span className="font-bold">{pedido.hora_recogida.slice(0, 5)}</span>
              </div>
            )}
          </div>

          {/* DETALLE DE PLATILLOS */}
          <div className="flex flex-col gap-2 border-b border-dashed border-gray-400 pb-3">
            <div className="flex justify-between font-bold text-[11px] border-b border-gray-300 pb-1">
              <span>CANT / DESCRIPCIÓN</span>
              <span>IMPORTE</span>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-0.5 text-[11px]">
                <div className="flex justify-between items-start font-bold">
                  <span>
                    {item.cantidad}x {item.nombre_platillo}
                  </span>
                  <span>${((item.precio_unitario || 0) * (item.cantidad || 1)).toFixed(0)}</span>
                </div>
                {item.nivel_picor && (
                  <span className="text-[10px] text-gray-800 pl-2">
                    - Picor: {item.nivel_picor.toUpperCase()}
                  </span>
                )}
                {item.notas_item && (
                  <span className="text-[10px] text-gray-700 pl-2 italic">
                    - Nota: "{item.notas_item}"
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* NOTA GENERAL */}
          {pedido.notas && (
            <div className="bg-gray-100 p-1.5 border border-gray-300 text-[10px] italic">
              <strong>Nota:</strong> {pedido.notas}
            </div>
          )}

          {/* TOTALES (Solo para Cuenta Cliente) */}
          {tipo === 'cuenta_cliente' && (
            <div className="flex flex-col gap-1 border-b border-dashed border-gray-400 pb-3 text-[11px]">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1">
                <span>TOTAL:</span>
                <span>${subtotal.toFixed(2)} MXN</span>
              </div>
              <div className="text-[10px] text-gray-600 mt-1">
                Método: <strong className="uppercase">{pedido.metodo_pago || 'Efectivo'}</strong>
              </div>

              {/* PROPINA SUGERIDA */}
              <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-[10px] flex flex-col gap-0.5">
                <span className="font-bold text-center">PROPINA SUGERIDA:</span>
                <div className="flex justify-between">
                  <span>10% Sugerido:</span>
                  <span>+${propina10} (Total: ${(subtotal + Number(propina10)).toFixed(0)})</span>
                </div>
                <div className="flex justify-between">
                  <span>15% Excelente servicio:</span>
                  <span>+${propina15} (Total: ${(subtotal + Number(propina15)).toFixed(0)})</span>
                </div>
              </div>
            </div>
          )}

          {/* PIE DE TICKET */}
          <div className="text-center text-[10px] text-gray-700 flex flex-col gap-1 pt-1">
            <span className="font-bold">¡GRACIAS POR TU PREFERENCIA! 🦐</span>
            <span>Muestra tu QR VIP en tu próxima visita</span>
            <span>para acumular sellos de platillos gratis</span>
            <span className="text-[8px] text-gray-500 mt-1">*** SISTEMA MAREA NEGRA POS ***</span>
          </div>
        </div>

        {/* BOTÓN DE IMPRESIÓN */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 bg-oro text-negro hover:bg-blanco font-sans font-bold text-xs py-3.5 px-5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 border border-oro/40"
          >
            <Printer className="w-4 h-4" />
            <span>IMPRIMIR TICKET (80MM)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-carbon text-arena/80 hover:text-blanco border border-arena/20 font-sans font-bold text-xs py-3.5 px-5 rounded-2xl transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
