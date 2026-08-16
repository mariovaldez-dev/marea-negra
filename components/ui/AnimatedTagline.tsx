'use client'

import React, { useState } from 'react'
import { motion, Variants } from 'framer-motion'

export function AnimatedTagline() {
  const [isTapped, setIsTapped] = useState(false)
  const line1 = '¡Al vrgazo!,'
  const line2 = 'como nos gusta.'

  const handleTap = () => {
    setIsTapped(true)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30)
      } catch (e) {}
    }
    setTimeout(() => setIsTapped(false), 600)
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.4,
      },
    },
  }

  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 32, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 15,
      },
    },
    hover: {
      y: -8,
      scale: 1.12,
      color: '#E8430A',
      transition: {
        type: 'spring',
        stiffness: 450,
        damping: 12,
      },
    },
    tap: {
      scale: 0.92,
      y: 2,
      transition: { duration: 0.1 },
    },
  }

  return (
    <motion.div
      onClick={handleTap}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileTap={{ scale: 0.98 }}
      className="flex flex-col justify-center items-center md:items-start text-center md:text-left border-t-2 md:border-t-0 md:border-l-4 border-coral/40 md:border-coral/80 pt-4 md:pt-2 md:pl-6 mt-2 md:mt-0 cursor-pointer select-none group w-full md:w-auto"
    >
      <div className="flex flex-wrap justify-center md:justify-start font-display text-5xl lg:text-7xl text-negro dark:text-blanco uppercase tracking-widest leading-none">
        {line1.split('').map((char, index) => (
          <motion.span
            key={`l1-${index}`}
            variants={letterVariants}
            whileHover="hover"
            whileTap="tap"
            className="inline-block transition-colors"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.6, ease: 'easeOut' }}
        className="font-serif italic text-3xl lg:text-4xl text-negro/70 dark:text-arena/80 mt-1"
      >
        {line2}
      </motion.div>
    </motion.div>
  )
}
