'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase/client'
import { Platillo, Categoria } from '@/lib/types/database'
import dynamic from 'next/dynamic'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const UserHeaderBadge = dynamic(
  () => import('@/components/ui/UserHeaderBadge').then((mod) => mod.UserHeaderBadge),
  {
    ssr: false,
    loading: () => <div className="h-9 w-32 bg-arena/10 rounded-full animate-pulse shrink-0" />,
  }
)
import { ClubBenefitsModal } from '@/components/menu/ClubBenefitsModal'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { FloatingShrimp } from '@/components/ui/FloatingShrimp'
import { AnimatedTagline } from '@/components/ui/AnimatedTagline'
import { RippleButton } from '@/components/ui/RippleButton'
import { DishCarouselSection } from '@/components/menu/DishCarouselSection'
import { generateWhatsAppMessageUrl } from '@/lib/utils/whatsapp'
import { isPromoActiveToday, isPromoItem } from '@/lib/utils/promo'
import { TraditionalMenuBoard } from '@/components/menu/TraditionalMenuBoard'
import { getEstadoRestaurante } from '@/lib/actions/negocioEstado'
import {
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  Waves,
  CheckCircle2,
  ChevronRight,
  Globe,
  Menu as MenuIcon,
  X,
  Gift,
  User,
  Award,
  FileText,
  Clock,
  Flame,
} from 'lucide-react'

export default function PublicMenuPage() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [platillos, setPlatillos] = useState<Platillo[]>([])
  const [activeCategory, setActiveCategory] = useState<number | 'all' | 'promos'>('all')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'interactive' | 'carta'>('interactive')
  const [isScrolled, setIsScrolled] = useState(false)
  const [waLoading, setWaLoading] = useState(false)

  const [restauranteAbierto, setRestauranteAbierto] = useState(true)
  const [horarios, setHorarios] = useState<any[]>([])
  const supabase = createBrowserClient()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [catRes, platRes, estadoRes] = await Promise.all([
          supabase.from('categorias').select('*').order('orden', { ascending: true }),
          supabase.from('platillos').select('*').order('id', { ascending: true }),
          getEstadoRestaurante(),
        ])

        if (catRes.data) setCategorias(catRes.data)
        if (platRes.data) setPlatillos(platRes.data)
        if (estadoRes) {
          setRestauranteAbierto(estadoRes.abierto)
          if (estadoRes.horarios_dias) {
            setHorarios(estadoRes.horarios_dias)
          }
        }
      } catch (err) {
        console.error('Error al consultar el menú de Supabase:', err)
        setCategorias([])
        setPlatillos([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const generateWhatsAppUrl = () => {
    return generateWhatsAppMessageUrl('Hola, quisiera consultar el menú de Marea Negra para hoy.')
  }

  const handleWhatsAppOrder = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([25, 15, 50])
      } catch (e) { }
    }
    setWaLoading(true)
    setTimeout(() => {
      window.open(generateWhatsAppUrl(), '_blank')
      setWaLoading(false)
    }, 800)
  }

  const handleOnlineOrder = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30)
      } catch (e) { }
    }
    router.push('/pedir')
  }

  // Promos activas HOY (validadas por día de semana en Sinaloa)
  const promoPlatillos = platillos.filter((p) => isPromoActiveToday(p))
  // Platillos sin ninguna promoción configurada — siempre visibles en su categoría
  // Los que tienen es_promocion=true pero hoy NO es su día: se ocultan completamente
  const platillosNormales = platillos.filter((p) => !isPromoItem(p))

  const filteredPlatillos =
    activeCategory === 'promos'
      ? promoPlatillos
      : activeCategory === 'all'
      ? platillosNormales
      : platillosNormales.filter((p) => p.categoria_id === activeCategory)

  // Bloquear scroll del body al abrir el menú de navegación móvil
  useEffect(() => {
    if (mobileNavOpen) {
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
  }, [mobileNavOpen])

  if (viewMode === 'carta') {
    return (
      <TraditionalMenuBoard
        categorias={categorias}
        platillos={platillos}
        onBackToInteractive={() => setViewMode('interactive')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F0E8] dark:bg-negro text-negro dark:text-blanco flex flex-col justify-between selection:bg-coral transition-colors duration-300">
      {/* 1. HEADER CON BLUR AL SCROLL Y LOGO ADAPTABLE */}
      <header
        className={`sticky top-0 z-40 px-6 py-3 safe-header transition-all duration-300 ${
          isScrolled
            ? 'bg-[#F4F0E8]/95 dark:bg-negro/95 backdrop-blur-md border-b border-arena/30 dark:border-arena/10 shadow-lg shadow-black/10'
            : 'bg-[#F4F0E8]/80 dark:bg-negro/80 backdrop-blur-sm border-b border-arena/20 dark:border-arena/10 md:bg-transparent md:border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size={isScrolled ? 'sm' : 'md'} />
          </div>

          {/* NAVEGACIÓN DESKTOP */}
          <nav className="hidden md:flex items-center gap-2.5 text-xs font-sans tracking-wider">
            <a
              href="#menu"
              className="bg-negro/10 dark:bg-arena/10 border border-negro/20 dark:border-arena/20 text-negro dark:text-arena hover:bg-turquesa hover:text-negro dark:hover:bg-turquesa dark:hover:text-negro font-bold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Menú</span>
            </a>

            <button
              onClick={() => setViewMode('carta')}
              className="bg-oro/20 dark:bg-oro/15 border border-oro/40 dark:border-oro/30 text-negro dark:text-oro hover:bg-oro hover:text-negro dark:hover:bg-oro dark:hover:text-negro font-bold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Carta Tradicional</span>
            </button>

            <Link
              href="/micuenta"
              className="bg-limon dark:bg-limon/15 border border-limon/50 dark:border-limon/30 text-black dark:text-limon hover:bg-black hover:text-white dark:hover:bg-limon dark:hover:text-black font-bold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span>Mi Cuenta</span>
            </Link>

            <Link
              href="/pedir"
              className="bg-turquesa/20 dark:bg-turquesa/15 border border-turquesa/40 dark:border-turquesa/30 text-negro dark:text-turquesa hover:bg-turquesa hover:text-negro dark:hover:bg-turquesa dark:hover:text-negro font-bold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Pedir Online</span>
            </Link>

            <UserHeaderBadge />

            <ThemeToggle />
          </nav>

          {/* BOTÓN HAMBURGUESA Y THEME TOGGLE EN MÓVIL */}
          <div className="flex md:hidden items-center gap-2">
            <UserHeaderBadge />
            <ThemeToggle />
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 text-negro dark:text-blanco hover:text-coral transition-colors rounded-xl bg-arena/20 dark:bg-carbon border border-arena/30 dark:border-arena/10"
              aria-label="Abrir menú de navegación"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* DRAWER DESLIZANTE DE NAVEGACIÓN MÓVIL */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex justify-end animate-in fade-in duration-200">
          <div className="bg-white text-negro dark:bg-[#050404] dark:text-blanco bg-dots-pattern border-l border-arena/30 dark:border-oro/30 w-4/5 max-w-sm h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 transition-colors">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-arena/30 dark:border-arena/15 pb-4">
                <BrandLogo size="sm" />
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2 text-negro/60 dark:text-arena/70 hover:text-coral dark:hover:text-blanco rounded-full hover:bg-arena/20 dark:hover:bg-carbon transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex flex-col gap-3 font-sans text-base">
                <button
                  onClick={() => {
                    setViewMode('carta')
                    setMobileNavOpen(false)
                  }}
                  className="p-3.5 rounded-2xl bg-[#F4F0E8] dark:bg-carbon/80 border border-oro/40 dark:border-oro/30 text-negro dark:text-oro font-bold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-oro" />
                    <span>Carta Tradicional</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-oro" />
                </button>

                <Link
                  href="/micuenta"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-3.5 rounded-2xl bg-limon dark:bg-carbon/80 border border-limon/50 dark:border-limon/30 text-black dark:text-limon font-bold flex items-center justify-between transition-all shadow-sm"
                >
                  <span className="flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-black dark:text-limon" />
                    <span>Mi Cuenta & Lealtad</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-black dark:text-limon" />
                </Link>

                <Link
                  href="/pedir"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-3.5 rounded-2xl bg-[#F4F0E8] dark:bg-carbon/80 border border-turquesa/40 dark:border-turquesa/30 text-negro dark:text-turquesa font-bold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag className="w-5 h-5 text-turquesa" />
                    <span>Pedir Online Directo</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-turquesa" />
                </Link>

                <Link
                  href="/registro"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-3.5 rounded-2xl bg-coral/10 border border-coral/30 text-coral font-bold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <Gift className="w-5 h-5 text-coral" />
                    <span>Club Marea (10% OFF)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-coral" />
                </Link>
              </nav>
            </div>

            <div className="pt-4 border-t border-arena/15 flex flex-col gap-3">
              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-limon text-black uppercase font-sans font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>PEDIR POR WHATSAPP</span>
              </a>

              <span className="text-[10px] font-sans italic text-arena/50 text-center">
                Marea Negra · Sinaloa, México
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. HERO BANNER CON CAMARÓN FLOTANTE Y ENTRADA SECUENCIAL */}
      <section className="relative bg-[#EBE5D8] dark:bg-negro overflow-hidden px-6 pt-14 pb-20 border-b border-arena/30 dark:border-arena/10 transition-colors">
        {/* Blobs de Fondo Estáticos Ligeros */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-coral/10 dark:bg-coral/15 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-turquesa/10 dark:bg-turquesa/15 rounded-full filter blur-3xl pointer-events-none" />

        {/* CAMARÓN FLOTANTE INTERACTIVO EN MÓVIL */}
        <FloatingShrimp />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-start gap-6">
          {/* Badge Superior Animado */}
          <motion.span
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-xs font-sans font-semibold text-black uppercase bg-limon px-3.5 py-1 rounded-full shadow-sm"
          >
            SINALOA AUTÉNTICO · MARISCOS DEL DÍA
          </motion.span>

          {/* Logo y Tagline con Entrada Stagger */}
          <div className="py-2 flex flex-col md:flex-row md:items-center gap-4 md:gap-10 w-full">
            <BrandLogo size="hero" stacked withSubtext animated />
            <AnimatedTagline />
          </div>

          {/* Descripción de Texto */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5, ease: 'easeOut' }}
            className="font-sans text-sm md:text-base text-negro/70 dark:text-arena/70 max-w-xl leading-relaxed"
          >
            Personaliza el nivel de picor y notas para la cocina con nuestro nuevo sistema de pedido directo en 4 pasos.
          </motion.p>

          {/* Botones de Acción con Ripple y Feedback Táctil */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.55, ease: 'easeOut' }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <RippleButton
              onClick={handleOnlineOrder}
              haptic
              className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-sm tracking-wider px-8 py-4 rounded-full shadow-[0_0_25px_rgba(42,191,191,0.3)] transition-colors flex items-center gap-2 group"
            >
              <Globe className="w-5 h-5" />
              <span>HACER PEDIDO EN LÍNEA</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </RippleButton>

            <RippleButton
              onClick={() => setViewMode('carta')}
              className="bg-oro text-negro hover:bg-oro/90 dark:hover:bg-oro/80 font-sans font-bold text-sm tracking-wider px-6 py-4 rounded-full border border-oro/30 transition-colors flex items-center gap-2 shadow-lg"
            >
              <FileText className="w-4 h-4 text-negro" />
              <span>CARTA TRADICIONAL</span>
            </RippleButton>

            <RippleButton
              onClick={handleWhatsAppOrder}
              haptic
              className="bg-limon text-black hover:bg-negro hover:text-white dark:hover:bg-negro dark:hover:text-blanco uppercase font-sans font-bold text-sm tracking-wider px-6 py-4 rounded-full border border-arena/20 transition-colors flex items-center gap-2"
            >
              {waLoading ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-bounce" />
                  <span>¡ABRIENDO WHATSAPP...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 fill-blanco" />
                  <span>POR WHATSAPP</span>
                </>
              )}
            </RippleButton>
          </motion.div>
        </div>
      </section>

      {/* 3. NAVEGACIÓN POR CATEGORÍAS */}
      {categorias.length > 0 && (
        <section id="menu" className="sticky top-[60px] z-30 bg-[#EFEAE1] dark:bg-carbon border-b border-arena/30 dark:border-arena/10 px-6 py-4 transition-colors">
          <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-5 py-2 rounded-full font-sans text-xs font-semibold tracking-wider transition-all whitespace-nowrap ${activeCategory === 'all'
                ? 'bg-coral text-blanco shadow-[0_0_15px_rgba(232,67,10,0.3)]'
                : 'bg-white dark:bg-negro text-negro/80 dark:text-arena/80 border border-arena/30 dark:border-arena/10'
                }`}
            >
              TODOS LOS PLATILLOS
            </button>

            {promoPlatillos.length > 0 && (
              <button
                onClick={() => setActiveCategory('promos')}
                className={`px-5 py-2 rounded-full font-sans text-xs font-extrabold tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${activeCategory === 'promos'
                  ? 'bg-gradient-to-r from-coral via-coral to-oro text-blanco shadow-[0_0_20px_rgba(232,67,10,0.4)]'
                  : 'bg-coral/10 text-coral border border-coral/30 hover:bg-coral/20'
                  }`}
              >
                <Flame className="w-3.5 h-3.5 fill-coral animate-pulse" />
                <span>🔥 PROMOCIONES ({promoPlatillos.length})</span>
              </button>
            )}

            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2 rounded-full font-sans text-xs font-semibold tracking-wider transition-all whitespace-nowrap ${activeCategory === cat.id
                  ? 'bg-coral text-blanco shadow-[0_0_15px_rgba(232,67,10,0.3)]'
                  : 'bg-white dark:bg-negro text-negro/80 dark:text-arena/80 border border-arena/30 dark:border-arena/10'
                  }`}
              >
                {cat.nombre.toUpperCase()}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 4. GRID DE PLATILLOS CON CARRUSEL MÓVIL (SWIPE SNAP) & DESKTOP ANIMADO */}
      <main className="max-w-7xl mx-auto px-6 py-12 w-full flex-1" id="menu">
        {/* ESTADO CARGANDO (SKELETON GRID) */}
        {isLoading && (
          <div className="flex flex-col gap-8">
            <div className="h-8 w-48 bg-[#EBE5D8] dark:bg-carbon rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white dark:bg-[#080808] border border-arena/30 dark:border-arena/10 rounded-3xl p-6 flex flex-col justify-between h-[280px] animate-pulse relative overflow-hidden shadow-sm transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="h-6 w-24 bg-[#EBE5D8] dark:bg-carbon rounded-full" />
                    <div className="h-8 w-8 bg-[#EBE5D8] dark:bg-carbon rounded-full" />
                  </div>
                  <div className="flex flex-col gap-2.5 my-auto">
                    <div className="h-8 w-3/4 bg-[#EBE5D8] dark:bg-carbon rounded-md" />
                    <div className="h-4 w-full bg-[#EBE5D8] dark:bg-carbon rounded-md" />
                    <div className="h-4 w-2/3 bg-[#EBE5D8] dark:bg-carbon rounded-md" />
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-arena/30 dark:border-arena/10">
                    <div className="h-8 w-24 bg-coral/20 rounded-md" />
                    <div className="h-10 w-28 bg-turquesa/20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ESTADO VACÍO (SIN PLATILLOS EN LA BASE DE DATOS) */}
        {!isLoading && platillos.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 max-w-xl mx-auto gap-6 bg-white dark:bg-carbon/80 border border-arena/30 dark:border-arena/15 rounded-3xl my-8 shadow-xl">
            <div className="w-20 h-20 rounded-full bg-coral/10 border border-coral/30 flex items-center justify-center text-coral shadow-[0_0_30px_rgba(232,67,10,0.2)]">
              <Waves className="w-10 h-10 animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco tracking-wide">
                NO HAY PLATILLOS DISPONIBLES
              </h3>
              <p className="font-sans text-sm md:text-base text-negro/70 dark:text-arena/70 leading-relaxed">
                Actualmente no hay productos registrados en el menú del restaurante. Te invitamos a consultar la pesca fresca del día directamente por WhatsApp.
              </p>
            </div>
            <a
              href={generateWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-turquesa text-negro font-sans font-bold text-xs tracking-wider px-8 py-4 rounded-full shadow-[0_0_25px_rgba(42,191,191,0.3)] hover:bg-blanco transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-negro" />
              <span>CONSULTAR PESCA DEL DÍA POR WHATSAPP</span>
            </a>
          </div>
        )}

        {/* 1. SECCIÓN DESTACADA DE PROMOCIONES Y ESPECIALES EN PRIMER LUGAR */}
        {!isLoading && (activeCategory === 'all' || activeCategory === 'promos') && promoPlatillos.length > 0 && (
          <section className="mb-16 bg-gradient-to-b from-coral/10 via-transparent to-transparent p-4 sm:p-6 rounded-3xl border border-coral/20">
            <div className="flex items-center justify-between mb-8 border-b border-coral/30 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-sans text-xs font-bold text-blanco tracking-widest uppercase bg-gradient-to-r from-coral to-oro px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Flame className="w-3.5 h-3.5 fill-blanco animate-pulse" />
                  <span>DESTACADO DE HOY</span>
                </span>
                <h3 className="font-display text-4xl text-negro dark:text-blanco tracking-wider">
                  🔥 PROMOCIONES & ESPECIALES
                </h3>
              </div>
              <span className="text-xs font-sans font-bold text-coral uppercase tracking-wider hidden sm:inline-block">
                ¡Aprovecha por tiempo limitado!
              </span>
            </div>

            <DishCarouselSection
              platillos={promoPlatillos}
              onSelect={() => router.push('/pedir')}
              categoryIndex={0}
            />
          </section>
        )}

        {/* 2. LISTADO DE PLATILLOS POR CATEGORÍA CON PROMOCIONES PRIORIZADAS AL INICIO */}
        {!isLoading &&
          platillos.length > 0 &&
          activeCategory !== 'promos' &&
          (categorias.length > 0 ? categorias : [{ id: 1, nombre: 'Menú General', orden: 1 }])
            .filter((cat) => activeCategory === 'all' || activeCategory === cat.id)
            .map((cat, idx) => {
              const catPlatillos = filteredPlatillos
                .filter((p) => p.categoria_id === cat.id || (!p.categoria_id && cat.id === 1))

              if (catPlatillos.length === 0) return null

              return (
                <section key={cat.id} className="mb-16">
                  <div className="flex items-center gap-3 mb-8 border-b border-arena/30 dark:border-arena/10 pb-4">
                    <span className="font-sans text-xs font-semibold text-coral tracking-widest uppercase">
                      CATEGORÍA - 0{idx + 1}
                    </span>
                    <h3 className="font-display text-4xl text-negro dark:text-blanco tracking-wider">
                      {cat.nombre.toUpperCase()}
                    </h3>
                  </div>

                  <DishCarouselSection
                    platillos={catPlatillos}
                    onSelect={() => router.push('/pedir')}
                    categoryIndex={idx + 1}
                  />
                </section>
              )
            })}
      </main>

      {/* 5. HORARIOS DE ATENCIÓN */}
      {!isLoading && horarios.length > 0 && (
        <section className="bg-white dark:bg-[#080808] border-t border-arena/30 dark:border-arena/10 px-6 py-16 transition-colors">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-8">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-turquesa" />
              <h3 className="font-display text-3xl text-negro dark:text-blanco tracking-widest uppercase">
                HORARIOS DE SERVICIO
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              {horarios.map((dia) => (
                <div
                  key={dia.id}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-colors ${dia.abierto
                    ? 'bg-[#F4F0E8] dark:bg-carbon border-arena/30 dark:border-arena/10'
                    : 'bg-coral/5 border-coral/20'
                    }`}
                >
                  <span className="font-sans font-bold text-sm text-negro dark:text-blanco mb-1 uppercase tracking-wider">
                    {dia.nombre}
                  </span>
                  {dia.abierto ? (
                    <span className="font-sans text-xs text-negro/70 dark:text-arena/70">
                      {dia.apertura} — {dia.cierre}
                    </span>
                  ) : (
                    <span className="font-sans font-bold text-xs text-coral">CERRADO</span>
                  )}
                </div>
              ))}
            </div>
            <p className="font-sans text-xs text-negro/50 dark:text-arena/40 italic">
              * Horarios sujetos a la disponibilidad de pesca fresca del día.
            </p>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-[#EFEAE1] dark:bg-[#050404] border-t border-arena/30 dark:border-arena/10 px-6 py-12 lg:py-16 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Columna 1: Marca */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <h4 className="font-display text-2xl text-negro dark:text-blanco tracking-wider">MAREA NEGRA</h4>
            <p className="font-sans text-xs sm:text-sm text-negro/70 dark:text-arena/70 leading-relaxed max-w-xs">
              Sinaloa, México.<br />
              ¡Al vrgazo!, como nos gusta.<br />
              Mariscos frescos y picor a tu medida.
            </p>
          </div>

          {/* Columna 2: Contacto Rápido */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <h4 className="font-display text-xl text-negro dark:text-blanco tracking-widest uppercase">
              CONTACTO
            </h4>
            <div className="flex flex-col gap-2 font-sans text-sm text-negro/80 dark:text-arena/80">
              <a href={generateWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-turquesa transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>+{process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}</span>
              </a>
            </div>
          </div>

          {/* Columna 3: Ubicación */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <h4 className="font-display text-xl text-negro dark:text-blanco tracking-widest uppercase">
              UBICACIÓN
            </h4>
            <p className="font-sans text-sm text-negro/80 dark:text-arena/80 leading-relaxed max-w-[200px]">
              Al momento de hacer el pedido se compartirá la ubicación por whatsapp <br />
            </p>
          </div>

          {/* Columna 4: Redes y Decoración */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-6">
            <h4 className="font-display text-xl text-negro dark:text-blanco tracking-widest uppercase">
              SÍGUENOS
            </h4>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/mareanegra.aguachiles" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-negro/5 dark:bg-carbon border border-arena/20 flex items-center justify-center hover:bg-turquesa hover:text-negro transition-all">
                IG
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-negro/5 dark:bg-carbon border border-arena/20 flex items-center justify-center hover:bg-turquesa hover:text-negro transition-all">
                FB
              </a>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="w-3 h-3 rounded-full bg-negro border border-arena/20" />
              <span className="w-3 h-3 rounded-full bg-carbon border border-arena/20" />
              <span className="w-3 h-3 rounded-full bg-coral" />
              <span className="w-3 h-3 rounded-full bg-turquesa" />
              <span className="w-3 h-3 rounded-full bg-arena" />
              <span className="w-3 h-3 rounded-full bg-oro" />
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-arena/30 dark:border-arena/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-negro/50 dark:text-arena/40">
          <span>&copy; {new Date().getFullYear()} Marea Negra. Todos los derechos reservados.</span>
          <span>Sinaloa, México.</span>
        </div>
      </footer>

      {/* MODAL LEAD MAGNET CLUB MAREA NEGRA */}
      <ClubBenefitsModal />
    </div>
  )
}
