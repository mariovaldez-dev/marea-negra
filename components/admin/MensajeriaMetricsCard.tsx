'use client'

import React, { useState, useEffect } from 'react'
import { getMetricasMensajeria, MetricasMensajeria } from '@/lib/actions/notificationMetrics'
import { probarEnvioMetaWhatsApp } from '@/lib/actions/testWhatsApp'
import {
  MessageSquare,
  Phone,
  ShieldCheck,
  Send,
  Sparkles,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FlaskConical,
  X,
  Loader2,
} from 'lucide-react'

export function MensajeriaMetricsCard() {
  const [metricas, setMetricas] = useState<MetricasMensajeria | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTestModal, setShowTestModal] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const cargarMetricas = async () => {
    setLoading(true)
    try {
      const data = await getMetricasMensajeria()
      setMetricas(data)
    } catch (err) {
      console.error('Error cargando métricas de mensajería:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarMetricas()
  }, [])

  if (loading && !metricas) {
    return (
      <div className="bg-[#050404] bg-dots-pattern border border-oro/15 rounded-3xl p-6 shadow-xl animate-pulse flex items-center justify-center min-h-[160px]">
        <div className="flex items-center gap-3 text-oro text-sm font-sans">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Calculando consumo de mensajes...</span>
        </div>
      </div>
    )
  }

  if (!metricas) return null

  const esWhatsAppSeguro = metricas.totalMesWhatsApp < metricas.limiteGratisWhatsApp
  const esSmsSeguro = metricas.totalMesSms < metricas.limiteGratisSms

  return (
    <div className="bg-[#050404] bg-dots-pattern border border-oro/20 rounded-3xl p-6 sm:p-7 shadow-2xl relative gold-border-corner transition-all">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-arena/10 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-turquesa/10 border border-turquesa/30 rounded-2xl text-turquesa">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-sans font-bold text-turquesa uppercase tracking-widest">
              MONITOR DE CONSUMO MENSUAL
            </span>
            <h3 className="font-display text-2xl text-blanco tracking-wide">
              MENSAJES ENVIADOS (WHATSAPP & SMS)
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setShowTestModal(true)
              setTestResult(null)
            }}
            className="text-xs font-sans bg-turquesa/10 hover:bg-turquesa text-turquesa hover:text-negro font-bold px-3 py-1.5 rounded-xl border border-turquesa/30 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Probar WhatsApp API</span>
          </button>

          <span className="text-[11px] font-sans bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% EN CAPA GRATUITA</span>
          </span>
          <button
            onClick={cargarMetricas}
            disabled={loading}
            className="p-2 text-arena/60 hover:text-oro rounded-lg hover:bg-carbon transition-colors"
            title="Actualizar métricas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid de Medidores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Medidor WhatsApp */}
        <div className="bg-carbon border border-arena/10 rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-bold text-sm text-blanco">WhatsApp (Meta API)</span>
                <span className="text-[10px] text-arena/60">Pedidos listos y campañas marketing</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-turquesa">
              {metricas.totalMesWhatsApp} / {metricas.limiteGratisWhatsApp}
            </span>
          </div>

          {/* Barra de Progreso WhatsApp */}
          <div className="flex flex-col gap-1.5">
            <div className="w-full bg-negro h-3 rounded-full overflow-hidden border border-arena/10 p-0.5">
              <div
                className="bg-gradient-to-r from-emerald-500 to-turquesa h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, metricas.porcentajeWhatsApp)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-sans text-arena/60">
              <span>{metricas.porcentajeWhatsApp}% consumido este mes</span>
              <span>{metricas.limiteGratisWhatsApp - metricas.totalMesWhatsApp} gratis restantes</span>
            </div>
          </div>
        </div>

        {/* Medidor SMS OTP Firebase */}
        <div className="bg-carbon border border-arena/10 rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-turquesa/10 text-turquesa rounded-xl">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-bold text-sm text-blanco">SMS OTP (Google Firebase)</span>
                <span className="text-[10px] text-arena/60">Recuperación de contraseñas de socios</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-oro">
              {metricas.totalMesSms} / {metricas.limiteGratisSms}
            </span>
          </div>

          {/* Barra de Progreso SMS */}
          <div className="flex flex-col gap-1.5">
            <div className="w-full bg-negro h-3 rounded-full overflow-hidden border border-arena/10 p-0.5">
              <div
                className="bg-gradient-to-r from-turquesa to-oro h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, metricas.porcentajeSms)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-sans text-arena/60">
              <span>{metricas.porcentajeSms}% consumido este mes</span>
              <span>{metricas.limiteGratisSms - metricas.totalMesSms} SMS gratis restantes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historial rápido de últimos envíos si existen */}
      {metricas.ultimosEnvios.length > 0 && (
        <div className="mt-5 pt-4 border-t border-arena/10 flex flex-col gap-2">
          <span className="text-[10px] font-sans uppercase font-bold text-arena/60 tracking-wider">
            Últimos mensajes procesados
          </span>
          <div className="flex flex-wrap gap-2">
            {metricas.ultimosEnvios.slice(0, 5).map((envio) => {
              const cleanNum = envio.destinatario || ''
              const masked =
                cleanNum.length >= 10
                  ? `***-***-${cleanNum.slice(-4)}`
                  : cleanNum || 'General'

              return (
                <span
                  key={envio.id}
                  className="text-xs font-mono bg-carbon px-2.5 py-1 rounded-lg border border-arena/10 text-arena/80 flex items-center gap-1.5"
                >
                  <Clock className="w-3 h-3 text-turquesa" />
                  <span>
                    {envio.canal === 'whatsapp_pedido'
                      ? '💬 Pedido Listo'
                      : envio.canal === 'sms_otp'
                      ? '📱 SMS OTP'
                      : '📢 Campaña'}
                  </span>
                  <span className="text-arena/50">({masked})</span>
                </span>
              )
            })}
          </div>
        </div>
      )}
      {/* MODAL DE PRUEBA DE META WHATSAPP API */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="bg-[#0D0907] border border-oro/30 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative gold-border-corner">
            <button
              onClick={() => setShowTestModal(false)}
              className="absolute top-4 right-4 p-2 text-arena hover:text-coral rounded-full hover:bg-carbon transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-arena/10 pb-4 mb-4">
              <div className="p-3 bg-turquesa/10 border border-turquesa/30 rounded-2xl text-turquesa">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-widest">
                  DIAGNÓSTICO OFICIAL
                </span>
                <h3 className="font-display text-2xl text-blanco tracking-wide">
                  PROBAR META WHATSAPP API
                </h3>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setTestLoading(true)
                setTestResult(null)
                try {
                  const res = await probarEnvioMetaWhatsApp(testPhone)
                  setTestResult(res)
                  if (res.success) {
                    cargarMetricas()
                  }
                } catch (err: any) {
                  setTestResult({ success: false, error: err.message })
                } finally {
                  setTestLoading(false)
                }
              }}
              className="flex flex-col gap-4"
            >
              <p className="font-serif italic text-xs text-arena/70">
                Ingresa tu número celular (ej. <strong>6671234567</strong>). Enviaremos un mensaje de prueba oficial desde los servidores de Meta.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-arena flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-turquesa" />
                  <span>Tu Celular (10 Dígitos) *</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="Ej. 6671234567"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                  className="bg-carbon border border-arena/20 rounded-xl px-4 py-3 text-base font-mono text-blanco focus:border-turquesa focus:outline-none"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-sans leading-relaxed ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-2'
                      : 'bg-coral/10 border-coral/30 text-coral flex flex-col gap-1'
                  }`}
                >
                  {testResult.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{testResult.message}</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Error de Meta API:</span>
                      </div>
                      <span>{testResult.error}</span>
                    </>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={testLoading || testPhone.length < 10}
                className="bg-turquesa text-negro font-sans font-bold text-xs tracking-wider py-3.5 rounded-xl shadow-lg hover:bg-blanco transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {testLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ENVIANDO PRUEBA A META...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>ENVIAR MENSAJE DE PRUEBA</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
