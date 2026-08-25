'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { CierreCaja, Pedido, GastoCaja, CategoriaGasto, DesgloseBilletes } from '@/lib/types/database'
import { LuxuryCard } from '@/components/ui/LuxuryCard'
import { ListRow } from '@/components/ui/ListRow'
import { CustomerQrScannerModal } from '@/components/admin/CustomerQrScannerModal'
import { guardarCierreCaja } from '@/lib/actions/caja'
import { registrarGastoCaja, eliminarGastoCaja } from '@/lib/actions/gastosCaja'
import { generateWhatsAppMessageUrl } from '@/lib/utils/whatsapp'
import { getMazatlanDateString, formatMazatlanDate } from '@/lib/utils/date'
import {
  Banknote,
  Building2,
  Store,
  Calculator,
  CheckCircle2,
  History,
  Loader2,
  MessageCircle,
  Calendar,
  Sparkles,
  Edit3,
  Plus,
  Trash2,
  Printer,
  X,
  Coins,
  Receipt,
  TrendingDown,
  Wallet,
  Camera,
} from 'lucide-react'

interface CajaManagerProps {
  pedidosEntregados: Pedido[]
  historialCierres: CierreCaja[]
  initialGastos: GastoCaja[]
  fechaHoy: string
}

export function CajaManager({
  pedidosEntregados,
  historialCierres,
  initialGastos,
  fechaHoy,
}: CajaManagerProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(fechaHoy)
  const [cierres, setCierres] = useState<CierreCaja[]>(historialCierres)
  const [gastos, setGastos] = useState<GastoCaja[]>(initialGastos)
  const [isSaving, setIsSaving] = useState(false)

  // Modales
  const [showGastoModal, setShowGastoModal] = useState(false)
  const [showDenomModal, setShowDenomModal] = useState(false)
  const [showQrScanner, setShowQrScanner] = useState(false)

  // Formulario de Gasto Rápido
  const [gastoConcepto, setGastoConcepto] = useState('')
  const [gastoCategoria, setGastoCategoria] = useState<CategoriaGasto>('insumos_urgentes')
  const [gastoMonto, setGastoMonto] = useState<string | number>('')
  const [gastoMetodo, setGastoMetodo] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [isSavingGasto, setIsSavingGasto] = useState(false)

  // Desglose de Billetes y Monedas
  const [denominaciones, setDenominaciones] = useState<DesgloseBilletes>({
    b1000: 0,
    b500: 0,
    b200: 0,
    b100: 0,
    b50: 0,
    b20: 0,
    m20: 0,
    m10: 0,
    m5: 0,
    m2: 0,
    m1: 0,
    m050: 0,
  })

  // Fecha de ayer
  const fechaAyer = useMemo(() => {
    try {
      const [y, m, d] = fechaHoy.split('-').map(Number)
      const ayer = new Date(Date.UTC(y, m - 1, d - 1))
      return ayer.toISOString().slice(0, 10)
    } catch {
      return ''
    }
  }, [fechaHoy])

  // Pedidos de la fecha seleccionada
  const pedidosDeLaFecha = useMemo(() => {
    return pedidosEntregados.filter(
      (p) => p.created_at && getMazatlanDateString(p.created_at) === fechaSeleccionada
    )
  }, [pedidosEntregados, fechaSeleccionada])

  // Gastos de la fecha seleccionada
  const gastosDeLaFecha = useMemo(() => {
    return gastos.filter((g) => g.fecha === fechaSeleccionada)
  }, [gastos, fechaSeleccionada])

  const totalGastosEfectivo = useMemo(() => {
    return gastosDeLaFecha
      .filter((g) => g.metodo_pago === 'efectivo')
      .reduce((acc, g) => acc + Number(g.monto || 0), 0)
  }, [gastosDeLaFecha])

  const totalGastosTodos = useMemo(() => {
    return gastosDeLaFecha.reduce((acc, g) => acc + Number(g.monto || 0), 0)
  }, [gastosDeLaFecha])

  // Totales de ventas del sistema
  const { totalSistemaEntregado, sugeridoPorMetodo } = useMemo(() => {
    let total = 0
    const metodos = { efectivo: 0, transferencia: 0, oxxo: 0 }

    pedidosDeLaFecha.forEach((p) => {
      const monto = p.total || 0
      total += monto
      if (p.metodo_pago === 'efectivo') metodos.efectivo += monto
      else if (p.metodo_pago === 'transferencia') metodos.transferencia += monto
      else if (p.metodo_pago === 'oxxo') metodos.oxxo += monto
      else metodos.efectivo += monto
    })

    return { totalSistemaEntregado: total, sugeridoPorMetodo: metodos }
  }, [pedidosDeLaFecha])

  // Cierre existente
  const cierreExistente = useMemo(() => {
    return cierres.find((c) => c.fecha === fechaSeleccionada)
  }, [cierres, fechaSeleccionada])

  // Estados del arqueo
  const [fondoInicial, setFondoInicial] = useState<string | number>(0)
  const [efectivo, setEfectivo] = useState<string | number>('')
  const [transferencia, setTransferencia] = useState<string | number>('')
  const [oxxo, setOxxo] = useState<string | number>('')
  const [notas, setNotas] = useState('')

  // Sincronizar formulario
  useEffect(() => {
    if (cierreExistente) {
      setFondoInicial(cierreExistente.fondo_inicial || 0)
      setEfectivo(cierreExistente.total_efectivo)
      setTransferencia(cierreExistente.total_transferencia)
      setOxxo(cierreExistente.total_oxxo)
      setNotas(cierreExistente.notas || '')
      if (cierreExistente.desglose_billetes) {
        setDenominaciones(cierreExistente.desglose_billetes)
      }
    } else {
      setFondoInicial(0)
      setEfectivo(sugeridoPorMetodo.efectivo || 0)
      setTransferencia(sugeridoPorMetodo.transferencia || 0)
      setOxxo(sugeridoPorMetodo.oxxo || 0)
      setNotas('')
      setDenominaciones({
        b1000: 0,
        b500: 0,
        b200: 0,
        b100: 0,
        b50: 0,
        b20: 0,
        m20: 0,
        m10: 0,
        m5: 0,
        m2: 0,
        m1: 0,
        m050: 0,
      })
    }
  }, [fechaSeleccionada, cierreExistente, sugeridoPorMetodo])

  const numFondo = Number(fondoInicial) || 0
  const numEfectivo = Number(efectivo) || 0
  const numTransferencia = Number(transferencia) || 0
  const numOxxo = Number(oxxo) || 0

  // Total físico contado
  const totalReal = numEfectivo + numTransferencia + numOxxo

  // Efectivo esperado en caja = Fondo Inicial + Ventas Efectivo - Gastos en Efectivo
  const efectivoEsperado = numFondo + sugeridoPorMetodo.efectivo - totalGastosEfectivo

  // Diferencia de arqueo
  const diferenciaEfectivo = numEfectivo - efectivoEsperado
  const diferenciaTotal = totalReal - (totalSistemaEntregado + numFondo - totalGastosTodos)

  // Guardar Cierre
  const handleSaveCierre = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await guardarCierreCaja({
        fecha: fechaSeleccionada,
        total_efectivo: numEfectivo,
        total_transferencia: numTransferencia,
        total_oxxo: numOxxo,
        fondo_inicial: numFondo,
        total_gastos: totalGastosTodos,
        desglose_billetes: denominaciones,
        total_sistema: totalSistemaEntregado,
        total_real: totalReal,
        diferencia: diferenciaTotal,
        notas,
      })

      if (res.data) {
        setCierres((prev) => {
          const idx = prev.findIndex((c) => c.fecha === fechaSeleccionada)
          if (idx >= 0) {
            const copy = [...prev]
            copy[idx] = res.data
            return copy
          }
          return [res.data, ...prev].sort((a, b) => b.fecha.localeCompare(a.fecha))
        })
      }

      alert(`¡Cierre de caja para el día ${fechaSeleccionada} guardado exitosamente!`)
    } catch (err) {
      console.error('Error al guardar cierre:', err)
      alert('Error al guardar el cierre de caja.')
    } finally {
      setIsSaving(false)
    }
  }

  // Registrar Gasto Rápido
  const handleCreateGastoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numMonto = Number(gastoMonto)
    if (!gastoConcepto.trim() || isNaN(numMonto) || numMonto <= 0) {
      alert('Ingresa un concepto y un monto válido.')
      return
    }

    setIsSavingGasto(true)
    try {
      const res = await registrarGastoCaja({
        fecha: fechaSeleccionada,
        concepto: gastoConcepto.trim(),
        categoria: gastoCategoria,
        monto: numMonto,
        metodo_pago: gastoMetodo,
      })

      if (res.data) {
        setGastos((prev) => [res.data, ...prev])
        setGastoConcepto('')
        setGastoMonto('')
        setShowGastoModal(false)
      }
    } catch (err) {
      console.error('Error al registrar gasto:', err)
      alert('Ocurrió un error al registrar el gasto.')
    } finally {
      setIsSavingGasto(false)
    }
  }

  const handleDeleteGasto = async (id: number) => {
    if (!confirm('¿Eliminar este gasto registrado?')) return
    try {
      await eliminarGastoCaja(id)
      setGastos((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      console.error('Error al eliminar gasto:', err)
    }
  }

  // Calcular suma de la calculadora de denominaciones
  const totalCalculadora = useMemo(() => {
    const d = denominaciones
    return (
      (d.b1000 || 0) * 1000 +
      (d.b500 || 0) * 500 +
      (d.b200 || 0) * 200 +
      (d.b100 || 0) * 100 +
      (d.b50 || 0) * 50 +
      (d.b20 || 0) * 20 +
      (d.m20 || 0) * 20 +
      (d.m10 || 0) * 10 +
      (d.m5 || 0) * 5 +
      (d.m2 || 0) * 2 +
      (d.m1 || 0) * 1 +
      (d.m050 || 0) * 0.5
    )
  }, [denominaciones])

  const handleApplyCalculadora = () => {
    setEfectivo(totalCalculadora)
    setShowDenomModal(false)
  }

  const handleExportWhatsApp = () => {
    const text = `Cierre Marea Negra [${fechaSeleccionada}]\nFondo Inicial: $${numFondo.toFixed(0)}\nVentas Efectivo: $${numEfectivo.toFixed(0)}\nTransferencias: $${numTransferencia.toFixed(0)}\nOXXO: $${numOxxo.toFixed(0)}\nGastos Turno: -$${totalGastosTodos.toFixed(0)}\nTotal Físico: $${totalReal.toFixed(0)}\nTotal Sistema: $${totalSistemaEntregado.toFixed(0)}\nDiferencia: $${diferenciaTotal.toFixed(0)}\n${notas ? `Notas: ${notas}` : ''}`
    const url = generateWhatsAppMessageUrl(text)
    window.open(url, '_blank')
  }

  const handlePrintCierre = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Estilos para impresión de comprobante de cierre */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-cierre-ticket, #thermal-cierre-ticket * {
            visibility: visible !important;
          }
          #thermal-cierre-ticket {
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
      <div id="thermal-cierre-ticket" className="hidden print:block bg-white text-black p-5 font-mono text-xs">
        <div className="text-center font-bold text-base border-b border-black/30 pb-2">
          MAREA NEGRA
          <div className="text-[10px] font-normal">CORTE Z - CIERRE DE CAJA</div>
        </div>
        <div className="py-2 border-b border-black/20 text-[11px]">
          <div>FECHA: {fechaSeleccionada}</div>
          <div>HORA: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div className="py-2 border-b border-black/20 flex flex-col gap-1 text-[11px]">
          <div className="flex justify-between"><span>Fondo Inicial:</span><span>${numFondo.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Ventas Efectivo:</span><span>${sugeridoPorMetodo.efectivo.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Transferencias:</span><span>${sugeridoPorMetodo.transferencia.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>OXXO / Tarjetas:</span><span>${sugeridoPorMetodo.oxxo.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold"><span>Total Sistema:</span><span>${totalSistemaEntregado.toFixed(2)}</span></div>
          <div className="flex justify-between text-red-600"><span>Gastos Turno:</span><span>-${totalGastosTodos.toFixed(2)}</span></div>
        </div>
        <div className="py-2 border-b border-black/20 flex flex-col gap-1 text-[11px]">
          <div className="flex justify-between font-bold"><span>Efectivo Físico:</span><span>${numEfectivo.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold"><span>Diferencia:</span><span>${diferenciaTotal >= 0 ? '+' : ''}${diferenciaTotal.toFixed(2)}</span></div>
        </div>
        {notas && <div className="py-2 text-[10px] italic">Notas: {notas}</div>}
        <div className="text-center text-[9px] pt-3 text-black/60">*** CORTE CONCILIADO ***</div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/20 dark:border-arena/10 pb-4">
        <div>
          <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase">
            ARQUEO & CAJA CHICA
          </span>
          <h1 className="font-display text-4xl text-negro dark:text-blanco tracking-wide">
            CIERRE Y ARQUEO DE CAJA
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowQrScanner(true)}
            className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs px-5 py-3 rounded-full shadow-[0_0_20px_rgba(42,191,191,0.3)] transition-all flex items-center gap-2"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>📷 ESCANEAR SOCIO</span>
          </button>

          <button
            type="button"
            onClick={handlePrintCierre}
            className="bg-oro text-negro hover:bg-blanco font-sans font-bold text-xs px-5 py-3 rounded-full shadow-lg transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>IMPRIMIR CORTE (80MM)</span>
          </button>

          <button
            onClick={handleExportWhatsApp}
            className="bg-white text-negro border border-arena/30 hover:border-turquesa dark:bg-carbon dark:border-arena/20 dark:text-blanco font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-full transition-all flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-turquesa" />
            <span>WHATSAPP</span>
          </button>
        </div>
      </div>

      {/* SELECTOR DE FECHA INTERACTIVO */}
      <div className="bg-white dark:bg-[#050404] bg-dots-pattern border-2 border-oro/30 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl gold-border-corner">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-oro" />
          <div className="flex flex-col">
            <span className="text-[10px] font-sans font-bold text-negro/60 dark:text-arena/60 uppercase tracking-widest">
              FECHA DE LA JORNADA A CONCILIAR:
            </span>
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl text-negro dark:text-blanco tracking-wide">
                {fechaSeleccionada === fechaHoy
                  ? `HOY (${fechaSeleccionada})`
                  : fechaSeleccionada === fechaAyer
                  ? `AYER (${fechaSeleccionada})`
                  : fechaSeleccionada}
              </span>
              {cierreExistente ? (
                <span className="bg-oro/20 text-oro border border-oro/30 text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Edit3 className="w-3 h-3" />
                  <span>REGISTRADO</span>
                </span>
              ) : (
                <span className="bg-turquesa/20 text-turquesa border border-turquesa/30 text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>NUEVO CIERRE</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFechaSeleccionada(fechaHoy)}
            className={`px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all border ${
              fechaSeleccionada === fechaHoy
                ? 'bg-turquesa text-negro border-turquesa shadow-md'
                : 'bg-[#F4F0E8] text-negro/80 border-arena/30 dark:bg-carbon dark:text-arena/70 dark:border-arena/20 hover:border-turquesa'
            }`}
          >
            📅 HOY
          </button>

          {fechaAyer && (
            <button
              type="button"
              onClick={() => setFechaSeleccionada(fechaAyer)}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all border ${
                fechaSeleccionada === fechaAyer
                  ? 'bg-oro text-negro border-oro shadow-md'
                  : 'bg-carbon text-arena/70 border-arena/20 hover:border-oro'
              }`}
            >
              ⬅️ AYER
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-carbon border border-arena/20 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-[10px] text-arena/50 uppercase font-bold">OTRA FECHA:</span>
            <input
              type="date"
              max={fechaHoy}
              value={fechaSeleccionada}
              onChange={(e) => {
                if (e.target.value) setFechaSeleccionada(e.target.value)
              }}
              className="bg-transparent text-blanco font-mono focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* LUXURY CARDS (PATRÓN 4) PARA TOTALES Y DESFASES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <LuxuryCard
          eyebrow="FONDO & ENTRADAS"
          title="Fondo Inicial"
          value={`$${numFondo.toFixed(0)}`}
          subtitle="Cambio base para apertura"
          icon={<Wallet className="w-5 h-5 text-oro" />}
        />

        <LuxuryCard
          eyebrow="VENTAS TOTALES"
          title="Sistema Registró"
          value={`$${totalSistemaEntregado.toFixed(0)}`}
          subtitle={`${pedidosDeLaFecha.length} pedidos entregados`}
          icon={<Building2 className="w-5 h-5 text-oro" />}
        />

        <LuxuryCard
          eyebrow="CAJA CHICA"
          title="Gastos del Turno"
          value={`-$${totalGastosTodos.toFixed(0)}`}
          subtitle={`${gastosDeLaFecha.length} salidas registradas`}
          icon={<TrendingDown className="w-5 h-5 text-coral" />}
        />

        <LuxuryCard
          eyebrow="ARQUEO FINAL"
          title="Diferencia Total"
          value={`${diferenciaTotal >= 0 ? '+' : ''}$${diferenciaTotal.toFixed(0)}`}
          subtitle={`Efectivo contado: $${numEfectivo.toFixed(0)}`}
          icon={<Calculator className="w-5 h-5 text-oro" />}
        />
      </div>

      {/* SECCIÓN 1: GASTOS DEL TURNO / CAJA CHICA */}
      <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-arena/20 rounded-2xl p-6 gold-border-corner shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-arena/20 dark:border-arena/10 pb-4 mb-4">
          <div>
            <span className="text-xs font-sans text-coral font-bold uppercase tracking-wider">
              EGRESOS Y COMPRAS DEL DÍA
            </span>
            <h3 className="font-display text-2xl text-negro dark:text-blanco">
              GASTOS DEL TURNO / CAJA CHICA (${totalGastosTodos.toFixed(0)})
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowGastoModal(true)}
            className="bg-coral text-blanco hover:bg-coral/80 font-sans font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>➕ REGISTRAR GASTO</span>
          </button>
        </div>

        {gastosDeLaFecha.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {gastosDeLaFecha.map((gasto) => (
              <div
                key={gasto.id}
                className="bg-[#F4F0E8] dark:bg-carbon/80 border border-arena/30 dark:border-arena/15 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-negro dark:text-blanco text-sm truncate">
                    {gasto.concepto}
                  </span>
                  <div className="flex items-center gap-2 text-negro/60 dark:text-arena/60 text-[11px]">
                    <span className="uppercase">{gasto.categoria.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="uppercase text-turquesa font-semibold">{gasto.metodo_pago}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-display text-lg text-coral font-bold shrink-0">
                    -${Number(gasto.monto).toFixed(0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteGasto(gasto.id)}
                    className="p-1.5 text-negro/40 dark:text-arena/40 hover:text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40"
                    title="Eliminar gasto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-negro/60 dark:text-arena/50 font-serif italic py-3 text-center">
            No se han registrado salidas de caja chica para el día {fechaSeleccionada}.
          </p>
        )}
      </div>

      {/* SECCIÓN 2: FORMULARIO DE CAPTURA Y RESUMEN DEL ARQUEO */}
      <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-oro/30 dark:border-oro/20 rounded-2xl p-6 gold-border-corner shadow-2xl">
        <div className="mb-6 border-b border-arena/20 dark:border-arena/10 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-sans text-turquesa font-semibold uppercase tracking-wider">
              CONCILIACIÓN FÍSICA
            </span>
            <h3 className="font-display text-2xl text-negro dark:text-blanco">
              CAPTURA DE ARQUEO — {fechaSeleccionada}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowDenomModal(true)}
            className="bg-oro/20 text-oro border border-oro/30 hover:bg-oro hover:text-negro font-sans font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 self-start"
          >
            <Coins className="w-4 h-4" />
            <span>🧮 CALCULADORA DE BILLETES</span>
          </button>
        </div>

        <form onSubmit={handleSaveCierre} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Fondo Inicial */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-negro/80 dark:text-arena uppercase font-semibold flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-oro" />
                <span>Fondo Inicial ($)</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={fondoInicial}
                onChange={(e) => setFondoInicial(e.target.value)}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-lg px-3 py-2.5 text-base font-display text-oro focus:border-turquesa focus:outline-none"
              />
            </div>

            {/* Efectivo Físico */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-sans text-negro/80 dark:text-arena uppercase font-semibold flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-turquesa" />
                  <span>Efectivo Físico ($)</span>
                </label>
                <span className="text-[10px] font-mono text-negro/50 dark:text-arena/50">
                  Esperado: ${efectivoEsperado.toFixed(0)}
                </span>
              </div>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={efectivo}
                onChange={(e) => setEfectivo(e.target.value)}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-lg px-3 py-2.5 text-base font-display text-oro focus:border-turquesa focus:outline-none"
              />
            </div>

            {/* Transferencias */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-sans text-negro/80 dark:text-arena uppercase font-semibold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-turquesa" />
                  <span>Transferencias ($)</span>
                </label>
                <span className="text-[10px] font-mono text-negro/50 dark:text-arena/50">
                  Sistema: ${sugeridoPorMetodo.transferencia.toFixed(0)}
                </span>
              </div>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={transferencia}
                onChange={(e) => setTransferencia(e.target.value)}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-lg px-3 py-2.5 text-base font-display text-oro focus:border-turquesa focus:outline-none"
              />
            </div>

            {/* OXXO */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-sans text-negro/80 dark:text-arena uppercase font-semibold flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-turquesa" />
                  <span>Depósitos OXXO ($)</span>
                </label>
                <span className="text-[10px] font-mono text-negro/50 dark:text-arena/50">
                  Sistema: ${sugeridoPorMetodo.oxxo.toFixed(0)}
                </span>
              </div>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={oxxo}
                onChange={(e) => setOxxo(e.target.value)}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-lg px-3 py-2.5 text-base font-display text-oro focus:border-turquesa focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-sans text-negro/80 dark:text-arena uppercase font-semibold">
              Notas de Conciliación / Observaciones
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Faltaron $50 pesos por vueltas entregadas sin registrar..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-lg p-3 text-xs text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-arena/10">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-sans text-arena/60 uppercase">Total Real Contado:</span>
                <span className="font-display text-3xl text-oro">${totalReal.toFixed(0)}</span>
              </div>
              <div className="h-8 w-[1px] bg-arena/20" />
              <div className="flex flex-col">
                <span className="text-[10px] font-sans text-arena/60 uppercase">Diferencia Efectivo:</span>
                <span
                  className={`font-display text-3xl ${
                    diferenciaEfectivo >= 0 ? 'text-turquesa' : 'text-coral'
                  }`}
                >
                  {diferenciaEfectivo >= 0 ? '+' : ''}${diferenciaEfectivo.toFixed(0)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider py-3.5 px-6 rounded-xl transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(42,191,191,0.3)] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>GUARDANDO CIERRE...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{cierreExistente ? 'ACTUALIZAR CIERRE EN SISTEMA' : 'GUARDAR CIERRE EN SISTEMA'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECCIÓN 3: HISTORIAL DE CIERRES ANTERIORES */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-arena/10 pb-3">
          <History className="w-5 h-5 text-oro" />
          <h3 className="font-display text-2xl text-blanco tracking-wide">
            HISTORIAL DE CIERRES ANTERIORES
          </h3>
        </div>

        {cierres.length > 0 ? (
          <div className="flex flex-col gap-3">
            {cierres.map((cierre) => (
              <div
                key={cierre.id || cierre.fecha}
                onClick={() => setFechaSeleccionada(cierre.fecha)}
                className="cursor-pointer group"
                title="Hacer clic para cargar y revisar este cierre"
              >
                <ListRow
                  title={`Cierre de Caja — ${cierre.fecha}`}
                  subtitle={`Fondo: $${cierre.fondo_inicial || 0} · Efectivo: $${cierre.total_efectivo} · Gastos: -$${cierre.total_gastos || 0}`}
                  value={`$${cierre.total_real?.toFixed(0)}`}
                  valueSubtitle="TOTAL REAL"
                  badgeText={cierre.diferencia >= 0 ? 'SIN FALTANTE' : 'CON DIFERENCIA'}
                  badgeVariant={cierre.diferencia >= 0 ? 'disponible' : 'agotado'}
                  footer={
                    cierre.notas ? (
                      <span className="font-serif italic text-xs text-arena/60">
                        📝 "{cierre.notas}"
                      </span>
                    ) : undefined
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-carbon/40 rounded-xl border border-arena/5">
            <p className="font-serif italic text-sm text-arena/60">
              No hay historial de cierres de caja guardados.
            </p>
          </div>
        )}
      </div>

      {/* MODAL 1: REGISTRAR GASTO DE CAJA CHICA */}
      {showGastoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#050404] bg-dots-pattern border-2 border-coral/40 rounded-2xl w-full max-w-md p-6 gold-border-corner shadow-2xl relative text-blanco">
            <button
              onClick={() => setShowGastoModal(false)}
              className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon border border-arena/20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-xs font-sans font-bold text-coral uppercase tracking-widest">
                EGRESO DE CAJA CHICA
              </span>
              <h3 className="font-display text-2xl text-blanco mt-0.5">
                REGISTRAR SALIDA DE DINERO
              </h3>
            </div>

            <form onSubmit={handleCreateGastoSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-arena uppercase font-bold">
                  Concepto del Gasto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Compra de 2 bolsas de hielo, limones..."
                  value={gastoConcepto}
                  onChange={(e) => setGastoConcepto(e.target.value)}
                  className="bg-carbon border border-arena/20 rounded-xl px-4 py-2.5 text-sm text-blanco focus:border-coral focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-arena uppercase font-bold">
                    Monto ($) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    placeholder="Ej. 150"
                    value={gastoMonto}
                    onChange={(e) => setGastoMonto(e.target.value)}
                    className="bg-carbon border border-arena/20 rounded-xl px-4 py-2.5 text-base font-display text-coral font-bold focus:border-coral focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-arena uppercase font-bold">
                    Categoría
                  </label>
                  <select
                    value={gastoCategoria}
                    onChange={(e) => setGastoCategoria(e.target.value as CategoriaGasto)}
                    className="bg-carbon border border-arena/20 rounded-xl px-3 py-2.5 text-xs text-blanco focus:border-coral focus:outline-none"
                  >
                    <option value="insumos_urgentes">Insumos urgentes</option>
                    <option value="proveedores">Pago Proveedor</option>
                    <option value="servicios">Servicios / Reparto</option>
                    <option value="personal">Personal / Propinas</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-arena uppercase font-bold">
                  Método de Salida
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGastoMetodo('efectivo')}
                    className={`py-2.5 rounded-xl text-xs font-sans font-bold border transition-all ${
                      gastoMetodo === 'efectivo'
                        ? 'bg-coral text-blanco border-coral shadow-md'
                        : 'bg-carbon text-arena/70 border-arena/20'
                    }`}
                  >
                    💵 EFECTIVO (CAJA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGastoMetodo('transferencia')}
                    className={`py-2.5 rounded-xl text-xs font-sans font-bold border transition-all ${
                      gastoMetodo === 'transferencia'
                        ? 'bg-turquesa text-negro border-turquesa shadow-md'
                        : 'bg-carbon text-arena/70 border-arena/20'
                    }`}
                  >
                    📱 TRANSFERENCIA
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingGasto}
                className="bg-coral text-blanco hover:bg-coral/80 font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg mt-2"
              >
                {isSavingGasto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>GUARDANDO...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>REGISTRAR SALIDA DE DINERO</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CALCULADORA DE DENOMINACIONES DE BILLETES Y MONEDAS */}
      {showDenomModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/40 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8 gold-border-corner shadow-2xl relative text-blanco flex flex-col gap-5">
            <button
              onClick={() => setShowDenomModal(false)}
              className="absolute top-4 right-4 p-2 text-arena/60 hover:text-blanco rounded-full hover:bg-carbon border border-arena/20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-oro font-mono text-xs uppercase tracking-widest font-bold">
              <Coins className="w-4 h-4" />
              <span>CONTEO FÍSICO DE DENOMINACIONES</span>
            </div>

            <h3 className="font-display text-2xl text-blanco -mt-3">
              CALCULADORA DE BILLETES Y MONEDAS
            </h3>

            {/* Billetes */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-sans font-bold text-arena/70 uppercase">
                💵 Billetes en Caja:
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { key: 'b1000', val: 1000, label: '$1,000' },
                  { key: 'b500', val: 500, label: '$500' },
                  { key: 'b200', val: 200, label: '$200' },
                  { key: 'b100', val: 100, label: '$100' },
                  { key: 'b50', val: 50, label: '$50' },
                  { key: 'b20', val: 20, label: '$20' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center bg-carbon border border-arena/20 rounded-xl p-2 justify-between">
                    <span className="text-xs font-bold text-oro">{item.label}</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={(denominaciones as any)[item.key] || ''}
                      onChange={(e) =>
                        setDenominaciones((prev) => ({
                          ...prev,
                          [item.key]: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      className="w-14 bg-[#111] border border-arena/20 text-center font-bold text-xs rounded-lg py-1 text-blanco focus:border-turquesa focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Monedas */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-sans font-bold text-arena/70 uppercase">
                🪙 Monedas en Caja:
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { key: 'm20', val: 20, label: '$20' },
                  { key: 'm10', val: 10, label: '$10' },
                  { key: 'm5', val: 5, label: '$5' },
                  { key: 'm2', val: 2, label: '$2' },
                  { key: 'm1', val: 1, label: '$1' },
                  { key: 'm050', val: 0.5, label: '$0.50' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center bg-carbon border border-arena/20 rounded-xl p-2 justify-between">
                    <span className="text-xs font-bold text-arena">{item.label}</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={(denominaciones as any)[item.key] || ''}
                      onChange={(e) =>
                        setDenominaciones((prev) => ({
                          ...prev,
                          [item.key]: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      className="w-14 bg-[#111] border border-arena/20 text-center font-bold text-xs rounded-lg py-1 text-blanco focus:border-turquesa focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Total Calculado */}
            <div className="bg-carbon border border-oro/30 rounded-2xl p-4 flex items-center justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-arena/60 uppercase font-bold">TOTAL EFECTIVO SUMADO</span>
                <span className="font-display text-3xl text-oro">${totalCalculadora.toFixed(2)} MXN</span>
              </div>

              <button
                type="button"
                onClick={handleApplyCalculadora}
                className="bg-turquesa text-negro font-sans font-bold text-xs py-3 px-5 rounded-xl hover:bg-blanco transition-all flex items-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>APLICAR AL ARQUEO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ESCÁNER QR DE SOCIOS EN CAJA */}
      {showQrScanner && (
        <CustomerQrScannerModal
          onClose={() => setShowQrScanner(false)}
        />
      )}
    </div>
  )
}
