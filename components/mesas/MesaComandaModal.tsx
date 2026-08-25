'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
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
  Sparkles,
  Loader2,
  Clock,
  User,
  ShoppingBag,
  Flame,
  FileText,
  Trash2,
  ChevronRight,
  Info,
  QrCode,
  Award,
  Crown,
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
  { id: 'sin_chile', label: 'Sin Chile', desc: 'Mariscos al natural con limón', color: 'border-arena/40 text-arena bg-arena/10', flames: 0 },
  { id: 'suave', label: 'Suave', desc: 'Toque leve de picante', color: 'border-turquesa text-turquesa bg-turquesa/10', flames: 1 },
  { id: 'medio', label: 'Medio', desc: 'Picor tradicional de la casa', color: 'border-oro text-oro bg-oro/10', flames: 2 },
  { id: 'bravo', label: 'Bravo', desc: 'Sabor intenso para conocedores', color: 'border-coral text-coral bg-coral/10', flames: 3 },
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

    // Si la mesa ya está abierta, asociar en la base de datos de inmediato
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

  const [showTicketModal, setShowTicketModal] = useState(false)

  const handlePrintPrecuenta = () => {
    setShowTicketModal(true)
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
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4">
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

      <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/40 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 gold-border-corner shadow-2xl relative text-blanco flex flex-col gap-5">
        {/* Header Comanda */}
        <div className="flex items-start justify-between border-b border-arena/15 pb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="bg-turquesa/20 text-turquesa border border-turquesa/30 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                {mesa.nombre}
              </span>
              <span
                className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border uppercase ${
                  mesa.estado === 'libre'
                    ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30'
                    : mesa.estado === 'ocupada'
                    ? 'bg-coral/20 text-coral border-coral/30'
                    : 'bg-oro/20 text-oro border-oro/30'
                }`}
              >
                {mesa.estado === 'libre'
                  ? '🟢 LIBRE'
                  : mesa.estado === 'ocupada'
                  ? '🔴 OCUPADA / COMIENDO'
                  : '🟡 CUENTA PEDIDA'}
              </span>
            </div>

            <h3 className="font-display text-3xl text-blanco mt-1">
              COMANDERO DE SALÓN
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon border border-arena/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS DE CONTROL (Si está ocupada) */}
        {mesa.estado !== 'libre' && (
          <div className="grid grid-cols-3 gap-2 bg-carbon p-1.5 rounded-2xl border border-arena/15">
            <button
              onClick={() => setActiveTab('comanda')}
              className={`py-2 px-3 rounded-xl text-xs font-sans font-bold transition-all ${
                activeTab === 'comanda'
                  ? 'bg-turquesa text-negro shadow-md'
                  : 'text-arena/70 hover:text-blanco'
              }`}
            >
              📋 CUENTA (${subtotalActual.toFixed(0)})
            </button>
            <button
              onClick={() => setActiveTab('agregar_ronda')}
              className={`py-2 px-3 rounded-xl text-xs font-sans font-bold transition-all ${
                activeTab === 'agregar_ronda'
                  ? 'bg-coral text-blanco shadow-md'
                  : 'text-arena/70 hover:text-blanco'
              }`}
            >
              ➕ AGREGAR RONDA
            </button>
            <button
              onClick={() => setActiveTab('cobro')}
              className={`py-2 px-3 rounded-xl text-xs font-sans font-bold transition-all ${
                activeTab === 'cobro'
                  ? 'bg-oro text-negro shadow-md'
                  : 'text-arena/70 hover:text-blanco'
              }`}
            >
              💳 COBRAR Y LIBERAR
            </button>
          </div>
        )}

        {/* CASO 1: MESA LIBRE -> ABRIR COMANDA */}
        {mesa.estado === 'libre' && (
          <form onSubmit={handleAbrirMesaSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-sans text-arena uppercase font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-turquesa" />
                  <span>Nombre de Comensal / Identificador</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-xs font-sans font-bold text-oro hover:text-blanco bg-oro/10 hover:bg-oro/20 border border-oro/30 px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>📷 ESCANEAR QR SOCIO VIP</span>
                </button>
              </div>

              <input
                type="text"
                placeholder={`Ej. Familia Ramírez, Barra (${mesa.nombre})`}
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="bg-carbon border border-arena/20 rounded-xl px-4 py-2.5 text-sm text-blanco focus:border-turquesa focus:outline-none"
              />

              {clienteTelefono && (
                <div className="bg-turquesa/10 border border-turquesa/30 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs text-turquesa">
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
                    className="text-[10px] text-arena hover:text-coral font-bold"
                  >
                    Desvincular
                  </button>
                </div>
              )}
            </div>

            {/* Selector de Platillos para la Comanda Inicial */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-arena uppercase font-bold">
                  Seleccionar Platillos del Menú:
                </span>
                <span className="font-mono text-xs text-turquesa font-bold">
                  {selectedItems.length} platillos configurados
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-arena/50" />
                <input
                  type="text"
                  placeholder="Buscar platillo o bebida..."
                  value={dishQuery}
                  onChange={(e) => setDishQuery(e.target.value)}
                  className="bg-carbon border border-arena/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-blanco w-full focus:border-turquesa focus:outline-none"
                />
              </div>

              {/* Grid de platillos disponibles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {filteredDishes.map((platillo) => (
                  <div
                    key={platillo.id}
                    onClick={() => handleOpenConfig(platillo)}
                    className="bg-carbon border border-arena/15 hover:border-turquesa p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all group"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-bold text-xs text-blanco truncate group-hover:text-turquesa transition-colors">
                        {platillo.nombre}
                      </span>
                      <span className="font-display text-sm text-coral">
                        ${platillo.precio} MXN
                      </span>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 bg-turquesa/10 group-hover:bg-turquesa text-turquesa group-hover:text-negro rounded-lg border border-turquesa/30 transition-all shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Items Seleccionados para Abrir con Picor y Notas */}
              {selectedItems.length > 0 && (
                <div className="bg-[#111] border border-turquesa/30 rounded-2xl p-4 flex flex-col gap-2.5 shadow-inner">
                  <span className="text-[10px] font-sans font-bold text-turquesa uppercase tracking-wider">
                    Platillos y Especificaciones a marchar en cocina:
                  </span>
                  <div className="divide-y divide-arena/10 flex flex-col gap-2">
                    {selectedItems.map((item) => {
                      const picorInfo = PICOR_OPTIONS.find((p) => p.id === item.nivelPicor)
                      return (
                        <div key={item.id} className="pt-2 flex flex-col gap-1 text-xs">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="bg-turquesa/20 text-turquesa font-mono font-bold px-2 py-0.5 rounded-lg border border-turquesa/30">
                                x{item.cantidad}
                              </span>
                              <span className="text-blanco font-bold text-sm">
                                {item.platillo.nombre}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-display text-base text-coral font-bold">
                                ${(item.platillo.precio * item.cantidad).toFixed(0)}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSelectedQty(item.id, -1)}
                                  className="p-1 bg-carbon hover:bg-red-950 text-red-400 rounded"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSelectedQty(item.id, 1)}
                                  className="p-1 bg-carbon hover:bg-turquesa text-turquesa hover:text-negro rounded"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSelectedItem(item.id)}
                                  className="p-1 bg-carbon hover:bg-red-900 text-red-400 rounded ml-1"
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
                              <span className="text-[11px] font-serif italic text-arena/80 flex items-center gap-1 bg-carbon px-2 py-0.5 rounded border border-arena/15">
                                <FileText className="w-3 h-3 text-turquesa" />
                                <span>"{item.notasItem}"</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-arena/15 font-bold">
                    <span className="text-xs text-arena/70">TOTAL INICIAL:</span>
                    <span className="font-display text-2xl text-coral">
                      ${subtotalNuevaRonda.toFixed(2)} MXN
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedItems.length === 0}
              className="bg-coral text-blanco hover:bg-coral/80 font-sans font-bold text-xs tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>MARCHANDO COMANDA...</span>
                </>
              ) : (
                <>
                  <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
                  <span>ABRIR MESA Y ENVIAR A COCINA (${subtotalNuevaRonda.toFixed(0)})</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* CASO 2: TAB 'COMANDA' DE MESA OCUPADA */}
        {mesa.estado !== 'libre' && activeTab === 'comanda' && (
          <div className="flex flex-col gap-4">
            {/* Banner de Socio VIP en la mesa */}
            <div className="bg-carbon border border-arena/20 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-oro/10 text-oro rounded-xl border border-oro/30">
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-sans font-bold text-turquesa uppercase tracking-wider">
                    Socio VIP de la Mesa:
                  </span>
                  <span className="text-xs font-sans font-bold text-blanco">
                    {clienteTelefono
                      ? `${clienteNombre || 'Socio Club'} (+52 ${clienteTelefono})`
                      : 'Sin socio asignado'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="text-xs font-sans font-bold text-oro hover:text-blanco bg-oro/10 hover:bg-oro/20 border border-oro/30 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{clienteTelefono ? 'CAMBIAR' : 'ESCANEAR QR'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-arena/80">
                Detalle de Platillos Consumidos en {mesa.nombre}:
              </span>
              <span className="text-xs font-mono text-arena/60">
                {itemsActuales.length} partidas
              </span>
            </div>

            <div className="bg-[#111111] border border-arena/10 rounded-2xl overflow-hidden divide-y divide-arena/10">
              {itemsActuales.length > 0 ? (
                itemsActuales.map((item, i) => {
                  const picorInfo = PICOR_OPTIONS.find((p) => p.id === item.nivel_picor)
                  return (
                    <div key={i} className="p-3.5 flex flex-col gap-1.5 text-xs font-sans">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="bg-turquesa/20 text-turquesa font-mono font-bold px-2 py-0.5 rounded-lg border border-turquesa/30">
                            x{item.cantidad}
                          </span>
                          <span className="font-bold text-blanco text-sm">
                            {item.nombre_platillo}
                          </span>
                        </div>
                        <span className="font-display text-base text-coral font-bold">
                          ${((item.precio_unitario || 0) * item.cantidad).toFixed(2)}
                        </span>
                      </div>

                      {/* Badge de Picor y Especificación guardada */}
                      <div className="flex flex-wrap items-center gap-2 pl-8">
                        {item.nivel_picor && (
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${picorInfo?.color || 'text-arena'}`}>
                            {renderFlames(picorInfo?.flames || 0)}
                            <span>Picor: {picorInfo?.label || item.nivel_picor}</span>
                          </span>
                        )}

                        {item.notas_item && (
                          <span className="text-[11px] font-serif italic text-arena/80 flex items-center gap-1 bg-carbon px-2 py-0.5 rounded border border-arena/15">
                            <FileText className="w-3 h-3 text-turquesa" />
                            <span>Nota: "{item.notas_item}"</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-arena/50 p-4 italic text-center">
                  Sin platillos registrados en la comanda.
                </p>
              )}
            </div>

            {/* Total acumulado */}
            <div className="bg-carbon/80 border border-oro/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex flex-col">
                <span className="text-[10px] font-sans font-bold text-arena/60 uppercase">
                  SUBTOTAL ACUMULADO
                </span>
                <span className="font-display text-3xl text-oro">
                  ${subtotalActual.toFixed(2)} MXN
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPrecuenta}
                  className="bg-oro text-negro font-sans font-bold text-xs py-3 px-4 rounded-xl hover:bg-blanco transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>IMPRIMIR PRE-CUENTA</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-arena/10">
              <button
                type="button"
                onClick={() => cambiarEstadoMesa(mesa.id, mesa.estado === 'cuenta_pedida' ? 'ocupada' : 'cuenta_pedida')}
                className="flex-1 bg-carbon border border-arena/20 text-arena hover:text-blanco hover:border-oro py-3 px-3 rounded-xl text-xs font-sans font-bold transition-all"
              >
                {mesa.estado === 'cuenta_pedida' ? '↩️ MARCAR COMO COMIENDO' : '🟡 MARCAR: PIDIENDO CUENTA'}
              </button>
            </div>
          </div>
        )}

        {/* CASO 3: TAB 'AGREGAR RONDA' (Platillos extra a mesa ocupada con especificaciones) */}
        {mesa.estado !== 'libre' && activeTab === 'agregar_ronda' && (
          <form onSubmit={handleAgregarRondaSubmit} className="flex flex-col gap-4">
            <span className="text-xs font-sans text-arena uppercase font-bold">
              Marchar Ronda Extra a {mesa.nombre}:
            </span>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-arena/50" />
              <input
                type="text"
                placeholder="Buscar platillo o bebida extra..."
                value={dishQuery}
                onChange={(e) => setDishQuery(e.target.value)}
                className="bg-carbon border border-arena/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-blanco w-full focus:border-turquesa focus:outline-none"
              />
            </div>

            {/* Grid de selección para abrir modal de configuración */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {filteredDishes.map((platillo) => (
                <div
                  key={platillo.id}
                  onClick={() => handleOpenConfig(platillo)}
                  className="bg-carbon border border-arena/15 hover:border-coral p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-bold text-xs text-blanco truncate group-hover:text-coral transition-colors">
                      {platillo.nombre}
                    </span>
                    <span className="font-display text-sm text-coral">
                      ${platillo.precio} MXN
                    </span>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 bg-coral/10 group-hover:bg-coral text-coral group-hover:text-blanco rounded-lg border border-coral/30 transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {selectedItems.length > 0 && (
              <div className="bg-[#111] border border-coral/30 rounded-2xl p-4 flex flex-col gap-2.5">
                <span className="text-[10px] font-sans font-bold text-coral uppercase tracking-wider">
                  Nuevos items y especificaciones a marchar en esta ronda:
                </span>
                <div className="divide-y divide-arena/10 flex flex-col gap-2">
                  {selectedItems.map((item) => {
                    const picorInfo = PICOR_OPTIONS.find((p) => p.id === item.nivelPicor)
                    return (
                      <div key={item.id} className="pt-2 flex flex-col gap-1 text-xs">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="bg-coral/20 text-coral font-mono font-bold px-2 py-0.5 rounded-lg border border-coral/30">
                              x{item.cantidad}
                            </span>
                            <span className="text-blanco font-bold text-sm">
                              {item.platillo.nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-display text-base text-coral font-bold">
                              ${(item.platillo.precio * item.cantidad).toFixed(0)}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateSelectedQty(item.id, -1)}
                                className="p-1 bg-carbon hover:bg-red-950 text-red-400 rounded"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateSelectedQty(item.id, 1)}
                                className="p-1 bg-carbon hover:bg-coral text-coral hover:text-blanco rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSelectedItem(item.id)}
                                className="p-1 bg-carbon hover:bg-red-900 text-red-400 rounded ml-1"
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
                            <span className="text-[11px] font-serif italic text-arena/80 flex items-center gap-1 bg-carbon px-2 py-0.5 rounded border border-arena/15">
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
              <label className="text-xs font-sans text-arena uppercase">
                Instrucciones Generales de la Mesa / Notas de Ronda
              </label>
              <input
                type="text"
                placeholder="Ej. Llevar primero las bebidas, salsas extra..."
                value={notasRonda}
                onChange={(e) => setNotasRonda(e.target.value)}
                className="bg-carbon border border-arena/20 rounded-xl px-4 py-2.5 text-xs text-blanco focus:border-coral focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedItems.length === 0}
              className="bg-coral text-blanco hover:bg-coral/80 font-sans font-bold text-xs tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ENVIANDO RONDA...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>MARCHAR RONDA EXTRA (+${subtotalNuevaRonda.toFixed(0)})</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* CASO 4: TAB 'COBRAR Y LIBERAR' */}
        {mesa.estado !== 'libre' && activeTab === 'cobro' && (
          <form onSubmit={handleCobrarSubmit} className="flex flex-col gap-5">
            <div className="bg-carbon/80 border border-arena/20 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-arena/70">Subtotal de la mesa:</span>
                <span className="font-mono font-bold text-blanco">${subtotalActual.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="text-xs font-sans text-arena">Descuento aplicado ($):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={descuento}
                  onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                  className="bg-[#111] border border-arena/20 rounded-lg px-3 py-1.5 text-right text-sm font-mono text-coral w-32 focus:border-turquesa focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-arena/15 font-bold">
                <span className="text-sm text-blanco">TOTAL FINAL A COBRAR:</span>
                <span className="font-display text-2xl text-oro">
                  ${totalParaCobro.toFixed(2)} MXN
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-arena uppercase font-bold">
                Método de Pago Recibido
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'efectivo', label: '💵 EFECTIVO' },
                  { id: 'transferencia', label: '📱 SPEI / TRANSF' },
                  { id: 'oxxo', label: '🏪 TARJETA / OXXO' },
                ].map((mp) => (
                  <button
                    key={mp.id}
                    type="button"
                    onClick={() => setMetodoPago(mp.id as MetodoPago)}
                    className={`py-3 px-2 rounded-xl text-xs font-sans font-bold border transition-all ${
                      metodoPago === mp.id
                        ? 'bg-turquesa text-negro border-turquesa shadow-md'
                        : 'bg-carbon text-arena/70 border-arena/20 hover:border-turquesa'
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
              className="bg-emerald-600 hover:bg-emerald-500 text-blanco font-sans font-bold text-xs tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PROCESANDO COBRO...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>REGISTRAR COBRO Y LIBERAR {mesa.nombre.toUpperCase()}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* SUB-MODAL DE CONFIGURACIÓN INDIVIDUAL DE PLATILLO (PICOR, NOTAS, CANTIDAD) */}
      {configuringPlatillo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#080808] bg-dots-pattern border-2 border-oro/40 rounded-3xl w-full max-w-lg p-5 sm:p-6 gold-border-corner shadow-2xl relative text-blanco flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setConfiguringPlatillo(null)}
              className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon border border-arena/20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabecera del Platillo */}
            <div>
              <span className="text-[10px] font-sans font-bold tracking-widest text-turquesa uppercase block">
                ESPECIFICACIONES DE COMANDA
              </span>
              <h3 className="font-display text-2xl sm:text-3xl text-blanco mt-0.5">
                {configuringPlatillo.nombre}
              </h3>
              {configuringPlatillo.descripcion && (
                <p className="font-serif italic text-xs text-arena/70 mt-1 line-clamp-2">
                  {configuringPlatillo.descripcion}
                </p>
              )}
            </div>

            {/* Selector de Cantidad */}
            <div className="flex justify-between items-center bg-carbon p-3 rounded-2xl border border-arena/20">
              <span className="text-xs font-sans uppercase font-bold text-arena">Porciones:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfigQty(Math.max(1, configQty - 1))}
                  className="w-8 h-8 rounded-lg bg-[#181818] border border-arena/20 text-blanco flex items-center justify-center font-bold text-base hover:bg-coral transition-colors"
                >
                  -
                </button>
                <span className="font-display text-2xl px-2 text-oro">{configQty}</span>
                <button
                  type="button"
                  onClick={() => setConfigQty(configQty + 1)}
                  className="w-8 h-8 rounded-lg bg-turquesa text-negro flex items-center justify-center font-bold text-base hover:bg-blanco transition-colors"
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
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                      configPicor === picor.id
                        ? `${picor.color} shadow-md ring-2 ring-turquesa/50 font-bold`
                        : 'bg-carbon border-arena/20 text-arena/70 hover:border-turquesa/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{picor.label}</span>
                      {renderFlames(picor.flames)}
                    </div>
                    <span className="text-[10px] opacity-70 truncate font-serif italic">
                      {picor.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Especificaciones / Notas de Preparación */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-arena flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-turquesa" />
                <span>Notas de Preparación / Exclusiones</span>
              </label>
              <textarea
                rows={2}
                placeholder="Ej. Sin cebolla, limón extra, salsas aparte..."
                value={configNotas}
                onChange={(e) => setConfigNotas(e.target.value)}
                className="bg-carbon border border-arena/20 rounded-xl p-3 text-xs text-blanco focus:border-turquesa focus:outline-none"
              />
            </div>

            {/* Botón Confirmar */}
            <button
              type="button"
              onClick={handleConfirmConfig}
              className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(42,191,191,0.3)] mt-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                AGREGAR A LA COMANDA (${(configuringPlatillo.precio * configQty).toFixed(0)} MXN)
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
