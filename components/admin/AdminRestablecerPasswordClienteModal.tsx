'use client'

import React, { useState } from 'react'
import { restablecerPasswordCliente } from '@/lib/actions/clienteCuenta'
import { validatePasswordStrength } from '@/lib/security/passwordHash'
import { useWhatsAppSupport } from '@/lib/hooks/useWhatsAppSupport'
import {
  KeyRound,
  Dices,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Send,
  ShieldCheck,
  Check,
  Sparkles,
  MessageCircle,
} from 'lucide-react'

interface AdminRestablecerPasswordClienteModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: {
    id: string
    nombre: string
    telefono: string
  } | null
}

const PALABRAS_ALEATORIAS = ['Marea', 'Aguachile', 'Camaron', 'Pulpo', 'Sinaloa', 'Ceviche', 'Pacifico']

export function AdminRestablecerPasswordClienteModal({
  isOpen,
  onClose,
  cliente,
}: AdminRestablecerPasswordClienteModalProps) {
  const { openWhatsApp } = useWhatsAppSupport()

  const [nuevaPassword, setNuevaPassword] = useState('')
  const [showPass, setShowPass] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)
  const [passwordFinal, setPasswordFinal] = useState('')

  if (!isOpen || !cliente) return null

  const strength = validatePasswordStrength(nuevaPassword)

  // Generar contraseña aleatoria y segura
  const generarPasswordAleatoria = () => {
    const palabra = PALABRAS_ALEATORIAS[Math.floor(Math.random() * PALABRAS_ALEATORIAS.length)]
    const num = Math.floor(100 + Math.random() * 900)
    const simbolos = ['!', '*', '#', '$', '@']
    const sim = simbolos[Math.floor(Math.random() * simbolos.length)]
    const pass = `${palabra}${num}${sim}`
    setNuevaPassword(pass)
    setErrorMsg(null)
  }

  const handleGuardarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!strength.isValid) {
      setErrorMsg('La contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.')
      return
    }

    setLoading(true)
    try {
      const res = await restablecerPasswordCliente(cliente.telefono, nuevaPassword)
      if (res.success) {
        setPasswordFinal(nuevaPassword)
        setGuardadoExitoso(true)
      } else {
        setErrorMsg(res.error || 'Error al actualizar contraseña.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarWhatsAppCliente = () => {
    const cleanPhone = cliente.telefono.replace(/\D/g, '')
    const targetPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`
    const msg = `🌊 *MAREA NEGRA - CLUB VIP* 🦐
Hola *${cliente.nombre}*, hemos restablecido tu contraseña de acceso a la plataforma:

🔑 *Nueva Contraseña:* \`${passwordFinal}\`

Ya puedes ingresar a tu cuenta para ver tus sellos y beneficios: https://marea-negra.com/micuenta
(Te sugerimos cambiarla por una de tu preferencia al ingresar).`

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank')
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
          <div className="p-3 bg-oro/10 border border-oro/30 rounded-2xl text-oro shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-sans font-bold text-oro uppercase tracking-widest">
              ADMINISTRACIÓN DE ACCESO
            </span>
            <h3 className="font-display text-2xl sm:text-3xl text-negro dark:text-blanco tracking-wide">
              RESTABLECER CLAVE
            </h3>
          </div>
        </div>

        {guardadoExitoso ? (
          <div className="flex flex-col items-center text-center gap-4 py-2 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/40">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="flex flex-col gap-1">
              <h4 className="font-display text-2xl text-emerald-600 dark:text-emerald-400">
                ¡CONTRASEÑA ASIGNADA!
              </h4>
              <p className="text-xs font-sans text-negro/80 dark:text-arena/90">
                Se guardó la nueva contraseña para <strong>{cliente.nombre}</strong> (+52 {cliente.telefono}).
              </p>
            </div>

            <div className="w-full bg-[#F4F0E8] dark:bg-carbon p-3.5 rounded-2xl border border-arena/30 flex items-center justify-between font-mono text-sm">
              <span className="text-negro/60 dark:text-arena/60 text-xs">Clave:</span>
              <strong className="text-coral dark:text-oro tracking-wider">{passwordFinal}</strong>
            </div>

            <div className="flex flex-col w-full gap-2 mt-2">
              <button
                type="button"
                onClick={handleEnviarWhatsAppCliente}
                className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>ENVIAR CLAVE POR WHATSAPP AL CLIENTE</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-carbon text-arena hover:text-blanco font-sans font-bold text-xs py-3 rounded-xl transition-colors"
              >
                CERRAR
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGuardarPassword} className="flex flex-col gap-4">
            {/* Info del Cliente */}
            <div className="p-3.5 bg-[#F4F0E8] dark:bg-carbon border border-arena/20 rounded-2xl flex flex-col gap-0.5 text-xs">
              <span className="text-[10px] font-sans uppercase font-bold text-turquesa">Socio VIP</span>
              <span className="font-bold text-sm text-negro dark:text-blanco">{cliente.nombre}</span>
              <span className="text-negro/60 dark:text-arena/70 font-mono">Celular: +52 {cliente.telefono}</span>
            </div>

            {/* Input Contraseña con Generador */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90">
                  Nueva Contraseña *
                </label>
                <button
                  type="button"
                  onClick={generarPasswordAleatoria}
                  className="text-xs font-sans text-turquesa hover:text-coral font-bold flex items-center gap-1 transition-colors"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Generar Aleatoria</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="Ej. Marea2026!"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  className="w-full bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-3 text-base font-mono text-negro dark:text-blanco focus:border-oro focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-negro/50 dark:text-arena/50 hover:text-coral"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Medidor de Requisitos */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-sans pt-1">
                <div
                  className={`flex items-center gap-1 p-1 rounded-md border ${
                    strength.hasMinLength
                      ? 'bg-emerald-100 dark:bg-turquesa/15 border-emerald-300 dark:border-turquesa/40 text-emerald-900 dark:text-turquesa font-bold'
                      : 'bg-arena/10 border-arena/20 text-negro/60 dark:text-arena/60'
                  }`}
                >
                  {strength.hasMinLength ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>Mín. 8 caracteres</span>
                </div>
                <div
                  className={`flex items-center gap-1 p-1 rounded-md border ${
                    strength.hasUppercase
                      ? 'bg-emerald-100 dark:bg-turquesa/15 border-emerald-300 dark:border-turquesa/40 text-emerald-900 dark:text-turquesa font-bold'
                      : 'bg-arena/10 border-arena/20 text-negro/60 dark:text-arena/60'
                  }`}
                >
                  {strength.hasUppercase ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Mayúscula</span>
                </div>
                <div
                  className={`flex items-center gap-1 p-1 rounded-md border ${
                    strength.hasLowercase
                      ? 'bg-emerald-100 dark:bg-turquesa/15 border-emerald-300 dark:border-turquesa/40 text-emerald-900 dark:text-turquesa font-bold'
                      : 'bg-arena/10 border-arena/20 text-negro/60 dark:text-arena/60'
                  }`}
                >
                  {strength.hasLowercase ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Minúscula</span>
                </div>
                <div
                  className={`flex items-center gap-1 p-1 rounded-md border ${
                    strength.hasNumber
                      ? 'bg-emerald-100 dark:bg-turquesa/15 border-emerald-300 dark:border-turquesa/40 text-emerald-900 dark:text-turquesa font-bold'
                      : 'bg-arena/10 border-arena/20 text-negro/60 dark:text-arena/60'
                  }`}
                >
                  {strength.hasNumber ? <Check className="w-3 h-3 stroke-[3]" /> : '●'}
                  <span>1 Número</span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-coral/10 border border-coral/30 text-coral p-3 rounded-xl text-xs font-sans font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !strength.isValid}
              className="bg-oro text-negro font-sans font-bold text-xs tracking-wider py-4 rounded-xl shadow-lg hover:bg-blanco transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>GUARDANDO ENCRIPTADO...</span>
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
