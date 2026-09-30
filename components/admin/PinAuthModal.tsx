'use client'

import React, { useState } from 'react'
import { Profile, UserRole } from '@/lib/types/database'
import { verificarPinEmpleado } from '@/lib/actions/empleados'
import {
  X,
  KeyRound,
  Loader2,
  Delete,
  ShieldCheck,
  UserCheck,
  AlertCircle,
} from 'lucide-react'

interface PinAuthModalProps {
  title?: string
  subtitle?: string
  allowedRoles?: UserRole[]
  onSuccess: (empleado: Profile) => void
  onClose: () => void
}

export function PinAuthModal({
  title = 'Autenticación de Empleado',
  subtitle = 'Ingresa tu PIN de 4 dígitos para continuar',
  allowedRoles,
  onSuccess,
  onClose,
}: PinAuthModalProps) {
  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return
    setErrorMsg('')
    const nextPin = pin + digit
    setPin(nextPin)

    // Auto-validar cuando se tienen 4 dígitos
    if (nextPin.length === 4) {
      validatePin(nextPin)
    }
  }

  const handleDelete = () => {
    setErrorMsg('')
    setPin((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setErrorMsg('')
    setPin('')
  }

  const validatePin = async (pinToTest: string) => {
    setIsValidating(true)
    setErrorMsg('')

    try {
      const empleado = await verificarPinEmpleado(pinToTest)
      if (!empleado) {
        setErrorMsg('PIN incorrecto o empleado inactivo.')
        setPin('')
        return
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(empleado.rol)) {
        setErrorMsg(`Acción no permitida para el rol: ${empleado.rol.toUpperCase()}`)
        setPin('')
        return
      }

      onSuccess(empleado)
    } catch (err) {
      console.error('Error al validar PIN:', err)
      setErrorMsg('Error de conexión al verificar PIN.')
      setPin('')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-negro dark:text-blanco flex flex-col items-center">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-negro/40 dark:text-arena/40 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icono Cabecera */}
        <div className="w-12 h-12 rounded-2xl bg-turquesa/10 text-turquesa flex items-center justify-center mb-3 shadow-inner">
          <KeyRound className="w-6 h-6" />
        </div>

        <h3 className="font-display text-2xl font-bold text-center">
          {title}
        </h3>
        <p className="text-xs text-negro/60 dark:text-arena/60 text-center mt-1 mb-4 font-serif italic max-w-[240px]">
          {subtitle}
        </p>

        {/* Indicador de PIN (Círculos) */}
        <div className="flex items-center justify-center gap-3 my-2">
          {[0, 1, 2, 3].map((idx) => {
            const hasValue = pin.length > idx
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  hasValue
                    ? 'bg-turquesa scale-110 shadow-[0_0_10px_rgba(42,191,191,0.5)]'
                    : 'border-2 border-black/20 dark:border-white/20 bg-transparent'
                }`}
              />
            )
          })}
        </div>

        {/* Mensaje de Error o Cargando */}
        <div className="h-6 flex items-center justify-center my-1 text-center">
          {isValidating ? (
            <div className="flex items-center gap-1.5 text-xs text-turquesa font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Verificando...</span>
            </div>
          ) : errorMsg ? (
            <div className="flex items-center gap-1 text-xs text-coral font-bold animate-shake">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{errorMsg}</span>
            </div>
          ) : null}
        </div>

        {/* Teclado Numérico POS */}
        <div className="grid grid-cols-3 gap-2.5 w-full mt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isValidating}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-turquesa hover:text-negro active:scale-95 font-display text-2xl font-bold transition-all border border-black/5 dark:border-white/5 disabled:opacity-50"
            >
              {digit}
            </button>
          ))}

          {/* Borrar todo (C) */}
          <button
            type="button"
            disabled={isValidating || pin.length === 0}
            onClick={handleClear}
            className="h-14 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 font-sans text-xs font-bold text-negro/60 dark:text-arena/60 transition-all border border-black/5 dark:border-white/5 disabled:opacity-30"
          >
            LIMPIAR
          </button>

          {/* Cero (0) */}
          <button
            type="button"
            disabled={isValidating}
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-turquesa hover:text-negro active:scale-95 font-display text-2xl font-bold transition-all border border-black/5 dark:border-white/5 disabled:opacity-50"
          >
            0
          </button>

          {/* Retroceso (Delete) */}
          <button
            type="button"
            disabled={isValidating || pin.length === 0}
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-red-500/10 hover:text-red-500 active:scale-95 flex items-center justify-center transition-all border border-black/5 dark:border-white/5 disabled:opacity-30"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
