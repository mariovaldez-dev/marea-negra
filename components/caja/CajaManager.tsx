'use client'

import React, { useState } from 'react'
import { CierreCaja } from '@/lib/types/database'
import { LuxuryCard } from '@/components/ui/LuxuryCard'
import { ListRow } from '@/components/ui/ListRow'
import { guardarCierreCaja } from '@/lib/actions/caja'
import { generateWhatsAppMessageUrl } from '@/lib/utils/whatsapp'
import {
  Banknote,
  Building2,
  Store,
  Calculator,
  Share2,
  CheckCircle2,
  History,
  Loader2,
  MessageCircle,
} from 'lucide-react'

interface CajaManagerProps {
  totalSistemaEntregado: number
  ventasPorMetodo: {
    efectivo: number
    transferencia: number
    oxxo: number
  }
  historialCierres: CierreCaja[]
  fechaHoy: string
}

export function CajaManager({
  totalSistemaEntregado,
  ventasPorMetodo,
  historialCierres,
  fechaHoy,
}: CajaManagerProps) {
  const [efectivo, setEfectivo] = useState<number>(ventasPorMetodo.efectivo)
  const [transferencia, setTransferencia] = useState<number>(ventasPorMetodo.transferencia)
  const [oxxo, setOxxo] = useState<number>(ventasPorMetodo.oxxo)
  const [notas, setNotas] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [cierres, setCierres] = useState<CierreCaja[]>(historialCierres)

  const totalReal = efectivo + transferencia + oxxo
  const diferencia = totalReal - totalSistemaEntregado

  const handleSaveCierre = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await guardarCierreCaja({
        fecha: fechaHoy,
        total_efectivo: efectivo,
        total_transferencia: transferencia,
        total_oxxo: oxxo,
        total_sistema: totalSistemaEntregado,
        total_real: totalReal,
        diferencia,
        notas,
      })

      if (res.data) {
        setCierres((prev) => {
          const idx = prev.findIndex((c) => c.fecha === fechaHoy)
          if (idx >= 0) {
            const copy = [...prev]
            copy[idx] = res.data
            return copy
          }
          return [res.data, ...prev]
        })
      }

      alert('Cierre de caja guardado exitosamente.')
    } catch (err) {
      console.error('Error al guardar cierre:', err)
      alert('Error al guardar el cierre de caja.')
    } finally {
      setIsSaving(false)
    }
  }

  // Generar texto para WhatsApp
  const handleExportWhatsApp = () => {
    const text = `Cierre Marea Negra [${fechaHoy}]\nEfectivo: $${efectivo.toFixed(0)}\nTransferencia: $${transferencia.toFixed(0)}\nOXXO: $${oxxo.toFixed(0)}\nTotal Físico: $${totalReal.toFixed(0)}\nTotal Sistema: $${totalSistemaEntregado.toFixed(0)}\nDiferencia: $${diferencia.toFixed(0)}\n${notas ? `Notas: ${notas}` : ''}`
    
    const url = generateWhatsAppMessageUrl(text)
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/10 pb-4">
        <div>
          <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase">
            CONCILIACIÓN FINANCIERA DIARIA
          </span>
          <h1 className="font-display text-4xl text-blanco tracking-wide">
            CIERRE Y ARQUEO DE CAJA
          </h1>
        </div>

        <button
          onClick={handleExportWhatsApp}
          className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-full shadow-[0_0_20px_rgba(42,191,191,0.3)] transition-all flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4 fill-negro" />
          <span>EXPORTAR PARA WHATSAPP</span>
        </button>
      </div>

      {/* LUXURY CARDS (PATRÓN 4) PARA TOTALES Y DESFASES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <LuxuryCard
          eyebrow="EFECTIVO EN CAJA"
          title="Físico Recibido"
          value={`$${efectivo.toFixed(0)}`}
          subtitle="Monedas y billetes en caja"
          icon={<Banknote className="w-5 h-5 text-oro" />}
        />

        <LuxuryCard
          eyebrow="BANCOS Y SPEI"
          title="Transferencias"
          value={`$${transferencia.toFixed(0)}`}
          subtitle="Pagos confirmados por app"
          icon={<Building2 className="w-5 h-5 text-oro" />}
        />

        <LuxuryCard
          eyebrow="DEPÓSITOS TIENDA"
          title="OXXO Pay"
          value={`$${oxxo.toFixed(0)}`}
          subtitle="Comprobantes entregados"
          icon={<Store className="w-5 h-5 text-oro" />}
        />

        <LuxuryCard
          eyebrow="CONCILIACIÓN SISTEMA"
          title="Diferencia Arqueo"
          value={`${diferencia >= 0 ? '+' : ''}$${diferencia.toFixed(0)}`}
          subtitle={`Sistema registró: $${totalSistemaEntregado.toFixed(0)}`}
          icon={<Calculator className="w-5 h-5 text-oro" />}
        />
      </div>

      {/* FORMULARIO DE CAPTURA Y RESUMEN */}
      <div className="bg-[#050404] bg-dots-pattern border border-oro/20 rounded-2xl p-6 gold-border-corner shadow-2xl">
        <div className="mb-6 border-b border-arena/10 pb-3 flex justify-between items-center">
          <div>
            <span className="text-xs font-sans text-turquesa font-semibold uppercase tracking-wider">
              REGISTRO DE ARQUEO DIARIO
            </span>
            <h3 className="font-display text-2xl text-blanco">
              FECHA: {fechaHoy}
            </h3>
          </div>
          <span className="text-xs font-serif italic text-arena/60">
            Ingresa los valores contados físicamente al terminar la jornada
          </span>
        </div>

        <form onSubmit={handleSaveCierre} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-arena uppercase font-semibold flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-turquesa" />
                <span>Efectivo Físico ($)</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={efectivo}
                onChange={(e) => setEfectivo(parseFloat(e.target.value) || 0)}
                className="bg-carbon border border-arena/20 rounded-lg px-3 py-2.5 text-base font-display text-oro focus:border-turquesa focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-arena uppercase font-semibold flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-turquesa" />
                <span>Transferencias ($)</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={transferencia}
                onChange={(e) => setTransferencia(parseFloat(e.target.value) || 0)}
                className="bg-carbon border border-arena/20 rounded-lg px-3 py-2.5 text-base font-display text-oro focus:border-turquesa focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-arena uppercase font-semibold flex items-center gap-1.5">
                <Store className="w-4 h-4 text-turquesa" />
                <span>Depósitos OXXO ($)</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={oxxo}
                onChange={(e) => setOxxo(parseFloat(e.target.value) || 0)}
                className="bg-carbon border border-arena/20 rounded-lg px-3 py-2.5 text-base font-display text-oro focus:border-turquesa focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-sans text-arena uppercase font-semibold">
              Notas de Conciliación / Observaciones
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Faltaron $50 pesos por vueltas entregadas sin registrar..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="bg-carbon border border-arena/20 rounded-lg p-3 text-xs text-blanco focus:border-turquesa focus:outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-arena/10">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-sans text-arena/60 uppercase">Total Real Contado:</span>
                <span className="font-display text-3xl text-oro">${totalReal.toFixed(0)}</span>
              </div>
              <div className="h-8 w-[1px] bg-arena/20" />
              <div className="flex flex-col">
                <span className="text-[10px] font-sans text-arena/60 uppercase">Diferencia Final:</span>
                <span
                  className={`font-display text-3xl ${
                    diferencia >= 0 ? 'text-turquesa' : 'text-coral'
                  }`}
                >
                  {diferencia >= 0 ? '+' : ''}${diferencia.toFixed(0)}
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
                  <span>GUARDAR CIERRE EN SISTEMA</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* HISTORIAL DE CIERRES CON LISTROW (PATRÓN 2) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-arena/10 pb-3">
          <History className="w-5 h-5 text-oro" />
          <h3 className="font-display text-2xl text-blanco tracking-wide">
            HISTORIAL DE CIERRES ANTERIORES (PATRÓN 2)
          </h3>
        </div>

        {cierres.length > 0 ? (
          <div className="flex flex-col gap-3">
            {cierres.map((cierre) => (
              <ListRow
                key={cierre.id || cierre.fecha}
                title={`Cierre de Caja — ${cierre.fecha}`}
                subtitle={`Efectivo: $${cierre.total_efectivo} · Transf: $${cierre.total_transferencia} · OXXO: $${cierre.total_oxxo}`}
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
    </div>
  )
}
