'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Mesa, Platillo, MetodoPago, NivelPicor } from '@/lib/types/database'
import {
  abrirComandaMesa,
  agregarRondaAMesa,
  cambiarEstadoMesa,
  cobrarYLiberarMesa,
  asignarSocioAPedidoMesa,
} from '@/lib/actions/mesas'
import { ClientePerfilStats } from '@/lib/actions/clienteCuenta'

const CustomerQrScannerModal = dynamic(
  () => import('@/components/admin/CustomerQrScannerModal').then((mod) => mod.CustomerQrScannerModal),
  { ssr: false }
)
const TicketTermicoModal = dynamic(
  () => import('@/components/print/TicketTermicoModal').then((mod) => mod.TicketTermicoModal),
  { ssr: false }
)

import {
  X,
  Check,
  Plus,
  Minus,
  Search,
  Printer,
  DollarSign,
  UtensilsCrossed,
  Loader2,
  Clock,
  User,
  ShoppingBag,
  Flame,
  FileText,
  Trash2,
  QrCode,
  Award,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react'

interface MesaComandaModalProps {
  mesa: Mesa
  platillos: Platillo[]
  onClose: () => void
  onMesaUpdated: () => void
}

interface ItemConfigurado {
  id: string
  platillo: Platillo
  cantidad: number
  nivelPicor: NivelPicor
  notasItem: string
}

const PICOR_OPTIONS: { id: NivelPicor; label: string; desc: string; color: string; flames: number }[] = [
  { id: 'sin_chile', label: 'Sin Chile', desc: 'Mariscos al natural con limón', color: 'bg-black/5 dark:bg-white/10 text-negro dark:text-blanco border-black/10 dark:border-white/10', flames: 0 },
  { id: 'suave', label: 'Suave', desc: 'Toque leve de picante', color: 'bg-turquesa/15 text-turquesa border-turquesa/30', flames: 1 },
  { id: 'medio', label: 'Medio', desc: 'Picor tradicional de la casa', color: 'bg-[#ECC94B]/20 text-[#8B6E00] dark:text-[#ECC94B] border-[#ECC94B]/30', flames: 2 },
  { id: 'bravo', label: 'Bravo', desc: 'Sabor intenso para conocedores', color: 'bg-coral/20 text-coral border-coral/30', flames: 3 },
]

export function MesaComandaModal({
  mesa,
  platillos,
  onClose,
  onMesaUpdated,
}: MesaComandaModalProps) {
  const [activeTab, setActiveTab] = useState<'comanda' | 'agregar_ronda' | 'cobro'>('comanda')
  const [dishQuery, setDishQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<ItemConfigurado[]>([])
  const [clienteNombre, setClienteNombre] = useState(mesa.pedido_activo?.cliente_nombre || '')
  const [clienteTelefono, setClienteTelefono] = useState(mesa.pedido_activo?.cliente_telefono || '')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [notasRonda, setNotasRonda] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [descuento, setDescuento] = useState<number>(0)
  const [showTicketModal, setShowTicketModal] = useState(false)

  // Estado del Modal de Configuración Individual de Platillo
  const [configuringPlatillo, setConfiguringPlatillo] = useState<Platillo | null>(null)
  const [configQty, setConfigQty] = useState<number>(1)
  const [configPicor, setConfigPicor] = useState<NivelPicor>('medio')
  const [configNotas, setConfigNotas] = useState<string>('')

  const pedidoActivo = mesa.pedido_activo
  const itemsActuales = pedidoActivo?.pedido_items || []
  const subtotalActual = Number(pedidoActivo?.total || 0)

  // Suma de la nueva ronda que se está armando
  const subtotalNuevaRonda = selectedItems.reduce(
    (acc, item) => acc + item.platillo.precio * item.cantidad,
    0
  )

  const totalParaCobro = Math.max(0, subtotalActual - descuento)

  // Abrir modal de especificaciones al hacer clic en un platillo
  const handleOpenConfig = (platillo: Platillo) => {
    setConfiguringPlatillo(platillo)
    setConfigQty(1)
    setConfigPicor('medio')
    setConfigNotas('')
  }

  // Confirmar y agregar platillo configurado a la ronda
  const handleConfirmConfig = () => {
    if (!configuringPlatillo) return

    const newItem: ItemConfigurado = {
      id: Math.random().toString(36).substring(7),
      platillo: configuringPlatillo,
      cantidad: configQty,
      nivelPicor: configPicor,
      notasItem: configNotas.trim(),
    }

    setSelectedItems((prev) => [...prev, newItem])
    setConfiguringPlatillo(null)
  }

  const handleRemoveSelectedItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleUpdateSelectedQty = (id: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const nextQty = i.cantidad + delta
            return nextQty > 0 ? { ...i, cantidad: nextQty } : null
          }
          return i
        })
        .filter(Boolean) as ItemConfigurado[]
    )
  }

  // Asignar cliente desde el Escáner QR
  const handleCustomerSelectedFromScanner = async (socio: ClientePerfilStats) => {
    setClienteNombre(socio.nombreCliente)
    setClienteTelefono(socio.telefono)

    if (pedidoActivo) {
      try {
        await asignarSocioAPedidoMesa({
          pedido_id: pedidoActivo.id,
          cliente_telefono: socio.telefono,
          cliente_nombre: socio.nombreCliente,
        })
        onMesaUpdated()
      } catch (e) {
        console.error('Error al asociar socio a comanda:', e)
      }
    }
  }

  // Enviar comanda inicial (abrir mesa)
  const handleAbrirMesaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItems.length === 0) {
      alert('Selecciona al menos un platillo o bebida para abrir la mesa.')
      return
    }

    setIsSubmitting(true)
    try {
      await abrirComandaMesa({
        mesa_id: mesa.id,
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono,
        notas: notasRonda,
        items: selectedItems.map((item) => ({
          platillo_id: item.platillo.id,
          nombre_platillo: item.platillo.nombre,
          precio_unitario: item.platillo.precio,
          cantidad: item.cantidad,
          nivel_picor: item.nivelPicor,
          notas_item: item.notasItem || undefined,
        })),
      })
      onMesaUpdated()
      onClose()
    } catch (err) {
      console.error('Error al abrir mesa:', err)
      alert('Ocurrió un error al abrir la mesa.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Enviar ronda adicional a mesa ocupada
  const handleAgregarRondaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pedidoActivo || selectedItems.length === 0) return

    setIsSubmitting(true)
    try {
      await agregarRondaAMesa({
        mesa_id: mesa.id,
        pedido_id: pedidoActivo.id,
        items: selectedItems.map((item) => ({
          platillo_id: item.platillo.id,
          nombre_platillo: item.platillo.nombre,
          precio_unitario: item.platillo.precio,
          cantidad: item.cantidad,
          nivel_picor: item.nivelPicor,
          notas_item: item.notasItem || undefined,
        })),
        notas_adicionales: notasRonda,
      })
      setSelectedItems([])
      setNotasRonda('')
      setActiveTab('comanda')
      onMesaUpdated()
    } catch (err) {
      console.error('Error al agregar ronda:', err)
      alert('Ocurrió un error al agregar los platillos a la comanda.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cobrar y liberar mesa
  const handleCobrarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pedidoActivo) return

    setIsSubmitting(true)
    try {
      await cobrarYLiberarMesa({
        mesa_id: mesa.id,
        pedido_id: pedidoActivo.id,
        metodo_pago: metodoPago,
        descuento,
        total_cobrado: totalParaCobro,
        notas: `Cobro de ${mesa.nombre}`,
      })
      onMesaUpdated()
      onClose()
    } catch (err) {
      console.error('Error al cobrar mesa:', err)
      alert('Ocurrió un error al registrar el cobro de la mesa.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredDishes = platillos.filter((p) =>
    p.nombre.toLowerCase().includes(dishQuery.toLowerCase())
  )

  const renderFlames = (flames: number) => {
    if (flames === 0) return <span className="text-xs">⚪</span>
    return (
      <span className="flex items-center text-coral">
        {Array.from({ length: flames }).map((_, i) => (
          <Flame key={i} className="w-3.5 h-3.5 fill-coral stroke-none -mr-0.5" />
        ))}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Estilos para impresión de Precuenta Térmica */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-precuenta-ticket, #thermal-precuenta-ticket * {
            visibility: visible !important;
          }
          #thermal-precuenta-ticket {
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

      {/* TICKET TÉRMICO OCULTO EN PANTALLA, VISIBLE EN IMPRESIÓN */}
      <div id="thermal-precuenta-ticket" className="hidden print:block bg-white text-black p-5 font-mono text-xs">
        <div className="text-center font-bold text-base border-b border-black/30 pb-2">
          MAREA NEGRA
          <div className="text-[10px] font-normal">PRE-CUENTA DE MESA</div>
        </div>
        <div className="flex justify-between items-center text-xs font-bold pt-2 border-b border-black/20 pb-2">
          <span>{mesa.nombre.toUpperCase()}</span>
          <span>ORDEN #{pedidoActivo?.id || '---'}</span>
        </div>
        <div className="py-2 border-b border-black/20 flex flex-col gap-1">
          {itemsActuales.map((it, idx) => (
            <div key={idx} className="flex justify-between text-[11px]">
              <span>[{it.cantidad}x] {it.nombre_platillo}</span>
              <span>${((it.precio_unitario || 0) * it.cantidad).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center font-bold text-sm pt-2">
          <span>TOTAL:</span>
          <span>${subtotalActual.toFixed(2)} MXN</span>
        </div>
        <div className="text-center text-[9px] pt-3 text-black/60">
          *** NO ES COMPROBANTE FISCAL ***
        </div>
      </div>

      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative text-negro dark:text-blanco flex flex-col gap-5">
        {/* Header Comanda */}
        <div className="flex items-start justify-between border-b border-black/5 dark:border-white/5 pb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="bg-turquesa text-negro text-xs font-mono font-bold px-3 py-0.5 rounded-full uppercase shadow-sm">
                {mesa.nombre}
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase shadow-sm ${
                  mesa.estado === 'libre'
                    ? 'bg-[#16A34B] text-white'
                    : mesa.estado === 'ocupada'
                    ? 'bg-coral text-white'
                    : 'bg-[#ECC94B] text-[#3A2D00]'
                }`}
              >
                {mesa.estado === 'libre'
                  ? 'Libre'
                  : mesa.estado === 'ocupada'
                  ? 'Ocupada · Comiendo'
                  : 'Cuenta Pedida'}
              </span>
            </div>

            <h3 className="font-sans font-black text-2xl sm:text-3xl text-negro dark:text-blanco tracking-tight mt-1.5">
              Comandero de Salón
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-negro/40 dark:text-arena/50 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS DE CONTROL (Si está ocupada) */}
        {mesa.estado !== 'libre' && (
          <div className="grid grid-cols-3 gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('comanda')}
              className={`py-2 px-3 rounded-full text-xs font-sans font-bold transition-all cursor-pointer ${
                activeTab === 'comanda'
                  ? 'bg-white dark:bg-[#222222] text-negro dark:text-blanco shadow-sm'
                  : 'text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco'
              }`}
            >
              📋 Cuenta (${subtotalActual.toFixed(0)})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('agregar_ronda')}
              className={`py-2 px-3 rounded-full text-xs font-sans font-bold transition-all cursor-pointer ${
                activeTab === 'agregar_ronda'
                  ? 'bg-coral text-white shadow-sm'
                  : 'text-negro/60 dark:text-arena/60 hover:text-coral'
              }`}
            >
              ➕ Ronda Extra
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cobro')}
              className={`py-2 px-3 rounded-full text-xs font-sans font-bold transition-all cursor-pointer ${
                activeTab === 'cobro'
                  ? 'bg-[#16A34B] text-white shadow-sm'
                  : 'text-negro/60 dark:text-arena/60 hover:text-[#16A34B]'
              }`}
            >
              💳 Cobro & Cierre
            </button>
          </div>
        )}

        {/* CASO 1: MESA LIBRE -> ABRIR COMANDA */}
        {mesa.estado === 'libre' && (
          <form onSubmit={handleAbrirMesaSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-sans text-negro/70 dark:text-arena/70 font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-turquesa" />
                  <span>Nombre del Comensal / Identificador</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-xs font-sans font-bold text-oro bg-oro/10 hover:bg-oro/20 px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Escanear Socio VIP</span>
                </button>
              </div>

              <input
                type="text"
                placeholder={`Ej. Familia Ramírez, Amigos (${mesa.nombre})`}
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-2.5 text-sm text-negro dark:text-blanco focus:outline-none focus:ring-2 focus:ring-turquesa"
              />

              {clienteTelefono && (
                <div className="bg-[#16A34B]/10 border border-[#16A34B]/30 px-3 py-2 rounded-2xl flex items-center justify-between text-xs text-[#16A34B]">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Award className="w-4 h-4" />
                    <span>Socio VIP Vinculado: +52 {clienteTelefono}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setClienteTelefono('')
                      setClienteNombre('')
                    }}
                    className="text-[10px] text-coral hover:underline font-bold"
                  >
                    Desvincular
                  </button>
                </div>
              )}
            </div>

            {/* Selector de Platillos para la Comanda Inicial */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-negro/70 dark:text-arena/70 font-bold">
                  Seleccionar Platillos del Menú:
                </span>
                <span className="font-mono text-xs text-turquesa font-bold">
                  {selectedItems.length} platillos configurados
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-negro/40 dark:text-arena/50" />
                <input
                  type="text"
                  placeholder="Buscar platillo, aguachile o bebida..."
                  value={dishQuery}
                  onChange={(e) => setDishQuery(e.target.value)}
                  className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-negro dark:text-blanco w-full focus:outline-none focus:ring-2 focus:ring-turquesa"
                />
              </div>

              {/* Grid de platillos disponibles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {filteredDishes.map((platillo) => (
                  <div
                    key={platillo.id}
                    onClick={() => handleOpenConfig(platillo)}
                    className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:border-turquesa p-3 rounded-2xl cursor-pointer flex items-center justify-between transition-all group shadow-sm hover:shadow active:scale-95"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-sans font-bold text-xs text-negro dark:text-blanco truncate group-hover:text-turquesa transition-colors">
                        {platillo.nombre}
                      </span>
                      <span className="font-sans font-black text-xs text-coral">
                        ${platillo.precio} MXN
                      </span>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 bg-turquesa/10 group-hover:bg-turquesa text-turquesa group-hover:text-negro rounded-xl transition-all shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Items Seleccionados para Abrir con Picor y Notas */}
              {selectedItems.length > 0 && (
                <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-turquesa/30 rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-turquesa uppercase tracking-wider">
                    Platillos y Especificaciones a marchar:
                  </span>
                  <div className="divide-y divide-black/5 dark:divide-white/5 flex flex-col gap-2">
                    {selectedItems.map((item) => {
                      const picorInfo = PICOR_OPTIONS.find((p) => p.id === item.nivelPicor)
                      return (
                        <div key={item.id} className="pt-2 flex flex-col gap-1 text-xs">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="bg-turquesa text-negro font-mono font-bold px-2 py-0.5 rounded-md shadow-sm">
                                x{item.cantidad}
                              </span>
                              <span className="text-negro dark:text-blanco font-sans font-bold text-sm">
                                {item.platillo.nombre}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-sans font-black text-sm text-coral">
                                ${(item.platillo.precio * item.cantidad).toFixed(0)}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSelectedQty(item.id, -1)}
                                  className="p-1 bg-black/5 dark:bg-white/10 hover:bg-red-500/20 text-red-500 rounded-lg"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSelectedQty(item.id, 1)}
                                  className="p-1 bg-black/5 dark:bg-white/10 hover:bg-turquesa text-turquesa hover:text-negro rounded-lg"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSelectedItem(item.id)}
                                  className="p-1 bg-black/5 dark:bg-white/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg ml-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pl-7">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${picorInfo?.color}`}>
                              {renderFlames(picorInfo?.flames || 0)}
                              <span>{picorInfo?.label}</span>
                            </span>

                            {item.notasItem && (
                              <span className="text-[11px] italic text-negro/70 dark:text-arena/80 flex items-center gap-1 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md">
                                <FileText className="w-3 h-3 text-turquesa" />
                                <span>"{item.notasItem}"</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-black/5 dark:border-white/5 font-bold">
                    <span className="text-xs text-negro/60 dark:text-arena/70">TOTAL INICIAL:</span>
                    <span className="font-sans font-black text-2xl text-coral">
                      ${subtotalNuevaRonda.toFixed(2)} MXN
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedItems.length === 0}
              className="bg-coral hover:bg-coral/90 text-white font-sans font-bold text-xs tracking-wider py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Marchando comanda...</span>
                </>
              ) : (
                <>
                  <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
                  <span>Abrir Mesa y Enviar a Cocina (${subtotalNuevaRonda.toFixed(0)})</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* CASO 2: TAB 'COMANDA' DE MESA OCUPADA */}
        {mesa.estado !== 'libre' && activeTab === 'comanda' && (
          <div className="flex flex-col gap-4">
            {/* Banner de Socio VIP en la mesa */}
            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-oro/10 text-oro rounded-xl">
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold text-turquesa uppercase tracking-wider">
                    Socio VIP de la Mesa:
                  </span>
                  <span className="text-xs font-sans font-bold text-negro dark:text-blanco">
                    {clienteTelefono
                      ? `${clienteNombre || 'Socio Club'} (+52 ${clienteTelefono})`
                      : 'Sin socio asignado'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="text-xs font-sans font-bold text-oro bg-oro/10 hover:bg-oro/20 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{clienteTelefono ? 'Cambiar' : 'Escanear QR'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-negro/70 dark:text-arena/80">
                Platillos Consumidos en {mesa.nombre}:
              </span>
              <span className="text-xs font-mono text-negro/50 dark:text-arena/50">
                {itemsActuales.length} partidas
              </span>
            </div>

            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-black/5 dark:divide-white/5">
              {itemsActuales.length > 0 ? (
                itemsActuales.map((item, i) => {
                  const picorInfo = PICOR_OPTIONS.find((p) => p.id === item.nivel_picor)
                  return (
                    <div key={i} className="p-3.5 flex flex-col gap-1.5 text-xs font-sans">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="bg-turquesa text-negro font-mono font-bold px-2 py-0.5 rounded-md shadow-sm">
                            x{item.cantidad}
                          </span>
                          <span className="font-bold text-negro dark:text-blanco text-sm">
                            {item.nombre_platillo}
                          </span>
                        </div>
                        <span className="font-sans font-black text-base text-coral">
                          ${((item.precio_unitario || 0) * item.cantidad).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pl-8">
                        {item.nivel_picor && (
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${picorInfo?.color || 'text-arena'}`}>
                            {renderFlames(picorInfo?.flames || 0)}
                            <span>Picor: {picorInfo?.label || item.nivel_picor}</span>
                          </span>
                        )}

                        {item.notas_item && (
                          <span className="text-[11px] italic text-negro/70 dark:text-arena/80 flex items-center gap-1 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md">
                            <FileText className="w-3 h-3 text-turquesa" />
                            <span>Nota: "{item.notas_item}"</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-negro/40 dark:text-arena/50 p-4 italic text-center">
                  Sin platillos registrados en la comanda.
                </p>
              )}
            </div>

            {/* Total acumulado */}
            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-negro/50 dark:text-arena/60 uppercase">
                  Subtotal Acumulado
                </span>
                <span className="font-sans font-black text-2xl sm:text-3xl text-negro dark:text-blanco">
                  ${subtotalActual.toFixed(2)} MXN
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowTicketModal(true)}
                className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-negro dark:text-blanco font-sans font-bold text-xs py-3 px-4 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              >
                <Printer className="w-4 h-4 text-oro" />
                <span>Imprimir Pre-cuenta</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => cambiarEstadoMesa(mesa.id, mesa.estado === 'cuenta_pedida' ? 'ocupada' : 'cuenta_pedida')}
                className="flex-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-negro dark:text-blanco py-3 px-3 rounded-2xl text-xs font-sans font-bold transition-all cursor-pointer"
              >
                {mesa.estado === 'cuenta_pedida' ? '↩️ Marcar como Comiendo' : '🟡 Marcar: Pidiendo Cuenta'}
              </button>
            </div>
          </div>
        )}

        {/* CASO 3: TAB 'AGREGAR RONDA' */}
        {mesa.estado !== 'libre' && activeTab === 'agregar_ronda' && (
          <form onSubmit={handleAgregarRondaSubmit} className="flex flex-col gap-4">
            <span className="text-xs font-sans text-negro/70 dark:text-arena/70 font-bold">
              Marchar Ronda Extra a {mesa.nombre}:
            </span>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-negro/40 dark:text-arena/50" />
              <input
                type="text"
                placeholder="Buscar platillo o bebida extra..."
                value={dishQuery}
                onChange={(e) => setDishQuery(e.target.value)}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-negro dark:text-blanco w-full focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>

            {/* Grid de selección para abrir modal de configuración */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {filteredDishes.map((platillo) => (
                <div
                  key={platillo.id}
                  onClick={() => handleOpenConfig(platillo)}
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:border-coral p-3 rounded-2xl cursor-pointer flex items-center justify-between transition-all group shadow-sm hover:shadow active:scale-95"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-sans font-bold text-xs text-negro dark:text-blanco truncate group-hover:text-coral transition-colors">
                      {platillo.nombre}
                    </span>
                    <span className="font-sans font-black text-xs text-coral">
                      ${platillo.precio} MXN
                    </span>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 bg-coral/10 group-hover:bg-coral text-coral group-hover:text-white rounded-xl transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {selectedItems.length > 0 && (
              <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-coral/30 rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm">
                <span className="text-[10px] font-mono font-bold text-coral uppercase tracking-wider">
                  Nuevos items y especificaciones de esta ronda:
                </span>
                <div className="divide-y divide-black/5 dark:divide-white/5 flex flex-col gap-2">
                  {selectedItems.map((item) => {
                    const picorInfo = PICOR_OPTIONS.find((p) => p.id === item.nivelPicor)
                    return (
                      <div key={item.id} className="pt-2 flex flex-col gap-1 text-xs">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="bg-coral text-white font-mono font-bold px-2 py-0.5 rounded-md shadow-sm">
                              x{item.cantidad}
                            </span>
                            <span className="text-negro dark:text-blanco font-sans font-bold text-sm">
                              {item.platillo.nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-sans font-black text-sm text-coral">
                              ${(item.platillo.precio * item.cantidad).toFixed(0)}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateSelectedQty(item.id, -1)}
                                className="p-1 bg-black/5 dark:bg-white/10 hover:bg-red-500/20 text-red-500 rounded-lg"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateSelectedQty(item.id, 1)}
                                className="p-1 bg-black/5 dark:bg-white/10 hover:bg-coral text-coral hover:text-white rounded-lg"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSelectedItem(item.id)}
                                className="p-1 bg-black/5 dark:bg-white/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg ml-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pl-7">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${picorInfo?.color}`}>
                            {renderFlames(picorInfo?.flames || 0)}
                            <span>{picorInfo?.label}</span>
                          </span>

                          {item.notasItem && (
                            <span className="text-[11px] italic text-negro/70 dark:text-arena/80 flex items-center gap-1 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md">
                              <FileText className="w-3 h-3 text-turquesa" />
                              <span>"{item.notasItem}"</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-negro/70 dark:text-arena/70">
                Instrucciones Generales de la Mesa / Notas de Ronda
              </label>
              <input
                type="text"
                placeholder="Ej. Llevar primero las bebidas, salsas extra..."
                value={notasRonda}
                onChange={(e) => setNotasRonda(e.target.value)}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-negro dark:text-blanco focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedItems.length === 0}
              className="bg-coral hover:bg-coral/90 text-white font-sans font-bold text-xs tracking-wider py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando ronda...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Marchar Ronda Extra (+${subtotalNuevaRonda.toFixed(0)})</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* CASO 4: TAB 'COBRAR Y LIBERAR' */}
        {mesa.estado !== 'libre' && activeTab === 'cobro' && (
          <form onSubmit={handleCobrarSubmit} className="flex flex-col gap-5">
            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-negro/60 dark:text-arena/70">Subtotal de la mesa:</span>
                <span className="font-mono font-bold text-negro dark:text-blanco">${subtotalActual.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="text-xs font-sans text-negro/70 dark:text-arena/70 font-bold">Descuento aplicado ($):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={descuento}
                  onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                  className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-right text-sm font-mono font-bold text-coral w-32 focus:outline-none focus:ring-2 focus:ring-[#16A34B]"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-black/5 dark:border-white/5 font-bold">
                <span className="text-sm text-negro dark:text-blanco">Total a Cobrar:</span>
                <span className="font-sans font-black text-2xl text-oro">
                  ${totalParaCobro.toFixed(2)} MXN
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-negro/70 dark:text-arena/70 uppercase font-bold">
                Método de Pago Recibido
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'efectivo', label: '💵 Efectivo' },
                  { id: 'transferencia', label: '📱 SPEI / Transf' },
                  { id: 'oxxo', label: '🏪 Tarjeta / OXXO' },
                ].map((mp) => (
                  <button
                    key={mp.id}
                    type="button"
                    onClick={() => setMetodoPago(mp.id as MetodoPago)}
                    className={`py-3 px-2 rounded-2xl text-xs font-sans font-bold transition-all cursor-pointer ${
                      metodoPago === mp.id
                        ? 'bg-[#16A34B] text-white shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-negro/70 dark:text-arena/70 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    {mp.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#16A34B] hover:bg-[#16A34B]/90 text-white font-sans font-bold text-xs tracking-wider py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando cobro...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Registrar Cobro y Liberar {mesa.nombre}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* SUB-MODAL DE CONFIGURACIÓN INDIVIDUAL DE PLATILLO (PICOR, NOTAS, CANTIDAD) */}
      {configuringPlatillo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-lg p-5 sm:p-6 shadow-2xl relative text-negro dark:text-blanco flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setConfiguringPlatillo(null)}
              className="absolute top-4 right-4 p-2 text-negro/40 dark:text-arena/50 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabecera del Platillo */}
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-turquesa uppercase block">
                Especificaciones de Comanda
              </span>
              <h3 className="font-sans font-black text-2xl text-negro dark:text-blanco mt-0.5">
                {configuringPlatillo.nombre}
              </h3>
              {configuringPlatillo.descripcion && (
                <p className="text-xs text-negro/60 dark:text-arena/70 mt-1 line-clamp-2 font-normal">
                  {configuringPlatillo.descripcion}
                </p>
              )}
            </div>

            {/* Selector de Cantidad */}
            <div className="flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 p-3.5 rounded-2xl">
              <span className="text-xs font-sans uppercase font-bold text-negro/70 dark:text-arena/70">Porciones:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfigQty(Math.max(1, configQty - 1))}
                  className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 text-negro dark:text-blanco flex items-center justify-center font-bold text-base hover:bg-coral hover:text-white transition-colors"
                >
                  -
                </button>
                <span className="font-sans font-black text-2xl px-2 text-negro dark:text-blanco">{configQty}</span>
                <button
                  type="button"
                  onClick={() => setConfigQty(configQty + 1)}
                  className="w-8 h-8 rounded-xl bg-turquesa text-negro flex items-center justify-center font-bold text-base hover:bg-turquesa/90 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Selector de Nivel de Picor */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-turquesa tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-coral" />
                <span>Nivel de Picor *</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {PICOR_OPTIONS.map((picor) => (
                  <button
                    key={picor.id}
                    type="button"
                    onClick={() => setConfigPicor(picor.id)}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                      configPicor === picor.id
                        ? `${picor.color} shadow-sm ring-2 ring-turquesa/50 font-bold`
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 text-negro/70 dark:text-arena/70 hover:border-turquesa/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{picor.label}</span>
                      {renderFlames(picor.flames)}
                    </div>
                    <span className="text-[10px] opacity-70 truncate">
                      {picor.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Especificaciones / Notas de Preparación */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/70 dark:text-arena/70 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-turquesa" />
                <span>Notas de Preparación / Exclusiones</span>
              </label>
              <textarea
                rows={2}
                placeholder="Ej. Sin cebolla, limón extra, salsas aparte..."
                value={configNotas}
                onChange={(e) => setConfigNotas(e.target.value)}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3 text-xs text-negro dark:text-blanco focus:outline-none focus:ring-2 focus:ring-turquesa"
              />
            </div>

            {/* Botón Confirmar */}
            <button
              type="button"
              onClick={handleConfirmConfig}
              className="bg-coral hover:bg-coral/90 text-white font-sans font-bold text-xs tracking-wider py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md mt-2 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                Agregar a la Comanda (${(configuringPlatillo.precio * configQty).toFixed(0)} MXN)
              </span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE TICKET TÉRMICO (PRE-CUENTA / CUENTA 80MM) */}
      {showTicketModal && mesa.pedido_activo && (
        <TicketTermicoModal
          pedido={mesa.pedido_activo}
          tipo="cuenta_cliente"
          onClose={() => setShowTicketModal(false)}
        />
      )}

      {/* MODAL DE ESCÁNER QR DE SOCIO VIP PARA LA MESA */}
      {isScannerOpen && (
        <CustomerQrScannerModal
          onClose={() => setIsScannerOpen(false)}
          onCustomerSelected={(socio) => {
            handleCustomerSelectedFromScanner(socio)
            setIsScannerOpen(false)
          }}
        />
      )}
    </div>
  )
}
