'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Platillo } from '@/lib/types/database'
import { ProductCard } from '@/components/ui/ProductCard'

interface DishCarouselSectionProps {
  platillos: Platillo[]
  onSelect: (platillo: Platillo) => void
  categoryIndex: number
}

export function DishCarouselSection({
  platillos,
  onSelect,
  categoryIndex,
}: DishCarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      const scrollLeft = el.scrollLeft
      const cardWidth = el.offsetWidth * 0.85
      const newIndex = Math.round(scrollLeft / cardWidth)
      setActiveIndex(Math.min(Math.max(0, newIndex), platillos.length - 1))
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [platillos.length])

  const scrollToDish = (idx: number) => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.offsetWidth * 0.85
    el.scrollTo({ left: idx * cardWidth, behavior: 'smooth' })
  }

  return (
    <div className="w-full">
      {/* 1. VISTA DESKTOP (GRID DE 3 COLUMNAS CON STAGGER ANIMATION) */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {platillos.map((platillo, pIdx) => (
          <motion.div
            key={platillo.id}
            initial={{ opacity: 0, y: 45 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{
              delay: (pIdx % 3) * 0.1,
              duration: 0.5,
              ease: 'easeOut',
            }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="h-full"
          >
            <ProductCard
              platillo={platillo}
              onSelect={() => onSelect(platillo)}
              priority={categoryIndex === 0 && pIdx < 3}
            />
          </motion.div>
        ))}
      </div>

      {/* 2. VISTA MÓVIL (CARRUSEL HORIZONTAL CON SNAP TÁCTIL) */}
      <div className="md:hidden flex flex-col gap-3">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-6 px-6 no-scrollbar scroll-smooth"
        >
          {platillos.map((platillo, pIdx) => (
            <motion.div
              key={platillo.id}
              whileTap={{ scale: 0.97 }}
              className="snap-center shrink-0 w-[84vw] max-w-[340px]"
            >
              <ProductCard
                platillo={platillo}
                onSelect={() => onSelect(platillo)}
                priority={categoryIndex === 0 && pIdx < 2}
              />
            </motion.div>
          ))}
        </div>

        {/* Indicador de Dots en Móvil */}
        {platillos.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {platillos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToDish(idx)}
                aria-label={`Ir al platillo ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeIndex === idx
                    ? 'w-6 bg-coral shadow-[0_0_8px_rgba(232,67,10,0.5)]'
                    : 'w-2 bg-arena/30 dark:bg-arena/20'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
