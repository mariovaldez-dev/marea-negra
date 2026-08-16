'use client'

import React, { useState } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  haptic?: boolean
}

export function RippleButton({
  children,
  className = '',
  onClick,
  disabled = false,
  haptic = false,
  type = 'button',
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])

  const createRipple = (clientX: number, clientY: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const size = Math.max(rect.width, rect.height)

    const newRipple: Ripple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size,
    }

    setRipples((prev) => [...prev, newRipple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
    }, 600)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    createRipple(e.clientX, e.clientY, e.currentTarget)

    if (haptic && typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([25, 15, 50])
      } catch (err) {}
    }

    if (onClick) onClick(e)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (disabled) return
    const touch = e.touches[0]
    if (touch) {
      createRipple(touch.clientX, touch.clientY, e.currentTarget)
    }
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`relative overflow-hidden ${className}`}
      {...(props as any)}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none bg-white/30 animate-ripple"
          style={{
            top: ripple.y - 4,
            left: ripple.x - 4,
            width: 8,
            height: 8,
          }}
        />
      ))}
      <span className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
        {children}
      </span>
    </motion.button>
  )
}
