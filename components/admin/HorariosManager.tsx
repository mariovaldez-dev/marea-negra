'use client'

import React, { useState } from 'react'
import {
  ConfigHorariosNegocio,
  DiaHorario,
  saveConfigHorariosNegocio,
} from '@/lib/actions/negocioEstado'
import {
  Clock,
  Store,
  Lock,
  Sparkles,
  Save,
  CheckCircle2,
  Loader2,
  Calendar,
  AlertTriangle,
  Radio,
} from 'lucide-react'

interface HorariosManagerProps {
  initialConfig: ConfigHorariosNegocio
}

export function HorariosManager({ initialConfig }: HorariosManagerProps) {
  const [config, setConfig] = useState<ConfigHorariosNegocio>(initialConfig)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleToggleDia = (diaId: string) => {
    setConfig((prev) => ({
      ...prev,
      horarios_dias: prev.horarios_dias.map((d) =>
        d.id === diaId ? { ...d, abierto: !d.abierto } : d
      ),
    }))
  }

  const handleTimeChange = (
    diaId: string,
    field: 'apertura' | 'cierre',
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      horarios_dias: prev.horarios_dias.map((d) =>
        d.id === diaId ? { ...d, [field]: value } : d
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      await saveConfigHorariosNegocio(config)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      console.error('Error al guardar horarios:', err)
      alert('Ocurrió un error al guardar la configuración de horarios.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-5xl relative">
      {/* Header Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/10 pb-4">
        <div>
          <span className="text-xs font-sans font-semibold tracking-widest text-turquesa uppercase flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>OPERACIÓN DE SUCURSAL & HORARIOS</span>
          </span>
          <h1 className="font-display text-4xl text-blanco tracking-wide mt-1">
            CONTROL DE HORARIOS Y APERTURA
          </h1>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider px-6 py-3.5 rounded-full shadow-[0_0_20px_rgba(42,191,191,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>GUARDANDO...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>GUARDAR CONFIGURACIÓN</span>
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-turquesa/20 border-2 border-turquesa/50 rounded-2xl p-4 flex items-center gap-3 text-turquesa animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <span className="font-sans font-bold text-sm">
            ¡Configuración de horarios y estado guardada correctamente!
          </span>
        </div>
      )}

      {/* CARD 1: CONTROL MAESTRO DE APERTURA MANUAL */}
      <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/30 rounded-3xl p-6 md:p-8 gold-border-corner shadow-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-arena/10 pb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-oro" />
            <h2 className="font-display text-2xl text-blanco tracking-wider">
              1. CONTROL MAESTRO DEL RESTAURANTE
            </h2>
          </div>
          <span className="text-[10px] font-sans font-bold uppercase text-turquesa tracking-widest bg-turquesa/10 px-3 py-1 rounded-full border border-turquesa/30">
            APERTURA DIRECTA
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-sans font-bold uppercase text-arena/90">
              Estado de Servicio Actual:
            </span>
            <p className="text-xs font-sans text-arena/60 leading-relaxed">
              Puedes encender o apagar manualmente la recepción de pedidos en cualquier momento.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfig({ ...config, abierto_manual: !config.abierto_manual })}
              className={`px-6 py-4 rounded-2xl font-sans font-bold text-xs md:text-sm flex items-center gap-3 transition-all border shadow-xl cursor-pointer ${
                config.abierto_manual
                  ? 'bg-turquesa text-negro border-turquesa shadow-[0_0_20px_rgba(42,191,191,0.3)]'
                  : 'bg-coral text-blanco border-coral shadow-[0_0_20px_rgba(232,67,10,0.3)]'
              }`}
            >
              {config.abierto_manual ? (
                <>
                  <span className="w-3 h-3 rounded-full bg-negro animate-ping" />
                  <Store className="w-5 h-5" />
                  <span>🟢 RESTAURANTE ABIERTO (EN SERVICIO)</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>🔴 RESTAURANTE CERRADO (PAUSADO)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mensaje de cerrado personalizado */}
        <div className="flex flex-col gap-2 border-t border-arena/10 pt-4">
          <label className="text-xs font-sans font-bold uppercase text-arena/90">
            Mensaje Personalizado cuando el Restaurante esté Cerrado:
          </label>
          <textarea
            rows={2}
            value={config.mensaje_cerrado}
            onChange={(e) => setConfig({ ...config, mensaje_cerrado: e.target.value })}
            placeholder="Ej. Por el momento nuestro restaurante se encuentra cerrado. Regresa pronto dentro de nuestro horario de servicio..."
            className="bg-carbon border border-arena/20 rounded-2xl p-4 text-xs text-blanco focus:border-turquesa focus:outline-none leading-relaxed"
          />
        </div>
      </div>

      {/* CARD 2: MODO DE AUTOMATIZACIÓN POR ZONA HORARIA */}
      <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/30 rounded-3xl p-6 md:p-8 gold-border-corner shadow-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-arena/10 pb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-turquesa" />
            <h2 className="font-display text-2xl text-blanco tracking-wider">
              2. MODO DE APERTURA AUTOMÁTICA POR RELOJ
            </h2>
          </div>
          <span className="text-[10px] font-sans font-bold uppercase text-oro tracking-widest bg-oro/10 px-3 py-1 rounded-full border border-oro/30">
            HORARIO SINALOA
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setConfig({ ...config, modo_automatico: false })}
            className={`p-5 rounded-2xl border cursor-pointer flex flex-col gap-2 transition-all ${
              !config.modo_automatico
                ? 'bg-carbon border-turquesa ring-1 ring-turquesa shadow-lg'
                : 'bg-carbon/40 border-arena/20 text-arena/60 hover:border-arena/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-sans font-bold text-sm text-blanco">
                🛠️ MODO MANUAL DIRECTO (RECOMENDADO)
              </span>
              {!config.modo_automatico && (
                <CheckCircle2 className="w-4 h-4 text-turquesa" />
              )}
            </div>
            <p className="text-xs text-arena/70 leading-relaxed">
              El estado lo decides únicamente tú con el botón maestro de encendido/apagado arriba.
            </p>
          </div>

          <div
            onClick={() => setConfig({ ...config, modo_automatico: true })}
            className={`p-5 rounded-2xl border cursor-pointer flex flex-col gap-2 transition-all ${
              config.modo_automatico
                ? 'bg-carbon border-turquesa ring-1 ring-turquesa shadow-lg'
                : 'bg-carbon/40 border-arena/20 text-arena/60 hover:border-arena/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-sans font-bold text-sm text-blanco">
                ⚡ MODO AUTOMÁTICO POR HORARIOS
              </span>
              {config.modo_automatico && (
                <CheckCircle2 className="w-4 h-4 text-turquesa" />
              )}
            </div>
            <p className="text-xs text-arena/70 leading-relaxed">
              Evalúa la hora actual en Sinaloa (America/Mazatlan) y cierra automáticamente fuera de horario.
            </p>
          </div>
        </div>
      </div>

      {/* CARD 3: TABLA DE HORARIOS SEMANALES */}
      <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/30 rounded-3xl p-6 md:p-8 gold-border-corner shadow-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-arena/10 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-coral" />
            <h2 className="font-display text-2xl text-blanco tracking-wider">
              3. HORARIO DE ATENCIÓN DE LUNES A DOMINGO
            </h2>
          </div>
          <span className="text-[10px] font-sans font-bold uppercase text-blanco tracking-widest bg-carbon px-3 py-1 rounded-full border border-arena/20">
            AMERICA/MAZATLAN (-07:00)
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {config.horarios_dias.map((dia) => (
            <div
              key={dia.id}
              className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                dia.abierto
                  ? 'bg-carbon/80 border-arena/20 hover:border-turquesa/50'
                  : 'bg-carbon/30 border-arena/10 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-[150px]">
                <button
                  type="button"
                  onClick={() => handleToggleDia(dia.id)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                    dia.abierto
                      ? 'bg-turquesa text-negro'
                      : 'bg-carbon border border-arena/30 text-arena/40'
                  }`}
                >
                  {dia.abierto ? '✓' : ''}
                </button>
                <span className="font-sans font-bold text-base text-blanco">
                  {dia.nombre}
                </span>
              </div>

              {dia.abierto ? (
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-arena/60 uppercase font-bold">Apertura:</span>
                    <input
                      type="time"
                      value={dia.apertura}
                      onChange={(e) => handleTimeChange(dia.id, 'apertura', e.target.value)}
                      className="bg-carbon border border-arena/30 rounded-xl px-3 py-2 text-xs font-mono text-blanco focus:border-turquesa focus:outline-none"
                    />
                  </div>

                  <span className="text-arena/30 font-mono">—</span>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-arena/60 uppercase font-bold">Cierre:</span>
                    <input
                      type="time"
                      value={dia.cierre}
                      onChange={(e) => handleTimeChange(dia.id, 'cierre', e.target.value)}
                      className="bg-carbon border border-arena/30 rounded-xl px-3 py-2 text-xs font-mono text-blanco focus:border-turquesa focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs font-sans font-bold text-coral uppercase tracking-wider bg-coral/10 px-3 py-1 rounded-full border border-coral/20">
                  CERRADO ESTE DÍA
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider px-8 py-4 rounded-full shadow-[0_0_25px_rgba(42,191,191,0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>GUARDANDO CAMBIOS...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>GUARDAR CONFIGURACIÓN DE HORARIOS</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
