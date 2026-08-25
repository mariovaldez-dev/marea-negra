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
            // QR detectado con éxito
            await handleQrFound(decodedText)
          },
          () => {
            // Frame sin QR (ignorar)
          }
        )
        isRunningRef.current = true
      } catch (err: any) {
        console.warn('Error al iniciar cámara:', err)
        setErrorMsg('No se pudo acceder a la cámara. Puedes usar la pestaña de Búsqueda Manual.')
        setIsScanning(false)
      }
    }

    // Delay breve para asegurar que el div del DOM esté montado
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
        setErrorMsg(res.error || 'Código no reconocido.')
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
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/40 rounded-3xl w-full max-w-lg p-6 gold-border-corner shadow-2xl relative text-blanco flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        <button
          onClick={() => {
            stopScanner()
            onClose()
          }}
          className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon border border-arena/20 z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div>
          <div className="flex items-center gap-2 text-turquesa font-mono text-xs uppercase tracking-widest font-bold">
            <Camera className="w-4 h-4" />
            <span>IDENTIFICACIÓN DE SOCIO</span>
          </div>
          <h2 className="font-display text-3xl text-blanco mt-1">
            ESCANEAR QR DE SOCIO
          </h2>
        </div>

        {/* SI AÚN NO HA ESCANEADO A UN CLIENTE */}
        {!cliente && (
          <div className="flex flex-col gap-4">
            {/* TABS: CÁMARA vs MANUAL */}
            <div className="grid grid-cols-2 gap-2 bg-carbon p-1.5 rounded-2xl border border-arena/15">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null)
                  setActiveTab('camara')
                }}
                className={`py-2 px-3 rounded-xl text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'camara'
                    ? 'bg-turquesa text-negro shadow-md'
                    : 'text-arena/70 hover:text-blanco'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>CÁMARA EN VIVO</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopScanner()
                  setErrorMsg(null)
                  setActiveTab('manual')
                }}
                className={`py-2 px-3 rounded-xl text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'manual'
                    ? 'bg-oro text-negro shadow-md'
                    : 'text-arena/70 hover:text-blanco'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>BÚSQUEDA MANUAL</span>
              </button>
            </div>

            {/* VISTA 1: CÁMARA EN VIVO */}
            {activeTab === 'camara' && (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-full aspect-square max-w-[300px] bg-black rounded-3xl overflow-hidden border-2 border-turquesa/40 shadow-inner flex items-center justify-center">
                  <div id="customer-qr-video-region" className="w-full h-full object-cover" />

                  {/* Marco decorativo de escaneo */}
                  <div className="absolute inset-8 border-2 border-turquesa rounded-2xl pointer-events-none opacity-60 animate-pulse" />

                  {loadingSearch && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-10">
                      <Loader2 className="w-8 h-8 text-turquesa animate-spin" />
                      <span className="text-xs font-sans font-bold text-blanco">
                        CONSULTANDO SOCIO...
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs font-serif italic text-arena/70 text-center">
                  Apunta la cámara al código QR de la tarjeta del cliente.
                </p>
              </div>
            )}

            {/* VISTA 2: BÚSQUEDA MANUAL */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSearch} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-arena uppercase font-bold">
                    Celular o N° de Socio del Cliente
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-arena/50" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. 6671234567 o MN-8492-VIP"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="bg-carbon border border-arena/20 rounded-xl pl-10 pr-4 py-3 text-base text-blanco w-full focus:border-oro focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingSearch}
                  className="bg-oro text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  {loadingSearch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>BUSCANDO...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>BUSCAR SOCIO CLUB</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {errorMsg && (
              <div className="bg-red-950/40 border border-red-800 text-red-300 text-xs p-3 rounded-xl text-center">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* CLIENTE DETECTADO Y RECONOCIDO CON ÉXITO */}
        {cliente && (
          <div className="flex flex-col gap-5 animate-in fade-in zoom-in duration-300">
            <div className="bg-[#111] border border-oro/40 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
              {/* Cabecera del socio */}
              <div className="flex items-start justify-between border-b border-arena/15 pb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-sans font-bold text-turquesa uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>SOCIO IDENTIFICADO</span>
                  </span>
                  <h3 className="font-display text-3xl text-blanco mt-0.5">
                    {cliente.nombreCliente}
                  </h3>
                  <span className="text-xs font-mono text-arena/70">
                    +52 {cliente.telefono} · Puntos: {cliente.puntos}
                  </span>
                </div>

                <div className="bg-carbon border border-oro/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-oro" />
                  <span className="text-xs font-display text-oro tracking-wider">
                    {cliente.nivelLealtad.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Sellos de Lealtad por Pedidos Reales */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-arena/80 uppercase">
                    Sellos Acumulados por Consumos:
                  </span>
                  <span className="font-mono text-oro font-bold">
                    {sellosActuales} / {pedidosReq} sellos ({cliente.pedidosEntregados} pedidos totales)
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-arena/10">
                  {Array.from({ length: pedidosReq }).map((_, idx) => {
                    const isChecked = idx < sellosActuales
                    return (
                      <div
                        key={idx}
                        className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs transition-all ${
                          isChecked
                            ? 'bg-coral text-blanco font-bold shadow-sm border border-oro'
                            : 'bg-carbon text-arena/30 border border-arena/10'
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
                <div className={`rounded-xl p-3.5 flex flex-col gap-2 text-xs border ${
                  cliente.canjesDisponibles > 0
                    ? 'bg-gradient-to-r from-oro/20 to-amber-500/15 border-oro shadow-[0_0_15px_rgba(201,168,76,0.2)]'
                    : 'bg-turquesa/10 border-turquesa/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className={`w-4 h-4 shrink-0 ${cliente.canjesDisponibles > 0 ? 'text-oro animate-bounce' : 'text-turquesa'}`} />
                      <span className="text-blanco font-bold text-sm">
                        {cliente.proximaRecompensa}
                      </span>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      cliente.canjesDisponibles > 0
                        ? 'bg-oro text-negro shadow-md'
                        : 'bg-turquesa/20 text-turquesa border border-turquesa/30'
                    }`}>
                      {cliente.canjesDisponibles > 0
                        ? `🎉 ¡${cliente.canjesDisponibles} LISTO PARA CANJE!`
                        : `Faltan ${cliente.pedidosFaltantesParaRecompensa} pedidos`}
                    </span>
                  </div>

                  {cliente.totalCanjesRealizados > 0 && (
                    <span className="text-[10px] font-sans text-arena/70 italic">
                      🏆 Historial: {cliente.totalCanjesRealizados} premio(s) entregado(s) a este socio.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mensajes de Confirmación */}
            {canjeSuccessMsg && (
              <div className="bg-emerald-950/60 border border-emerald-500 text-emerald-200 text-xs p-4 rounded-2xl flex items-center gap-3 shadow-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-bold">{canjeSuccessMsg}</span>
              </div>
            )}

            {puntosSuccess && (
              <div className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs p-3.5 rounded-xl flex items-center gap-2 shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>¡Puntos bonificados exitosamente para {cliente.nombreCliente}!</span>
              </div>
            )}

            {/* ACCIONES DE CAJA / SALÓN */}
            <div className="flex flex-col gap-2.5">
              {/* BOTÓN DE CANJE DIRECTO SI TIENE PREMIOS DISPONIBLES */}
              {cliente.canjesDisponibles > 0 && (
                <button
                  type="button"
                  onClick={handleCanjearRecompensa}
                  disabled={isCanjeando}
                  className="w-full bg-gradient-to-r from-oro via-amber-400 to-yellow-500 text-negro hover:brightness-110 font-sans font-bold text-xs tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(201,168,76,0.4)]"
                >
                  {isCanjeando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>PROCESANDO CANJE...</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 stroke-[2.5]" />
                      <span>🎁 CANJEAR: {(cliente.proximaRecompensa || 'PLATILLO GRATIS').toUpperCase()}</span>
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
                  className="w-full bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>✓ ASOCIAR CLIENTE A ESTA VENTA / MESA</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleBonificarPuntos}
                disabled={isAddingPuntos}
                className="w-full bg-carbon border border-arena/20 hover:border-oro text-arena hover:text-blanco font-sans font-bold text-xs tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {isAddingPuntos ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>BONIFICANDO...</span>
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 text-oro" />
                    <span>⭐ BONIFICAR +10 PUNTOS DE LEALTAD</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleScanAnother}
                className="w-full bg-carbon border border-arena/20 hover:border-turquesa text-arena hover:text-blanco font-sans font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ESCANEAR OTRO CLIENTE</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
