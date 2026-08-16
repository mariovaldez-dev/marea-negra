'use client'

import React from 'react'
import Link from 'next/link'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero'
  stacked?: boolean
  withSubtext?: boolean
  className?: string
  href?: string
}

export function BrandLogo({
  size = 'md',
  stacked = false,
  withSubtext = false,
  className = '',
  href = '/',
}: BrandLogoProps) {
  // Configuración de tamaños para el logo 3D estrujado
  const sizeClasses = {
    sm: 'text-2xl md:text-3xl leading-[0.88]',
    md: 'text-3xl md:text-4xl leading-[0.88]',
    lg: 'text-5xl md:text-6xl leading-[0.88]',
    hero: 'text-7xl md:text-9xl leading-[0.84]',
  }

  // Sombras 3D escalonadas en tono Coral Quemado Terracota (#D93806 / #942905)
  const shadowStyleSmall = {
    textShadow: `
      1.5px 1.5px 0px #C23A0A,
      3px 3px 0px #C23A0A,
      4.5px 4.5px 0px #822204,
      6px 6px 0px #421001
    `,
  }

  const shadowStyleLarge = {
    textShadow: `
      2px 2px 0px #D93806,
      4px 4px 0px #D93806,
      6px 6px 0px #B52B02,
      8px 8px 0px #8A1E01,
      10px 10px 0px #5E1200,
      12px 12px 0px #330800
    `,
  }

  const activeShadow = size === 'hero' || size === 'lg' ? shadowStyleLarge : shadowStyleSmall

  const logoContent = (
    <div className={`flex flex-col select-none group ${className}`}>
      {stacked ? (
        // LOGO APILADO EN DOS LÍNEAS (IGUAL A TU IMAGEN DE REFERENCIA)
        <div className="flex flex-col items-start font-display uppercase tracking-tight">
          <span
            style={activeShadow}
            className={`text-blanco font-bold tracking-wider ${sizeClasses[size]}`}
          >
            MAREA
          </span>
          <span
            style={activeShadow}
            className={`text-blanco font-bold tracking-wider ${sizeClasses[size]}`}
          >
            NEGRA
          </span>
        </div>
      ) : (
        // LOGO EN UNA SOLA LÍNEA (PARA NAV BARS)
        <div className="flex items-center gap-2 font-display uppercase tracking-tight">
          <span
            style={activeShadow}
            className={`text-blanco font-bold tracking-wider ${sizeClasses[size]}`}
          >
            MAREA NEGRA
          </span>
        </div>
      )}

      {withSubtext && (
        <span className="font-display font-bold text-coral text-2xl md:text-3xl tracking-[0.25em] uppercase mt-2 pl-2">
          AGUACHILES
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-95 transition-opacity">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}
