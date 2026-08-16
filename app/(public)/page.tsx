'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Platillo, Categoria } from '@/lib/types/database'
import { ProductCard } from '@/components/ui/ProductCard'
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
import { generateWhatsAppMessageUrl } from '@/lib/utils/whatsapp'
import { TraditionalMenuBoard } from '@/components/menu/TraditionalMenuBoard'
import { getEstadoRestaurante } from '@/lib/actions/negocioEstado'
import {
  Lock,
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  Waves,
  CheckCircle2,
  ChevronRight,
  Globe,
  Flame,
  Menu as MenuIcon,
  X,
  Gift,
  User,
  Award,
  RefreshCw,
  FileText,
  LayoutGrid,
  Clock,
} from 'lucide-react'

export default function PublicMenuPage() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [platillos, setPlatillos] = useState<Platillo[]>([])
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'interactive' | 'carta'>('interactive')

  const [restauranteAbierto, setRestauranteAbierto] = useState(true)
  const [horarios, setHorarios] = useState<any[]>([])
  const supabase = createBrowserClient()

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

  const filteredPlatillos =
    activeCategory === 'all'
      ? platillos
      : platillos.filter((p) => p.categoria_id === activeCategory)

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
      {/* 1. HEADER CON BOTÓN HAMBURGUESA Y DESKTOP NAV */}
      <header className="sticky top-0 z-40 bg-[#F4F0E8] dark:bg-negro border-b border-arena/30 dark:border-arena/10 px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
          </div>

          {/* NAVEGACIÓN DESKTOP (PANTALLAS MEDIANAS Y GRANDES - ESTILO BADGES ALTO CONTRASTE) */}
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

      {/* DRAWER DESLIZANTE DE NAVEGACIÓN MÓVIL (ADAPTABLE A LIGHT MODE Y DARK MODE) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex justify-end animate-in fade-in duration-200">
          <div className="bg-white text-negro dark:bg-[#050404] dark:text-blanco bg-dots-pattern border-l border-arena/30 dark:border-oro/30 w-4/5 max-w-sm h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 transition-colors">
            <div className="flex flex-col gap-6">
              {/* CABECERA DEL DRAWER */}
              <div className="flex items-center justify-between border-b border-arena/30 dark:border-arena/15 pb-4">
                <BrandLogo size="sm" />
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2 text-negro/60 dark:text-arena/70 hover:text-coral dark:hover:text-blanco rounded-full hover:bg-arena/20 dark:hover:bg-carbon transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* OPCIONES DEL MENÚ MÓVIL */}
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

            {/* FOOTER DEL DRAWER */}
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

              <span className="text-[10px] font-serif italic text-arena/50 text-center">
                Marea Negra · Sinaloa, México
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. HERO BANNER */}
      <section className="relative bg-[#EBE5D8] dark:bg-negro overflow-hidden px-6 pt-16 pb-20 border-b border-arena/30 dark:border-arena/10 transition-colors">

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-start gap-6">
          <span className="text-xs font-sans font-semibold text-black uppercase bg-limon px-3 py-1 rounded-full">
            SINALOA AUTÉNTICO · MARISCOS DEL DÍA
          </span>

          <div className="py-2 flex flex-col md:flex-row md:items-center gap-4 md:gap-10 w-full">
            <BrandLogo size="hero" stacked withSubtext />

            <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left border-t-2 md:border-t-0 md:border-l-4 border-coral/40 md:border-coral/80 pt-4 md:pt-2 md:pl-6 mt-2 md:mt-0 animate-in fade-in slide-in-from-left-4 duration-700 delay-300 fill-mode-both w-full md:w-auto">
              <span className="font-display text-5xl lg:text-7xl text-negro dark:text-blanco uppercase tracking-widest leading-none">
                ¡Al vrgazo!,
              </span>
              <span className="font-serif italic text-3xl lg:text-4xl text-negro/60 dark:text-arena/70 mt-1">
                como nos gusta.
              </span>
            </div>
          </div>

          <p className="font-sans text-sm md:text-base text-negro/70 dark:text-arena/70 max-w-xl leading-relaxed">
            Personaliza el nivel de picor y notas para la cocina con nuestro nuevo sistema de pedido directo en 4 pasos.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/pedir"
              className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-sm tracking-wider px-8 py-4 rounded-full shadow-[0_0_25px_rgba(42,191,191,0.3)] transition-all flex items-center gap-2 group"
            >
              <Globe className="w-5 h-5" />
              <span>HACER PEDIDO EN LÍNEA</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <button
              onClick={() => setViewMode('carta')}
              className="bg-oro text-negro dark:bg-carbon dark:text-oro hover:bg-oro/90 dark:hover:bg-oro/80 font-sans font-bold text-sm tracking-wider px-6 py-4 rounded-full border border-oro/30 transition-all flex items-center gap-2 shadow-lg"
            >
              <FileText className="w-4 h-4 text-negro" />
              <span>CARTA TRADICIONAL</span>
            </button>

            <a
              href={generateWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-limon text-black hover:bg-negro hover:text-white dark:hover:bg-negro dark:hover:text-blanco uppercase font-sans font-bold text-sm tracking-wider px-6 py-4 rounded-full border border-arena/20 transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-blanco" />
              <span>POR WHATSAPP</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. NAVEGACIÓN POR CATEGORÍAS */}
      {categorias.length > 0 && (
        <section id="menu" className="sticky top-[65px] z-30 bg-[#EFEAE1] dark:bg-carbon border-b border-arena/30 dark:border-arena/10 px-6 py-4 transition-colors">
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

      {/* 4. GRID DE PLATILLOS / SKELETON / ESTADO VACÍO */}
      <main className="max-w-7xl mx-auto px-6 py-12 w-full flex-1" id="menu">
        {/* ESTADO CARGANDO (SKELETON GRID - LIMPIO EN LIGHT MODE Y DARK MODE) */}
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

        {/* LISTADO REAL DE PLATILLOS POR CATEGORÍA */}
        {!isLoading &&
          platillos.length > 0 &&
          (categorias.length > 0 ? categorias : [{ id: 1, nombre: 'Menú General', orden: 1 }])
            .filter((cat) => activeCategory === 'all' || activeCategory === cat.id)
            .map((cat, idx) => {
              const catPlatillos = filteredPlatillos.filter(
                (p) => p.categoria_id === cat.id || (!p.categoria_id && cat.id === 1)
              )
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

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {catPlatillos.map((platillo, pIdx) => (
                      <ProductCard
                        key={platillo.id}
                        platillo={platillo}
                        onSelect={() => router.push('/pedir')}
                        priority={pIdx < 3}
                      />
                    ))}
                  </div>
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
                <span>+52 (667) XXX-XXXX</span>
              </a>
              <a href="mailto:hola@mareanegra.com" className="flex items-center gap-2 hover:text-turquesa transition-colors">
                <FileText className="w-4 h-4" />
                <span>hola@mareanegra.com</span>
              </a>
            </div>
          </div>

          {/* Columna 3: Ubicación */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <h4 className="font-display text-xl text-negro dark:text-blanco tracking-widest uppercase">
              UBICACIÓN
            </h4>
            <p className="font-sans text-sm text-negro/80 dark:text-arena/80 leading-relaxed max-w-[200px]">
              Calle Falsa 123,<br />
              Colonia Centro, Culiacán, Sin.
            </p>
            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-xs font-bold font-sans text-coral hover:text-coral/80 underline underline-offset-4 mt-1 transition-colors">
              Ver en Google Maps
            </a>
          </div>

          {/* Columna 4: Redes y Decoración */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-6">
            <h4 className="font-display text-xl text-negro dark:text-blanco tracking-widest uppercase">
              SÍGUENOS
            </h4>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-negro/5 dark:bg-carbon border border-arena/20 flex items-center justify-center hover:bg-turquesa hover:text-negro transition-all">
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
