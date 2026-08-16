'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SplashParticle {
  id: number
  x: number
  y: number
}

export function FloatingShrimp() {
  const [splashes, setSplashes] = useState<SplashParticle[]>([])
  const [isTapped, setIsTapped] = useState(false)

  const handleTap = () => {
    setIsTapped(true)

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([20, 20, 40])
      } catch (e) {}
    }

    // Generar partículas de salpicadura 💦
    const newSplash: SplashParticle = {
      id: Date.now() + Math.random(),
      x: (Math.random() - 0.5) * 30,
      y: (Math.random() - 0.5) * 30,
    }

    setSplashes((prev) => [...prev, newSplash])

    setTimeout(() => {
      setSplashes((prev) => prev.filter((s) => s.id !== newSplash.id))
      setIsTapped(false)
    }, 800)
  }

  return (
    <div className="block md:hidden absolute right-3 top-20 z-20 select-none">
      <motion.div
        onClick={handleTap}
        className="cursor-pointer relative flex items-center justify-center p-2 touch-manipulation"
        animate={
          isTapped
            ? {
                scale: 1.3,
                rotate: 360,
              }
            : {
                y: [0, -22, 0],
                rotate: [0, 12, -8, 0],
                scale: [1, 1.06, 1],
              }
        }
        transition={
          isTapped
            ? { duration: 0.45, ease: 'easeOut' }
            : {
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
        whileTap={{ scale: 1.35 }}
      >
        <span className="text-5xl sm:text-6xl drop-shadow-[0_8px_16px_rgba(232,67,10,0.4)]">
          🦐
        </span>

        {/* Partículas de salpicadura al tocar */}
        <AnimatePresence>
          {splashes.map((splash) => (
            <motion.span
              key={splash.id}
              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 1.6,
                x: splash.x * 2.5,
                y: splash.y * 2.5 - 20,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="absolute pointer-events-none text-2xl"
            >
              💦
            </motion.span>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
