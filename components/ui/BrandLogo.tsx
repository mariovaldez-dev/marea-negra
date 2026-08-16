'use client'

import React from 'react'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero'
  stacked?: boolean
  withSubtext?: boolean
  animated?: boolean
  className?: string
  href?: string
}

export function BrandLogo({
  size = 'md',
  stacked = false,
  withSubtext = false,
  animated = false,
  className = '',
  href = '/',
}: BrandLogoProps) {
  const sizeClasses = {
    sm: 'text-2xl md:text-3xl leading-[0.88]',
    md: 'text-3xl md:text-4xl leading-[0.88]',
    lg: 'text-5xl md:text-6xl leading-[0.88]',
    hero: 'text-7xl md:text-9xl leading-[0.84]',
  }

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

  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 35 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.15 + i * 0.04,
        type: 'spring',
        stiffness: 350,
        damping: 20,
      },
    }),
  }

  const renderText = (text: string, startIndex = 0) => {
    if (!animated) {
      return (
        <span
          style={activeShadow}
          className={`text-blanco font-bold tracking-wider ${sizeClasses[size]}`}
        >
          {text}
        </span>
      )
    }

    return (
      <span
        style={activeShadow}
        className={`text-blanco font-bold tracking-wider inline-flex ${sizeClasses[size]}`}
      >
        {text.split('').map((char, idx) => (
          <motion.span
            key={idx}
            custom={startIndex + idx}
            variants={letterVariants}
            initial="hidden"
            animate="visible"
            className="inline-block"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </span>
    )
  }

  const logoContent = (
    <div className={`flex flex-col select-none group ${className}`}>
      {stacked ? (
        <div className="flex flex-col items-start font-display uppercase tracking-tight">
          {renderText('MAREA', 0)}
          {renderText('NEGRA', 5)}
        </div>
      ) : (
        <div className="flex items-center gap-2 font-display uppercase tracking-tight">
          {renderText('MAREA NEGRA', 0)}
        </div>
      )}

      {withSubtext && (
        animated ? (
          <motion.span
            initial={{ opacity: 0, letterSpacing: '0.05em' }}
            animate={{ opacity: 1, letterSpacing: '0.25em' }}
            transition={{ delay: 0.85, duration: 0.6, ease: 'easeOut' }}
            className="font-display font-bold text-coral text-2xl md:text-3xl uppercase mt-2 pl-2"
          >
            AGUACHILES
          </motion.span>
        ) : (
          <span className="font-display font-bold text-coral text-2xl md:text-3xl tracking-[0.25em] uppercase mt-2 pl-2">
            AGUACHILES
          </span>
        )
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

