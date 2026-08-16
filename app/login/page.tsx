'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { LuxuryCard } from '@/components/ui/LuxuryCard'
import { LogIn, KeyRound, Mail, AlertCircle, Loader2 } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/admin/dashboard'

  const supabase = createBrowserClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      window.location.href = redirectTo
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas. Verifica tu correo y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LuxuryCard eyebrow="PANEL DE CONTROL" title="Iniciar Sesión" ornament={true}>
      <form onSubmit={handleLogin} className="flex flex-col gap-5 mt-4">
        {error && (
          <div className="p-3 bg-coral/10 border border-coral/30 rounded-lg flex items-center gap-2 text-xs text-coral">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-sans text-arena/80 uppercase tracking-wider">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-arena/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="admin@mareanegra.mx"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-carbon border border-arena/20 rounded-lg pl-9 pr-3 py-2.5 text-xs text-blanco placeholder:text-arena/30 focus:outline-none focus:border-turquesa transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-sans text-arena/80 uppercase tracking-wider">
            Contraseña
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-arena/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-carbon border border-arena/20 rounded-lg pl-9 pr-3 py-2.5 text-xs text-blanco placeholder:text-arena/30 focus:outline-none focus:border-turquesa transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(42,191,191,0.2)] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-negro" />
              <span>INGRESANDO...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>ENTRAR AL PANEL</span>
            </>
          )}
        </button>
      </form>
    </LuxuryCard>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-negro flex items-center justify-center p-6 relative overflow-hidden">
      {/* Bioluminiscencia de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ocean-blob rounded-full opacity-30 filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-coral-blob rounded-full opacity-20 filter blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl text-blanco tracking-wide">
            MAREA <span className="text-coral">NEGRA</span>
          </h1>
          <p className="font-serif italic text-lg text-coral mt-1">
            — acceso administrativo —
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-8 text-center bg-carbon/50 rounded-xl text-arena/60 font-serif italic">
              Cargando formulario...
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs font-sans text-arena/50 hover:text-turquesa transition-colors"
          >
            ← Volver al Menú Público
          </a>
        </div>
      </div>
    </div>
  )
}
