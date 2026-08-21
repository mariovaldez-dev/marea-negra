'use client'

import React from 'react'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero' | 'story'
  variant?: 'default' | 'story'
  stacked?: boolean
  withSubtext?: boolean
  withSlogan?: boolean
  align?: 'left' | 'center' | 'right'
  animated?: boolean
  className?: string
  href?: string | null
}

export function BrandLogo({
  size = 'md',
  variant = 'default',
  stacked = false,
  withSubtext = false,
  withSlogan = false,
  align = 'left',
  animated = false,
  className = '',
  href = '/',
}: BrandLogoProps) {
  const isStory = variant === 'story' || size === 'story'
  const isStacked = isStory ? (stacked ?? true) : stacked
  const showSubtext = isStory ? true : withSubtext
  const showSlogan = isStory ? true : withSlogan

  const sizeClasses = {
    xs: 'text-xl md:text-2xl leading-[0.88]',
    sm: 'text-2xl md:text-3xl leading-[0.88]',
    story: 'text-3xl md:text-4xl leading-[0.88]',
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

  const subtextSizeClasses = {
    xs: 'text-xs md:text-sm tracking-[0.18em] mt-0.5 leading-none',
    sm: 'text-sm md:text-base tracking-[0.2em] mt-0.5 leading-none',
    story: 'text-base md:text-lg tracking-[0.2em] mt-0.5 leading-none',
    md: 'text-2xl md:text-3xl tracking-[0.25em] mt-1.5 pl-2',
    lg: 'text-3xl md:text-4xl tracking-[0.25em] mt-2 pl-2',
    hero: 'text-3xl md:text-5xl tracking-[0.25em] mt-2 pl-2',
  }

  const alignClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }

  const logoContent = (
    <div className={`flex flex-col select-none group ${alignClasses[align]} ${className}`}>
      {isStacked ? (
        <div className={`flex flex-col ${align === 'center' ? 'items-center' : 'items-start'} font-display uppercase tracking-tight`}>
          {renderText('MAREA', 0)}
          {renderText('NEGRA', 5)}
        </div>
      ) : (
        <div className={`flex items-center gap-2 font-display uppercase tracking-tight ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
          {renderText('MAREA NEGRA', 0)}
        </div>
      )}

      {showSubtext && (
        animated ? (
          <motion.span
            initial={{ opacity: 0, letterSpacing: '0.05em' }}
            animate={{ opacity: 1, letterSpacing: '0.2em' }}
            transition={{ delay: 0.85, duration: 0.6, ease: 'easeOut' }}
            className={`font-display font-bold text-coral uppercase ${subtextSizeClasses[size]}`}
          >
            AGUACHILES
          </motion.span>
        ) : (
          <span className={`font-display font-bold text-coral uppercase ${subtextSizeClasses[size]}`}>
            AGUACHILES
          </span>
        )
      )}

      {showSlogan && (
        <div className={`mt-0.5 flex items-center gap-1 ${align === 'center' ? 'justify-center' : 'justify-start'} leading-none`}>
          <span className="font-display font-bold text-blanco tracking-wider text-xs uppercase">
            ¡AL VRGAZO!,
          </span>
          <span className="font-serif italic text-arena/90 text-xs">
            como nos gusta.
          </span>
        </div>
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

