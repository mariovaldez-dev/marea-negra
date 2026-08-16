'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function CustomCursor() {
  const [mounted, setMounted] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(true)
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 })
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window === 'undefined') return

    // Detectar si el dispositivo tiene cursor/mouse real (no pantalla táctil pura)
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    setIsTouchDevice(!hasFinePointer)

    if (!hasFinePointer) return

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      if (!isVisible) setIsVisible(true)

      // Detectar elementos interactivos bajo el cursor
      const target = e.target as HTMLElement | null
      if (target) {
        const isInteractive = Boolean(
          target.closest('a, button, [role="button"], input, select, textarea, label, [data-cursor="pointer"]')
        )
        setIsHovered(isInteractive)
      }
    }

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)
    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [isVisible])

  if (!mounted || isTouchDevice || !isVisible) return null

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[999999] select-none text-2xl flex items-center justify-center will-change-transform"
      style={{
        width: 36,
        height: 36,
        marginLeft: -18,
        marginTop: -18,
      }}
      animate={{
        x: mousePos.x,
        y: mousePos.y,
        scale: isClicking ? 0.85 : isHovered ? 1.45 : 1,
        rotate: isClicking ? -25 : isHovered ? 20 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 450,
        damping: 28,
        mass: 0.5,
      }}
    >
      <span className="drop-shadow-[0_4px_12px_rgba(232,67,10,0.5)]">
        🦐
      </span>
    </motion.div>
  )
}
