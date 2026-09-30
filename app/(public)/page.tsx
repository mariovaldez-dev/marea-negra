'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { createBrowserClient } from '@/lib/supabase/client'
import { Platillo, Categoria, DatosSucursal, DEFAULT_SUCURSAL } from '@/lib/types/database'
import { getEstadoRestaurante, EstadoRestaurante } from '@/lib/actions/negocioEstado'
import { getPlatilloFavoritoDelSistema, FavoritoSistemaResult } from '@/lib/actions/menu'
import { isPromoActiveToday, getPromoBannerText } from '@/lib/utils/promo'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { AnimatedTagline } from '@/components/ui/AnimatedTagline'
import { FloatingShrimp } from '@/components/ui/FloatingShrimp'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ClubBenefitsModal } from '@/components/menu/ClubBenefitsModal'
import {
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  Clock,
  MapPin,
  Phone,
  Flame,
  Star,
  Search,
  ChevronRight,
  ExternalLink,
  Menu as MenuIcon,
  X,
  Award,
  FileText,
  User,
  Plus,
  Globe,
} from 'lucide-react'

const UserHeaderBadge = dynamic(
  () => import('@/components/ui/UserHeaderBadge').then((mod) => mod.UserHeaderBadge),
  {
    ssr: false,
    loading: () => <div className="h-9 w-32 bg-black/5 dark:bg-white/10 rounded-full animate-pulse shrink-0" />,
  }
)

export default function PublicMenuPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [platillos, setPlatillos] = useState<Platillo[]>([])
  const [favoritoSistema, setFavoritoSistema] = useState<FavoritoSistemaResult | null>(null)
  const [estadoRestaurante, setEstadoRestaurante] = useState<EstadoRestaurante | null>(null)
  const [sucursal, setSucursal] = useState<DatosSucursal>(DEFAULT_SUCURSAL)
  const [activeCategory, setActiveCategory] = useState<number | 'all' | 'promos'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showClubModal, setShowClubModal] = useState(false)
  const [loggedUser, setLoggedUser] = useState<{ name: string; coupons: number } | null>(null)

  // Sincronizar scroll para blur dinámico
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cargar Sesión del Usuario / Club
  useEffect(() => {
    const checkUser = async () => {
      const storedName = typeof window !== 'undefined' ? localStorage.getItem('marea_cliente_nombre') : null
      const storedCoupons = typeof window !== 'undefined' ? localStorage.getItem('marea_user_coupons') : null
      let coupons = 0
      if (storedCoupons) {
        try {
          const parsed = JSON.parse(storedCoupons)
          coupons = Array.isArray(parsed) ? parsed.length : 0
        } catch (e) {}
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const name = user.user_metadata?.nombre || storedName || user.email?.split('@')[0] || 'Socio'
          setLoggedUser({
            name: name.split(' ')[0],
            coupons,
          })
          return
        }
      } catch (err) {}

      if (storedName) {
        setLoggedUser({
          name: storedName.trim().split(' ')[0],
          coupons,
        })
      } else {
        setLoggedUser(null)
      }
    }

    checkUser()
  }, [])

  // Cargar Catálogo, Estado en Vivo y Favorito Elegido por el Sistema
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [catRes, platRes, estadoRes, favRes] = await Promise.all([
          supabase.from('categorias').select('*').order('orden', { ascending: true }),
          supabase.from('platillos').select('*').order('id', { ascending: true }),
          getEstadoRestaurante(),
          getPlatilloFavoritoDelSistema(),
        ])

        if (catRes.data) setCategorias(catRes.data)
        if (platRes.data) setPlatillos(platRes.data)
        if (favRes) setFavoritoSistema(favRes)
        if (estadoRes) {
          setEstadoRestaurante(estadoRes)
          if (estadoRes.sucursal) setSucursal(estadoRes.sucursal)
        }
      } catch (err) {
        console.error('Error cargando menú:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Promociones del día (solo platillos disponibles)
  const promoPlatillos = useMemo(() => {
    return platillos.filter((p) => p.disponible && isPromoActiveToday(p))
  }, [platillos])

  // Platillos disponibles activos para el público
  const platillosDisponibles = useMemo(() => {
    return platillos.filter((p) => p.disponible)
  }, [platillos])

  // Platillo destacado: elegido inteligentemente por el sistema (#1 en ventas reales / promo / insignia)
  const featuredDish = useMemo(() => {
    if (favoritoSistema?.platillo && favoritoSistema.platillo.disponible) {
      // Buscar la versión más fresca del platillo en el catálogo cargado
      const foundInList = platillosDisponibles.find((p) => p.id === favoritoSistema.platillo?.id)
      return foundInList || favoritoSistema.platillo
    }
    return (
      promoPlatillos[0] ||
      platillosDisponibles.find((p) => p.nombre.toLowerCase().includes('negro')) ||
      platillosDisponibles[0]
    )
  }, [favoritoSistema, promoPlatillos, platillosDisponibles])

  // Filtrado de Platillos (solo platillos disponibles)
  const filteredPlatillos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return platillosDisponibles.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(term) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(term))

      let matchCategory = true
      if (activeCategory === 'promos') {
        matchCategory = isPromoActiveToday(p)
      } else if (activeCategory !== 'all') {
        matchCategory = p.categoria_id === activeCategory
      }

      return matchSearch && matchCategory
    })
  }, [platillosDisponibles, searchTerm, activeCategory])

  // Helper de Picor Sinaloense
  const getSpiceBadge = (nombre: string) => {
    const n = nombre.toLowerCase()
    if (n.includes('negro') || n.includes('chiltep')) {
      return { label: '🌶️🌶️🌶️ Furia Chiltepín', color: 'bg-neutral-900 dark:bg-black text-coral border border-coral/30' }
    }
    if (n.includes('rojo') || n.includes('árbol') || n.includes('arbol')) {
      return { label: '🌶️ Bravo Árbol', color: 'bg-coral/10 text-coral border border-coral/20' }
    }
    if (n.includes('verde') || n.includes('serrano')) {
      return { label: '🌶️ Serrano Fresco', color: 'bg-[#16A34B]/10 text-[#16A34B] border border-[#16A34B]/20' }
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[#F8F6F0] dark:bg-[#080808] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-coral selection:text-white transition-colors duration-300">
      {/* MODAL DE BIENVENIDA Y REGISTRO AL CLUB (10% OFF) */}
      <ClubBenefitsModal
        isOpen={showClubModal ? true : undefined}
        onClose={() => setShowClubModal(false)}
      />

      {/* ── 1. NAVBAR CRISTALINO ────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 dark:bg-[#080808]/90 backdrop-blur-xl border-b border-black/[0.08] dark:border-white/[0.08] shadow-md'
            : 'bg-transparent border-b border-black/[0.04] dark:border-white/[0.04]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <BrandLogo size="md" href="/" />
          </div>

          {/* NAVEGACIÓN DESKTOP */}
          <nav className="hidden md:flex items-center gap-2 font-sans text-xs font-bold">
            <a
              href="#menu"
              className="px-4 py-2 rounded-full text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              Menú Digital
            </a>

            <Link
              href="/carta"
              className="px-4 py-2 rounded-full text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span>Carta Tradicional</span>
            </Link>

            <Link
              href="/micuenta"
              className="px-4 py-2 rounded-full text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-[#2ABFBF]" />
              <span>Mi Tarjeta Club</span>
            </Link>

            <Link
              href="/pedir"
              className="bg-coral text-white hover:bg-coral/90 px-5 py-2.5 rounded-full transition-all shadow-[0_4px_16px_rgba(232,67,10,0.3)] flex items-center gap-2 active:scale-95 ml-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>PEDIR EN LÍNEA</span>
            </Link>

            <UserHeaderBadge />
            <ThemeToggle />
          </nav>

          {/* MÓVIL: BOTONES RÁPIDOS */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/pedir"
              className="bg-coral text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Pedir</span>
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200"
              aria-label="Abrir menú"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MENÚ MÓVIL DRAWER ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end md:hidden"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-4/5 max-w-sm bg-white dark:bg-[#111317] h-full p-6 flex flex-col justify-between shadow-2xl border-l border-black/10 dark:border-white/10"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
                  <BrandLogo size="sm" />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex flex-col gap-2 font-sans font-bold text-sm">
                  <Link
                    href="/pedir"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-3.5 rounded-2xl bg-coral text-white flex items-center justify-between shadow-md"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShoppingBag className="w-4 h-4" />
                      <span>Hacer Pedido Online</span>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/carta"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-[#C9A84C]" />
                      <span>Carta Tradicional</span>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/micuenta"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-[#2ABFBF]" />
                      <span>Club de Lealtad & Cupones</span>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </nav>
              </div>

              <div className="pt-4 border-t border-black/10 dark:border-white/10 flex flex-col gap-2">
                <a
                  href={`https://wa.me/52${sucursal.telefono_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('¡Hola! Me gustaría consultar el menú del día.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>PEDIR POR WHATSAPP</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. HERO BENTO SECTION CON BRANDING ORIGINAL COMPLETO ─────────────── */}
      {/* ── 2. HERO BANNER FULL-WIDTH CON BRANDING ORIGINAL COMPLETO (ESTILO V1) ── */}
      <section className="relative w-full bg-[#EFEAE1] dark:bg-[#111317] overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16 border-b border-black/[0.08] dark:border-white/[0.08] transition-colors">
        {/* Glows de fondo */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-coral/10 dark:bg-coral/15 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-[#2ABFBF]/10 dark:bg-[#2ABFBF]/15 rounded-full filter blur-3xl pointer-events-none" />

        {/* CAMARÓN FLOTANTE INTERACTIVO */}
        <FloatingShrimp />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* LADO IZQUIERDO: HERO BRANDING OPEN & FULL WIDTH (8 COLS) */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-5">
              {/* Badge Superior Animado Original */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-sans font-semibold text-black uppercase bg-[#2ABFBF] px-3.5 py-1 rounded-full shadow-sm">
                  SINALOA AUTÉNTICO · MARISCOS DEL DÍA
                </span>
                <span className="text-xs font-sans text-neutral-600 dark:text-neutral-400 font-medium">
                  📍 {sucursal.ciudad}
                </span>
              </div>

              {/* LOGO DE MARCA Y SLOGAN ORIGINAL ANIMADO */}
              <div className="py-2 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 w-full">
                <BrandLogo size="hero" stacked withSubtext animated />
                <AnimatedTagline />
              </div>

              {/* Descripción de Texto Original */}
              <p className="font-sans text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-xl leading-relaxed">
                Personaliza el nivel de picor y notas para la cocina con nuestro nuevo sistema de pedido directo en 4 pasos.
              </p>
            </div>

            {/* Acciones Principales y Social Proof */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-black/[0.08] dark:border-white/[0.08]">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/pedir')}
                  className="bg-coral text-white hover:bg-coral/90 font-sans font-bold text-xs tracking-wider px-8 py-4 rounded-2xl shadow-[0_4px_24px_rgba(232,67,10,0.35)] transition-all flex items-center gap-2 group active:scale-95 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>HACER PEDIDO EN LÍNEA</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/carta')}
                  className="bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90 font-sans font-bold text-xs tracking-wider px-6 py-4 rounded-2xl shadow-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-black" />
                  <span>CARTA TRADICIONAL</span>
                </button>

                <a
                  href={`https://wa.me/52${sucursal.telefono_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('¡Hola! Me gustaría hacer un pedido.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#25D366] text-white hover:bg-[#1EBE5D] font-sans font-bold text-xs tracking-wider px-6 py-4 rounded-2xl shadow-sm transition-all flex items-center gap-2 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>POR WHATSAPP</span>
                </a>
              </div>

              {/* Calificación */}
              <div className="flex items-center gap-2 text-xs font-sans font-bold">
                <div className="flex text-[#C9A84C]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-neutral-700 dark:text-neutral-300">4.9 / 5</span>
              </div>
            </div>
          </div>

          {/* TARJETA EDITORIAL FULL-BLEED PLATILLO ESTRELLA (4 COLS) */}
          {isLoading ? (
            <div className="lg:col-span-4 rounded-[32px] overflow-hidden min-h-[420px] bg-neutral-900 dark:bg-[#111317] border border-black/10 dark:border-white/10 p-6 flex flex-col justify-between animate-pulse">
              <div className="flex items-start justify-between">
                <div className="w-36 h-7 bg-coral/40 rounded-full" />
                <div className="w-24 h-7 bg-white/15 rounded-full" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-3/4 h-8 bg-white/20 rounded-xl" />
                <div className="w-5/6 h-4 bg-white/10 rounded-full" />
                <div className="w-full h-12 bg-[#2ABFBF]/30 rounded-2xl mt-2" />
              </div>
            </div>
          ) : featuredDish ? (
            <div className="lg:col-span-4 rounded-[32px] overflow-hidden shadow-2xl relative group min-h-[420px] flex flex-col justify-between border border-black/10 dark:border-white/10 bg-neutral-950">
              {/* IMAGEN DE FONDO FULL-BLEED (Colores 100% naturales y vivos) */}
              {featuredDish.imagen_url ? (
                <Image
                  src={featuredDish.imagen_url}
                  alt={featuredDish.nombre}
                  fill
                  className="object-cover md:group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex items-center justify-center">
                  <span className="text-8xl opacity-20 select-none">{featuredDish.emoji || '🦐'}</span>
                </div>
              )}

              {/* OVERLAY GRADIENTE SOLO EN LA BASE PARA TEXTO */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 via-45% to-transparent pointer-events-none" />

              {/* FILA SUPERIOR: BADGE Y PRECIO */}
              <div className="relative z-10 p-5 sm:p-6 flex items-start justify-between gap-2">
                <span className="bg-coral text-white text-[11px] font-sans font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-white/20">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{favoritoSistema?.tituloBadge || 'EL MÁS PEDIDO DE LA CASA'}</span>
                </span>

                <div className="bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shrink-0 flex items-center whitespace-nowrap">
                  <span className="font-display text-xl text-coral font-bold tracking-tight">
                    ${featuredDish.precio.toFixed(0)} MXN
                  </span>
                </div>
              </div>

              {/* FILA INFERIOR: TÍTULO, DESCRIPCIÓN Y BOTÓN CTA */}
              <div className="relative z-10 p-5 sm:p-6 flex flex-col gap-2">
                <h3 className="font-bold font-sans text-2xl sm:text-3xl text-white tracking-tight leading-tight drop-shadow-md">
                  {featuredDish.nombre}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-100 line-clamp-2 leading-relaxed font-sans drop-shadow-md">
                  {featuredDish.descripcion || 'Marisco fresco sinaloense sazonado al momento.'}
                </p>

                <button
                  type="button"
                  onClick={() => router.push('/pedir')}
                  className="mt-2 w-full bg-[#2ABFBF] text-black hover:bg-white active:scale-95 font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-2xl shadow-[0_4px_20px_rgba(42,191,191,0.35)] transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>ORDENAR ESTE PLATILLO</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── 4. BARRA STICKY DE CATEGORÍAS & BUSCADOR ────────────────────────── */}
      <section id="menu" className="sticky top-[68px] z-30 bg-[#F8F6F0]/95 dark:bg-[#080808]/95 backdrop-blur-xl border-y border-black/[0.08] dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* CATEGORÍAS PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap shrink-0 touch-manipulation active:scale-95 ${
                activeCategory === 'all'
                  ? 'bg-neutral-950 text-white dark:bg-white dark:text-black shadow-sm'
                  : 'bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              🍽️ Todos ({platillosDisponibles.length})
            </button>

            {promoPlatillos.length > 0 && (
              <button
                onClick={() => setActiveCategory('promos')}
                className={`px-4 py-2.5 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap shrink-0 touch-manipulation active:scale-95 flex items-center gap-1.5 ${
                  activeCategory === 'promos'
                    ? 'bg-coral text-white shadow-sm'
                    : 'bg-coral/10 text-coral border border-coral/30 hover:bg-coral/20'
                }`}
              >
                <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span>🔥 Promos de Hoy ({promoPlatillos.length})</span>
              </button>
            )}

            {categorias.map((cat) => {
              const count = platillosDisponibles.filter((p) => p.categoria_id === cat.id).length
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-sans font-bold transition-all whitespace-nowrap shrink-0 touch-manipulation active:scale-95 ${
                    activeCategory === cat.id
                      ? 'bg-[#2ABFBF] text-black shadow-sm'
                      : 'bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  {cat.nombre} ({count})
                </button>
              )
            })}
          </div>

          {/* BUSCADOR */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar platillo o ingrediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-xl pl-10 pr-3.5 py-2 text-xs font-sans font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-[#2ABFBF] focus:outline-none shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* ── 5. GRID DE PRODUCTOS EDITORIAL FULL-BLEED ────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-neutral-900 dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-5 h-96 flex flex-col justify-between gap-4"
              >
                <div className="flex justify-between items-center">
                  <div className="w-28 h-6 bg-white/10 rounded-full" />
                  <div className="w-20 h-6 bg-coral/30 rounded-full" />
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="h-6 w-3/4 bg-white/20 rounded-xl" />
                  <div className="h-3.5 w-5/6 bg-white/10 rounded-full" />
                  <div className="h-11 w-full bg-[#2ABFBF]/30 rounded-xl mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPlatillos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlatillos.map((platillo) => {
              const spice = getSpiceBadge(platillo.nombre)
              const promoText = platillo.es_promocion ? getPromoBannerText(platillo) : null

              return (
                <div
                  key={platillo.id}
                  className="relative rounded-[28px] overflow-hidden shadow-xl flex flex-col justify-between p-5 sm:p-6 min-h-[400px] bg-neutral-950 border border-black/10 dark:border-white/10 group md:hover:border-[#2ABFBF]/50 transition-all duration-300 touch-manipulation"
                >
                  {/* FOTO FULL-BLEED DE FONDO (Colores 100% naturales, frescos y sin tintes grises) */}
                  {platillo.imagen_url ? (
                    <Image
                      src={platillo.imagen_url}
                      alt={platillo.nombre}
                      fill
                      className="object-cover md:group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex items-center justify-center">
                      <span className="text-7xl opacity-20 select-none">{platillo.emoji || '🦐'}</span>
                    </div>
                  )}

                  {/* OVERLAY GRADIENTE SOLO EN LA BASE PARA CONTRASTE DE TEXTO (Parte superior 100% clara) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 via-45% to-transparent pointer-events-none" />

                  {/* FILA SUPERIOR: BADGES & PRECIO */}
                  <div className="relative z-10 flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {promoText ? (
                        <span className="bg-coral text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 backdrop-blur-md border border-white/20">
                          <Flame className="w-3 h-3 fill-current" />
                          <span>{promoText}</span>
                        </span>
                      ) : (
                        <span className="bg-[#2ABFBF]/95 text-black text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md backdrop-blur-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                          <span>DISPONIBLE HOY</span>
                        </span>
                      )}

                      {spice && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase backdrop-blur-md ${spice.color}`}>
                          {spice.label}
                        </span>
                      )}
                    </div>

                    <div className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shrink-0 flex flex-col items-end">
                      <span className="font-display text-xl text-coral font-bold tracking-tight">
                        ${platillo.precio.toFixed(0)} MXN
                      </span>
                      {platillo.precio_anterior && platillo.precio_anterior > platillo.precio && (
                        <span className="text-[10px] text-neutral-400 line-through">
                          ${platillo.precio_anterior.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* FILA INFERIOR: TÍTULO, DESCRIPCIÓN Y BOTÓN DE PEDIDO */}
                  <div className="relative z-10 flex flex-col gap-2 pt-12">
                    <h3 className="font-bold font-sans text-xl sm:text-2xl text-white tracking-tight leading-snug drop-shadow-md">
                      {platillo.nombre}
                    </h3>

                    <p className="text-xs text-neutral-100 line-clamp-2 leading-relaxed font-sans drop-shadow-md">
                      {platillo.descripcion || 'Marisco fresco sinaloense sazonado al momento.'}
                    </p>

                    <button
                      type="button"
                      onClick={() => router.push('/pedir')}
                      className="mt-2 w-full py-3.5 px-4 rounded-xl text-xs font-sans font-bold bg-[#2ABFBF] text-black hover:bg-white active:scale-95 active:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(42,191,191,0.3)] touch-manipulation cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>AGREGAR AL PEDIDO</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-16 text-center bg-white dark:bg-[#111317] rounded-[32px] border border-dashed border-black/10 dark:border-white/10">
            <p className="font-sans font-medium text-sm text-neutral-500">
              No se encontraron platillos con el término &quot;{searchTerm}&quot;.
            </p>
          </div>
        )}
      </main>

      {/* ── 6. SECCIÓN BENTO DE SUCURSAL & HORARIOS EN VIVO ──────────────────── */}
      <section className="bg-white dark:bg-[#0E0E0E] border-t border-black/[0.08] dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 py-14 transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SUCURSAL & CONTACTO (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#2ABFBF] bg-[#2ABFBF]/10 px-3 py-1 rounded-full w-fit">
                MATRIZ & ATENCIÓN DIRECTA
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 dark:text-white">
                {sucursal.nombre_sucursal.toUpperCase()}
              </h2>
              <p className="font-serif italic text-sm text-neutral-500 dark:text-neutral-400">
                {sucursal.slogan}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex flex-col gap-1">
                <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-coral" />
                  <span>Ubicación:</span>
                </span>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {sucursal.direccion}, {sucursal.colonia}, {sucursal.ciudad}
                </p>
                {sucursal.google_maps_url && (
                  <a
                    href={sucursal.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2ABFBF] font-bold hover:underline inline-flex items-center gap-1 mt-2"
                  >
                    <span>Abrir en Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex flex-col gap-1">
                <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#2ABFBF]" />
                  <span>Teléfonos & WhatsApp:</span>
                </span>
                <p className="text-neutral-600 dark:text-neutral-400">
                  WhatsApp: +52 {sucursal.telefono_whatsapp}
                </p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Fijo: +52 {sucursal.telefono_fijo || sucursal.telefono_whatsapp}
                </p>
              </div>
            </div>
          </div>

          {/* HORARIOS EN VIVO (5 COLS) */}
          <div className="lg:col-span-5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[28px] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <span className="font-sans font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#C9A84C]" />
                <span>Horario Semanal de Atención</span>
              </span>
              <span className="text-[10px] text-neutral-500 font-bold uppercase">
                Hora Sinaloa
              </span>
            </div>

            <div className="flex flex-col gap-2 font-sans text-xs">
              {estadoRestaurante?.horarios_dias?.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-1.5 border-b border-black/[0.03] dark:border-white/[0.03] last:border-none"
                >
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {h.nombre}
                  </span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {h.abierto ? `${h.apertura} - ${h.cierre}` : 'Cerrado'}
                  </span>
                </div>
              )) || (
                <p className="text-xs text-neutral-500 italic">
                  Lunes a Domingo: 11:00 AM - 8:00 PM
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ELEGANTE ─────────────────────────────────────────────────── */}
      <footer className="bg-neutral-950 text-white border-t border-white/10 px-4 sm:px-6 lg:px-8 py-8 text-xs font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-400">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" />
            <span>© {new Date().getFullYear()} Marea Negra · Todos los derechos reservados</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="hover:text-white">Aviso de Privacidad</Link>
            <span>•</span>
            <Link href="/login" className="text-[#2ABFBF] hover:underline font-bold">Acceso Personal</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
