'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
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

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPhone.trim() || !newPassword.trim()) return

    setLoading(true)
    try {
      const res = await restablecerPasswordCliente(resetPhone, newPassword)
      setResetSuccess(res.message)
      setTimeout(() => {
        setShowReset(false)
        setResetSuccess(null)
        setTelefono(resetPhone)
      }, 2000)
    } catch (err: any) {
      alert(err.message || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F0E8] dark:bg-negro text-negro dark:text-blanco flex flex-col justify-between selection:bg-coral transition-colors duration-300">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#F4F0E8] dark:bg-negro border-b border-arena/30 dark:border-arena/10 px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-xs md:text-sm font-sans font-bold text-negro/70 dark:text-arena/70 hover:text-coral flex items-center gap-1"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Inicio</span>
          </button>

          <h1 className="font-display text-2xl md:text-3xl text-coral tracking-wider">
            MAREA NEGRA
          </h1>

          <ThemeToggle />
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-md mx-auto px-4 md:px-6 py-12 w-full flex-1 flex flex-col justify-center gap-6">
        <div className="text-center flex flex-col gap-2">
          <span className="text-xs font-sans font-bold tracking-widest text-turquesa uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-turquesa" />
            <span>ACCESO AL CLUB & PEDIDOS</span>
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-negro dark:text-blanco tracking-wide">
            INICIAR SESIÓN
          </h2>
          <p className="font-serif italic text-base text-negro/70 dark:text-arena/80">
            Ingresa tu número celular y contraseña para acceder a tus beneficios.
          </p>
        </div>

        <form
          noValidate
          onSubmit={handleLogin}
          className="bg-white dark:bg-[#050404] bg-dots-pattern border border-oro/30 rounded-3xl p-6 md:p-8 gold-border-corner shadow-2xl flex flex-col gap-5"
        >
          {/* CAMPO TELEFONO CON MENSAJE DE ERROR INLINE */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-turquesa" />
              <span>Número Celular (10 dígitos) *</span>
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-arena/50 absolute left-4 top-3.5" />
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
                className={`w-full bg-[#F4F0E8] dark:bg-carbon border rounded-xl pl-12 pr-4 py-3.5 text-base text-negro dark:text-blanco font-sans font-bold focus:outline-none ${
                  fieldErrors.telefono ? 'border-coral ring-2 ring-coral/20' : 'border-arena/30 dark:border-arena/20 focus:border-turquesa'
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
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-turquesa" />
                <span>Contraseña *</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetPhone(telefono)
                  setShowReset(true)
                }}
                className="text-[11px] font-sans font-semibold text-coral hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-arena/50 absolute left-4 top-3.5" />
              <input
                type="password"
                required
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
                }}
                className={`w-full bg-[#F4F0E8] dark:bg-carbon border rounded-xl pl-12 pr-4 py-3.5 text-base text-negro dark:text-blanco font-sans font-bold focus:outline-none ${
                  fieldErrors.password ? 'border-coral ring-2 ring-coral/20' : 'border-arena/30 dark:border-arena/20 focus:border-turquesa'
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
            <div className="bg-coral/10 border border-coral/30 text-coral p-3 rounded-xl text-xs font-sans font-bold">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-turquesa text-negro font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-[0_0_20px_rgba(42,191,191,0.4)] hover:bg-blanco transition-all flex items-center justify-center gap-2 disabled:opacity-50 group"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-negro" />
                <span>VERIFICANDO CREDANCIALES...</span>
              </>
            ) : (
              <>
                <span>ENTRAR A MI CUENTA</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          <div className="border-t border-arena/15 pt-4 flex flex-col items-center text-center gap-2">
            <span className="text-xs font-serif italic text-negro/60 dark:text-arena/60">
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#050404] border border-oro/30 rounded-3xl w-full max-w-md p-6 gold-border-corner shadow-2xl relative text-blanco flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-arena/10 pb-3">
              <span className="font-display text-2xl text-coral flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-coral" />
                <span>CAMBIAR CONTRASEÑA</span>
              </span>
              <button
                onClick={() => setShowReset(false)}
                className="text-arena/60 hover:text-blanco font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {resetSuccess ? (
              <div className="bg-turquesa/10 border border-turquesa/30 p-4 rounded-xl text-turquesa flex items-center gap-2 font-sans font-bold text-xs">
                <CheckCircle2 className="w-5 h-5" />
                <span>{resetSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-arena">
                    Tu Celular de Contacto *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    className="bg-carbon border border-arena/20 rounded-xl px-3.5 py-2.5 text-sm font-bold text-blanco focus:border-turquesa focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-arena">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres (Mayúscula, Minúscula y Número)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-carbon border border-arena/20 rounded-xl px-3.5 py-2.5 text-sm font-bold text-blanco focus:border-turquesa focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-coral text-blanco font-sans font-bold text-xs py-3.5 rounded-xl hover:bg-blanco hover:text-negro transition-all shadow-md mt-2"
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
