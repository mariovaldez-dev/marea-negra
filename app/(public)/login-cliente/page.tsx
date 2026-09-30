'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { loginClienteConPassword, restablecerPasswordCliente } from '@/lib/actions/clienteCuenta'
import { Phone, Lock, ChevronLeft, Sparkles, ShieldCheck, ArrowRight, Loader2, User, KeyRound, CheckCircle2 } from 'lucide-react'

export default function LoginClientePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/micuenta'

  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Restablecer Contraseña Modal State
  const [showReset, setShowReset] = useState(false)
  const [resetPhone, setResetPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const cleanPhone = telefono.replace(/\D/g, '')

    const errors: Record<string, string> = {}
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.telefono = 'Ingresa tu número celular registrado de 10 dígitos (ej. 6671234567).'
    }

    if (!password.trim()) {
      errors.password = 'Por favor ingresa tu contraseña.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setLoading(true)

    try {
      const res = await loginClienteConPassword(cleanPhone, password)
      if (res.cuenta) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('marea_cliente_telefono', cleanPhone)
          localStorage.setItem('marea_cliente_nombre', res.cuenta.nombreCliente)
          localStorage.setItem('marea_club_registered', 'true')
        }
        router.push(redirectUrl)
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err)
      setError(err.message || 'Contraseña o número celular incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  const [resetError, setResetError] = useState<string | null>(null)

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError(null)
    if (!resetPhone.trim() || !newPassword.trim()) return

    setLoading(true)
    try {
      const res = await restablecerPasswordCliente(resetPhone, newPassword)
      if (res.success) {
        setResetSuccess(res.message || '¡Contraseña actualizada exitosamente!')
        setTimeout(() => {
          setShowReset(false)
          setResetSuccess(null)
          setTelefono(resetPhone)
        }, 2000)
      } else {
        setResetError(res.error || 'Error al cambiar contraseña.')
      }
    } catch (err: any) {
      setResetError(err.message || 'Error al cambiar contraseña.')
    } finally {
      setLoading(false)
    }
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
      {/* HEADER */}
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-md mx-auto px-4 sm:px-6 py-10 w-full flex-1 flex flex-col justify-center gap-6">
        <div className="text-center flex flex-col gap-2">
          <span className="text-[11px] font-sans font-bold tracking-widest text-[#2ABFBF] uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#2ABFBF]" />
            <span>ACCESO AL CLUB & PEDIDOS</span>
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-neutral-900 dark:text-white tracking-wide">
            INICIAR SESIÓN
          </h1>
          <p className="font-sans text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Ingresa tu número celular y contraseña para acceder a tus beneficios.
          </p>
        </div>

        <form
          noValidate
          onSubmit={handleLogin}
          className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col gap-5"
        >
          {/* CAMPO TELEFONO CON MENSAJE DE ERROR INLINE */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#2ABFBF]" />
              <span>Número Celular (10 dígitos) *</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Phone className="w-4 h-4 text-neutral-400" />
              </div>
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
                className={`w-full bg-black/[0.02] dark:bg-white/[0.04] border rounded-2xl pl-10 pr-4 py-3 text-base text-neutral-900 dark:text-white font-mono focus:outline-none ${fieldErrors.telefono ? 'border-coral ring-2 ring-coral/20' : 'border-black/10 dark:border-white/10 focus:border-[#2ABFBF]'
                  }`}
              />
            </div>
            {fieldErrors.telefono && (
              <span className="text-[11px] font-sans font-bold text-coral flex items-center gap-1 mt-0.5">
                ⚠️ {fieldErrors.telefono}
              </span>
            )}
          </div>

          {/* CAMPO CONTRASEÑA CON MENSAJE DE ERROR INLINE */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#2ABFBF]" />
                <span>Contraseña *</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetPhone(telefono)
                  setShowReset(true)
                }}
                className="text-[11px] font-sans font-semibold text-[#2ABFBF] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-neutral-400" />
              </div>
              <input
                type="password"
                required
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
                }}
                className={`w-full bg-black/[0.02] dark:bg-white/[0.04] border rounded-2xl pl-10 pr-4 py-3 text-base text-neutral-900 dark:text-white font-sans focus:outline-none ${fieldErrors.password ? 'border-coral ring-2 ring-coral/20' : 'border-black/10 dark:border-white/10 focus:border-[#2ABFBF]'
                  }`}
              />
            </div>
            {fieldErrors.password && (
              <span className="text-[11px] font-sans font-bold text-coral flex items-center gap-1 mt-0.5">
                ⚠️ {fieldErrors.password}
              </span>
            )}
          </div>

          {error && (
            <div className="bg-coral/10 border border-coral/30 text-coral p-3 rounded-2xl text-xs font-sans font-bold text-center">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#2ABFBF] text-black font-sans font-bold text-xs tracking-wider py-4 rounded-2xl shadow-lg hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 group"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>VERIFICANDO CREDENCIALES...</span>
              </>
            ) : (
              <>
                <span>ENTRAR A MI CUENTA</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-4 flex flex-col items-center text-center gap-2">
            <span className="text-xs font-sans text-neutral-500">
              ¿Aún no tienes cuenta registrada?
            </span>
            <Link
              href="/registro"
              className="text-xs font-sans font-bold text-coral hover:underline flex items-center gap-1"
            >
              <User className="w-3.5 h-3.5" />
              <span>Registrarme gratis en 10 segundos y obtener 10% OFF</span>
            </Link>
          </div>
        </form>
      </main>

      {/* MODAL CAMBIAR / RESTABLECER CONTRASEÑA */}
      {showReset && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-neutral-900 dark:text-white flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-4">
              <span className="font-display text-2xl text-coral flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-coral" />
                <span>CAMBIAR CONTRASEÑA</span>
              </span>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-neutral-500 hover:text-coral transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {resetSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-sans font-bold text-xs">
                <CheckCircle2 className="w-5 h-5" />
                <span>{resetSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
                {resetError && (
                  <div className="bg-coral/10 border border-coral/30 text-coral p-3 rounded-2xl text-xs font-sans font-bold text-center">
                    ⚠️ {resetError}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300">
                    Tu Celular de Contacto *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    className="w-full bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-mono text-neutral-900 dark:text-white focus:border-[#2ABFBF] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-sans text-neutral-900 dark:text-white focus:border-[#2ABFBF] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-coral text-white font-sans font-bold text-xs py-3.5 rounded-2xl hover:bg-neutral-900 dark:hover:bg-white dark:hover:text-black transition-all shadow-md mt-2 active:scale-95"
                >
                  GUARDAR NUEVA CONTRASEÑA
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
