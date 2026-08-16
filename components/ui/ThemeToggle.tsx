'use client'

import React from 'react'
import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Conmutar Tema Marea Oscura / Marea Clara"
      className={`relative inline-flex items-center justify-center p-2 rounded-full border transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-carbon text-oro border-oro/30 hover:border-oro hover:shadow-[0_0_15px_rgba(201,168,76,0.3)]'
          : 'bg-blanco text-azul border-azul/30 hover:border-azul hover:shadow-[0_0_15px_rgba(13,59,94,0.2)]'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 transition-transform duration-500 rotate-0 hover:rotate-90" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-500 rotate-0 hover:-rotate-45" />
      )}
    </button>
  )
}
