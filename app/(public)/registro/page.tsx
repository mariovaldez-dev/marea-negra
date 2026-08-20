'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registrarClienteClub } from '@/lib/actions/clienteCuenta'
import { validatePasswordStrength } from '@/lib/security/passwordHash'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Gift, Sparkles, ChevronLeft, User, Phone, Mail, CheckCircle2, Copy, Loader2, Ticket, Lock, ShieldCheck, Check, AlertCircle } from 'lucide-react'

export default function RegisterClubPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
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

      const userCouponCode = resReg.welcomeCouponCode || `BIENVENIDO-${nombre.slice(0,4).toUpperCase()}`
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
    <div className="min-h-screen bg-[#F4F0E8] text-negro dark:bg-negro dark:text-blanco flex flex-col justify-between selection:bg-coral transition-colors duration-300">
      {/* HEADER ADAPTABLE */}
      <header className="sticky top-0 z-40 bg-[#F4F0E8] dark:bg-negro border-b border-arena/30 dark:border-arena/10 px-6 py-3 safe-header transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-xs md:text-sm font-sans font-bold text-negro/70 dark:text-arena/70 hover:text-coral flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>

          <h1 className="font-display text-2xl md:text-3xl text-coral tracking-wider">
            MAREA NEGRA
          </h1>

          <ThemeToggle />
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-xl mx-auto px-4 md:px-6 py-10 w-full flex-1 flex flex-col gap-6">
        <div className="text-center flex flex-col gap-2">
          <span className="text-xs font-sans font-bold tracking-widest text-turquesa uppercase flex items-center justify-center gap-1.5">
            <Gift className="w-4 h-4 text-turquesa" />
            <span>CLUB DE LEALTAD & DESCUENTOS</span>
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-negro dark:text-blanco tracking-wide">
            ÚNETE AL CLUB MAREA NEGRA
          </h2>
          <p className="font-sans text-base text-negro/80 dark:text-arena/80">
            Regístrate para recibir tu <span className="font-bold text-turquesa">CUPÓN PERSONAL ÚNICO (10% OFF)</span> de una sola vez y tu enlace exclusivo para invitar amigos.
          </p>
        </div>

        {!submitted ? (
          <form
            noValidate
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-oro/30 rounded-2xl p-6 shadow-2xl gold-border-corner flex flex-col gap-5 transition-colors"
          >
            {/* CAMPO NOMBRE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                <User className="w-4 h-4 text-turquesa" />
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
                className={`bg-[#F4F0E8] dark:bg-carbon border rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:outline-none ${
                  fieldErrors.nombre ? 'border-coral ring-2 ring-coral/20' : 'border-arena/30 dark:border-arena/20 focus:border-turquesa'
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
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-turquesa" />
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
                className={`bg-[#F4F0E8] dark:bg-carbon border rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:outline-none ${
                  fieldErrors.telefono ? 'border-coral ring-2 ring-coral/20' : 'border-arena/30 dark:border-arena/20 focus:border-turquesa'
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
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-turquesa" />
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
                className={`bg-[#F4F0E8] dark:bg-carbon border rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:outline-none ${
                  fieldErrors.password ? 'border-coral ring-2 ring-coral/20' : 'border-arena/30 dark:border-arena/20 focus:border-turquesa'
                }`}
              />

              {fieldErrors.password && (
                <span className="text-[11px] font-sans font-bold text-coral flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 text-coral shrink-0" />
                  <span>{fieldErrors.password}</span>
                </span>
              )}

              {/* GUÍA DE REQUISITOS SIEMPRE VISIBLE Y MEDIDOR ADAPTABLE DE ALTO CONTRASTE */}
              <div className="bg-[#F4F0E8] dark:bg-carbon/90 border border-arena/30 dark:border-arena/20 rounded-2xl p-4 flex flex-col gap-2.5 mt-1 shadow-sm">
                <div className="flex justify-between items-center text-xs font-sans font-bold">
                  <span className="text-negro/80 dark:text-arena flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-turquesa" />
                    <span>Requisitos de Contraseña Segura:</span>
                  </span>
                  <span
                    className={`${
                      passwordStrength.score === 4
                        ? 'text-emerald-700 dark:text-limon font-bold'
                        : password.length > 0
                        ? 'text-coral font-bold'
                        : 'text-negro/60 dark:text-arena/60 font-semibold'
                    }`}
                  >
                    {password.length === 0
                      ? 'Requerida'
                      : passwordStrength.score === 4
                      ? '¡Excelente y Fuerte! ✓'
                      : 'Incompleta'}
                  </span>
                </div>

                {/* Barra de progreso de alto contraste */}
                <div className="w-full h-2 bg-arena/30 dark:bg-negro rounded-full overflow-hidden border border-arena/20 dark:border-arena/10">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.score === 4
                        ? 'bg-emerald-600 dark:bg-limon shadow-sm'
                        : password.length > 0
                        ? 'bg-coral'
                        : 'bg-transparent'
                    }`}
                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                  />
                </div>

                {/* Lista de 4 Requisitos claros de alto contraste en ambos temas */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-sans pt-1">
                  <div
                    className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      passwordStrength.hasMinLength
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-turquesa/15 dark:border-turquesa/40 dark:text-turquesa font-bold shadow-sm'
                        : 'bg-white/80 dark:bg-carbon/40 border-arena/30 dark:border-arena/10 text-negro/70 dark:text-arena/60'
                    }`}
                  >
                    {passwordStrength.hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-turquesa stroke-[3]" /> : <span className="w-3.5 text-center text-negro/40 dark:text-arena/40">●</span>}
                    <span>Mínimo 8 caracteres</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      passwordStrength.hasUppercase
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-turquesa/15 dark:border-turquesa/40 dark:text-turquesa font-bold shadow-sm'
                        : 'bg-white/80 dark:bg-carbon/40 border-arena/30 dark:border-arena/10 text-negro/70 dark:text-arena/60'
                    }`}
                  >
                    {passwordStrength.hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-turquesa stroke-[3]" /> : <span className="w-3.5 text-center text-negro/40 dark:text-arena/40">●</span>}
                    <span>1 Mayúscula (A-Z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      passwordStrength.hasLowercase
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-turquesa/15 dark:border-turquesa/40 dark:text-turquesa font-bold shadow-sm'
                        : 'bg-white/80 dark:bg-carbon/40 border-arena/30 dark:border-arena/10 text-negro/70 dark:text-arena/60'
                    }`}
                  >
                    {passwordStrength.hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-turquesa stroke-[3]" /> : <span className="w-3.5 text-center text-negro/40 dark:text-arena/40">●</span>}
                    <span>1 Minúscula (a-z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      passwordStrength.hasNumber
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-turquesa/15 dark:border-turquesa/40 dark:text-turquesa font-bold shadow-sm'
                        : 'bg-white/80 dark:bg-carbon/40 border-arena/30 dark:border-arena/10 text-negro/70 dark:text-arena/60'
                    }`}
                  >
                    {passwordStrength.hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-turquesa stroke-[3]" /> : <span className="w-3.5 text-center text-negro/40 dark:text-arena/40">●</span>}
                    <span>1 Número (0-9)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-turquesa" />
                <span>Correo Electrónico (Opcional)</span>
              </label>
              <input
                type="email"
                placeholder="mareanegra@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
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
              disabled={isSubmitting || !passwordStrength.isValid}
              className="mt-2 bg-turquesa text-negro font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-[0_0_20px_rgba(42,191,191,0.4)] hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-negro" />
                  <span>ENCRIPTANDO Y REGISTRANDO...</span>
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
          <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-turquesa/40 rounded-2xl p-6 shadow-2xl gold-border-corner flex flex-col items-center text-center gap-5 transition-colors">
            <div className="w-16 h-16 rounded-full bg-turquesa/20 text-turquesa flex items-center justify-center border border-turquesa/40 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-widest">
                ¡REGISTRO EXITOSO! TU CUPÓN DE USO ÚNICO:
              </span>

              {/* CUPÓN PERSONAL ÚNICO DESTACADO */}
              <div className="bg-[#111111] dark:bg-carbon border-2 border-dashed border-limon rounded-2xl p-5 flex flex-col items-center gap-1 shadow-[0_0_25px_rgba(222,253,111,0.25)]">
                <span className="text-[10px] font-sans font-bold text-limon uppercase tracking-widest flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-limon" />
                  <span>CUPÓN PERSONAL DE 1 SOLO USO</span>
                </span>
                <span className="font-mono text-3xl md:text-4xl font-bold text-limon tracking-wider my-1 drop-shadow-[0_0_10px_rgba(222,253,111,0.4)]">
                  {personalCoupon}
                </span>
                <span className="text-xs font-serif italic text-arena/80">
                  Válido únicamente para 1 solo pedido. ¡Al canjearlo se desactivará automáticamente!
                </span>
              </div>
            </div>

            <div className="w-full bg-[#F4F0E8] dark:bg-carbon p-4 rounded-xl border border-arena/30 dark:border-arena/20 flex flex-col gap-2">
              <span className="text-xs font-sans font-bold text-turquesa">Tu Enlace de Referidos para Amigos:</span>
              <span className="font-mono text-xs text-turquesa font-bold bg-white/80 dark:bg-negro/50 p-2 rounded border border-arena/20 dark:border-transparent">
                {referralCode}
              </span>
              <button
                onClick={copyReferralLink}
                className="bg-turquesa text-negro font-sans font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro transition-all mt-1"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? '¡ENLACE COPIADO!' : 'COPIAR ENLACE DE INVITACIÓN'}</span>
              </button>
            </div>

            <button
              onClick={() => router.push('/pedir')}
              className="w-full bg-coral text-blanco font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg hover:bg-negro dark:hover:bg-blanco dark:hover:text-negro transition-all"
            >
              USAR MI CUPÓN ÚNICO Y ORDENAR AHORA
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
