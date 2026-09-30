'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { CierreCaja, Pedido, GastoCaja, CategoriaGasto, DesgloseBilletes } from '@/lib/types/database'
import { CustomerQrScannerModal } from '@/components/admin/CustomerQrScannerModal'
import { abrirCajaTurno, guardarCierreCaja, reabrirCajaTurno } from '@/lib/actions/caja'
import { registrarGastoCaja, eliminarGastoCaja } from '@/lib/actions/gastosCaja'
import { generateWhatsAppMessageUrl } from '@/lib/utils/whatsapp'
import { getMazatlanDateString } from '@/lib/utils/date'
import { printCierreTicket } from '@/lib/utils/printThermalTicket'
import { StaffSelectorPill } from '@/components/admin/StaffSelectorPill'
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
  Plus,
  Trash2,
  Printer,
  X,
  Coins,
  TrendingDown,
  Wallet,
  Camera,
  Check,
  ReceiptText,
  Lock,
  Unlock,
  Play,
  RotateCcw,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'

interface CajaManagerProps {
  pedidosEntregados: Pedido[]
  historialCierres: CierreCaja[]
  initialGastos: GastoCaja[]
  fechaHoy: string
}

const ITEMS_PER_PAGE = 10

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
  const [isOpening, setIsOpening] = useState(false)
  const [isReopening, setIsReopening] = useState(false)

  // Paginación
  const [historialPage, setHistorialPage] = useState(1)
  const [gastosPage, setGastosPage] = useState(1)

  // Modales
  const [showGastoModal, setShowGastoModal] = useState(false)
  const [showDenomModal, setShowDenomModal] = useState(false)
  const [denomTarget, setDenomTarget] = useState<'apertura' | 'cierre'>('cierre')
  const [showQrScanner, setShowQrScanner] = useState(false)

  // Formulario de Apertura de Caja
  const [montoApertura, setMontoApertura] = useState<string | number>(500)
  const [notasApertura, setNotasApertura] = useState('')
  const [denominacionesApertura, setDenominacionesApertura] = useState<DesgloseBilletes>({
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

  // Formulario de Gasto Rápido
  const [gastoConcepto, setGastoConcepto] = useState('')
  const [gastoCategoria, setGastoCategoria] = useState<CategoriaGasto>('insumos_urgentes')
  const [gastoMonto, setGastoMonto] = useState<string | number>('')
  const [gastoMetodo, setGastoMetodo] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [isSavingGasto, setIsSavingGasto] = useState(false)

  // Desglose de Billetes y Monedas para Cierre
  const [denominacionesCierre, setDenominacionesCierre] = useState<DesgloseBilletes>({
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

  // Paginación de Gastos
  const totalGastosPages = Math.max(1, Math.ceil(gastosDeLaFecha.length / ITEMS_PER_PAGE))
  const paginatedGastos = useMemo(() => {
    const start = (gastosPage - 1) * ITEMS_PER_PAGE
    return gastosDeLaFecha.slice(start, start + ITEMS_PER_PAGE)
  }, [gastosDeLaFecha, gastosPage])

  const totalGastosEfectivo = useMemo(() => {
    return gastosDeLaFecha
      .filter((g) => g.metodo_pago === 'efectivo')
      .reduce((acc, g) => acc + Number(g.monto || 0), 0)
  }, [gastosDeLaFecha])

  const totalGastosTransferencia = useMemo(() => {
    return gastosDeLaFecha
      .filter((g) => g.metodo_pago === 'transferencia')
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
      const monto = Number(p.total || 0)
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

  // Paginación de Historial de Cierres
  const totalHistorialPages = Math.max(1, Math.ceil(cierres.length / ITEMS_PER_PAGE))
  const paginatedCierres = useMemo(() => {
    const start = (historialPage - 1) * ITEMS_PER_PAGE
    return cierres.slice(start, start + ITEMS_PER_PAGE)
  }, [cierres, historialPage])

  // Estado del turno: 'sin_abrir' | 'abierta' | 'cerrada'
  const estadoTurno = useMemo(() => {
    if (!cierreExistente) return 'sin_abrir'
    if (cierreExistente.estado === 'abierta') return 'abierta'
    if (cierreExistente.estado === 'cerrada') return 'cerrada'
    // Fallback si no tiene estado explícito pero tiene registro
    if (cierreExistente.total_real > 0 || cierreExistente.total_efectivo > 0) return 'cerrada'
    return 'abierta'
  }, [cierreExistente])

  // Estados del arqueo
  const [fondoInicial, setFondoInicial] = useState<string | number>(0)
  const [efectivo, setEfectivo] = useState<string | number>('')
  const [transferencia, setTransferencia] = useState<string | number>('')
  const [oxxo, setOxxo] = useState<string | number>('')
  const [notas, setNotas] = useState('')

  // Sincronizar formulario al cambiar fecha o cierre existente
  useEffect(() => {
    setGastosPage(1)
    if (cierreExistente) {
      setFondoInicial(cierreExistente.fondo_inicial || 0)
      setEfectivo(cierreExistente.total_efectivo || '')
      setTransferencia(cierreExistente.total_transferencia || '')
      setOxxo(cierreExistente.total_oxxo || '')
      setNotas(cierreExistente.notas || '')
      if (cierreExistente.desglose_billetes) {
        setDenominacionesCierre(cierreExistente.desglose_billetes)
      }
      if (cierreExistente.monto_apertura_desglose) {
        setDenominacionesApertura(cierreExistente.monto_apertura_desglose)
      }
    } else {
      setFondoInicial(0)
      setEfectivo(sugeridoPorMetodo.efectivo || 0)
      setTransferencia(sugeridoPorMetodo.transferencia || 0)
      setOxxo(sugeridoPorMetodo.oxxo || 0)
      setNotas('')
      setMontoApertura(500)
      setNotasApertura('')
      setDenominacionesCierre({
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
      setDenominacionesApertura({
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
  const dineroEsperadoTotal = totalSistemaEntregado + numFondo - totalGastosTodos
  const diferenciaTotal = totalReal - dineroEsperadoTotal

  // ACCIÓN 1: ABRIR CAJA / INICIAR TURNO
  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault()
    const fondoNum = Number(montoApertura)
    if (isNaN(fondoNum) || fondoNum < 0) {
      alert('Por favor ingresa un fondo inicial válido.')
      return
    }

    setIsOpening(true)
    try {
      const res = await abrirCajaTurno({
        fecha: fechaSeleccionada,
        fondo_inicial: fondoNum,
        monto_apertura_desglose: denominacionesApertura,
        notas_apertura: notasApertura.trim() || undefined,
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
        setFondoInicial(fondoNum)
        alert(`¡Caja abierta exitosamente con $${fondoNum.toLocaleString('es-MX')} de fondo inicial!`)
      }
    } catch (err) {
      console.error('Error al abrir caja:', err)
      alert('Ocurrió un error al abrir la caja.')
    } finally {
      setIsOpening(false)
    }
  }

  // ACCIÓN 2: GUARDAR ARQUEO / CERRAR TURNO (CORTE Z)
  const handleSaveCierre = async (cerrarTurno: boolean) => {
    setIsSaving(true)
    try {
      const res = await guardarCierreCaja({
        fecha: fechaSeleccionada,
        total_efectivo: numEfectivo,
        total_transferencia: numTransferencia,
        total_oxxo: numOxxo,
        fondo_inicial: numFondo,
        total_gastos: totalGastosTodos,
        desglose_billetes: denominacionesCierre,
        total_sistema: totalSistemaEntregado,
        total_real: totalReal,
        diferencia: diferenciaTotal,
        notas,
        cerrar_turno: cerrarTurno,
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

      if (cerrarTurno) {
        alert(`¡Corte Z y Cierre de caja para ${fechaSeleccionada} completado exitosamente!`)
      } else {
        alert(`¡Avance de arqueo guardado!`)
      }
    } catch (err) {
      console.error('Error al guardar cierre:', err)
      alert('Error al guardar el cierre de caja.')
    } finally {
      setIsSaving(false)
    }
  }

  // ACCIÓN 3: REABRIR TURNO
  const handleReabrirCaja = async () => {
    if (!confirm('¿Deseas reabrir la caja de esta fecha para continuar operando o corregir el arqueo?')) {
      return
    }

    setIsReopening(true)
    try {
      const res = await reabrirCajaTurno(fechaSeleccionada)
      if (res.data) {
        setCierres((prev) => {
          const idx = prev.findIndex((c) => c.fecha === fechaSeleccionada)
          if (idx >= 0) {
            const copy = [...prev]
            copy[idx] = res.data
            return copy
          }
          return prev
        })
        alert('Caja reabierta. Puedes continuar registrando movimientos.')
      }
    } catch (err) {
      console.error('Error al reabrir caja:', err)
      alert('Error al reabrir la caja.')
    } finally {
      setIsReopening(false)
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

  // Calculadora de Denominaciones
  const currentDenominaciones = denomTarget === 'apertura' ? denominacionesApertura : denominacionesCierre

  const totalCalculadora = useMemo(() => {
    const d = currentDenominaciones
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
  }, [currentDenominaciones])

  const handleApplyCalculadora = () => {
    if (denomTarget === 'apertura') {
      setMontoApertura(totalCalculadora)
    } else {
      setEfectivo(totalCalculadora)
    }
    setShowDenomModal(false)
  }

  const updateDenom = (key: keyof DesgloseBilletes, delta: number) => {
    const setter = denomTarget === 'apertura' ? setDenominacionesApertura : setDenominacionesCierre
    setter((prev) => {
      const current = Number(prev[key] || 0)
      const next = Math.max(0, current + delta)
      return { ...prev, [key]: next }
    })
  }

  const handleExportWhatsApp = () => {
    const text = `🌊 *Cierre Marea Negra* [${fechaSeleccionada}]\n\n` +
      `💵 Fondo Inicial: $${numFondo.toFixed(0)}\n` +
      `📈 Ventas Sistema: $${totalSistemaEntregado.toFixed(0)} (${pedidosDeLaFecha.length} pedidos)\n` +
      `   • Efectivo: $${sugeridoPorMetodo.efectivo.toFixed(0)}\n` +
      `   • Transferencia: $${sugeridoPorMetodo.transferencia.toFixed(0)}\n` +
      `   • OXXO/Tarjetas: $${sugeridoPorMetodo.oxxo.toFixed(0)}\n\n` +
      `📉 Gastos Caja Chica: -$${totalGastosTodos.toFixed(0)}\n\n` +
      `🧾 *Arqueo Físico Contado:* $${totalReal.toFixed(0)}\n` +
      `⚖️ *Diferencia:* ${diferenciaTotal >= 0 ? '+' : ''}$${diferenciaTotal.toFixed(0)} (${diferenciaTotal === 0 ? 'Cuadrado ✅' : diferenciaTotal > 0 ? 'Sobrante' : 'Faltante ⚠️'})\n` +
      (notas ? `\n📝 Notas: ${notas}` : '')

    const url = generateWhatsAppMessageUrl(text)
    window.open(url, '_blank')
  }

  const handlePrintThermalCierre = () => {
    printCierreTicket({
      fecha: fechaSeleccionada,
      fondoInicial: numFondo,
      ventasEfectivo: sugeridoPorMetodo.efectivo,
      ventasTransferencia: sugeridoPorMetodo.transferencia,
      ventasOxxo: sugeridoPorMetodo.oxxo,
      totalSistema: totalSistemaEntregado,
      totalGastos: totalGastosTodos,
      gastosList: gastosDeLaFecha.map((g) => ({
        concepto: g.concepto,
        monto: Number(g.monto),
        metodo_pago: g.metodo_pago,
        categoria: g.categoria,
      })),
      efectivoFisico: numEfectivo,
      transferenciaFisico: numTransferencia,
      oxxoFisico: numOxxo,
      totalReal: totalReal,
      diferencia: diferenciaTotal,
      notas: notas || undefined,
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* 1. CABECERA PRINCIPAL BENTO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-sans uppercase tracking-wider font-bold bg-[#2ABFBF] text-black px-2.5 py-0.5 rounded-full">
              Control Financiero
            </span>
            <span className="text-xs text-negro/60 dark:text-arena/60 font-sans font-medium">
              Apertura, Turno & Arqueo
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco tracking-wide">
            GESTIÓN DE CAJA & ARQUEO
          </h1>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2 flex-wrap">
          <StaffSelectorPill allowedRoles={['admin', 'cajero']} defaultRoleLabel="Cajero" />

          <button
            type="button"
            onClick={() => setShowQrScanner(true)}
            className="inline-flex items-center gap-2 bg-[#2ABFBF]/10 hover:bg-[#2ABFBF]/20 text-[#2ABFBF] border border-[#2ABFBF]/30 px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Escanear Socio</span>
          </button>

          {estadoTurno !== 'sin_abrir' && (
            <button
              type="button"
              onClick={handlePrintThermalCierre}
              className="inline-flex items-center gap-2 bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all"
              title="Imprimir ticket térmico de 80mm con desglose completo"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Corte Z (80mm)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportWhatsApp}
            className="inline-flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 2. SELECTOR DE JORNADA & BARRA DE ESTADO DEL TURNO */}
      <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            estadoTurno === 'abierta'
              ? 'bg-[#16A34B]/15 text-[#16A34B]'
              : estadoTurno === 'cerrada'
              ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
              : 'bg-[#ECC94B]/20 text-[#3A2D00] dark:text-[#ECC94B]'
          }`}>
            {estadoTurno === 'abierta' ? (
              <Unlock className="w-5 h-5 stroke-[2.5]" />
            ) : estadoTurno === 'cerrada' ? (
              <Lock className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Play className="w-5 h-5 fill-current" />
            )}
          </div>
          <div>
            <div className="text-[11px] font-sans font-bold text-negro/50 dark:text-arena/50 uppercase tracking-wider">
              Jornada Seleccionada
            </div>
            <div className="flex items-center gap-2.5 flex-wrap mt-0.5">
              <span className="font-display text-xl text-negro dark:text-blanco font-bold">
                {fechaSeleccionada === fechaHoy
                  ? `Hoy (${fechaSeleccionada})`
                  : fechaSeleccionada === fechaAyer
                  ? `Ayer (${fechaSeleccionada})`
                  : fechaSeleccionada}
              </span>

              {/* Status Badge Sólido */}
              {estadoTurno === 'abierta' && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-bold bg-[#16A34B] text-white px-3 py-0.5 rounded-full shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>Caja Abierta (Turno Activo)</span>
                </span>
              )}

              {estadoTurno === 'cerrada' && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-bold bg-[#C9A84C] text-black px-3 py-0.5 rounded-full shadow-sm">
                  <Lock className="w-3 h-3 stroke-[2.5]" />
                  <span>Caja Cerrada (Corte Z)</span>
                </span>
              )}

              {estadoTurno === 'sin_abrir' && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-bold bg-[#ECC94B] text-[#3A2D00] px-3 py-0.5 rounded-full shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  <span>Sin Apertura de Caja</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botones de navegación de fecha */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFechaSeleccionada(fechaHoy)}
            className={`px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all border ${
              fechaSeleccionada === fechaHoy
                ? 'bg-[#2ABFBF] text-negro border-[#2ABFBF] shadow-sm'
                : 'bg-black/5 dark:bg-white/5 text-negro/70 dark:text-arena/70 border-transparent hover:border-black/20 dark:hover:border-white/20'
            }`}
          >
            Hoy
          </button>

          {fechaAyer && (
            <button
              type="button"
              onClick={() => setFechaSeleccionada(fechaAyer)}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all border ${
                fechaSeleccionada === fechaAyer
                  ? 'bg-[#C9A84C] text-negro border-[#C9A84C] shadow-sm'
                  : 'bg-black/5 dark:bg-white/5 text-negro/70 dark:text-arena/70 border-transparent hover:border-black/20 dark:hover:border-white/20'
              }`}
            >
              Ayer
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-[10px] text-negro/50 dark:text-arena/50 uppercase font-bold">Fecha:</span>
            <input
              type="date"
              max={fechaHoy}
              value={fechaSeleccionada}
              onChange={(e) => {
                if (e.target.value) setFechaSeleccionada(e.target.value)
              }}
              className="bg-transparent text-negro dark:text-blanco font-sans font-medium text-xs focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* CASO A: SI LA CAJA NO HA SIDO ABIERTA TODAVÍA PARA ESTA FECHA */}
      {estadoTurno === 'sin_abrir' && (
        <div className="bg-white dark:bg-[#111317] border border-[#2ABFBF]/30 rounded-[28px] p-6 md:p-10 shadow-lg relative overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-[22px] bg-[#2ABFBF]/10 text-[#2ABFBF] flex items-center justify-center shadow-inner">
              <Wallet className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-sans font-bold uppercase tracking-widest text-[#2ABFBF]">
                Paso 1: Apertura de Turno
              </span>
              <h2 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco font-bold">
                ¿CON CUÁNTO DINERO SE ABRE LA CAJA?
              </h2>
              <p className="text-xs md:text-sm text-negro/70 dark:text-arena/70 font-sans font-medium max-w-lg">
                Ingresa el fondo inicial de cambio con el que se inicia la jornada para registrar las entradas, gastos y habilitar el arqueo.
              </p>
            </div>

            <form onSubmit={handleAbrirCaja} className="w-full flex flex-col gap-5">
              {/* Input grande para el fondo inicial */}
              <div className="bg-black/[0.03] dark:bg-white/[0.03] border-2 border-black/10 dark:border-white/10 focus-within:border-[#2ABFBF] rounded-[24px] p-4 flex flex-col items-center transition-colors">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-negro/50 dark:text-arena/50 mb-1">
                  Fondo Inicial de Apertura
                </span>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl font-display text-[#2ABFBF] font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    autoFocus
                    placeholder="500"
                    value={montoApertura}
                    onChange={(e) => setMontoApertura(e.target.value)}
                    className="bg-transparent text-4xl md:text-5xl font-display font-bold text-negro dark:text-blanco text-center w-48 focus:outline-none"
                  />
                  <span className="text-sm font-sans font-bold text-negro/40 dark:text-arena/40">MXN</span>
                </div>

                {/* Chips rápidos de monto */}
                <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                  {[200, 300, 500, 1000, 1500, 2000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMontoApertura(val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all border ${
                        Number(montoApertura) === val
                          ? 'bg-[#2ABFBF] text-negro border-[#2ABFBF] shadow-sm'
                          : 'bg-black/5 dark:bg-white/5 text-negro/70 dark:text-arena/70 border-transparent hover:border-black/20'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setDenomTarget('apertura')
                      setShowDenomModal(true)
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 transition-all"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Desglosar Billetes</span>
                  </button>
                </div>
              </div>

              {/* Notas de apertura opcionales */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-sans text-negro/80 dark:text-arena/80 font-bold uppercase">
                  Observaciones / Notas de Apertura (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Billetes de $50 y monedas de $10 para cambio..."
                  value={notasApertura}
                  onChange={(e) => setNotasApertura(e.target.value)}
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-xs text-negro dark:text-blanco font-sans font-medium focus:border-[#2ABFBF] focus:outline-none"
                />
              </div>

              {/* Botón Abrir Caja */}
              <button
                type="submit"
                disabled={isOpening}
                className="w-full bg-[#2ABFBF] hover:bg-[#2ABFBF]/90 text-negro font-sans font-bold text-sm tracking-wider py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isOpening ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Iniciando Turno...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>ABRIR CAJA E INICIAR TURNO</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CASO B & C: CAJA ABIERTA O CERRADA */}
      {estadoTurno !== 'sin_abrir' && (
        <>
          {/* BANNER DE DETALLE DEL TURNO */}
          <div className={`rounded-[24px] p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
            estadoTurno === 'abierta'
              ? 'bg-[#16A34B]/[0.05] border-[#16A34B]/30'
              : 'bg-[#C9A84C]/[0.05] border-[#C9A84C]/30'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`p-2.5 rounded-xl ${
                estadoTurno === 'abierta' ? 'bg-[#16A34B]/15 text-[#16A34B]' : 'bg-[#C9A84C]/15 text-[#C9A84C]'
              }`}>
                {estadoTurno === 'abierta' ? <Clock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-sans font-bold uppercase tracking-wider text-negro/70 dark:text-arena/70">
                  {estadoTurno === 'abierta' ? 'TURNO EN CURSO' : 'TURNO FINALIZADO'}
                </span>
                <div className="text-xs text-negro/90 dark:text-arena/90 font-sans font-medium mt-0.5">
                  Fondo de Apertura: <strong>${numFondo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  {cierreExistente?.hora_apertura && (
                    <span className="ml-2 font-sans text-[11px] opacity-75">
                      ({new Date(cierreExistente.hora_apertura).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  )}
                  {cierreExistente?.notas_apertura && (
                    <span className="ml-2 font-sans font-normal opacity-80">· "{cierreExistente.notas_apertura}"</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {estadoTurno === 'cerrada' && (
                <button
                  type="button"
                  onClick={handleReabrirCaja}
                  disabled={isReopening}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-sans font-bold bg-[#ECC94B]/20 hover:bg-[#ECC94B]/30 text-[#3A2D00] dark:text-[#ECC94B] border border-[#ECC94B]/40 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isReopening ? 'Reabriendo...' : 'Reabrir Turno'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. METRICAS / KPIS PRINCIPALES BENTO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fondo Inicial */}
            <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-negro/50 dark:text-arena/50">
                  Fondo de Apertura
                </span>
                <div className="p-2 rounded-xl bg-[#C9A84C]/10 text-[#C9A84C]">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl text-negro dark:text-blanco font-bold">
                  ${numFondo.toLocaleString('es-MX')}
                </div>
                <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
                  Base de cambio en caja
                </div>
              </div>
            </div>

            {/* Ventas Sistema */}
            <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#2ABFBF]">
                  Ventas Sistema
                </span>
                <div className="p-2 rounded-xl bg-[#2ABFBF]/10 text-[#2ABFBF]">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl text-[#2ABFBF] font-bold">
                  ${totalSistemaEntregado.toLocaleString('es-MX')}
                </div>
                <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
                  {pedidosDeLaFecha.length} pedido{pedidosDeLaFecha.length === 1 ? '' : 's'} entregado{pedidosDeLaFecha.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            {/* Gastos Turno */}
            <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-coral">
                  Gastos de Turno
                </span>
                <div className="p-2 rounded-xl bg-coral/10 text-coral">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl text-coral font-bold">
                  -${totalGastosTodos.toLocaleString('es-MX')}
                </div>
                <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
                  {gastosDeLaFecha.length} salida{gastosDeLaFecha.length === 1 ? '' : 's'} de caja chica
                </div>
              </div>
            </div>

            {/* Diferencia / Balance */}
            <div className={`bg-white dark:bg-[#111317] border rounded-[24px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px] ${
              diferenciaTotal === 0
                ? 'border-[#16A34B]/40 bg-[#16A34B]/[0.02]'
                : diferenciaTotal > 0
                ? 'border-[#2ABFBF]/40 bg-[#2ABFBF]/[0.02]'
                : 'border-coral/40 bg-coral/[0.02]'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-negro/60 dark:text-arena/60">
                  Diferencia / Balance
                </span>
                <div className={`p-2 rounded-xl ${
                  diferenciaTotal === 0
                    ? 'bg-[#16A34B]/15 text-[#16A34B]'
                    : diferenciaTotal > 0
                    ? 'bg-[#2ABFBF]/15 text-[#2ABFBF]'
                    : 'bg-coral/15 text-coral'
                }`}>
                  <Calculator className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className={`font-display text-3xl font-bold ${
                  diferenciaTotal === 0
                    ? 'text-[#16A34B]'
                    : diferenciaTotal > 0
                    ? 'text-[#2ABFBF]'
                    : 'text-coral'
                }`}>
                  {diferenciaTotal >= 0 ? '+' : ''}${diferenciaTotal.toLocaleString('es-MX')}
                </div>
                <div className="text-[11px] font-sans font-bold mt-1">
                  {diferenciaTotal === 0 ? (
                    <span className="text-[#16A34B]">✓ Corte Cuadrado Exacto</span>
                  ) : diferenciaTotal > 0 ? (
                    <span className="text-[#2ABFBF]">Sobrante en caja</span>
                  ) : (
                    <span className="text-coral">⚠️ Faltante en caja</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. WORKSPACE DE ARQUEO & CAJA CHICA (2 COLUMNAS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMNA IZQUIERDA (7 COLS): CONCILIACIÓN FÍSICA */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-5 md:p-6 shadow-sm">
                {/* Header Conciliación */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-black/[0.08] dark:border-white/[0.08]">
                  <div>
                    <span className="text-[11px] font-sans text-[#2ABFBF] font-bold uppercase tracking-wider">
                      Dinero Físico en Caja
                    </span>
                    <h2 className="font-display text-2xl text-negro dark:text-blanco font-bold">
                      Arqueo & Conciliación
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDenomTarget('cierre')
                      setShowDenomModal(true)
                    }}
                    className="inline-flex items-center gap-2 bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all self-start sm:self-auto"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Calculadora de Billetes</span>
                  </button>
                </div>

                <div className="flex flex-col gap-5">
                  {/* Grid de 4 Métodos de Dinero */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Fondo Inicial */}
                    <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3.5 flex flex-col gap-1.5 focus-within:border-[#C9A84C] transition-colors">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-sans text-negro/80 dark:text-arena font-bold uppercase flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-[#C9A84C]" />
                          <span>Fondo Inicial</span>
                        </label>
                        <span className="text-[10px] text-negro/50 dark:text-arena/50 font-sans font-bold">
                          Apertura
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-negro/40 dark:text-arena/40 font-display text-lg">$</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={fondoInicial}
                          onChange={(e) => setFondoInicial(e.target.value)}
                          className="w-full bg-transparent pl-7 pr-3 py-1.5 text-xl font-display font-bold text-negro dark:text-blanco focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* 2. Efectivo Físico */}
                    <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3.5 flex flex-col gap-1.5 focus-within:border-[#2ABFBF] transition-colors">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-sans text-negro/80 dark:text-arena font-bold uppercase flex items-center gap-1.5">
                          <Banknote className="w-3.5 h-3.5 text-[#2ABFBF]" />
                          <span>Efectivo Contado</span>
                        </label>
                        <span className="text-[10px] font-sans font-bold text-[#2ABFBF] bg-[#2ABFBF]/10 px-2 py-0.5 rounded-full">
                          Esperado: ${efectivoEsperado.toFixed(0)}
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-negro/40 dark:text-arena/40 font-display text-lg">$</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={efectivo}
                          onChange={(e) => setEfectivo(e.target.value)}
                          className="w-full bg-transparent pl-7 pr-3 py-1.5 text-xl font-display font-bold text-negro dark:text-blanco focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* 3. Transferencias */}
                    <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3.5 flex flex-col gap-1.5 focus-within:border-[#2ABFBF] transition-colors">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-sans text-negro/80 dark:text-arena font-bold uppercase flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#2ABFBF]" />
                          <span>Transferencias</span>
                        </label>
                        <span className="text-[10px] font-sans font-medium text-negro/50 dark:text-arena/50">
                          Sistema: ${sugeridoPorMetodo.transferencia.toFixed(0)}
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-negro/40 dark:text-arena/40 font-display text-lg">$</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={transferencia}
                          onChange={(e) => setTransferencia(e.target.value)}
                          className="w-full bg-transparent pl-7 pr-3 py-1.5 text-xl font-display font-bold text-negro dark:text-blanco focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* 4. OXXO / Tarjetas */}
                    <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3.5 flex flex-col gap-1.5 focus-within:border-[#2ABFBF] transition-colors">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-sans text-negro/80 dark:text-arena font-bold uppercase flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-[#2ABFBF]" />
                          <span>OXXO / Tarjetas</span>
                        </label>
                        <span className="text-[10px] font-sans font-medium text-negro/50 dark:text-arena/50">
                          Sistema: ${sugeridoPorMetodo.oxxo.toFixed(0)}
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-negro/40 dark:text-arena/40 font-display text-lg">$</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={oxxo}
                          onChange={(e) => setOxxo(e.target.value)}
                          className="w-full bg-transparent pl-7 pr-3 py-1.5 text-xl font-display font-bold text-negro dark:text-blanco focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Matriz Comparativa de Conciliación */}
                  <div className="bg-black/[0.03] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
                    <div className="flex justify-between items-center text-negro/70 dark:text-arena/70 font-sans font-medium">
                      <span>(+) Fondo Inicial + Ventas Sistema:</span>
                      <span className="font-sans font-bold text-negro dark:text-blanco">
                        ${(numFondo + totalSistemaEntregado).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-coral font-sans font-medium">
                      <span>(-) Gastos de Turno (Caja Chica):</span>
                      <span className="font-sans font-bold">
                        -${totalGastosTodos.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-[1px] bg-black/10 dark:bg-white/10" />
                    <div className="flex justify-between items-center font-bold text-sm">
                      <span className="text-negro/80 dark:text-arena">Dinero Esperado en Turno:</span>
                      <span className="font-sans text-negro dark:text-blanco">
                        ${dineroEsperadoTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-sm">
                      <span className="text-negro/80 dark:text-arena">Total Físico Contado:</span>
                      <span className="font-sans text-[#C9A84C]">
                        ${totalReal.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-[1px] bg-black/10 dark:bg-white/10" />
                    <div className="flex justify-between items-center font-bold text-base pt-1">
                      <span>Diferencia de Caja:</span>
                      <span className={`font-sans font-bold ${
                        diferenciaTotal === 0
                          ? 'text-[#16A34B]'
                          : diferenciaTotal > 0
                          ? 'text-[#2ABFBF]'
                          : 'text-coral'
                      }`}>
                        {diferenciaTotal >= 0 ? '+' : ''}${diferenciaTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Notas de Conciliación */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans text-negro/80 dark:text-arena/80 font-bold uppercase">
                      Observaciones / Notas del Cierre
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ej. Faltaron $50 pesos por vueltas entregadas sin registrar o propinas..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl p-3 text-xs text-negro dark:text-blanco placeholder:text-negro/30 dark:placeholder:text-arena/30 font-sans font-medium focus:border-[#2ABFBF] focus:outline-none"
                    />
                  </div>

                  {/* Botones de Guardar / Cerrar Turno */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveCierre(false)}
                      className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-negro dark:text-blanco font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-black/10 dark:border-white/10 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Guardar Avance</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveCierre(true)}
                      className="bg-[#2ABFBF] text-negro hover:bg-[#2ABFBF]/90 font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4 stroke-[2.5]" />
                      )}
                      <span>
                        {estadoTurno === 'cerrada' ? 'Actualizar Corte Z' : 'Finalizar Turno & Cerrar Caja'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA (5 COLS): GASTOS DEL TURNO / CAJA CHICA */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-5 md:p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
                  <div>
                    <span className="text-[11px] font-sans text-coral font-bold uppercase tracking-wider">
                      Caja Chica & Egresos
                    </span>
                    <h2 className="font-display text-2xl text-negro dark:text-blanco font-bold">
                      Gastos del Turno
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowGastoModal(true)}
                    className="inline-flex items-center gap-1.5 bg-coral text-white hover:bg-coral/90 px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all shadow-sm shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Nuevo Gasto</span>
                  </button>
                </div>

                {/* Resumen rápido de gastos */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div className="bg-coral/10 border border-coral/25 rounded-2xl p-3 flex flex-col">
                    <span className="text-[10px] uppercase font-sans font-bold text-coral">Efectivo Caja</span>
                    <span className="font-display text-xl text-coral font-bold mt-0.5">
                      -${totalGastosEfectivo.toFixed(0)}
                    </span>
                  </div>
                  <div className="bg-[#2ABFBF]/10 border border-[#2ABFBF]/25 rounded-2xl p-3 flex flex-col">
                    <span className="text-[10px] uppercase font-sans font-bold text-[#2ABFBF]">Transferencia</span>
                    <span className="font-display text-xl text-[#2ABFBF] font-bold mt-0.5">
                      -${totalGastosTransferencia.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Lista de gastos registrados con límite de 10 */}
                {gastosDeLaFecha.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {paginatedGastos.map((gasto) => (
                      <div
                        key={gasto.id}
                        className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] hover:border-coral/40 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-negro dark:text-blanco truncate">
                            {gasto.concepto}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-negro/60 dark:text-arena/60 mt-0.5">
                            <span className="capitalize">{gasto.categoria.replace('_', ' ')}</span>
                            <span>•</span>
                            <span className="uppercase font-sans font-bold text-[#2ABFBF]">
                              {gasto.metodo_pago}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-display text-base text-coral font-bold">
                            -${Number(gasto.monto).toFixed(0)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteGasto(gasto.id)}
                            className="p-1.5 text-negro/40 dark:text-arena/40 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Paginación de Gastos si excede 10 */}
                    {totalGastosPages > 1 && (
                      <div className="flex items-center justify-between pt-3 mt-1 border-t border-black/[0.08] dark:border-white/[0.08]">
                        <span className="text-[11px] font-sans font-medium text-negro/60 dark:text-arena/60">
                          Página {gastosPage} de {totalGastosPages} ({gastosDeLaFecha.length} gastos)
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setGastosPage((p) => Math.max(1, p - 1))}
                            disabled={gastosPage === 1}
                            className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setGastosPage((p) => Math.min(totalGastosPages, p + 1))}
                            disabled={gastosPage === totalGastosPages}
                            className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                    <ReceiptText className="w-8 h-8 mx-auto text-negro/30 dark:text-arena/30 mb-2" />
                    <p className="text-xs text-negro/60 dark:text-arena/60 font-sans font-medium">
                      No se han registrado salidas de caja chica para el día {fechaSeleccionada}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 5. HISTORIAL DE CIERRES ANTERIORES CON PAGINACIÓN DE 10 */}
      <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-5 md:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
          <History className="w-5 h-5 text-[#C9A84C]" />
          <h2 className="font-display text-2xl text-negro dark:text-blanco font-bold">
            Historial de Turnos y Cierres
          </h2>
          <span className="text-xs text-negro/50 dark:text-arena/50 ml-auto font-sans font-semibold">
            {cierres.length} registro{cierres.length === 1 ? '' : 's'}
          </span>
        </div>

        {cierres.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {paginatedCierres.map((cierre) => {
                const isSelected = cierre.fecha === fechaSeleccionada
                const isCuadrado = (cierre.diferencia || 0) >= 0
                const isAbierta = cierre.estado === 'abierta'

                return (
                  <div
                    key={cierre.id || cierre.fecha}
                    onClick={() => setFechaSeleccionada(cierre.fecha)}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#C9A84C]/5 border-[#C9A84C] shadow-sm'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-negro/50 dark:text-arena/50">
                          {isAbierta ? 'Turno en Curso' : 'Corte Z Finalizado'}
                        </div>
                        <div className="font-display text-lg font-bold text-negro dark:text-blanco mt-0.5">
                          {cierre.fecha}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full ${
                          isAbierta
                            ? 'bg-[#16A34B] text-white'
                            : isCuadrado
                            ? 'bg-[#C9A84C] text-black'
                            : 'bg-coral text-white'
                        }`}
                      >
                        {isAbierta
                          ? 'Abierta'
                          : isCuadrado
                          ? '✓ Cuadrado'
                          : '⚠️ Con Diferencia'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs border-t border-black/5 dark:border-white/5 pt-2 font-sans">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-negro/50 dark:text-arena/50">Fondo</span>
                        <span className="font-display text-sm font-bold text-negro dark:text-blanco">
                          ${cierre.fondo_inicial || 0}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-negro/50 dark:text-arena/50">Total Real</span>
                        <span className="font-display text-sm font-bold text-[#C9A84C]">
                          ${cierre.total_real?.toFixed(0) || '0'}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] text-negro/50 dark:text-arena/50">Diferencia</span>
                        <span className={`font-display text-sm font-bold ${isCuadrado ? 'text-[#16A34B]' : 'text-coral'}`}>
                          {(cierre.diferencia || 0) >= 0 ? '+' : ''}${cierre.diferencia?.toFixed(0) || '0'}
                        </span>
                      </div>
                    </div>

                    {cierre.notas && (
                      <p className="text-[11px] font-sans font-medium text-negro/70 dark:text-arena/70 truncate border-t border-black/5 dark:border-white/5 pt-1.5">
                        "{cierre.notas}"
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Paginación de Historial */}
            {totalHistorialPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-black/[0.08] dark:border-white/[0.08]">
                <span className="text-xs font-sans font-medium text-negro/60 dark:text-arena/60">
                  Mostrando página {historialPage} de {totalHistorialPages} ({cierres.length} jornadas)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHistorialPage((p) => Math.max(1, p - 1))}
                    disabled={historialPage === 1}
                    className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-sans font-bold px-2 text-negro dark:text-blanco">
                    {historialPage} / {totalHistorialPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistorialPage((p) => Math.min(totalHistorialPages, p + 1))}
                    disabled={historialPage === totalHistorialPages}
                    className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/10 dark:border-white/10">
            <p className="font-sans font-medium text-sm text-negro/50 dark:text-arena/50">
              No hay historial de cierres de caja guardados.
            </p>
          </div>
        )}
      </div>

      {/* MODAL 1: REGISTRAR GASTO DE CAJA CHICA */}
      {showGastoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 rounded-[28px] w-full max-w-md p-6 shadow-2xl relative text-negro dark:text-blanco">
            <button
              onClick={() => setShowGastoModal(false)}
              className="absolute top-4 right-4 p-2 text-negro/40 dark:text-arena/40 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-[11px] font-sans font-bold text-coral uppercase tracking-wider">
                Caja Chica & Egresos
              </span>
              <h3 className="font-display text-2xl font-bold mt-0.5">
                Registrar Salida de Dinero
              </h3>
            </div>

            <form onSubmit={handleCreateGastoSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold">
                  Concepto del Gasto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 2 bolsas de hielo, limones, servilletas..."
                  value={gastoConcepto}
                  onChange={(e) => setGastoConcepto(e.target.value)}
                  className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-sans font-medium focus:border-coral focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold">
                    Monto ($) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    placeholder="150"
                    value={gastoMonto}
                    onChange={(e) => setGastoMonto(e.target.value)}
                    className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-base font-display font-bold text-coral focus:border-coral focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold">
                    Categoría
                  </label>
                  <select
                    value={gastoCategoria}
                    onChange={(e) => setGastoCategoria(e.target.value as CategoriaGasto)}
                    className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-3 py-3 text-xs text-negro dark:text-blanco font-sans font-medium focus:border-coral focus:outline-none"
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
                <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold">
                  Método de Salida
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGastoMetodo('efectivo')}
                    className={`py-2.5 rounded-xl text-xs font-sans font-bold border transition-all ${
                      gastoMetodo === 'efectivo'
                        ? 'bg-coral text-white border-coral shadow-sm'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] text-negro/70 dark:text-arena/70 border-black/10 dark:border-white/10'
                    }`}
                  >
                    💵 Efectivo (Caja)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGastoMetodo('transferencia')}
                    className={`py-2.5 rounded-xl text-xs font-sans font-bold border transition-all ${
                      gastoMetodo === 'transferencia'
                        ? 'bg-[#2ABFBF] text-negro border-[#2ABFBF] shadow-sm'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] text-negro/70 dark:text-arena/70 border-black/10 dark:border-white/10'
                    }`}
                  >
                    📱 Transferencia
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingGasto}
                className="bg-coral text-white hover:bg-coral/90 font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md mt-2"
              >
                {isSavingGasto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Registrar Salida de Dinero</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CALCULADORA DE BILLETES Y MONEDAS */}
      {showDenomModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 rounded-[28px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative text-negro dark:text-blanco flex flex-col gap-5">
            <button
              onClick={() => setShowDenomModal(false)}
              className="absolute top-4 right-4 p-2 text-negro/40 dark:text-arena/40 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-[#C9A84C] text-xs uppercase tracking-wider font-bold">
                <Coins className="w-4 h-4" />
                <span>
                  {denomTarget === 'apertura' ? 'Conteo de Fondo Inicial' : 'Arqueo de Efectivo Final'}
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold mt-0.5">
                Calculadora de Billetes y Monedas
              </h3>
            </div>

            {/* Billetes */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-sans font-bold text-negro/80 dark:text-arena/80 uppercase">
                💵 Billetes
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'b1000', val: 1000, label: '$1,000' },
                  { key: 'b500', val: 500, label: '$500' },
                  { key: 'b200', val: 200, label: '$200' },
                  { key: 'b100', val: 100, label: '$100' },
                  { key: 'b50', val: 50, label: '$50' },
                  { key: 'b20', val: 20, label: '$20' },
                ].map((item) => {
                  const count = Number((currentDenominaciones as any)[item.key] || 0)
                  const subtotal = count * item.val

                  return (
                    <div
                      key={item.key}
                      className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl p-2.5 flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#C9A84C]">{item.label}</span>
                        <span className="text-[10px] text-negro/60 dark:text-arena/60 font-sans font-medium">
                          ${subtotal.toLocaleString('es-MX')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateDenom(item.key as keyof DesgloseBilletes, -1)}
                          className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={count || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0
                            const setter = denomTarget === 'apertura' ? setDenominacionesApertura : setDenominacionesCierre
                            setter((prev) => ({ ...prev, [item.key]: val }))
                          }}
                          className="w-full bg-black/5 dark:bg-white/5 text-center font-bold text-xs rounded-lg py-1.5 text-negro dark:text-blanco focus:outline-none focus:ring-1 focus:ring-[#2ABFBF]"
                        />
                        <button
                          type="button"
                          onClick={() => updateDenom(item.key as keyof DesgloseBilletes, 1)}
                          className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Monedas */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-sans font-bold text-negro/80 dark:text-arena/80 uppercase">
                🪙 Monedas
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'm20', val: 20, label: '$20' },
                  { key: 'm10', val: 10, label: '$10' },
                  { key: 'm5', val: 5, label: '$5' },
                  { key: 'm2', val: 2, label: '$2' },
                  { key: 'm1', val: 1, label: '$1' },
                  { key: 'm050', val: 0.5, label: '$0.50' },
                ].map((item) => {
                  const count = Number((currentDenominaciones as any)[item.key] || 0)
                  const subtotal = count * item.val

                  return (
                    <div
                      key={item.key}
                      className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl p-2.5 flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-negro/80 dark:text-arena/80">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-negro/60 dark:text-arena/60 font-sans font-medium">
                          ${subtotal.toLocaleString('es-MX')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateDenom(item.key as keyof DesgloseBilletes, -1)}
                          className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={count || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0
                            const setter = denomTarget === 'apertura' ? setDenominacionesApertura : setDenominacionesCierre
                            setter((prev) => ({ ...prev, [item.key]: val }))
                          }}
                          className="w-full bg-black/5 dark:bg-white/5 text-center font-bold text-xs rounded-lg py-1.5 text-negro dark:text-blanco focus:outline-none focus:ring-1 focus:ring-[#2ABFBF]"
                        />
                        <button
                          type="button"
                          onClick={() => updateDenom(item.key as keyof DesgloseBilletes, 1)}
                          className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer con Total Sumado */}
            <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 mt-1">
              <div className="flex flex-col text-center sm:text-left">
                <span className="text-[10px] text-negro/50 dark:text-arena/50 uppercase font-bold">
                  Total Sumado
                </span>
                <span className="font-display text-2xl text-[#C9A84C] font-bold">
                  ${totalCalculadora.toFixed(2)} MXN
                </span>
              </div>

              <button
                type="button"
                onClick={handleApplyCalculadora}
                className="w-full sm:w-auto bg-[#2ABFBF] text-negro font-sans font-bold text-xs py-3 px-5 rounded-xl hover:bg-[#2ABFBF]/90 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {denomTarget === 'apertura' ? 'Aplicar a Fondo Inicial' : 'Aplicar a Efectivo Físico'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ESCÁNER QR DE SOCIOS */}
      {showQrScanner && (
        <CustomerQrScannerModal
          onClose={() => setShowQrScanner(false)}
        />
      )}
    </div>
  )
}
