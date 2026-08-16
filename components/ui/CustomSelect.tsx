'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  emoji?: string
  subtitle?: string
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = '-- Selecciona una opción --',
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      {/* Botón Principal Selector */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 hover:border-turquesa dark:hover:border-oro rounded-xl px-4 py-3 text-left font-sans text-sm md:text-base text-negro dark:text-blanco flex items-center justify-between transition-all shadow-sm focus:outline-none"
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.emoji && <span>{selectedOption.emoji}</span>}
              <span className="font-semibold">{selectedOption.label}</span>
              {selectedOption.subtitle && (
                <span className="text-xs text-negro/60 dark:text-arena/60">
                  {selectedOption.subtitle}
                </span>
              )}
            </>
          ) : (
            <span className="text-negro/50 dark:text-arena/50">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-turquesa dark:text-oro shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover desplegable customizado 100% libre de estilos nativos macOS */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#F4F0E8] dark:bg-[#111111] border-2 border-turquesa/40 dark:border-oro/40 rounded-2xl p-1.5 shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {options.length === 0 ? (
            <div className="p-3 text-xs font-sans text-negro/50 dark:text-arena/50 text-center">
              No hay opciones disponibles
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={`px-3 py-2.5 rounded-xl font-sans text-xs md:text-sm flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-turquesa/20 text-turquesa font-bold dark:bg-oro/20 dark:text-oro'
                      : 'text-negro dark:text-blanco hover:bg-turquesa/15 dark:hover:bg-carbon'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {opt.emoji && <span className="text-base">{opt.emoji}</span>}
                    <span className="truncate">{opt.label}</span>
                    {opt.subtitle && (
                      <span className="text-[11px] font-mono text-negro/60 dark:text-arena/60">
                        {opt.subtitle}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-turquesa dark:text-oro shrink-0" />
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
