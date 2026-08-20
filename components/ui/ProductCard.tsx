'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Platillo } from '@/lib/types/database'
import { isPromoActiveToday, getPromoBannerText, isPromoItem, parsePrice, formatPrice } from '@/lib/utils/promo'
import { Plus, ExpandIcon, X, Loader2, Sparkles, Flame } from 'lucide-react'

interface ProductCardProps {
  platillo: Platillo
  onSelect?: (platillo: Platillo) => void
  priority?: boolean
  previewMode?: boolean
}

// CACHE GLOBAL EN MEMORIA DE IMÁGENES DESCARGADAS
const globalLoadedImages = new Set<string>()

export function ProductCard({
  platillo,
  onSelect,
  priority = false,
  previewMode = false,
}: ProductCardProps) {
  const isAvailable = platillo.disponible
  const hasPromo = isPromoItem(platillo)
  // isPromoActive: en previewMode muestra siempre; en producción solo si hoy es día de la promo
  const isPromoActive = previewMode ? hasPromo : isPromoActiveToday(platillo)
  const [isZoomOpen, setIsZoomOpen] = useState(false)

  const isCached = platillo.imagen_url ? globalLoadedImages.has(platillo.imagen_url) : false
  const [imageLoaded, setImageLoaded] = useState(isCached)
  const [zoomImageLoaded, setZoomImageLoaded] = useState(isCached)

  const handleOpenZoom = () => {
    if (imageLoaded || (platillo.imagen_url && globalLoadedImages.has(platillo.imagen_url))) {
      setZoomImageLoaded(true)
    } else {
      setZoomImageLoaded(false)
      requestAnimationFrame(() => {
        setTimeout(() => {
          setZoomImageLoaded(true)
        }, 50)
      })
    }
    setIsZoomOpen(true)
  }

  // Bloquear el scroll y movimiento del fondo al abrir el zoom HD
  React.useEffect(() => {
    if (isZoomOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isZoomOpen])

  return (
    <>
      <div className="relative group overflow-hidden rounded-2xl bg-white text-negro dark:bg-[#080808] dark:text-blanco border border-arena/30 dark:border-arena/10 shadow-xl transition-all duration-300 hover:border-turquesa hover:shadow-[0_0_30px_rgba(42,191,191,0.25)] flex flex-col justify-between h-[450px] select-none">
        {/* ÁREA DE IMAGEN CON TRANSICIÓN DIFUMINADA PROGRESIVA (BLUR-SMOOTH) */}
        <div
          onClick={handleOpenZoom}
          onContextMenu={(e) => e.preventDefault()}
          className="relative w-full h-[230px] overflow-hidden cursor-pointer bg-[#EBE5D8] dark:bg-carbon select-none transition-colors"
        >
          {platillo.imagen_url ? (
            <>
              {/* SKELETON DE RESGUARDO MIENTRAS CARGA LA FOTO POR RED */}
              {!imageLoaded && (
                <div className="absolute inset-0 z-0 bg-[#EBE5D8] dark:bg-carbon animate-pulse flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-1.5 text-turquesa font-sans font-bold text-[10px] uppercase tracking-wider">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cargando imagen...</span>
                  </div>
                </div>
              )}

              <Image
                src={platillo.imagen_url}
                alt={platillo.nombre}
                fill
                priority={priority}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onLoad={() => {
                  if (platillo.imagen_url) globalLoadedImages.add(platillo.imagen_url)
                  setImageLoaded(true)
                }}
                className={`object-cover group-hover:scale-108 transition-all duration-700 ease-out transform-gpu pointer-events-none select-none ${imageLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'
                  }`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />

              {/* CAPA TRANSPARENTE PROTECTORA ANTI-GUARDAR / ANTI-ARRASTRAR */}
              <div
                className="absolute inset-0 z-10 bg-transparent select-none"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-10 pointer-events-none" />

              {/* Botón Flotante "Ver Foto HD" */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenZoom()
                }}
                className="absolute bottom-3 right-3 z-20 bg-negro/90 text-blanco border border-oro/40 px-3 py-1.5 rounded-full text-xs font-sans font-bold flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-all hover:bg-turquesa hover:text-negro"
              >
                <ExpandIcon className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 overflow-hidden bg-[#080808] flex items-center justify-center">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-ocean-blob rounded-full pointer-events-none opacity-60" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-coral-blob rounded-full pointer-events-none opacity-40" />

              <div className="flex flex-col items-center gap-2 text-center p-4 relative z-10">
                <Flame className="w-10 h-10 text-turquesa filter drop-shadow-[0_0_12px_rgba(42,191,191,0.5)]" />
                <span className="font-display text-lg text-blanco tracking-widest uppercase">
                  MAREA NEGRA
                </span>
                <span className="font-sans italic text-xs text-arena/70">
                  Mariscos Frescos de Sinaloa
                </span>
              </div>
            </div>
          )}

          {/* Badges de Disponibilidad y Promoción */}
          {/* Si la promo está activa HOY → solo badge de promo (quita "DISPONIBLE HOY") */}
          {/* Si no hay promo o no es el día → badge normal de disponibilidad */}
          <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-center pointer-events-none gap-2">
            {isPromoActive ? (
              <span className="text-[10px] md:text-xs font-sans font-extrabold tracking-wider uppercase border border-coral/40 text-blanco bg-gradient-to-r from-coral via-coral/90 to-oro px-3 py-1 rounded-full shadow-[0_0_15px_rgba(232,67,10,0.5)] flex items-center gap-1">
                <Flame className="w-3 h-3 fill-blanco animate-pulse" />
                <span>{getPromoBannerText(platillo)}</span>
              </span>
            ) : (
              <span
                className={`text-[10px] md:text-xs font-sans font-bold tracking-widest uppercase border px-3 py-1 rounded-full shadow-md ${isAvailable
                  ? 'border-limon text-black bg-limon shadow-[0_0_15px_rgba(222,253,111,0.2)] pointer-events-none'
                  : 'border-coral text-coral bg-negro/85 pointer-events-none'
                  }`}
              >
                {isAvailable ? 'DISPONIBLE HOY' : 'AGOTADO'}
              </span>
            )}
          </div>
        </div>

        {/* CONTENIDO INFERIOR: TÍTULO, PRECIO Y CTA */}
        <div className="p-5 flex flex-col justify-between flex-1 gap-3 bg-white dark:bg-[#080808] transition-colors">
          <div className="flex flex-col gap-1">
            <h3
              onClick={handleOpenZoom}
              className="font-display text-2xl md:text-3xl text-negro dark:text-blanco group-hover:text-turquesa transition-colors tracking-wide leading-tight cursor-pointer flex items-center gap-2"
            >
              <span>{platillo.nombre}</span>
            </h3>

            {platillo.descripcion && (
              <p className="font-sans text-xs md:text-sm text-negro/75 dark:text-arena/80 line-clamp-2 mt-0.5">
                {platillo.descripcion}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-arena/30 dark:border-arena/10 mt-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-sans text-negro/60 dark:text-arena/60 uppercase font-bold">
                {hasPromo && parsePrice(platillo.precio_anterior) > parsePrice(platillo.precio) ? 'Precio Oferta' : 'Precio'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl md:text-4xl text-coral tracking-tight">
                  ${formatPrice(platillo.precio)} <span className="text-xs font-sans text-negro/60 dark:text-arena">MXN</span>
                </span>

                {hasPromo && parsePrice(platillo.precio_anterior) > parsePrice(platillo.precio) && (
                  <span className="font-display text-lg text-negro/40 dark:text-arena/40 line-through tracking-tight">
                    ${formatPrice(platillo.precio_anterior)}
                  </span>
                )}
              </div>

              {hasPromo && parsePrice(platillo.precio_anterior) > parsePrice(platillo.precio) && (
                <span className="text-[9px] font-sans font-bold text-turquesa uppercase tracking-wider">
                  ¡Ahorras ${(parsePrice(platillo.precio_anterior) - parsePrice(platillo.precio)).toFixed(0)} MXN!
                </span>
              )}
            </div>

            {onSelect && isAvailable && (
              <button
                type="button"
                onClick={() => onSelect(platillo)}
                className="bg-turquesa text-negro hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(42,191,191,0.4)] active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>ORDENAR</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL LIGHTBOX FOTO HD CON VISTA RESPONSIVA DE 2 COLUMNAS EN DESKTOP */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="bg-white text-negro dark:bg-[#050404] dark:text-blanco border border-arena/30 dark:border-oro/40 rounded-2xl w-full max-w-xl md:max-w-3xl lg:max-w-4xl p-6 gold-border-corner shadow-2xl relative flex flex-col md:grid md:grid-cols-2 gap-6 max-h-[92vh] overflow-y-auto transition-colors">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 z-30 p-2 text-negro/60 dark:text-arena/60 hover:text-coral dark:hover:text-blanco rounded-full hover:bg-arena/20 dark:hover:bg-carbon transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* COLUMNA IZQUIERDA: FOTO HD CON TRANSICIÓN DIFUMINADA PROGRESIVA */}
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="relative w-full h-[260px] md:h-[380px] rounded-xl overflow-hidden border border-arena/30 dark:border-oro/20 bg-[#EBE5D8] dark:bg-carbon select-none transition-colors"
            >
              {platillo.imagen_url ? (
                <>
                  {!zoomImageLoaded && (
                    <div className="absolute inset-0 z-0 bg-[#EBE5D8] dark:bg-carbon animate-pulse flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-1.5 text-turquesa font-sans font-bold text-xs">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Cargando foto HD...</span>
                      </div>
                    </div>
                  )}

                  <Image
                    src={platillo.imagen_url}
                    alt={platillo.nombre}
                    fill
                    priority
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onLoad={() => setZoomImageLoaded(true)}
                    className={`object-cover pointer-events-none select-none transition-all duration-700 ease-out transform-gpu ${zoomImageLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'
                      }`}
                  />
                  {/* Capa protectora invisible */}
                  <div
                    className="absolute inset-0 z-10 bg-transparent"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#080808]">
                  <Flame className="w-12 h-12 text-turquesa" />
                  <span className="text-xs font-sans text-arena/60">Marea Negra Mariscos</span>
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: DETALLES DEL PLATILLO Y ACCIONES */}
            <div className="flex flex-col justify-between gap-5 my-auto">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {isPromoActive
                        ? getPromoBannerText(platillo)
                        : 'MARISCOS FRESCOS DEL DÍA'}
                    </span>
                  </span>
                </div>

                <h2 className="font-display text-4xl lg:text-5xl text-negro dark:text-blanco tracking-wide">
                  {platillo.nombre}
                </h2>

                {platillo.descripcion && (
                  <p className="font-sans italic text-base lg:text-lg text-negro/80 dark:text-arena/90 leading-relaxed">
                    "{platillo.descripcion}"
                  </p>
                )}

                <div className="flex flex-col pt-2 border-t border-arena/20 dark:border-arena/10 mt-2">
                  <span className="text-[10px] font-sans text-negro/60 dark:text-arena/60 uppercase font-bold">
                    {isPromoActive && platillo.precio_anterior && platillo.precio_anterior > platillo.precio ? 'Precio Oferta Especial' : 'Precio'}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-4xl lg:text-5xl text-coral tracking-tight">
                      ${platillo.precio.toFixed(0)} <span className="text-sm font-sans text-negro/60 dark:text-arena">MXN</span>
                    </span>

                    {isPromoActive && platillo.precio_anterior && platillo.precio_anterior > platillo.precio && (
                      <span className="font-display text-2xl text-negro/40 dark:text-arena/40 line-through">
                        ${platillo.precio_anterior.toFixed(0)}
                      </span>
                    )}
                  </div>

                  {isPromoActive && platillo.precio_anterior && platillo.precio_anterior > platillo.precio && (
                    <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-wider mt-1">
                      ¡Ahorras ${(platillo.precio_anterior - platillo.precio).toFixed(0)} MXN en este platillo!
                    </span>
                  )}
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex items-center gap-3 pt-4 border-t border-arena/20 dark:border-arena/10">
                {onSelect && isAvailable && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(platillo)
                      setIsZoomOpen(false)
                    }}
                    className="flex-1 bg-turquesa text-negro font-sans font-bold text-xs md:text-sm py-4 px-6 rounded-xl hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>ORDENAR PLATILLO</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="bg-[#F4F0E8] dark:bg-carbon text-negro dark:text-blanco font-sans font-bold text-xs py-4 px-6 rounded-xl border border-arena/30 dark:border-arena/20 hover:bg-arena/20"
                >
                  CERRAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
