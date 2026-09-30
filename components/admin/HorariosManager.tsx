'use client'

import React, { useState } from 'react'
import {
  ConfigHorariosNegocio,
  DiaHorario,
  DatosSucursal,
  saveConfigHorariosNegocio,
} from '@/lib/actions/negocioEstado'
import { DEFAULT_SUCURSAL } from '@/lib/types/database'

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
  MapPin,
  Phone,
  Wifi,
  DollarSign,
  Building2,
  Compass,
  FileText,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'

interface HorariosManagerProps {
  initialConfig: ConfigHorariosNegocio
}

export function HorariosManager({ initialConfig }: HorariosManagerProps) {
  const [activeTab, setActiveTab] = useState<'horarios' | 'sucursal'>('horarios')
  const [config, setConfig] = useState<ConfigHorariosNegocio>({
    ...initialConfig,
    sucursal: initialConfig.sucursal || DEFAULT_SUCURSAL,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const sucursalData = config.sucursal || DEFAULT_SUCURSAL

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

  const handleSucursalChange = (field: keyof DatosSucursal, value: any) => {
    setConfig((prev) => ({
      ...prev,
      sucursal: {
        ...(prev.sucursal || DEFAULT_SUCURSAL),
        [field]: value,
      },
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
      console.error('Error al guardar configuración:', err)
      alert('Ocurrió un error al guardar la configuración de horarios y sucursal.')
    } finally {
      setIsSaving(false)
    }
  }

  const diasAbiertosCount = config.horarios_dias.filter((d) => d.abierto).length

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 text-negro dark:text-blanco transition-colors">
      {/* 1. CABECERA PRINCIPAL BENTO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-sans uppercase tracking-wider font-bold bg-[#2ABFBF] text-black px-2.5 py-0.5 rounded-full">
              Operación & Sucursal
            </span>
            <span className="text-xs text-negro/60 dark:text-arena/60 font-sans font-medium">
              Horarios, Apertura & Datos del Negocio
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco tracking-wide">
            HORARIOS & SUCURSAL
          </h1>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-[#2ABFBF] text-black hover:bg-[#2ABFBF]/90 font-sans font-bold text-xs tracking-wider px-6 py-3.5 rounded-2xl shadow-md transition-all flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>GUARDANDO CAMBIOS...</span>
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
        <div className="bg-[#16A34B]/10 border border-[#16A34B]/30 rounded-2xl p-4 flex items-center gap-3 text-[#16A34B] animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-sans font-bold text-sm">
            ¡Configuración de horarios y sucursal guardada correctamente en la base de datos!
          </span>
        </div>
      )}

      {/* 2. KPIS BENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estado Operativo */}
        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-negro/50 dark:text-arena/50">
              Estado de Servicio
            </span>
            <div className={`p-2 rounded-xl ${config.abierto_manual ? 'bg-[#16A34B]/15 text-[#16A34B]' : 'bg-coral/15 text-coral'}`}>
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`font-display text-2xl font-bold ${config.abierto_manual ? 'text-[#16A34B]' : 'text-coral'}`}>
              {config.abierto_manual ? 'ABIERTO (EN VIVO)' : 'CERRADO (PAUSADO)'}
            </div>
            <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
              {config.modo_automatico ? 'Modo reloj automático' : 'Modo manual activo'}
            </div>
          </div>
        </div>

        {/* Días Operativos */}
        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#2ABFBF]">
              Días de Atención
            </span>
            <div className="p-2 rounded-xl bg-[#2ABFBF]/10 text-[#2ABFBF]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-[#2ABFBF]">
              {diasAbiertosCount} / 7 días
            </div>
            <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
              Atención semanal programada
            </div>
          </div>
        </div>

        {/* Teléfono WhatsApp */}
        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#25D366]">
              WhatsApp Pedidos
            </span>
            <div className="p-2 rounded-xl bg-[#25D366]/10 text-[#25D366]">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-mono text-xl font-bold text-negro dark:text-blanco truncate">
              +52 {sucursalData.telefono_whatsapp}
            </div>
            <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
              Recepción oficial de comandas
            </div>
          </div>
        </div>

        {/* Zona Horaria */}
        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#C9A84C]">
              Zona Horaria
            </span>
            <div className="p-2 rounded-xl bg-[#C9A84C]/10 text-[#C9A84C]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-xl font-bold text-[#C9A84C]">
              Sinaloa (GMT-7)
            </div>
            <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
              America/Mazatlan
            </div>
          </div>
        </div>
      </div>

      {/* 3. PESTAÑAS BENTO */}
      <div className="grid grid-cols-2 gap-2 bg-black/[0.03] dark:bg-white/[0.03] p-1.5 rounded-[22px] border border-black/[0.08] dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => setActiveTab('horarios')}
          className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-sans font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'horarios'
              ? 'bg-[#2ABFBF] text-black shadow-sm'
              : 'text-negro/70 dark:text-arena/70 hover:text-negro dark:hover:text-blanco'
            }`}
        >
          <Clock className="w-4 h-4" />
          <span>HORARIOS & APERTURA EN VIVO</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sucursal')}
          className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-sans font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'sucursal'
              ? 'bg-[#C9A84C] text-black shadow-sm'
              : 'text-negro/70 dark:text-arena/70 hover:text-negro dark:hover:text-blanco'
            }`}
        >
          <Building2 className="w-4 h-4" />
          <span>DATOS DE LA SUCURSAL & CONTACTO</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: HORARIOS & APERTURA EN VIVO                   */}
      {/* ======================================================== */}
      {activeTab === 'horarios' && (
        <div className="flex flex-col gap-6">
          {/* CARD 1: CONTROL MAESTRO DE APERTURA */}
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <Store className="w-5 h-5 text-[#2ABFBF]" />
                <h2 className="font-display text-2xl text-negro dark:text-blanco font-bold">
                  1. Control Maestro de Apertura
                </h2>
              </div>
              <span className="text-[10px] font-sans font-bold uppercase text-[#2ABFBF] tracking-wider bg-[#2ABFBF]/10 px-3 py-1 rounded-full border border-[#2ABFBF]/30">
                Apertura Directa
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-sans font-bold uppercase text-negro/80 dark:text-arena/80">
                  Estado de Servicio en Tiempo Real:
                </span>
                <p className="text-xs font-sans text-negro/60 dark:text-arena/60 font-medium leading-relaxed">
                  Enciende o pausa la recepción de pedidos en la tienda web y menú QR en cualquier momento con un solo clic.
                </p>
              </div>

              <div className="flex items-center justify-start md:justify-end">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, abierto_manual: !config.abierto_manual })}
                  className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-sans font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer ${config.abierto_manual
                      ? 'bg-[#16A34B] text-white shadow-[#16A34B]/20'
                      : 'bg-coral text-white shadow-coral/20'
                    }`}
                >
                  {config.abierto_manual ? (
                    <>
                      <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                      <Store className="w-5 h-5" />
                      <span>RESTAURANTE ABIERTO (EN SERVICIO)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>RESTAURANTE CERRADO (PAUSADO)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mensaje de cerrado */}
            <div className="flex flex-col gap-1.5 border-t border-black/[0.08] dark:border-white/[0.08] pt-4">
              <label className="text-xs font-sans font-bold uppercase text-negro/80 dark:text-arena/80">
                Mensaje personalizado para comensales cuando esté cerrado:
              </label>
              <textarea
                rows={2}
                value={config.mensaje_cerrado}
                onChange={(e) => setConfig({ ...config, mensaje_cerrado: e.target.value })}
                placeholder="Ej. Por el momento nuestro restaurante se encuentra cerrado. Regresa pronto dentro de nuestro horario de servicio..."
                className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl p-3.5 text-xs text-negro dark:text-blanco font-sans font-medium focus:border-[#2ABFBF] focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* CARD 2: MODO DE AUTOMATIZACIÓN POR ZONA HORARIA */}
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-[#C9A84C]" />
                <h2 className="font-display text-2xl text-negro dark:text-blanco font-bold">
                  2. Modo de Apertura Automática por Reloj
                </h2>
              </div>
              <span className="text-[10px] font-sans font-bold uppercase text-[#C9A84C] tracking-wider bg-[#C9A84C]/10 px-3 py-1 rounded-full border border-[#C9A84C]/30">
                Horario Sinaloa
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setConfig({ ...config, modo_automatico: false })}
                className={`p-5 rounded-2xl border cursor-pointer flex flex-col gap-2 transition-all ${!config.modo_automatico
                    ? 'bg-[#2ABFBF]/10 border-[#2ABFBF] shadow-sm'
                    : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 hover:border-black/20'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-sm text-negro dark:text-blanco">
                    Modo Manual Directo (Recomendado)
                  </span>
                  {!config.modo_automatico && (
                    <CheckCircle2 className="w-4 h-4 text-[#2ABFBF]" />
                  )}
                </div>
                <p className="text-xs text-negro/60 dark:text-arena/60 font-sans font-medium leading-relaxed">
                  El estado lo decides únicamente tú con el botón maestro de encendido/apagado de arriba.
                </p>
              </div>

              <div
                onClick={() => setConfig({ ...config, modo_automatico: true })}
                className={`p-5 rounded-2xl border cursor-pointer flex flex-col gap-2 transition-all ${config.modo_automatico
                    ? 'bg-[#2ABFBF]/10 border-[#2ABFBF] shadow-sm'
                    : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 hover:border-black/20'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-sm text-negro dark:text-blanco">
                    Modo Automático por Horarios
                  </span>
                  {config.modo_automatico && (
                    <CheckCircle2 className="w-4 h-4 text-[#2ABFBF]" />
                  )}
                </div>
                <p className="text-xs text-negro/60 dark:text-arena/60 font-sans font-medium leading-relaxed">
                  Evalúa la hora oficial en Mazatlán (GMT-7) y abre/cierra automáticamente según la tabla inferior.
                </p>
              </div>
            </div>
          </div>

          {/* CARD 3: TABLA DE HORARIOS SEMANALES */}
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-coral" />
                <h2 className="font-display text-2xl text-negro dark:text-blanco font-bold">
                  3. Horario Semanal de Lunes a Domingo
                </h2>
              </div>
              <span className="text-[10px] font-sans font-bold uppercase text-negro/60 dark:text-arena/60 tracking-wider bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full border border-black/10 dark:border-white/10">
                America/Mazatlan (-07:00)
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {config.horarios_dias.map((dia) => (
                <div
                  key={dia.id}
                  className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all font-sans ${dia.abierto
                      ? 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] hover:border-[#2ABFBF]/40'
                      : 'bg-black/[0.01] dark:bg-white/[0.01] border-black/5 dark:border-white/5 opacity-50'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-[160px]">
                    <button
                      type="button"
                      onClick={() => handleToggleDia(dia.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${dia.abierto
                          ? 'bg-[#16A34B] text-white'
                          : 'bg-black/10 dark:bg-white/10 text-negro/40 dark:text-arena/40'
                        }`}
                    >
                      {dia.abierto ? '✓' : ''}
                    </button>
                    <span className="font-bold text-sm text-negro dark:text-blanco">
                      {dia.nombre}
                    </span>
                  </div>

                  {dia.abierto ? (
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-negro/60 dark:text-arena/60 uppercase font-bold">Apertura:</span>
                        <input
                          type="time"
                          value={dia.apertura}
                          onChange={(e) => handleTimeChange(dia.id, 'apertura', e.target.value)}
                          className="bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-sans font-medium text-negro dark:text-blanco focus:border-[#2ABFBF] focus:outline-none"
                        />
                      </div>

                      <span className="text-negro/30 dark:text-arena/30 font-bold">—</span>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-negro/60 dark:text-arena/60 uppercase font-bold">Cierre:</span>
                        <input
                          type="time"
                          value={dia.cierre}
                          onChange={(e) => handleTimeChange(dia.id, 'cierre', e.target.value)}
                          className="bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-sans font-medium text-negro dark:text-blanco focus:border-[#2ABFBF] focus:outline-none"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: DATOS DE LA SUCURSAL & NEGOCIO                */}
      {/* ======================================================== */}
      {activeTab === 'sucursal' && (
        <div className="flex flex-col gap-6 font-sans">
          {/* IDENTIDAD & CONTACTO OFICIAL */}
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#C9A84C]" />
                <h2 className="font-display text-2xl text-negro dark:text-blanco font-bold">
                  Identidad & Contacto de la Sucursal
                </h2>
              </div>
              <span className="text-[10px] font-sans font-bold uppercase text-[#C9A84C] tracking-wider bg-[#C9A84C]/10 px-3 py-1 rounded-full border border-[#C9A84C]/30">
                Matriz Mazatlán
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80">
                  Nombre Comercial del Restaurante *
                </label>
                <input
                  type="text"
                  required
                  value={sucursalData.nombre_sucursal}
                  onChange={(e) => handleSucursalChange('nombre_sucursal', e.target.value)}
                  placeholder="Marea Negra - Aguachiles"
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-medium focus:border-[#C9A84C] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80">
                  Slogan o Giro
                </label>
                <input
                  type="text"
                  value={sucursalData.slogan}
                  onChange={(e) => handleSucursalChange('slogan', e.target.value)}
                  placeholder="Aguachiles"
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-medium focus:border-[#C9A84C] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80 flex items-center justify-between">
                  <span>Teléfono WhatsApp para Pedidos *</span>
                  <a
                    href={`https://wa.me/52${sucursalData.telefono_whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#25D366] font-bold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Probar Chat</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="tel"
                  required
                  value={sucursalData.telefono_whatsapp}
                  onChange={(e) => handleSucursalChange('telefono_whatsapp', e.target.value.replace(/\D/g, ''))}
                  placeholder="6691234567"
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-negro dark:text-blanco focus:border-[#2ABFBF] focus:outline-none font-bold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80">
                  Teléfono Fijo / Sucursal (Opcional)
                </label>
                <input
                  type="tel"
                  value={sucursalData.telefono_fijo || ''}
                  onChange={(e) => handleSucursalChange('telefono_fijo', e.target.value)}
                  placeholder="6699876543"
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-negro dark:text-blanco focus:border-[#C9A84C] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* UBICACIÓN & DELIVERY */}
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-coral" />
                <h2 className="font-display text-2xl text-negro dark:text-blanco font-bold">
                  Ubicación Física & Cobertura
                </h2>
              </div>
              <span className="text-[10px] font-sans font-bold uppercase text-coral tracking-wider bg-coral/10 px-3 py-1 rounded-full border border-coral/30">
                Delivery & Google Maps
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80">
                  Dirección Completa *
                </label>
                <input
                  type="text"
                  required
                  value={sucursalData.direccion}
                  onChange={(e) => handleSucursalChange('direccion', e.target.value)}
                  placeholder="Av. del Mar #1200, Fracc. Tellerías"
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-medium focus:border-coral focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80">
                  Colonia / Fraccionamiento
                </label>
                <input
                  type="text"
                  value={sucursalData.colonia || ''}
                  onChange={(e) => handleSucursalChange('colonia', e.target.value)}
                  placeholder="Tellerías"
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-medium focus:border-coral focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80">
                  Ciudad & Estado
                </label>
                <input
                  type="text"
                  value={sucursalData.ciudad}
                  onChange={(e) => handleSucursalChange('ciudad', e.target.value)}
                  placeholder="Mazatlán, Sinaloa, México"
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-medium focus:border-coral focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80 flex items-center justify-between">
                  <span>Enlace de Google Maps (Ubicación en GPS)</span>
                  {sucursalData.google_maps_url && (
                    <a
                      href={sucursalData.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-coral font-bold inline-flex items-center gap-1 hover:underline"
                    >
                      <span>Abrir Mapa</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </label>
                <input
                  type="url"
                  value={sucursalData.google_maps_url || ''}
                  onChange={(e) => handleSucursalChange('google_maps_url', e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-medium focus:border-coral focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80">
                  Radio de Cobertura Delivery (km)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={sucursalData.radio_cobertura_km || 10}
                  onChange={(e) => handleSucursalChange('radio_cobertura_km', Number(e.target.value))}
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-medium focus:border-coral focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80">
                  Costo Base de Envío ($ MXN)
                </label>
                <input
                  type="number"
                  min="0"
                  value={sucursalData.costo_envio_base || 40}
                  onChange={(e) => handleSucursalChange('costo_envio_base', Number(e.target.value))}
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-medium focus:border-coral focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* AMENIDADES: WIFI & DATOS FISCALES */}
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <Wifi className="w-5 h-5 text-[#2ABFBF]" />
                <h2 className="font-display text-2xl text-negro dark:text-blanco font-bold">
                  WiFi de la Sucursal & Datos Fiscales
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80">
                  Nombre de Red WiFi (SSID)
                </label>
                <input
                  type="text"
                  value={sucursalData.wifi_red || ''}
                  onChange={(e) => handleSucursalChange('wifi_red', e.target.value)}
                  placeholder="MareaNegra_Invitados"
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-medium focus:border-[#2ABFBF] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80">
                  Contraseña WiFi
                </label>
                <input
                  type="text"
                  value={sucursalData.wifi_password || ''}
                  onChange={(e) => handleSucursalChange('wifi_password', e.target.value)}
                  placeholder="AguachileNegro2026"
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-negro dark:text-blanco focus:border-[#2ABFBF] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-negro/80 dark:text-arena/80">
                  RFC del Negocio (Opcional)
                </label>
                <input
                  type="text"
                  value={sucursalData.rfc || ''}
                  onChange={(e) => handleSucursalChange('rfc', e.target.value.toUpperCase())}
                  placeholder="MNE240101XYZ"
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono uppercase text-negro dark:text-blanco focus:border-[#2ABFBF] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTÓN FINAL DE GUARDAR */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto bg-[#2ABFBF] text-black hover:bg-[#2ABFBF]/90 font-sans font-bold text-xs tracking-wider px-8 py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>GUARDANDO CAMBIOS...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>GUARDAR CONFIGURACIÓN DE HORARIOS & SUCURSAL</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
