'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function OceanWaveSurge() {
  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden h-36 sm:h-48 md:h-56 z-0 select-none">
      {/* 1. OLA DE FONDO (Azul Abisal Profundo - Marea Negra) */}
      <motion.div
        animate={{
          x: [0, -1000],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute bottom-0 left-0 w-[2000px] sm:w-[2800px] h-full opacity-35 dark:opacity-40"
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full text-[#0D3B5E] fill-current"
        >
          <path d="M0,0 C150,90 350,-40 500,60 C650,140 900,10 1200,40 L1200,120 L0,120 Z" />
        </svg>
      </motion.div>

      {/* 2. OLA MEDIA (Turquesa Bioluminiscente Fluido) */}
      <motion.div
        animate={{
          x: [-1000, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute bottom-0 left-0 w-[2000px] sm:w-[2800px] h-[90%] opacity-25 dark:opacity-30"
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full text-turquesa fill-current"
        >
          <path d="M0,30 C200,110 450,0 700,70 C950,130 1100,20 1200,50 L1200,120 L0,120 Z" />
        </svg>
      </motion.div>

      {/* 3. OLA FRONTAL (Espuma & Cresta de Marea Marina) */}
      <motion.div
        animate={{
          x: [0, -800],
          y: [0, -10, 0],
        }}
        transition={{
          x: { duration: 9, repeat: Infinity, ease: 'linear' },
          y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute bottom-0 left-0 w-[2000px] sm:w-[2600px] h-[75%] opacity-20 dark:opacity-20"
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full text-turquesa dark:text-[#2ABFBF] fill-current"
        >
          <path d="M0,60 C180,10 320,80 520,30 C720,-10 920,90 1200,40 L1200,120 L0,120 Z" />
        </svg>
      </motion.div>

      {/* Gradiente de Fusión Abisal inferior */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#EFEAE1]/90 dark:from-carbon/90 to-transparent" />
    </div>
  )
}
