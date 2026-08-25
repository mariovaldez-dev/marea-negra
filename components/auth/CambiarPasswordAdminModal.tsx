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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="bg-[#0C0907] border border-oro/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative gold-border-corner">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-arena hover:text-coral rounded-full hover:bg-carbon transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-arena/10 pb-4 mb-5">
          <div className="p-3 bg-oro/10 border border-oro/30 rounded-2xl text-oro shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-widest">
              PANEL ADMINISTRATIVO
            </span>
            <h3 className="font-display text-2xl sm:text-3xl text-blanco tracking-wide">
              CAMBIAR CONTRASEÑA
            </h3>
            <span className="text-[11px] font-sans text-arena/70">
              Usuario: {userName}
            </span>
          </div>
        </div>

        {successMsg ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center flex flex-col items-center gap-2 animate-in zoom-in-95">
            <ShieldCheck className="w-12 h-12 text-emerald-500" />
            <span className="font-display text-2xl text-emerald-500 tracking-wider">
              {successMsg}
            </span>
            <p className="text-xs font-sans text-arena/80">
              Tu contraseña de acceso al panel admin ha sido modificada.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Nueva Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-arena flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-turquesa" />
                  <span>Nueva Contraseña *</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-arena/50 hover:text-coral text-[11px] flex items-center gap-1"
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
                className="bg-carbon border border-arena/20 rounded-xl px-4 py-3 text-sm text-blanco focus:border-oro focus:outline-none"
              />

              {/* Medidor de Requisitos */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-sans pt-1">
                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${strength.hasMinLength
                      ? 'bg-turquesa/15 border-turquesa/40 text-turquesa font-bold'
                      : 'bg-carbon border-arena/10 text-arena/50'
                    }`}
                >
                  {strength.hasMinLength ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>Mínimo 8 caracteres</span>
                </div>

                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${strength.hasUppercase
                      ? 'bg-turquesa/15 border-turquesa/40 text-turquesa font-bold'
                      : 'bg-carbon border-arena/10 text-arena/50'
                    }`}
                >
                  {strength.hasUppercase ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Mayúscula (A-Z)</span>
                </div>

                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${strength.hasLowercase
                      ? 'bg-turquesa/15 border-turquesa/40 text-turquesa font-bold'
                      : 'bg-carbon border-arena/10 text-arena/50'
                    }`}
                >
                  {strength.hasLowercase ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Minúscula (a-z)</span>
                </div>

                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${strength.hasNumber
                      ? 'bg-turquesa/15 border-turquesa/40 text-turquesa font-bold'
                      : 'bg-carbon border-arena/10 text-arena/50'
                    }`}
                >
                  {strength.hasNumber ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Número (0-9)</span>
                </div>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-arena flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-turquesa" />
                <span>Confirmar Nueva Contraseña *</span>
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-carbon border border-arena/20 rounded-xl px-4 py-3 text-sm text-blanco focus:border-oro focus:outline-none"
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
              className="bg-oro text-negro font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg hover:bg-blanco transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ACTUALIZANDO...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>GUARDAR CONTRASEÑA DE ACCESO</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
