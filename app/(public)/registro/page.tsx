'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registrarClienteClub } from '@/lib/actions/clienteCuenta'
import { validatePasswordStrength } from '@/lib/security/passwordHash'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { Gift, Sparkles, ChevronLeft, User, Phone, Mail, CheckCircle2, Copy, Loader2, Ticket, Lock, ShieldCheck, Check, AlertCircle } from 'lucide-react'

export default function RegisterClubPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [personalCoupon, setPersonalCoupon] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [copied, setCopied] = useState(false)

  const passwordStrength = validatePasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // Validar errores individuales por campo
    const errors: Record<string, string> = {}
    if (!nombre.trim()) {
      errors.nombre = 'Por favor ingresa tu nombre completo.'
    }

    const cleanPhone = telefono.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.telefono = 'Ingresa tu número celular de 10 dígitos (ej. 6671234567).'
    }

    if (!passwordStrength.isValid) {
      errors.password = 'La contraseña debe cumplir con los 4 requisitos de seguridad.'
    }

    if (!aceptoPrivacidad) {
      errors.privacidad = 'Debes aceptar el Aviso de Privacidad para unirte al Club.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    try {
      // Registrar cliente en Supabase clientes_club con contraseña encriptada (y crea cupones)
      const resReg = await registrarClienteClub({
        nombre,
        telefono,
        password,
        email,
      })

      if (!resReg.success) {
        setErrorMsg(resReg.error || 'Ocurrió un error al procesar tu registro.')
        return
      }

      const userCouponCode = resReg.welcomeCouponCode || `BIENVENIDO-${nombre.slice(0, 4).toUpperCase()}`
      const refCode = resReg.codigoReferido

      if (typeof window !== 'undefined') {
        localStorage.setItem('marea_cliente_nombre', nombre.trim())
        localStorage.setItem('marea_cliente_telefono', telefono.trim().replace(/\D/g, ''))
        localStorage.setItem('marea_cliente_email', email.trim())
        localStorage.setItem('marea_club_registered', 'true')

        // Guardar cupones personales disponibles para el selector tipo Uber Eats
        const userCoupons = [
          { codigo: userCouponCode, descuento: 10, titulo: 'Tu Cupón Personal de Bienvenida (10% OFF)', tipo: 'bienvenida' },
          { codigo: refCode, descuento: 10, titulo: 'Tu Cupón de Referidos para Amigos (10% OFF)', tipo: 'referidos' }
        ]
        localStorage.setItem('marea_user_coupons', JSON.stringify(userCoupons))
      }

      setPersonalCoupon(userCouponCode)
      setReferralCode(refCode)
      setSubmitted(true)
    } catch (err: any) {
      console.error('Error creando cupones de registro:', err)
      setErrorMsg(err.message || 'Ocurrió un error al procesar tu registro. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/pedir?ref=${referralCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8F6F0] dark:bg-[#080808] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-coral selection:text-white transition-colors duration-300">
      {/* HEADER ADAPTABLE */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#080808]/95 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] px-4 sm:px-6 py-2.5 safe-header transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300 hover:text-coral flex items-center gap-1 py-1.5 px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <BrandLogo size="sm" href="/" />

          <ThemeToggle />
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-10 w-full flex-1 flex flex-col gap-6">
        <div className="text-center flex flex-col gap-2">
          <span className="text-[11px] font-sans font-bold tracking-widest text-[#2ABFBF] uppercase flex items-center justify-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-[#2ABFBF]" />
            <span>CLUB DE LEALTAD & DESCUENTOS</span>
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-neutral-900 dark:text-white tracking-wide">
            ÚNETE AL CLUB MAREA NEGRA
          </h1>
          <p className="font-sans text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Regístrate para recibir tu <span className="font-bold text-[#2ABFBF]">CUPÓN PERSONAL ÚNICO (10% OFF)</span> y tu tarjeta digital VIP.
          </p>
        </div>

        {!submitted ? (
          <form
            noValidate
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col gap-5 transition-colors"
          >
            {/* CAMPO NOMBRE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#2ABFBF]" />
                <span>Nombre Completo *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Mario Valdez"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value)
                  if (fieldErrors.nombre) setFieldErrors({ ...fieldErrors, nombre: '' })
                }}
                className={`w-full bg-black/[0.02] dark:bg-white/[0.04] border rounded-2xl px-4 py-3 text-base text-neutral-900 dark:text-white focus:outline-none ${fieldErrors.nombre ? 'border-coral ring-2 ring-coral/20' : 'border-black/10 dark:border-white/10 focus:border-[#2ABFBF]'
                  }`}
              />
              {fieldErrors.nombre && (
                <span className="text-[11px] font-sans font-bold text-coral flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 text-coral shrink-0" />
                  <span>{fieldErrors.nombre}</span>
                </span>
              )}
            </div>

            {/* CAMPO TELEFONO */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#2ABFBF]" />
                <span>Teléfono Celular WhatsApp *</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="Ej. 6671234567"
                value={telefono}
                onChange={(e) => {
                  setTelefono(e.target.value)
                  if (fieldErrors.telefono) setFieldErrors({ ...fieldErrors, telefono: '' })
                }}
                className={`w-full bg-black/[0.02] dark:bg-white/[0.04] border rounded-2xl px-4 py-3 text-base text-neutral-900 dark:text-white font-mono focus:outline-none ${fieldErrors.telefono ? 'border-coral ring-2 ring-coral/20' : 'border-black/10 dark:border-white/10 focus:border-[#2ABFBF]'
                  }`}
              />
              {fieldErrors.telefono && (
                <span className="text-[11px] font-sans font-bold text-coral flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 text-coral shrink-0" />
                  <span>{fieldErrors.telefono}</span>
                </span>
              )}
            </div>

            {/* CAMPO CONTRASEÑA CON MEDIDOR Y MENSAJE DE ERROR INLINE */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#2ABFBF]" />
                <span>Crea tu Contraseña Segura *</span>
              </label>
              <input
                type="password"
                required
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
                }}
                className={`w-full bg-black/[0.02] dark:bg-white/[0.04] border rounded-2xl px-4 py-3 text-base text-neutral-900 dark:text-white font-sans focus:outline-none ${fieldErrors.password ? 'border-coral ring-2 ring-coral/20' : 'border-black/10 dark:border-white/10 focus:border-[#2ABFBF]'
                  }`}
              />

              {fieldErrors.password && (
                <span className="text-[11px] font-sans font-bold text-coral flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 text-coral shrink-0" />
                  <span>{fieldErrors.password}</span>
                </span>
              )}

              {/* GUÍA DE REQUISITOS SIEMPRE VISIBLE Y MEDIDOR ADAPTABLE DE ALTO CONTRASTE */}
              <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2.5 mt-1">
                <div className="flex justify-between items-center text-xs font-sans font-bold">
                  <span className="text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#2ABFBF]" />
                    <span>Requisitos de Contraseña:</span>
                  </span>
                  <span
                    className={`${passwordStrength.score === 4
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : password.length > 0
                          ? 'text-coral font-bold'
                          : 'text-neutral-400 font-medium'
                      }`}
                  >
                    {password.length === 0
                      ? 'Requerida'
                      : passwordStrength.score === 4
                        ? '¡Excelente! ✓'
                        : 'Incompleta'}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.score === 4
                        ? 'bg-emerald-500'
                        : password.length > 0
                          ? 'bg-coral'
                          : 'bg-transparent'
                      }`}
                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                  />
                </div>

                {/* Lista de 4 Requisitos */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-sans pt-1">
                  <div
                    className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all ${passwordStrength.hasMinLength
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-neutral-400'
                      }`}
                  >
                    {passwordStrength.hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" /> : <span className="w-3.5 text-center text-neutral-400">●</span>}
                    <span>Mínimo 8 caracteres</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all ${passwordStrength.hasUppercase
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-neutral-400'
                      }`}
                  >
                    {passwordStrength.hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" /> : <span className="w-3.5 text-center text-neutral-400">●</span>}
                    <span>1 Mayúscula (A-Z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all ${passwordStrength.hasLowercase
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-neutral-400'
                      }`}
                  >
                    {passwordStrength.hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" /> : <span className="w-3.5 text-center text-neutral-400">●</span>}
                    <span>1 Minúscula (a-z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all ${passwordStrength.hasNumber
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-neutral-400'
                      }`}
                  >
                    {passwordStrength.hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" /> : <span className="w-3.5 text-center text-neutral-400">●</span>}
                    <span>1 Número (0-9)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#2ABFBF]" />
                <span>Correo Electrónico (Opcional)</span>
              </label>
              <input
                type="email"
                placeholder="mareanegra@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-base text-neutral-900 dark:text-white focus:border-[#2ABFBF] focus:outline-none"
              />
            </div>

            {/* ACEPTACIÓN DE AVISO DE PRIVACIDAD */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aceptoPrivacidad}
                  onChange={(e) => {
                    setAceptoPrivacidad(e.target.checked)
                    if (fieldErrors.privacidad) {
                      setFieldErrors({ ...fieldErrors, privacidad: '' })
                    }
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-black/20 dark:border-white/20 text-[#2ABFBF] focus:ring-[#2ABFBF] cursor-pointer"
                />
                <span className="text-xs font-sans text-neutral-600 dark:text-neutral-400 leading-snug">
                  He leído y acepto el{' '}
                  <Link
                    href="/privacidad"
                    target="_blank"
                    className="text-[#2ABFBF] font-bold hover:underline"
                  >
                    Aviso de Privacidad (LFPDPPP)
                  </Link>{' '}
                  de Marea Negra - Aguachiles.
                </span>
              </label>
              {fieldErrors.privacidad && (
                <span className="text-[11px] font-sans font-bold text-coral flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-coral shrink-0" />
                  <span>{fieldErrors.privacidad}</span>
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="bg-coral/10 border border-coral/30 text-coral p-3 rounded-2xl text-xs font-sans font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !passwordStrength.isValid || !aceptoPrivacidad}
              className="mt-2 bg-[#2ABFBF] text-black font-sans font-bold text-xs tracking-wider py-4 rounded-2xl shadow-lg hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>REGISTRANDO...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>UNIRME Y OBTENER MI CUPÓN DE 10%</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col items-center text-center gap-6 transition-colors">
            <div className="w-16 h-16 rounded-full bg-[#2ABFBF]/20 text-[#2ABFBF] flex items-center justify-center border border-[#2ABFBF]/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <span className="text-xs font-sans font-bold text-[#2ABFBF] uppercase tracking-widest">
                ¡REGISTRO EXITOSO! TU CUPÓN DE USO ÚNICO:
              </span>

              {/* CUPÓN PERSONAL ÚNICO DESTACADO */}
              <div className="bg-black/[0.02] dark:bg-white/[0.03] border-2 border-dashed border-[#2ABFBF] rounded-2xl p-6 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-sans font-bold text-[#2ABFBF] uppercase tracking-widest flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>CUPÓN PERSONAL DE 1 SOLO USO</span>
                </span>
                <span className="font-mono text-3xl sm:text-4xl font-bold text-coral tracking-wider my-1">
                  {personalCoupon}
                </span>
                <span className="text-xs font-sans text-neutral-500">
                  Válido para 1 solo pedido. ¡Al canjearlo se aplicará tu 10% OFF!
                </span>
              </div>
            </div>

            <div className="w-full bg-black/[0.02] dark:bg-white/[0.03] p-4 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col gap-2">
              <span className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300">Tu Código de Invitación:</span>
              <span className="font-mono text-xs font-bold text-[#2ABFBF] bg-white dark:bg-black p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                {referralCode}
              </span>
              <button
                type="button"
                onClick={copyReferralLink}
                className="bg-[#2ABFBF] text-black font-sans font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-all mt-1 active:scale-95"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? '¡ENLACE COPIADO!' : 'COPIAR ENLACE DE INVITACIÓN'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push('/pedir')}
              className="w-full bg-coral text-white font-sans font-bold text-xs tracking-wider py-4 rounded-2xl shadow-lg hover:bg-white hover:text-black transition-all active:scale-95"
            >
              USAR MI CUPÓN Y ORDENAR AHORA
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
