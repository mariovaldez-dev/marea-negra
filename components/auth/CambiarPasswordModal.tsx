'use client'

import React, { useState } from 'react'
import { cambiarPasswordCliente } from '@/lib/actions/clienteCuenta'
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

interface CambiarPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  telefono: string
  nombreCliente: string
}

export function CambiarPasswordModal({
  isOpen,
  onClose,
  telefono,
  nombreCliente,
}: CambiarPasswordModalProps) {
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const strength = validatePasswordStrength(passwordNueva)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!passwordActual.trim()) {
      setErrorMsg('Ingresa tu contraseña actual.')
      return
    }

    if (!strength.isValid) {
      setErrorMsg('La nueva contraseña debe cumplir con los 4 requisitos de seguridad.')
      return
    }

    if (passwordNueva !== passwordConfirm) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.')
      return
    }

    if (passwordActual === passwordNueva) {
      setErrorMsg('La nueva contraseña debe ser diferente a la anterior.')
      return
    }

    setLoading(true)
    try {
      const res = await cambiarPasswordCliente(telefono, passwordActual, passwordNueva)
      if (res.success) {
        setSuccessMsg('¡Contraseña actualizada exitosamente!')
        setPasswordActual('')
        setPasswordNueva('')
        setPasswordConfirm('')
        setTimeout(() => {
          onClose()
        }, 2000)
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
          <div className="p-3 bg-coral/10 border border-coral/30 rounded-2xl text-coral shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-widest">
              SEGURIDAD DE TU CUENTA
            </span>
            <h3 className="font-display text-2xl sm:text-3xl text-negro dark:text-blanco tracking-wide">
              CAMBIAR CONTRASEÑA
            </h3>
            <span className="text-[11px] font-sans text-negro/60 dark:text-arena/70">
              Socio: {nombreCliente} ({telefono})
            </span>
          </div>
        </div>

        {successMsg ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center flex flex-col items-center gap-2 animate-in zoom-in-95">
            <ShieldCheck className="w-12 h-12 text-emerald-500" />
            <span className="font-display text-2xl text-emerald-500 tracking-wider">
              {successMsg}
            </span>
            <p className="text-xs font-sans text-negro/70 dark:text-arena/80">
              Usa tu nueva contraseña en tus próximos inicios de sesión.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Contraseña Actual */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-turquesa" />
                <span>Contraseña Actual *</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="Tu contraseña actual"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="w-full bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco focus:border-turquesa focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-negro/40 dark:text-arena/40 hover:text-coral"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-turquesa" />
                <span>Nueva Contraseña Segura *</span>
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Crea tu nueva contraseña"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
              />

              {/* Medidor de Requisitos */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-sans pt-1">
                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${strength.hasMinLength
                      ? 'bg-emerald-100 dark:bg-turquesa/15 border-emerald-300 dark:border-turquesa/40 text-emerald-900 dark:text-turquesa font-bold'
                      : 'bg-arena/10 border-arena/20 text-negro/60 dark:text-arena/60'
                    }`}
                >
                  {strength.hasMinLength ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>Mínimo 8 caracteres</span>
                </div>

                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${strength.hasUppercase
                      ? 'bg-emerald-100 dark:bg-turquesa/15 border-emerald-300 dark:border-turquesa/40 text-emerald-900 dark:text-turquesa font-bold'
                      : 'bg-arena/10 border-arena/20 text-negro/60 dark:text-arena/60'
                    }`}
                >
                  {strength.hasUppercase ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Mayúscula (A-Z)</span>
                </div>

                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${strength.hasLowercase
                      ? 'bg-emerald-100 dark:bg-turquesa/15 border-emerald-300 dark:border-turquesa/40 text-emerald-900 dark:text-turquesa font-bold'
                      : 'bg-arena/10 border-arena/20 text-negro/60 dark:text-arena/60'
                    }`}
                >
                  {strength.hasLowercase ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Minúscula (a-z)</span>
                </div>

                <div
                  className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all ${strength.hasNumber
                      ? 'bg-emerald-100 dark:bg-turquesa/15 border-emerald-300 dark:border-turquesa/40 text-emerald-900 dark:text-turquesa font-bold'
                      : 'bg-arena/10 border-arena/20 text-negro/60 dark:text-arena/60'
                    }`}
                >
                  {strength.hasNumber ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Número (0-9)</span>
                </div>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-turquesa" />
                <span>Confirmar Nueva Contraseña *</span>
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Repite tu nueva contraseña"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
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
              disabled={loading || !strength.isValid || !passwordConfirm}
              className="bg-turquesa text-negro font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ACTUALIZANDO...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
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
