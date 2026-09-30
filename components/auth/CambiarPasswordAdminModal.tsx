'use client'

import React, { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { validatePasswordStrength } from '@/lib/security/passwordHash'
import {
  Lock,
  ShieldCheck,
  Check,
  AlertCircle,
  X,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react'

interface CambiarPasswordAdminModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
}

export function CambiarPasswordAdminModal({
  isOpen,
  onClose,
  userName,
}: CambiarPasswordAdminModalProps) {
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const supabase = createBrowserClient()

  if (!isOpen) return null

  const strength = validatePasswordStrength(nuevaPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

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
      const { error } = await supabase.auth.updateUser({
        password: nuevaPassword,
      })

      if (error) {
        setErrorMsg(error.message || 'Error al actualizar contraseña de administrador.')
      } else {
        setSuccessMsg('¡Contraseña de administrador actualizada con éxito!')
        setNuevaPassword('')
        setConfirmPassword('')
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-negro/50 dark:text-arena/50 hover:text-coral rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-5">
          <div className="p-2.5 bg-oro/10 border border-oro/20 rounded-xl text-oro">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-turquesa uppercase tracking-wider">
              Panel Administrativo
            </span>
            <h3 className="font-sans font-bold text-lg sm:text-xl text-negro dark:text-blanco">
              Cambiar Contraseña
            </h3>
            <span className="text-xs text-negro/50 dark:text-arena/60">
              Usuario: {userName}
            </span>
          </div>
        </div>

        {successMsg ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center flex flex-col items-center gap-2 animate-in zoom-in-95">
            <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            <span className="font-sans font-bold text-base text-emerald-600 dark:text-emerald-400">
              {successMsg}
            </span>
            <p className="text-xs text-negro/60 dark:text-arena/70">
              Tu contraseña de acceso al panel admin ha sido modificada con éxito.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Nueva Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/70 dark:text-arena/70 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-turquesa" />
                  <span>Nueva Contraseña *</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-negro/40 dark:text-arena/50 hover:text-coral text-[11px] flex items-center gap-1 font-normal"
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
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
              />

              {/* Medidor de Requisitos */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-sans pt-1">
                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${
                    strength.hasMinLength
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-negro/40 dark:text-arena/40'
                  }`}
                >
                  {strength.hasMinLength ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>Mínimo 8 caracteres</span>
                </div>

                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${
                    strength.hasUppercase
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-negro/40 dark:text-arena/40'
                  }`}
                >
                  {strength.hasUppercase ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Mayúscula (A-Z)</span>
                </div>

                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${
                    strength.hasLowercase
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-negro/40 dark:text-arena/40'
                  }`}
                >
                  {strength.hasLowercase ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Minúscula (a-z)</span>
                </div>

                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${
                    strength.hasNumber
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-negro/40 dark:text-arena/40'
                  }`}
                >
                  {strength.hasNumber ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Número (0-9)</span>
                </div>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/70 dark:text-arena/70 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-turquesa" />
                <span>Confirmar Nueva Contraseña *</span>
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
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
              className="bg-turquesa text-negro font-sans font-bold text-xs tracking-wider py-3 rounded-xl shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ACTUALIZANDO...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>GUARDAR NUEVA CONTRASEÑA</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
