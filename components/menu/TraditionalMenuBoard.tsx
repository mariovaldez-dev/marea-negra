'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { Categoria, Platillo } from '@/lib/types/database'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { generateWhatsAppMessageUrl } from '@/lib/utils/whatsapp'
import { isPromoActiveToday, getPromoBannerText } from '@/lib/utils/promo'

interface TraditionalMenuBoardProps {
  categorias: Categoria[]
  platillos: Platillo[]
  onBackToInteractive?: () => void
}

export function TraditionalMenuBoard({
  categorias,
  platillos,
  onBackToInteractive,
}: TraditionalMenuBoardProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  const generateWhatsAppUrl = () => {
    return generateWhatsAppMessageUrl('Hola, quisiera hacer una reservación o pedido en Marea Negra.')
  }

  // Agrupar platillos por categoría
  const groupedCategories =
    categorias.length > 0
      ? categorias
      : [{ id: 1, nombre: 'Aguachiles & Especialidades', orden: 1 }]

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-negro dark:bg-[#080808] dark:text-blanco p-4 sm:p-8 flex flex-col items-center selection:bg-coral transition-colors">
      {/* BARRA DE HERRAMIENTAS SUPERIOR */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-4 mb-8">
        {onBackToInteractive ? (
          <button
            onClick={onBackToInteractive}
            className="text-xs font-sans font-bold text-turquesa hover:text-coral flex items-center gap-1.5 bg-turquesa/10 border border-turquesa/30 px-4 py-2 rounded-full transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Vista Interactiva</span>
          </button>
        ) : (
          <Link
            href="/"
            className="text-xs font-sans font-bold text-turquesa hover:text-coral flex items-center gap-1.5 bg-turquesa/10 border border-turquesa/30 px-4 py-2 rounded-full transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir al Menú Interactivo</span>
          </Link>
        )}
      </div>

      {/* CARTA DE MENÚ TRADICIONAL */}
      <div
        ref={menuRef}
        className="w-full max-w-4xl bg-white text-negro dark:bg-[#0B0907] dark:text-blanco bg-dots-pattern border-2 border-arena/40 dark:border-oro/30 rounded-3xl p-6 sm:p-12 gold-border-corner shadow-2xl flex flex-col gap-10 transition-colors"
      >
        {/* ENCABEZADO DEL MENÚ TRADICIONAL */}
        <header className="flex flex-col items-center text-center gap-3 border-b border-arena/30 dark:border-oro/20 pb-8">
          <BrandLogo size="lg" stacked withSubtext />
          <div className="flex items-center gap-3 my-1">
            <span className="h-[1px] w-12 bg-gradient-to-r from-transparent via-coral dark:via-oro to-transparent" />
            <span className="text-xs font-sans font-bold tracking-[0.3em] text-coral dark:text-turquesa uppercase">
              CARTA TRADICIONAL DE MARISCOS
            </span>
            <span className="h-[1px] w-12 bg-gradient-to-r from-transparent via-coral dark:via-oro to-transparent" />
          </div>
          <p className="font-sans italic text-sm text-negro/70 dark:text-arena/80">
            Elaborados al momento con pesca fresca de Sinaloa y chiles seleccionados
          </p>
        </header>

        {/* SECCIONES DEL MENÚ */}
        {groupedCategories.map((cat, cIdx) => {
          const catPlatillos = platillos.filter(
            (p) => (p.categoria_id === cat.id || (!p.categoria_id && cat.id === 1)) && (!p.es_promocion || isPromoActiveToday(p))
          )
          if (catPlatillos.length === 0) return null

          return (
            <section key={cat.id} className="flex flex-col gap-6">
              {/* TITULO DE CATEGORÍA */}
              <div className="flex items-center justify-between border-b border-arena/30 dark:border-arena/15 pb-2">
                <h2 className="font-display text-3xl sm:text-4xl text-coral dark:text-limon tracking-wider flex items-center gap-2">
                  {cat.nombre.toUpperCase()}
                </h2>
                <span className="text-xs font-sans text-negro/50 dark:text-arena/50 uppercase tracking-widest">
                  SECCIÓN 0{cIdx + 1}
                </span>
              </div>

              {/* LISTA ESTILO MENÚ TRADICIONAL CON PUNTOS LIDER */}
              <div className="flex flex-col gap-5">
                {catPlatillos.map((platillo) => (
                  <div key={platillo.id} className="flex flex-col gap-1 group">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-xl sm:text-2xl text-negro dark:text-blanco tracking-wide group-hover:text-turquesa transition-colors">
                          {platillo.nombre}
                        </h3>
                        {isPromoActiveToday(platillo) && (
                          <span className="text-[9px] font-sans font-bold text-blanco uppercase bg-gradient-to-r from-coral to-oro border border-coral/30 px-2 py-0.5 rounded-full shadow-sm">
                            {getPromoBannerText(platillo)}
                          </span>
                        )}
                        {!platillo.disponible && (
                          <span className="text-[10px] font-sans font-bold text-coral uppercase bg-coral/10 border border-coral/20 px-2 py-0.5 rounded-full">
                            AGOTADO
                          </span>
                        )}
                      </div>

                      {/* LÍNEA DE PUNTOS LÍDER */}
                      <span className="flex-1 border-b border-dotted border-arena/40 dark:border-arena/30 mx-2 hidden sm:inline-block" />

                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-2xl text-coral font-bold">
                          ${platillo.precio.toFixed(0)} <span className="text-xs text-negro/60 dark:text-arena/60 font-sans font-normal">MXN</span>
                        </span>
                        {platillo.precio_anterior && platillo.precio_anterior > platillo.precio && (
                          <span className="font-display text-base text-negro/40 dark:text-arena/40 line-through">
                            ${platillo.precio_anterior.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {platillo.descripcion && (
                      <p className="font-sans text-xs sm:text-sm text-negro/70 dark:text-arena/70 pl-2 sm:pl-0 max-w-2xl leading-relaxed">
                        {platillo.descripcion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {/* PIE DE CARTA DE RESTAURANTE */}
        <footer className="mt-6 pt-8 border-t-2 border-arena/30 dark:border-oro/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
            <span className="font-display text-xl text-negro dark:text-blanco tracking-wide">
              MAREA NEGRA — AGUACHILES
            </span>
            <span className="font-sans italic text-xs text-negro/60 dark:text-arena/70">
              Precios con IVA incluido · Sinaloa, México
            </span>
          </div>

          <a
            href={generateWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-limon text-black font-sans font-bold text-xs tracking-wider px-6 py-3 rounded-full hover:bg-turquesa hover:text-negro transition-all flex items-center gap-2 shadow-md"
          >
            <MessageCircle className="w-4 h-4 fill-black" />
            <span>PEDIR POR WHATSAPP</span>
          </a>
        </footer>
      </div>
    </div>
  )
}
