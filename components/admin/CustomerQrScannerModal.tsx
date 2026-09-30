'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { ClientePerfilStats } from '@/lib/actions/clienteCuenta'
import { getClienteFromQrCode, bonificarPuntosSocio, canjearPremioLealtad } from '@/lib/actions/loyaltyScanner'
import {
  X,
  Camera,
  Search,
  CheckCircle2,
  Award,
  Sparkles,
  Gift,
  Plus,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Phone,
  Crown,
  Flame,
  Star,
  UserCheck,
  Check,
} from 'lucide-react'

interface CustomerQrScannerModalProps {
  onClose: () => void
  onCustomerSelected?: (cliente: ClientePerfilStats) => void
}

export function CustomerQrScannerModal({
  onClose,
  onCustomerSelected,
}: CustomerQrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camara' | 'manual'>('camara')
  const [manualInput, setManualInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [cliente, setCliente] = useState<ClientePerfilStats | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isAddingPuntos, setIsAddingPuntos] = useState(false)
  const [puntosSuccess, setPuntosSuccess] = useState(false)
  const [isCanjeando, setIsCanjeando] = useState(false)
  const [canjeSuccessMsg, setCanjeSuccessMsg] = useState<string | null>(null)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isRunningRef = useRef(false)

  // Iniciar lector de cámara
  useEffect(() => {
    if (activeTab !== 'camara' || cliente) return

    const qrRegionId = 'customer-qr-video-region'

    const startScanner = async () => {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(qrRegionId)
        }

        if (isRunningRef.current) return

        setIsScanning(true)
        setErrorMsg(null)

        await scannerRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            await handleQrFound(decodedText)
          },
          () => {}
        )
        isRunningRef.current = true
      } catch (err: any) {
        console.warn('Error al iniciar cámara:', err)
        setErrorMsg('No se pudo acceder a la cámara. Puedes usar la pestaña de Búsqueda Manual.')
        setIsScanning(false)
      }
    }

    const timeout = setTimeout(() => {
      startScanner()
    }, 200)

    return () => {
      clearTimeout(timeout)
      stopScanner()
    }
  }, [activeTab, cliente])

  const stopScanner = async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop()
        isRunningRef.current = false
      } catch (err) {
        console.warn('Error al detener cámara:', err)
      }
    }
    setIsScanning(false)
  }

  const handleQrFound = async (qrData: string) => {
    await stopScanner()
    setLoadingSearch(true)
    setErrorMsg(null)

    try {
      const res = await getClienteFromQrCode(qrData)
      if (res.success && res.cliente) {
        setCliente(res.cliente)
        if (onCustomerSelected) onCustomerSelected(res.cliente)
      } else {
        setErrorMsg(res.error || 'Código QR no reconocido.')
      }
    } catch (err: any) {
      setErrorMsg('Error al consultar datos del socio.')
    } finally {
      setLoadingSearch(false)
    }
  }

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualInput.trim()) return

    setLoadingSearch(true)
    setErrorMsg(null)

    try {
      const res = await getClienteFromQrCode(manualInput.trim())
      if (res.success && res.cliente) {
        setCliente(res.cliente)
        if (onCustomerSelected) onCustomerSelected(res.cliente)
      } else {
        setErrorMsg(res.error || 'Cliente no encontrado.')
      }
    } catch (err: any) {
      setErrorMsg('Error al buscar cliente.')
    } finally {
      setLoadingSearch(false)
    }
  }

  // Bonificar puntos de lealtad sin crear pedidos falsos
  const handleBonificarPuntos = async () => {
    if (!cliente) return
    setIsAddingPuntos(true)
    setPuntosSuccess(false)

    try {
      const res = await bonificarPuntosSocio(cliente.telefono, 10)
      if (res.success) {
        setPuntosSuccess(true)
        const refreshed = await getClienteFromQrCode(cliente.telefono)
        if (refreshed.cliente) {
          setCliente(refreshed.cliente)
        }
      } else {
        alert(res.error || 'Error al bonificar puntos.')
      }
    } catch (err) {
      alert('Error de conexión al bonificar puntos.')
    } finally {
      setIsAddingPuntos(false)
    }
  }

  // Canjear recompensa de platillo gratis
  const handleCanjearRecompensa = async () => {
    if (!cliente || !cliente.proximaRecompensa) return
    const confirmed = window.confirm(
      `¿Deseas confirmar la entrega del premio "${cliente.proximaRecompensa}" a ${cliente.nombreCliente}?`
    )
    if (!confirmed) return

    setIsCanjeando(true)
    setCanjeSuccessMsg(null)

    try {
      const res = await canjearPremioLealtad({
        telefono: cliente.telefono,
        nombreCliente: cliente.nombreCliente,
        recompensa: cliente.proximaRecompensa,
      })

      if (res.success) {
        setCanjeSuccessMsg(res.mensaje || '¡Premio canjeado con éxito!')
        const refreshed = await getClienteFromQrCode(cliente.telefono)
        if (refreshed.cliente) {
          setCliente(refreshed.cliente)
        }
      } else {
        alert(res.error || 'Error al procesar el canje.')
      }
    } catch (err) {
      alert('Error de conexión al canjear premio.')
    } finally {
      setIsCanjeando(false)
    }
  }

  const handleScanAnother = () => {
    setCliente(null)
    setPuntosSuccess(false)
    setCanjeSuccessMsg(null)
    setErrorMsg(null)
    setManualInput('')
    setActiveTab('camara')
  }

  const pedidosReq = cliente?.lealtadConfig?.meta1_pedidos || 6
  const sellosActuales = cliente ? (cliente.pedidosEntregados || 0) % pedidosReq : 0

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-[32px] w-full max-w-lg p-6 sm:p-7 shadow-2xl relative text-negro dark:text-blanco flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={() => {
            stopScanner()
            onClose()
          }}
          className="absolute top-5 right-5 p-2 text-negro/40 dark:text-arena/50 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div>
          <div className="flex items-center gap-1.5 text-turquesa font-mono text-[10px] uppercase tracking-wider font-bold">
            <Camera className="w-3.5 h-3.5" />
            <span>Identificación de Socio</span>
          </div>
          <h2 className="font-sans font-black text-2xl text-negro dark:text-blanco tracking-tight mt-0.5">
            Escanear QR de Socio
          </h2>
        </div>

        {/* SI AÚN NO HA ESCANEADO A UN CLIENTE */}
        {!cliente && (
          <div className="flex flex-col gap-4">
            {/* TABS: CÁMARA vs MANUAL */}
            <div className="grid grid-cols-2 gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null)
                  setActiveTab('camara')
                }}
                className={`py-2 px-3 rounded-full text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'camara'
                    ? 'bg-white dark:bg-[#222222] text-negro dark:text-blanco shadow-sm'
                    : 'text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-turquesa" />
                <span>Cámara en Vivo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopScanner()
                  setErrorMsg(null)
                  setActiveTab('manual')
                }}
                className={`py-2 px-3 rounded-full text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-white dark:bg-[#222222] text-negro dark:text-blanco shadow-sm'
                    : 'text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-oro" />
                <span>Búsqueda Manual</span>
              </button>
            </div>

            {/* VISTA 1: CÁMARA EN VIVO */}
            {activeTab === 'camara' && (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-full aspect-square max-w-[280px] bg-black rounded-3xl overflow-hidden border-2 border-turquesa/40 shadow-inner flex items-center justify-center">
                  <div id="customer-qr-video-region" className="w-full h-full object-cover" />

                  {/* Marco decorativo de escaneo */}
                  <div className="absolute inset-8 border-2 border-turquesa rounded-2xl pointer-events-none opacity-60 animate-pulse" />

                  {loadingSearch && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-10">
                      <Loader2 className="w-8 h-8 text-turquesa animate-spin" />
                      <span className="text-xs font-sans font-bold text-white">
                        Consultando socio...
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-negro/50 dark:text-arena/60 text-center">
                  Apunta la cámara al código QR del cliente para identificarlo.
                </p>
              </div>
            )}

            {/* VISTA 2: BÚSQUEDA MANUAL */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSearch} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-negro/70 dark:text-arena/70 font-bold">
                    Celular o N° de Socio del Cliente
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-negro/40 dark:text-arena/50" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. 6671234567 o MN-VIP-001"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-negro dark:text-blanco w-full focus:outline-none focus:ring-2 focus:ring-turquesa font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingSearch}
                  className="bg-coral hover:bg-coral/90 text-white font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
                >
                  {loadingSearch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Buscar Socio Club</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs p-3.5 rounded-2xl text-center">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* CLIENTE DETECTADO Y RECONOCIDO CON ÉXITO */}
        {cliente && (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
              {/* Cabecera del socio */}
              <div className="flex items-start justify-between border-b border-black/5 dark:border-white/5 pb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold text-turquesa uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Socio Identificado</span>
                  </span>
                  <h3 className="font-sans font-black text-2xl text-negro dark:text-blanco mt-0.5">
                    {cliente.nombreCliente}
                  </h3>
                  <span className="text-xs font-mono text-negro/50 dark:text-arena/60">
                    +52 {cliente.telefono} · Puntos: {cliente.puntos}
                  </span>
                </div>

                <div className="bg-[#ECC94B] text-[#3A2D00] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <Award className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-black tracking-wider uppercase">
                    {cliente.nivelLealtad}
                  </span>
                </div>
              </div>

              {/* Sellos de Lealtad por Pedidos Reales */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-negro/70 dark:text-arena/80">
                    Sellos Acumulados por Consumo:
                  </span>
                  <span className="font-mono text-coral font-bold">
                    {sellosActuales} / {pedidosReq} sellos ({cliente.pedidosEntregados} pedidos)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-black/[0.03] dark:bg-white/[0.03] p-2 rounded-2xl border border-black/5 dark:border-white/5">
                  {Array.from({ length: pedidosReq }).map((_, idx) => {
                    const isChecked = idx < sellosActuales
                    return (
                      <div
                        key={idx}
                        className={`flex-1 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-all ${
                          isChecked
                            ? 'bg-coral text-white shadow-sm'
                            : 'bg-black/5 dark:bg-white/5 text-negro/30 dark:text-arena/30'
                        }`}
                      >
                        {isChecked ? '🦐' : idx + 1}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recompensa y Canjes Disponibles */}
              {cliente.proximaRecompensa && (
                <div className={`rounded-2xl p-3.5 flex flex-col gap-2 text-xs border ${
                  cliente.canjesDisponibles > 0
                    ? 'bg-[#ECC94B]/15 border-[#ECC94B]/30'
                    : 'bg-turquesa/10 border-turquesa/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className={`w-4 h-4 shrink-0 ${cliente.canjesDisponibles > 0 ? 'text-[#8B6E00] dark:text-[#ECC94B] animate-bounce' : 'text-turquesa'}`} />
                      <span className="text-negro dark:text-blanco font-bold text-xs sm:text-sm">
                        {cliente.proximaRecompensa}
                      </span>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase shadow-sm ${
                      cliente.canjesDisponibles > 0
                        ? 'bg-[#ECC94B] text-[#3A2D00]'
                        : 'bg-turquesa text-negro'
                    }`}>
                      {cliente.canjesDisponibles > 0
                        ? `🎉 ¡${cliente.canjesDisponibles} Listo para canje!`
                        : `Faltan ${cliente.pedidosFaltantesParaRecompensa} pedidos`}
                    </span>
                  </div>

                  {cliente.totalCanjesRealizados > 0 && (
                    <span className="text-[10px] text-negro/50 dark:text-arena/60 italic">
                      🏆 Historial: {cliente.totalCanjesRealizados} premio(s) entregado(s).
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mensajes de Confirmación */}
            {canjeSuccessMsg && (
              <div className="bg-[#16A34B]/10 border border-[#16A34B]/30 text-[#16A34B] text-xs p-3.5 rounded-2xl flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-bold">{canjeSuccessMsg}</span>
              </div>
            )}

            {puntosSuccess && (
              <div className="bg-[#16A34B]/10 border border-[#16A34B]/30 text-[#16A34B] text-xs p-3.5 rounded-2xl flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>¡Puntos bonificados con éxito para {cliente.nombreCliente}!</span>
              </div>
            )}

            {/* ACCIONES DE CAJA / SALÓN */}
            <div className="flex flex-col gap-2 pt-1">
              {cliente.canjesDisponibles > 0 && (
                <button
                  type="button"
                  onClick={handleCanjearRecompensa}
                  disabled={isCanjeando}
                  className="w-full bg-[#ECC94B] hover:bg-[#ECC94B]/90 text-[#3A2D00] font-sans font-bold text-xs tracking-wider py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
                >
                  {isCanjeando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando canje...</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 stroke-[2.5]" />
                      <span>🎁 Canjear: {(cliente.proximaRecompensa || 'Platillo Gratis').toUpperCase()}</span>
                    </>
                  )}
                </button>
              )}

              {onCustomerSelected && (
                <button
                  type="button"
                  onClick={() => {
                    onCustomerSelected(cliente)
                    onClose()
                  }}
                  className="w-full bg-[#16A34B] hover:bg-[#16A34B]/90 text-white font-sans font-bold text-xs tracking-wider py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Asociar Cliente a esta Venta / Mesa</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleBonificarPuntos}
                disabled={isAddingPuntos}
                className="w-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-negro dark:text-blanco font-sans font-bold text-xs tracking-wider py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {isAddingPuntos ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Bonificando...</span>
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 text-oro" />
                    <span>⭐ Bonificar +10 Puntos de Lealtad</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleScanAnother}
                className="w-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-negro/60 dark:text-arena/60 font-sans font-bold text-xs py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Escanear Otro Cliente</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
