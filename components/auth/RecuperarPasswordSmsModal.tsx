'use client'

import React, { useState, useEffect } from 'react'
import {
  solicitarOtpRecuperacionGratis,
  verificarOtpYCambiarPasswordGratis,
  verificarCumpleanosYCambiarPassword,
} from '@/lib/actions/clienteCuenta'
import { validatePasswordStrength } from '@/lib/security/passwordHash'
import { useWhatsAppSupport } from '@/lib/hooks/useWhatsAppSupport'
import {
  Phone,
  ShieldCheck,
  Check,
  AlertCircle,
  X,
  Loader2,
  KeyRound,
  MessageSquare,
  Cake,
  ArrowRight,
  Eye,
  EyeOff,
  MessageCircle,
  Send,
  Sparkles,
} from 'lucide-react'

interface RecuperarPasswordSmsModalProps {
  isOpen: boolean
  onClose: () => void
  initialPhone?: string
}

export function RecuperarPasswordSmsModal({
  isOpen,
  onClose,
  initialPhone = '',
}: RecuperarPasswordSmsModalProps) {
  const { openWhatsApp } = useWhatsAppSupport()

  const [metodo, setMetodo] = useState<'whatsapp' | 'cumpleanos'>('whatsapp')
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [telefono, setTelefono] = useState(initialPhone.replace(/\D/g, ''))
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null)

  useEffect(() => {
    if (initialPhone) {
      setTelefono(initialPhone.replace(/\D/g, ''))
    }
  }, [initialPhone])

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setOtpCode('')
      setNuevaPassword('')
      setConfirmPassword('')
      setFechaNacimiento('')
      setErrorMsg(null)
      setCodigoGenerado(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const strength = validatePasswordStrength(nuevaPassword)

  // 1. SOLICITAR CÓDIGO POR WHATSAPP (100% GRATIS)
  const handleSolicitarOtpWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const cleanPhone = telefono.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Ingresa tu número celular de 10 dígitos.')
      return
    }

    setLoading(true)
    try {
      const res = await solicitarOtpRecuperacionGratis(cleanPhone)
      if (res.success && res.codigo) {
        setCodigoGenerado(res.codigo)
        // Abrir WhatsApp con el código pre-armado
        if (res.waMensaje) {
          openWhatsApp(res.waMensaje)
        }
        setStep(2)
      } else {
        setErrorMsg(res.error || 'No se pudo generar el código.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  // 2. VERIFICAR CÓDIGO OTP
  const handleVerificarCodigoOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const cleanCode = otpCode.trim().replace(/\D/g, '')
    if (cleanCode.length !== 6) {
      setErrorMsg('Ingresa el código de 6 dígitos que recibiste.')
      return
    }

    setStep(3)
  }

  // 3. VERIFICAR POR CUMPLEAÑOS DIRECTO (0 MENSAJES / 0 COSTO)
  const handleVerificarCumpleanos = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!telefono || telefono.length < 10) {
      setErrorMsg('Ingresa tu número celular de 10 dígitos.')
      return
    }

    if (!fechaNacimiento) {
      setErrorMsg('Selecciona tu fecha de cumpleaños.')
      return
    }

    setStep(3)
  }

  // 4. GUARDAR NUEVA CONTRASEÑA
  const handleGuardarNuevaPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!strength.isValid) {
      setErrorMsg('La nueva contraseña debe cumplir con los 4 requisitos de seguridad.')
      return
    }

    if (nuevaPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      let res
      if (metodo === 'whatsapp') {
        res = await verificarOtpYCambiarPasswordGratis(telefono, otpCode, nuevaPassword)
      } else {
        res = await verificarCumpleanosYCambiarPassword(telefono, fechaNacimiento, nuevaPassword)
      }

      if (res.success) {
        setStep(4)
      } else {
        setErrorMsg(res.error || 'Error al actualizar contraseña.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0D0907] border border-arena/30 dark:border-oro/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative gold-border-corner transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-negro/60 dark:text-arena/60 hover:text-coral rounded-full hover:bg-arena/20 dark:hover:bg-carbon transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-arena/20 dark:border-arena/10 pb-4 mb-5">
          <div className="p-3 bg-turquesa/10 border border-turquesa/30 rounded-2xl text-turquesa shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-widest">
              RECUPERACIÓN DE CUENTA
            </span>
            <h3 className="font-display text-2xl sm:text-3xl text-negro dark:text-blanco tracking-wide">
              RESTABLECER CLAVE
            </h3>
          </div>
        </div>

        {/* SELECTOR DE MÉTODO EN PASO 1 */}
        {step === 1 && (
          <div className="flex bg-[#F4F0E8] dark:bg-carbon p-1 rounded-2xl border border-arena/20 mb-4">
            <button
              type="button"
              onClick={() => {
                setMetodo('whatsapp')
                setErrorMsg(null)
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-all ${
                metodo === 'whatsapp'
                  ? 'bg-turquesa text-negro shadow-md'
                  : 'text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMetodo('cumpleanos')
                setErrorMsg(null)
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-all ${
                metodo === 'cumpleanos'
                  ? 'bg-oro text-negro shadow-md'
                  : 'text-negro/60 dark:text-arena/60 hover:text-negro dark:hover:text-blanco'
              }`}
            >
              <Cake className="w-3.5 h-3.5" />
              <span>Por Cumpleaños</span>
            </button>
          </div>
        )}

        {/* PASO 1A: POR WHATSAPP */}
        {step === 1 && metodo === 'whatsapp' && (
          <form onSubmit={handleSolicitarOtpWhatsApp} className="flex flex-col gap-4">
            <p className="font-serif italic text-xs text-negro/70 dark:text-arena/70">
              Generaremos un <strong>código de 6 dígitos</strong> y lo enviaremos por WhatsApp a tu celular para verificar que eres el titular.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-turquesa" />
                <span>Número Celular (10 Dígitos) *</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="Ej. 6671234567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3.5 text-base font-mono text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div className="bg-coral/10 border border-coral/30 text-coral p-3 rounded-xl text-xs font-sans font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || telefono.length < 10}
              className="bg-turquesa text-negro font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>GENERANDO CÓDIGO...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>RECIBIR CÓDIGO POR WHATSAPP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* PASO 1B: POR FECHA DE CUMPLEAÑOS (INMEDIATO) */}
        {step === 1 && metodo === 'cumpleanos' && (
          <form onSubmit={handleVerificarCumpleanos} className="flex flex-col gap-4">
            <p className="font-serif italic text-xs text-negro/70 dark:text-arena/70">
              Verifica tu identidad de forma instantánea ingresando tu <strong>fecha de cumpleaños</strong> registrada en el Club.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-oro" />
                <span>Número Celular *</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="Ej. 6671234567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-sm font-mono text-negro dark:text-blanco focus:border-oro focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                <Cake className="w-4 h-4 text-oro" />
                <span>Fecha de Cumpleaños *</span>
              </label>
              <input
                type="date"
                required
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco focus:border-oro focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div className="bg-coral/10 border border-coral/30 text-coral p-3 rounded-xl text-xs font-sans font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={telefono.length < 10 || !fechaNacimiento}
              className="bg-oro text-negro font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg hover:bg-blanco transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-40"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>CONTINUAR A NUEVA CLAVE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* PASO 2: INGRESAR CÓDIGO OTP */}
        {step === 2 && (
          <form onSubmit={handleVerificarCodigoOtp} className="flex flex-col gap-4 animate-in fade-in">
            <div className="p-3 bg-turquesa/10 border border-turquesa/30 rounded-xl text-xs text-negro/80 dark:text-arena/90 flex items-center justify-between">
              <span>Código enviado a: <strong>+52 {telefono}</strong></span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-turquesa font-bold hover:underline"
              >
                Cambiar
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90">
                Ingresa el Código de 6 Dígitos *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3.5 text-2xl font-mono text-center tracking-[0.4em] text-negro dark:text-turquesa focus:border-turquesa focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div className="bg-coral/10 border border-coral/30 text-coral p-3 rounded-xl text-xs font-sans font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={otpCode.length !== 6}
              className="bg-turquesa text-negro font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>VALIDAR CÓDIGO</span>
            </button>
          </form>
        )}

        {/* PASO 3: INGRESAR NUEVA CONTRASEÑA */}
        {step === 3 && (
          <form onSubmit={handleGuardarNuevaPassword} className="flex flex-col gap-4 animate-in fade-in">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-400 font-sans font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>¡Identidad verificada exitosamente!</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center justify-between">
                <span>Nueva Contraseña *</span>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-negro/50 dark:text-arena/50 hover:text-coral text-[11px] flex items-center gap-1"
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPass ? 'Ocultar' : 'Ver'}</span>
                </button>
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Ingresa tu nueva contraseña"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
              />

              {/* Medidor de Requisitos */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-sans pt-1">
                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${
                    strength.hasMinLength
                      ? 'bg-emerald-100 dark:bg-turquesa/15 border-emerald-300 dark:border-turquesa/40 text-emerald-900 dark:text-turquesa font-bold'
                      : 'bg-arena/10 border-arena/20 text-negro/60 dark:text-arena/60'
                  }`}
                >
                  {strength.hasMinLength ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>Mínimo 8 caracteres</span>
                </div>

                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${
                    strength.hasUppercase
                      ? 'bg-emerald-100 dark:bg-turquesa/15 border-emerald-300 dark:border-turquesa/40 text-emerald-900 dark:text-turquesa font-bold'
                      : 'bg-arena/10 border-arena/20 text-negro/60 dark:text-arena/60'
                  }`}
                >
                  {strength.hasUppercase ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Mayúscula (A-Z)</span>
                </div>

                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${
                    strength.hasLowercase
                      ? 'bg-emerald-100 dark:bg-turquesa/15 border-emerald-300 dark:border-turquesa/40 text-emerald-900 dark:text-turquesa font-bold'
                      : 'bg-arena/10 border-arena/20 text-negro/60 dark:text-arena/60'
                  }`}
                >
                  {strength.hasLowercase ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Minúscula (a-z)</span>
                </div>

                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${
                    strength.hasNumber
                      ? 'bg-emerald-100 dark:bg-turquesa/15 border-emerald-300 dark:border-turquesa/40 text-emerald-900 dark:text-turquesa font-bold'
                      : 'bg-arena/10 border-arena/20 text-negro/60 dark:text-arena/60'
                  }`}
                >
                  {strength.hasNumber ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Número (0-9)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90">
                Confirmar Contraseña *
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div className="bg-coral/10 border border-coral/30 text-coral p-3 rounded-xl text-xs font-sans font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !strength.isValid || !confirmPassword}
              className="bg-turquesa text-negro font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>GUARDANDO...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>RESTABLECER Y ACCEDER</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* PASO 4: CONFIRMACIÓN EXITOSA */}
        {step === 4 && (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center flex flex-col items-center gap-3 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/40">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <span className="font-display text-3xl text-emerald-600 dark:text-emerald-400 tracking-wider">
              ¡CONTRASEÑA ACTUALIZADA!
            </span>
            <p className="text-xs font-sans text-negro/80 dark:text-arena/90 leading-relaxed">
              Tu contraseña ha sido restablecida con éxito. Ya puedes ingresar con tu nueva clave.
            </p>
            <button
              onClick={onClose}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs py-3.5 px-6 rounded-xl shadow-lg transition-all"
            >
              INICIAR SESIÓN AHORA
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
