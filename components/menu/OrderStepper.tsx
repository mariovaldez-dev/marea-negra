'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Platillo, Categoria, ConfiguredCartItem, NivelPicor, MetodoPago } from '@/lib/types/database'
import { createPublicPedido } from '@/lib/actions/publicPedidos'
import { validateCuponAction, getAvailableCuponesPublic } from '@/lib/actions/cupones'
import { getEstadoRestaurante, DiaHorario } from '@/lib/actions/negocioEstado'
import { generateWhatsAppMessageUrl } from '@/lib/utils/whatsapp'
import { isPromoActiveToday, getPromoBannerText, isPromoItem, parsePrice, formatPrice, getCurrentDayId } from '@/lib/utils/promo'
import { TicketImageDownload } from '@/components/menu/TicketImageDownload'
import { RestauranteCerradoModal } from '@/components/menu/RestauranteCerradoModal'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import {
  ShoppingBag,
  Flame,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  User,
  Phone,
  Clock,
  CreditCard,
  FileText,
  Sparkles,
  MessageCircle,
  X,
  Ticket,
  Lock,
  Check,
  ArrowRight,
  Search,
  MapPin,
  Utensils,
  Car,
  DollarSign,
  Send,
} from 'lucide-react'

const UserHeaderBadge = dynamic(
  () => import('@/components/ui/UserHeaderBadge').then((mod) => mod.UserHeaderBadge),
  {
    ssr: false,
    loading: () => <div className="h-9 w-28 bg-black/5 dark:bg-white/10 rounded-full animate-pulse shrink-0" />,
  }
)

interface OrderStepperProps {
  categorias: Categoria[]
  platillos: Platillo[]
  inicialAbierto?: boolean
  inicialMensaje?: string
  inicialHorarios?: DiaHorario[]
}

const PICOR_OPTIONS: { id: NivelPicor; label: string; desc: string; color: string; badgeColor: string; flames: number }[] = [
  { id: 'sin_chile', label: 'Sin Chile', desc: 'Al natural con limón y sal', color: 'border-neutral-300 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.04]', badgeColor: 'text-neutral-600 dark:text-neutral-400', flames: 0 },
  { id: 'suave', label: 'Suave', desc: 'Toque leve de serrano fresco', color: 'border-[#16A34B]/40 bg-[#16A34B]/10 text-[#16A34B]', badgeColor: 'text-[#16A34B]', flames: 1 },
  { id: 'medio', label: 'Medio', desc: 'Picor tradicional de la casa', color: 'border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C]', badgeColor: 'text-[#C9A84C]', flames: 2 },
  { id: 'bravo', label: 'Bravo', desc: 'Furia de árbol y chiltepín', color: 'border-coral/40 bg-coral/10 text-coral', badgeColor: 'text-coral', flames: 3 },
]

function getPlatilloIngredients(platillo: Platillo): string[] {
  const name = platillo.nombre.toLowerCase()
  const desc = (platillo.descripcion || '').toLowerCase()
  const list: string[] = []

  if (name.includes('aguachile')) {
    list.push('Cebolla morada', 'Pepino', 'Aguacate')
  } else if (name.includes('ceviche')) {
    list.push('Cebolla morada', 'Pepino', 'Cilantro', 'Jitomate', 'Aguacate')
  } else if (name.includes('coctel') || name.includes('cóctel')) {
    list.push('Cebolla morada', 'Pepino', 'Cilantro', 'Aguacate')
  } else if (name.includes('tostada')) {
    list.push('Cebolla morada', 'Pepino', 'Aguacate', 'Mayonesa')
  } else if (name.includes('taco')) {
    list.push('Cebolla morada', 'Cilantro', 'Repollo', 'Aderezo')
  } else {
    list.push('Cebolla morada', 'Pepino', 'Cilantro', 'Aguacate')
  }

  if (desc.includes('cebolla') && !list.includes('Cebolla morada')) list.push('Cebolla morada')
  if (desc.includes('pepino') && !list.includes('Pepino')) list.push('Pepino')
  if (desc.includes('cilantro') && !list.includes('Cilantro')) list.push('Cilantro')
  if (desc.includes('jitomate') && !list.includes('Jitomate')) list.push('Jitomate')
  if (desc.includes('aguacate') && !list.includes('Aguacate')) list.push('Aguacate')

  return Array.from(new Set(list))
}

export function OrderStepper({
  categorias,
  platillos,
  inicialAbierto = true,
  inicialMensaje = '',
  inicialHorarios,
}: OrderStepperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 1: Menú & Comanda, 2: Checkout Rápido, 3: Confirmación / Ticket
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [cartOpen, setCartOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const isCartLoaded = useRef(false)

  const [cart, setCart] = useState<ConfiguredCartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<number | 'all' | 'promos'>('all')

  // Modal para configurar platillo
  const [selectedPlatillo, setSelectedPlatillo] = useState<Platillo | null>(null)
  const [itemQty, setItemQty] = useState<number>(1)
  const [itemPicor, setItemPicor] = useState<NivelPicor>('medio')
  const [itemNotas, setItemNotas] = useState<string>('')
  const [itemSinIngredientes, setItemSinIngredientes] = useState<string[]>([])

  // Datos del Cliente y Checkout
  const urlMesaNombre = searchParams?.get('mesa') || ''
  const urlMesaId = searchParams?.get('mesa_id') ? parseInt(searchParams.get('mesa_id')!, 10) : undefined

  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [tipoEntrega, setTipoEntrega] = useState<'local' | 'didi'>('local')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [necesitaCambio, setNecesitaCambio] = useState<string>('')
  const [horaRecogida, setHoraRecogida] = useState('lo_antes_posible')
  const [notasGenerales, setNotasGenerales] = useState('')
  const [isPreFilled, setIsPreFilled] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Estado del restaurante
  const [restauranteAbierto, setRestauranteAbierto] = useState(inicialAbierto)
  const [mensajeCerrado, setMensajeCerrado] = useState(inicialMensaje)
  const [horariosDias, setHorariosDias] = useState<DiaHorario[] | undefined>(inicialHorarios)
  const [showClosedModal, setShowClosedModal] = useState(false)

  // Cupones y Descuento
  const [cuponInput, setCuponInput] = useState('')
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [fixedDiscount, setFixedDiscount] = useState<number>(0)
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [appliedGiftProduct, setAppliedGiftProduct] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [userAvailableCoupons, setUserAvailableCoupons] = useState<Array<{ codigo: string; descuento: number; titulo: string; tipo: string }>>([])
  const [showCouponAccordion, setShowCouponAccordion] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedOrderNum, setCompletedOrderNum] = useState<number | null>(null)

  // Cargar comanda guardada en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('marea_cart_items')
        if (savedCart) {
          const parsed = JSON.parse(savedCart)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCart(parsed)
          }
        }
      } catch (e) {}
    }
    isCartLoaded.current = true
    setIsMounted(true)
  }, [])

  // Sincronizar cambios del carrito a localStorage
  useEffect(() => {
    if (!isCartLoaded.current || typeof window === 'undefined') return
    try {
      localStorage.setItem('marea_cart_items', JSON.stringify(cart))
    } catch (e) {}
  }, [cart])

  // Scroll automático al inicio de pantalla al cambiar de paso
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [currentStep])

  // Cargar datos pre-guardados del cliente
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedName = localStorage.getItem('marea_cliente_nombre')
    const savedPhone = localStorage.getItem('marea_cliente_telefono')

    if (savedName) setClienteNombre(savedName)
    if (savedPhone) setClienteTelefono(savedPhone)
    if (savedName && savedPhone) setIsPreFilled(true)
  }, [])

  // Cargar estado en vivo del restaurante
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await getEstadoRestaurante()
        setRestauranteAbierto(res.abierto)
        if (res.mensaje_cerrado) setMensajeCerrado(res.mensaje_cerrado)
        if (res.horarios_dias) setHorariosDias(res.horarios_dias)
      } catch (e) {}
    }
    checkStatus()
  }, [])

  // Cargar cupones disponibles
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const activePhone = clienteTelefono || localStorage.getItem('marea_cliente_telefono') || ''
      getAvailableCuponesPublic(activePhone).then((sysCoupons: any) => {
        setUserAvailableCoupons(sysCoupons || [])
      })
    } catch (e) {}
  }, [clienteTelefono])

  // Bloqueo de scroll al abrir modals o bottom-sheets
  useEffect(() => {
    if (selectedPlatillo || cartOpen) {
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
  }, [selectedPlatillo, cartOpen])

  // Slots de Horarios
  const timeSlots = useMemo(() => {
    const todayId = getCurrentDayId()
    const todaySchedule = (horariosDias || []).find((h) => h.id === todayId)
    const aperturaStr = todaySchedule?.apertura || '11:00'
    const cierreStr = todaySchedule?.cierre || '20:00'

    const [startH, startM] = aperturaStr.split(':').map((v) => parseInt(v, 10) || 0)
    const [endH, endM] = cierreStr.split(':').map((v) => parseInt(v, 10) || 0)

    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const lastSlotMinutes = Math.max(startMinutes, endMinutes - 15)

    const slots: Array<{ value: string; label: string }> = [
      { value: 'lo_antes_posible', label: '⚡ Lo antes posible (Inmediato)' },
    ]

    for (let current = startMinutes; current <= lastSlotMinutes; current += 15) {
      const h24 = Math.floor(current / 60)
      const m = current % 60
      const timeVal = `${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      const period = h24 >= 12 ? 'PM' : 'AM'
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12
      const timeLabel = `${h12}:${m.toString().padStart(2, '0')} ${period}`

      slots.push({
        value: timeVal,
        label: `${timeLabel}${current === startMinutes ? ' (Apertura)' : current === lastSlotMinutes ? ' (Último)' : ''}`,
      })
    }
    return slots
  }, [horariosDias])

  // Promociones y Platillos disponibles
  const promoPlatillos = useMemo(() => {
    return (platillos || []).filter((p) => p.disponible && isPromoActiveToday(p))
  }, [platillos])

  const platillosDisponibles = useMemo(() => {
    return (platillos || []).filter((p) => p.disponible)
  }, [platillos])

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

  // Totales
  const rawSubtotal = cart.reduce((sum, item) => sum + item.platillo.precio * item.cantidad, 0)
  const regularSubtotal = cart.reduce((sum, item) => {
    const isPromo = isPromoActiveToday(item.platillo)
    return isPromo ? sum : sum + item.platillo.precio * item.cantidad
  }, 0)
  const percentDiscountAmount = (regularSubtotal * discountPercent) / 100
  const discountAmount = Math.min(rawSubtotal, percentDiscountAmount + fixedDiscount)
  const totalOrderPrice = Math.max(0, rawSubtotal - discountAmount)
  const totalItemCount = cart.reduce((sum, item) => sum + item.cantidad, 0)

  // Acciones de Carrito
  const handleOpenCustomizeModal = (platillo: Platillo) => {
    if (!restauranteAbierto) {
      setShowClosedModal(true)
      return
    }
    setSelectedPlatillo(platillo)
    setItemQty(1)
    setItemPicor('medio')
    setItemNotas('')
    setItemSinIngredientes([])
  }

  const toggleSinIngrediente = (ingrediente: string) => {
    setItemSinIngredientes((prev) =>
      prev.includes(ingrediente) ? prev.filter((i) => i !== ingrediente) : [...prev, ingrediente]
    )
  }

  const handleAddConfiguredItem = () => {
    if (!selectedPlatillo) return
    const cleanNotas = itemNotas.trim()
    const sortedSin = [...itemSinIngredientes].sort()

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.platillo.id === selectedPlatillo.id &&
          item.nivelPicor === itemPicor &&
          (item.sinIngredientes || []).slice().sort().join(',') === sortedSin.join(',') &&
          item.notasItem.trim().toLowerCase() === cleanNotas.toLowerCase()
      )

      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          cantidad: updated[existingIndex].cantidad + itemQty,
        }
        return updated
      }

      const newItem: ConfiguredCartItem = {
        cartItemId: `${selectedPlatillo.id}_${itemPicor}_${Date.now()}`,
        platillo: selectedPlatillo,
        cantidad: itemQty,
        nivelPicor: itemPicor,
        notasItem: cleanNotas,
        sinIngredientes: sortedSin,
      }
      return [...prev, newItem]
    })

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(25) } catch (e) {}
    }
    setSelectedPlatillo(null)
  }

  const handleUpdateQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.cantidad + delta
            return newQty > 0 ? { ...item, cantidad: newQty } : null
          }
          return item
        })
        .filter(Boolean) as ConfiguredCartItem[]
    )
  }

  const handleRemoveItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId))
  }

  const handleApplySpecificCoupon = async (codeToApply: string) => {
    if (!codeToApply || !codeToApply.trim()) return
    if (cart.length > 0 && regularSubtotal === 0) {
      setCouponError('Los cupones de descuento aplican en platillos regulares a precio de lista.')
      return
    }

    setCuponInput(codeToApply)
    setIsValidatingCoupon(true)
    setCouponError(null)

    try {
      const activePhone = clienteTelefono || (typeof window !== 'undefined' ? localStorage.getItem('marea_cliente_telefono') || '' : '')
      const res = await validateCuponAction(codeToApply, activePhone)
      if (res.valid) {
        setDiscountPercent(res.descuento_porcentaje || 0)
        setFixedDiscount(res.monto_fijo || 0)
        setAppliedCoupon(res.codigo || codeToApply)
        setAppliedGiftProduct(res.producto_regalo || null)
        setCouponError(null)
      } else {
        setDiscountPercent(0)
        setFixedDiscount(0)
        setAppliedCoupon(null)
        setAppliedGiftProduct(null)
        setCouponError(res.message || 'Código no válido.')
      }
    } catch (e) {
      setCouponError('Error al validar cupón.')
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  // Submit Final
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    const errors: Record<string, string> = {}
    if (!clienteNombre.trim()) {
      errors.nombre = 'Ingresa tu nombre para la comanda.'
    }
    const cleanP = clienteTelefono.replace(/\D/g, '')
    if (!cleanP || cleanP.length < 10) {
      errors.telefono = 'Ingresa tu WhatsApp de 10 dígitos (ej. 6671234567).'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)
    try {
      const orderItems = cart.map((item) => {
        const sinText = item.sinIngredientes && item.sinIngredientes.length > 0 ? ` · SIN: ${item.sinIngredientes.join(', ')}` : ''
        const notasText = item.notasItem ? ` (${item.notasItem})` : ''
        return {
          platillo_id: item.platillo.id,
          nombre_platillo: item.platillo.nombre,
          precio_unitario: item.platillo.precio,
          cantidad: item.cantidad,
          notas_item: `Picor: ${item.nivelPicor.toUpperCase()}${sinText}${notasText}`,
        }
      })

      if (appliedGiftProduct) {
        orderItems.push({
          platillo_id: 999999,
          nombre_platillo: `🎁 REGALO LEALTAD: ${appliedGiftProduct}`,
          precio_unitario: 0,
          cantidad: 1,
          notas_item: 'Regalo sin costo por Plan de Lealtad',
        })
      }

      const extraNotas = [
        necesitaCambio ? `[Paga con: $${necesitaCambio}]` : '',
        notasGenerales ? notasGenerales : '',
        appliedCoupon ? `[Cupón: ${appliedCoupon} -${discountPercent}%]` : '',
      ].filter(Boolean).join(' ')

      const res = await createPublicPedido({
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono,
        tipo_entrega: tipoEntrega,
        metodo_pago: metodoPago,
        hora_recogida: horaRecogida === 'lo_antes_posible' ? undefined : (horaRecogida || undefined),
        notas: extraNotas || undefined,
        subtotal: rawSubtotal,
        descuento: discountAmount,
        cupon_codigo: appliedCoupon || undefined,
        total: totalOrderPrice,
        items: orderItems,
      })

      if (res && res.success) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('marea_cart_items')
          localStorage.setItem('marea_cliente_nombre', clienteNombre)
          localStorage.setItem('marea_cliente_telefono', clienteTelefono)
        }
        setCompletedOrderNum(res.pedidoId)
        setCurrentStep(3)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        alert('Ocurrió un detalle al registrar el pedido. Intenta nuevamente.')
      }
    } catch (err: any) {
      alert('Error de conexión: ' + (err?.message || 'Revisa tu internet.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateWhatsAppUrlForOrder = () => {
    if (!completedOrderNum) return '#'
    const itemText = cart
      .map((i) => {
        const sinTxt = i.sinIngredientes && i.sinIngredientes.length > 0 ? ` | Sin: ${i.sinIngredientes.join(', ')}` : ''
        const notaTxt = i.notasItem ? ` | Nota: ${i.notasItem}` : ''
        return `- ${i.platillo.nombre} x${i.cantidad} ($${(i.platillo.precio * i.cantidad).toFixed(0)}) [Picor: ${i.nivelPicor}${sinTxt}${notaTxt}]`
      })
      .concat(appliedGiftProduct ? [`- 🎁 REGALO LEALTAD: ${appliedGiftProduct} x1 ($0 GRATIS)`] : [])
      .join('\n')

    const horaSeleccionadaObj = timeSlots.find((s) => s.value === horaRecogida)
    const horaTexto = horaSeleccionadaObj ? horaSeleccionadaObj.label : (horaRecogida || 'Lo antes posible')

    const message = `¡Hola Marea Negra! Acabo de hacer mi Pedido #${completedOrderNum} en línea:\n\n${itemText}\n\n${
      discountAmount > 0 ? `Subtotal: $${rawSubtotal.toFixed(0)} MXN\nDescuento: -$${discountAmount.toFixed(0)} MXN\n` : ''
    }Total: $${totalOrderPrice.toFixed(0)} MXN\nCliente: ${clienteNombre}\nTeléfono: ${clienteTelefono}\nMétodo de Pago: ${metodoPago.toUpperCase()}${
      necesitaCambio ? ` (Paga con: $${necesitaCambio})` : ''
    }\nEntrega: ${tipoEntrega === 'didi' ? 'Envío por DiDi/Uber' : 'Recoger en Local'}\nHora: ${horaTexto}`

    return generateWhatsAppMessageUrl(message)
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8F6F0] dark:bg-[#080808] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-coral selection:text-white transition-colors duration-300">
      
      {/* ── 1. NAVBAR COMPACTO (CERO DESBORDES EN MOBILE) ───────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#080808]/95 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] px-4 sm:px-6 py-2.5 safe-header transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Botón Volver */}
          {currentStep === 2 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300 hover:text-coral flex items-center gap-1 py-1.5 px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300 hover:text-coral flex items-center gap-1 py-1.5 px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Menú</span>
            </button>
          )}

          {/* Logo Central o Badge */}
          <div className="flex items-center">
            <span className="font-display text-lg tracking-wider text-neutral-900 dark:text-white">
              MAREA NEGRA
            </span>
          </div>

          {/* Lado Derecho */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <UserHeaderBadge />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── 2. ALERTA SI RESTAURANTE ESTÁ CERRADO ────────────────────────────── */}
      {!restauranteAbierto && (
        <div className="max-w-5xl mx-auto w-full px-4 pt-4">
          <div className="bg-coral/15 border border-coral/30 rounded-2xl p-4 flex items-center gap-3 text-coral shadow-sm animate-pulse">
            <Lock className="w-5 h-5 shrink-0 text-coral" />
            <div className="flex flex-col text-xs">
              <span className="font-bold uppercase tracking-wider">RESTAURANTE CERRADO EN ESTE MOMENTO</span>
              <p className="text-neutral-800 dark:text-neutral-200 mt-0.5">
                {mensajeCerrado || 'Puedes explorar los platillos, pero el envío de órdenes está pausado.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. CONTENIDO SEGÚN PASO ──────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        
        {/* ── PASO 1: MENÚ RÁPIDO & SELECCIÓN DE PLATILLOS ──────────────────── */}
        {currentStep === 1 && (
          <div className={`flex flex-col gap-6 ${totalItemCount > 0 ? 'pb-28' : ''}`}>
            
            {/* Header y Buscador */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#2ABFBF]">
                  PASO 1 · SELECCIONA TU COMANDA
                </span>
                <h1 className="font-display text-3xl sm:text-4xl text-neutral-900 dark:text-white">
                  ARMÁ TU PEDIDO EN LÍNEA
                </h1>
              </div>

              {/* Buscador */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar aguachile, ceviche..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-xl pl-10 pr-3.5 py-2 text-xs font-sans font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-[#2ABFBF] focus:outline-none shadow-sm"
                />
              </div>
            </div>

            {/* BARRA STICKY DE CATEGORÍAS (SIN DESBORDE HORIZONTAL) */}
            <div className="sticky top-[53px] z-30 w-full py-2 bg-[#F8F6F0]/95 dark:bg-[#080808]/95 backdrop-blur-xl border-y border-black/[0.06] dark:border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold whitespace-nowrap shrink-0 active:scale-95 transition-all ${
                  activeCategory === 'all'
                    ? 'bg-neutral-950 text-white dark:bg-white dark:text-black shadow-sm'
                    : 'bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400'
                }`}
              >
                🍽️ Todos ({platillosDisponibles.length})
              </button>

              {promoPlatillos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('promos')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold whitespace-nowrap shrink-0 active:scale-95 flex items-center gap-1 transition-all ${
                    activeCategory === 'promos'
                      ? 'bg-coral text-white shadow-sm'
                      : 'bg-coral/10 text-coral border border-coral/30'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                  <span>🔥 Promos ({promoPlatillos.length})</span>
                </button>
              )}

              {categorias.map((cat) => {
                const count = platillosDisponibles.filter((p) => p.categoria_id === cat.id).length
                if (count === 0) return null

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold whitespace-nowrap shrink-0 active:scale-95 transition-all ${
                      activeCategory === cat.id
                        ? 'bg-[#2ABFBF] text-black shadow-sm'
                        : 'bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {cat.nombre} ({count})
                  </button>
                )
              })}
            </div>

            {/* LISTA DE PLATILLOS EN GRID BENTO */}
            {filteredPlatillos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {filteredPlatillos.map((platillo) => {
                  const pActual = parsePrice(platillo.precio)
                  const qtyInCart = cart
                    .filter((item) => item.platillo.id === platillo.id)
                    .reduce((sum, item) => sum + item.cantidad, 0)
                  const promoText = isPromoActiveToday(platillo) ? getPromoBannerText(platillo) : null

                  return (
                    <div
                      key={platillo.id}
                      onClick={() => handleOpenCustomizeModal(platillo)}
                      className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] hover:border-[#2ABFBF]/50 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3.5 group relative touch-manipulation active:scale-[0.99]"
                    >
                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                        <div className="flex flex-col gap-1">
                          {promoText && (
                            <span className="text-[10px] font-sans font-bold uppercase text-coral bg-coral/10 px-2 py-0.5 rounded-md border border-coral/20 self-start flex items-center gap-1">
                              <Flame className="w-3 h-3 fill-coral" />
                              <span>{promoText}</span>
                            </span>
                          )}

                          <h3 className="font-sans font-bold text-sm sm:text-base text-neutral-900 dark:text-white group-hover:text-[#2ABFBF] transition-colors line-clamp-1">
                            {platillo.nombre}
                          </h3>

                          {platillo.descripcion && (
                            <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-snug">
                              {platillo.descripcion}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-baseline gap-2 mt-2 pt-1">
                          <span className="font-display text-2xl text-coral font-bold tracking-tight">
                            ${formatPrice(pActual)} <span className="text-[10px] font-sans text-neutral-500">MXN</span>
                          </span>

                          {qtyInCart > 0 && (
                            <span className="text-[10px] font-sans font-bold text-[#2ABFBF] bg-[#2ABFBF]/10 border border-[#2ABFBF]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>{qtyInCart} en comanda</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Foto y Botón + */}
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-neutral-900 shrink-0 shadow-sm border border-black/5 dark:border-white/5">
                        {platillo.imagen_url ? (
                          <Image
                            src={platillo.imagen_url}
                            alt={platillo.nombre}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="120px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-3xl opacity-30 select-none">{platillo.emoji || '🦐'}</span>
                          </div>
                        )}

                        <div className="absolute bottom-1.5 right-1.5">
                          <div className="bg-[#2ABFBF] text-black font-sans font-bold text-xs p-1.5 sm:px-2.5 sm:py-1 rounded-xl shadow-md flex items-center gap-1 transition-transform group-hover:scale-105 active:scale-90">
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span className="hidden sm:inline">AGREGAR</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-[#111317] rounded-3xl border border-dashed border-black/10 dark:border-white/10">
                <p className="text-sm font-sans text-neutral-500">No encontramos platillos con ese nombre.</p>
              </div>
            )}
          </div>
        )}

        {/* ── PASO 2: CHECKOUT RÁPIDO UNIFICADO O ESTADO VACÍO ───────────────── */}
        {currentStep === 2 && cart.length === 0 && (
          <div className="max-w-md mx-auto my-8 p-8 sm:p-10 text-center bg-white dark:bg-[#111317] rounded-[32px] border border-black/[0.08] dark:border-white/[0.08] shadow-sm flex flex-col items-center gap-5 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-full bg-coral/10 text-coral flex items-center justify-center border border-coral/20 shadow-sm">
              <ShoppingBag className="w-9 h-9" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="font-display text-3xl text-neutral-900 dark:text-white">
                TU COMANDA ESTÁ VACÍA
              </h2>
              <p className="font-sans text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Parece que quitaste todos los platillos. Explora nuestro menú y agrega tus aguachiles o cocteles favoritos para continuar con tu orden.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="w-full bg-[#2ABFBF] text-black hover:bg-white font-sans font-bold text-xs tracking-wider py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer mt-2"
            >
              <Utensils className="w-4 h-4" />
              <span>EXPLORAR MENÚ Y AGREGAR PLATILLOS</span>
            </button>
          </div>
        )}

        {currentStep === 2 && cart.length > 0 && (
          <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
            
            {/* Header del Checkout */}
            <div className="text-center flex flex-col gap-1">
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#2ABFBF]">
                PASO 2 · FINALIZAR Y ENVIAR
              </span>
              <h1 className="font-display text-3xl sm:text-4xl text-neutral-900 dark:text-white">
                CONFIRMAR TU PEDIDO
              </h1>
              <p className="font-sans text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                Solo ingresa tus datos para preparar tu orden en barra.
              </p>
            </div>

            {/* RESUMEN COMPACTO DE PLATILLOS */}
            <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                <span className="font-sans font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#2ABFBF]" />
                  <span>Tu Comanda ({totalItemCount} {totalItemCount === 1 ? 'platillo' : 'platillos'})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-[#2ABFBF] hover:underline"
                >
                  + Agregar más
                </button>
              </div>

              <div className="flex flex-col divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="font-sans font-bold text-sm text-neutral-900 dark:text-white">
                        {item.cantidad}x {item.platillo.nombre}
                      </span>
                      <span className="text-[11px] font-sans text-neutral-500">
                        Picor: {item.nivelPicor} {item.sinIngredientes?.length ? `· Sin: ${item.sinIngredientes.join(', ')}` : ''}
                      </span>
                      {item.notasItem && (
                        <span className="text-[11px] font-sans italic text-neutral-400">
                          &quot;{item.notasItem}&quot;
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-display text-xl text-coral font-bold">
                        ${(item.platillo.precio * item.cantidad).toFixed(0)}
                      </span>
                      <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.05] p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.cartItemId, -1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-1">{item.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.cartItemId, 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-[#2ABFBF]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CUPÓN DE DESCUENTO ACCORDION */}
              <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowCouponAccordion(!showCouponAccordion)}
                  className="w-full flex items-center justify-between text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300 py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-[#C9A84C]" />
                    <span>{appliedCoupon ? `Cupón aplicado: ${appliedCoupon} (-${discountAmount.toFixed(0)} MXN)` : '¿Tienes un cupón de descuento?'}</span>
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showCouponAccordion ? 'rotate-90' : ''}`} />
                </button>

                {showCouponAccordion && (
                  <div className="pt-3 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej. BIENVENIDO10"
                        value={cuponInput}
                        onChange={(e) => setCuponInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-sans font-bold uppercase focus:border-[#2ABFBF] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplySpecificCoupon(cuponInput)}
                        disabled={isValidatingCoupon}
                        className="bg-[#2ABFBF] text-black font-sans font-bold text-xs px-4 py-2 rounded-xl active:scale-95 disabled:opacity-50"
                      >
                        {isValidatingCoupon ? 'Validando...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] font-sans text-coral">{couponError}</p>}
                    {appliedCoupon && <p className="text-[11px] font-sans text-emerald-500 font-bold">✓ ¡Cupón activado con éxito!</p>}
                  </div>
                )}
              </div>

              {/* TOTAL FINAL */}
              <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-xs font-sans text-neutral-500 block">Total a pagar:</span>
                  {discountAmount > 0 && (
                    <span className="text-[11px] font-sans text-coral">Descuento: -${discountAmount.toFixed(0)} MXN</span>
                  )}
                </div>
                <span className="font-display text-3xl sm:text-4xl text-coral font-bold tracking-tight">
                  ${totalOrderPrice.toFixed(0)} MXN
                </span>
              </div>
            </div>

            {/* FORMULARIO DE CHECKOUT */}
            <form onSubmit={handleFinalSubmit} className="flex flex-col gap-5">
              
              {/* BLOQUE 1: TUS DATOS */}
              <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                <span className="font-sans font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#2ABFBF]" />
                  <span>1. Tus Datos de Contacto</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      className={`bg-black/[0.02] dark:bg-white/[0.04] border ${fieldErrors.nombre ? 'border-coral' : 'border-black/10 dark:border-white/10'} rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans focus:border-[#2ABFBF] focus:outline-none`}
                    />
                    {fieldErrors.nombre && <span className="text-[11px] font-sans text-coral">{fieldErrors.nombre}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300">
                      WhatsApp (10 dígitos) *
                    </label>
                    <input
                      type="tel"
                      placeholder="6671234567"
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      className={`bg-black/[0.02] dark:bg-white/[0.04] border ${fieldErrors.telefono ? 'border-coral' : 'border-black/10 dark:border-white/10'} rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans focus:border-[#2ABFBF] focus:outline-none`}
                    />
                    {fieldErrors.telefono && <span className="text-[11px] font-sans text-coral">{fieldErrors.telefono}</span>}
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: TIPO DE ENTREGA & HORARIO */}
              <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                <span className="font-sans font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C9A84C]" />
                  <span>2. Entrega y Horario</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoEntrega('local')}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      tipoEntrega === 'local'
                        ? 'bg-[#2ABFBF]/15 border-[#2ABFBF] text-[#2ABFBF] font-bold shadow-sm'
                        : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span className="text-xs font-sans font-bold">Para Recoger en Local</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoEntrega('didi')}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      tipoEntrega === 'didi'
                        ? 'bg-[#2ABFBF]/15 border-[#2ABFBF] text-[#2ABFBF] font-bold shadow-sm'
                        : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <Car className="w-5 h-5" />
                    <span className="text-xs font-sans font-bold">Enviar por DiDi / Uber</span>
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300">
                    Hora estimada de recogida / envío:
                  </label>
                  <select
                    value={horaRecogida}
                    onChange={(e) => setHoraRecogida(e.target.value)}
                    className="bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans font-bold focus:border-[#2ABFBF] focus:outline-none cursor-pointer"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot.value} value={slot.value} className="dark:bg-[#111317]">
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BLOQUE 3: MÉTODO DE PAGO */}
              <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                <span className="font-sans font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-coral" />
                  <span>3. Método de Pago</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('efectivo')}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all active:scale-95 ${
                      metodoPago === 'efectivo'
                        ? 'bg-coral/15 border-coral text-coral font-bold shadow-sm'
                        : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-xs font-sans">Efectivo al recibir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('transferencia')}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all active:scale-95 ${
                      metodoPago === 'transferencia'
                        ? 'bg-[#2ABFBF]/15 border-[#2ABFBF] text-[#2ABFBF] font-bold shadow-sm'
                        : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs font-sans">Transferencia SPEI</span>
                  </button>
                </div>

                {metodoPago === 'efectivo' && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className="text-xs font-sans text-neutral-600 dark:text-neutral-400">
                      ¿Con cuánto vas a pagar? (Opcional, para llevar tu cambio listo):
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 500"
                      value={necesitaCambio}
                      onChange={(e) => setNecesitaCambio(e.target.value)}
                      className="bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-sans focus:border-[#2ABFBF] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* BOTÓN ENVIAR COMANDA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-coral text-white font-sans font-bold text-sm tracking-wider py-4 px-6 rounded-2xl shadow-[0_4px_24px_rgba(232,67,10,0.35)] hover:bg-coral/90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>ENVIANDO A BARRA...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>CONFIRMAR PEDIDO · ${totalOrderPrice.toFixed(0)} MXN</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── PASO 3: CONFIRMACIÓN DE COMANDA & TICKET ────────────────────────── */}
        {currentStep === 3 && completedOrderNum && (
          <div className="max-w-xl mx-auto flex flex-col items-center text-center gap-6 animate-in fade-in duration-300">
            <div className="w-full bg-white dark:bg-[#111317] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center border border-emerald-500/30 shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <span className="text-xs font-sans font-bold tracking-widest text-emerald-500 uppercase">
                ¡PEDIDO REGISTRADO CON ÉXITO!
              </span>

              <h2 className="font-display text-4xl text-neutral-900 dark:text-white">
                FOLIO #{completedOrderNum}
              </h2>

              <p className="font-sans text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-md">
                Gracias <strong>{clienteNombre}</strong>. Tu comanda ya está en barra. Descarga tu ticket o confírmala por WhatsApp.
              </p>

              {/* Ticket visual */}
              <div className="w-full my-2">
                <TicketImageDownload
                  pedidoId={completedOrderNum}
                  clienteNombre={clienteNombre}
                  clienteTelefono={clienteTelefono}
                  metodoPago={metodoPago}
                  horaRecogida={horaRecogida}
                  notas={notasGenerales}
                  items={cart.map((item) => ({
                    nombre_platillo: item.platillo.nombre,
                    precio_unitario: item.platillo.precio,
                    cantidad: item.cantidad,
                    nivel_picor: item.nivelPicor,
                    notas_item: item.notasItem,
                    descripcion: item.platillo.descripcion,
                  }))}
                  subtotal={rawSubtotal}
                  descuento={discountAmount}
                  total={totalOrderPrice}
                />
              </div>

              {/* Botón WhatsApp */}
              <a
                href={generateWhatsAppUrlForOrder()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white font-sans font-bold text-xs tracking-wider py-4 rounded-2xl hover:bg-[#1EBE5D] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>CONFIRMAR POR WHATSAPP</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setCart([])
                  setCurrentStep(1)
                }}
                className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 font-sans font-bold text-xs py-3.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-all"
              >
                Hacer otro pedido
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── 4. BOTTOM SHEET: PERSONALIZACIÓN DE PLATILLO (MOBILE FIRST) ─────── */}
      <AnimatePresence>
        {selectedPlatillo && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white dark:bg-[#111317] border-t sm:border border-black/10 dark:border-white/10 rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Handle bar móvil */}
              <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

              {/* Botón cerrar */}
              <button
                onClick={() => setSelectedPlatillo(null)}
                className="absolute top-3.5 right-3.5 z-30 p-2 text-white bg-black/60 backdrop-blur-md rounded-full border border-white/20 active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Contenido scrolleable */}
              <div className="overflow-y-auto flex-1 flex flex-col">
                {/* Foto */}
                {selectedPlatillo.imagen_url ? (
                  <div className="relative w-full h-56 sm:h-64 bg-neutral-950 shrink-0">
                    <Image
                      src={selectedPlatillo.imagen_url}
                      alt={selectedPlatillo.nombre}
                      fill
                      className="object-cover"
                      sizes="500px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  </div>
                ) : (
                  <div className="relative w-full h-32 bg-neutral-900 flex items-center justify-center">
                    <span className="text-6xl opacity-20">{selectedPlatillo.emoji || '🦐'}</span>
                  </div>
                )}

                {/* Info & Config */}
                <div className="p-5 sm:p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-2 border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                    <div>
                      <h3 className="font-sans font-bold text-xl sm:text-2xl text-neutral-900 dark:text-white">
                        {selectedPlatillo.nombre}
                      </h3>
                      {selectedPlatillo.descripcion && (
                        <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {selectedPlatillo.descripcion}
                        </p>
                      )}
                    </div>
                    <span className="font-display text-2xl text-coral font-bold shrink-0">
                      ${formatPrice(selectedPlatillo.precio)}
                    </span>
                  </div>

                  {/* Porciones */}
                  <div className="flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.04] p-3 rounded-2xl border border-black/5 dark:border-white/5">
                    <span className="text-xs font-sans font-bold">Cantidad de porciones:</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                        className="w-8 h-8 rounded-xl bg-black/[0.05] dark:bg-white/[0.1] font-bold text-base flex items-center justify-center active:scale-95"
                      >
                        -
                      </button>
                      <span className="font-display text-2xl font-bold px-1">{itemQty}</span>
                      <button
                        type="button"
                        onClick={() => setItemQty(itemQty + 1)}
                        className="w-8 h-8 rounded-xl bg-[#2ABFBF] text-black font-bold text-base flex items-center justify-center active:scale-95 shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Nivel de Picor */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-sans font-bold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-coral" />
                      <span>Elige el nivel de picor</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {PICOR_OPTIONS.map((p) => {
                        const isSelected = itemPicor === p.id
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setItemPicor(p.id)}
                            className={`p-3 rounded-2xl border text-left flex flex-col gap-0.5 active:scale-95 transition-all ${
                              isSelected
                                ? `${p.color} ring-2 ring-[#2ABFBF] font-bold shadow-sm`
                                : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            <span className="text-xs font-sans font-bold text-neutral-900 dark:text-white">
                              {p.label}
                            </span>
                            <span className="text-[10px] font-sans opacity-70">
                              {p.desc}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Ingredientes Excluibles */}
                  {selectedPlatillo && getPlatilloIngredients(selectedPlatillo).length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-sans font-bold">¿Deseas quitar algún ingrediente?</span>
                      <div className="flex flex-wrap gap-1.5">
                        {getPlatilloIngredients(selectedPlatillo).map((ing) => {
                          const isExcluded = itemSinIngredientes.includes(ing)
                          return (
                            <button
                              key={ing}
                              type="button"
                              onClick={() => toggleSinIngrediente(ing)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-sans transition-all active:scale-95 flex items-center gap-1 ${
                                isExcluded
                                  ? 'bg-coral text-white font-bold'
                                  : 'bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {isExcluded && <X className="w-3.5 h-3.5" />}
                              <span>{isExcluded ? `Sin ${ing}` : ing}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold">Notas para la cocina (opcional):</label>
                    <input
                      type="text"
                      placeholder="Ej. Salsa aparte, poco limón..."
                      value={itemNotas}
                      onChange={(e) => setItemNotas(e.target.value)}
                      className="bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-sans focus:border-[#2ABFBF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Botón Sticky Agregar */}
              <div className="p-4 bg-white/95 dark:bg-[#111317]/95 backdrop-blur-md border-t border-black/[0.08] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={handleAddConfiguredItem}
                  className="w-full bg-[#2ABFBF] text-black hover:bg-white font-sans font-bold text-xs tracking-wider py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>AGREGAR · ${(selectedPlatillo.precio * itemQty).toFixed(0)} MXN</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 5. DRAWER BOTTOM SHEET: REVISIÓN DE COMANDA ─────────────────────── */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white dark:bg-[#111317] border-t sm:border border-black/10 dark:border-white/10 rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg shadow-2xl relative max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />
              
              <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
                <span className="font-sans font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#2ABFBF]" />
                  <span>Tu Comanda ({totalItemCount} {totalItemCount === 1 ? 'platillo' : 'platillos'})</span>
                </span>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 flex flex-col divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="font-sans font-bold text-sm text-neutral-900 dark:text-white">
                        {item.cantidad}x {item.platillo.nombre}
                      </span>
                      <span className="text-[11px] font-sans text-neutral-500">
                        Picor: {item.nivelPicor} {item.sinIngredientes?.length ? `· Sin: ${item.sinIngredientes.join(', ')}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-display text-xl text-coral font-bold">
                        ${(item.platillo.precio * item.cantidad).toFixed(0)}
                      </span>
                      <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.05] p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.cartItemId, -1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-1">{item.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.cartItemId, 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-[#2ABFBF]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans text-neutral-500">Subtotal:</span>
                  <span className="font-display text-2xl text-coral font-bold">${totalOrderPrice.toFixed(0)} MXN</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false)
                    setCurrentStep(2)
                  }}
                  className="w-full bg-coral text-white font-sans font-bold text-xs tracking-wider py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span>CONTINUAR AL CHECKOUT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 6. BARRA FLOTANTE STICKY DEL CARRITO EN MÓVIL/DESKTOP (PASO 1) ───── */}
      {isMounted && totalItemCount > 0 && currentStep === 1 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 pointer-events-none">
          <div className="max-w-xl mx-auto pointer-events-auto">
            <div className="bg-neutral-950/95 text-white backdrop-blur-xl border border-white/15 rounded-2xl sm:rounded-full p-3 px-5 shadow-2xl flex items-center justify-between gap-3 ring-1 ring-white/10">
              
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="flex items-center gap-3 text-left active:scale-95 transition-transform cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#2ABFBF]/20 text-[#2ABFBF] flex items-center justify-center font-bold text-xs shrink-0">
                  {totalItemCount}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-sans font-bold">Ver Comanda</span>
                  <span className="font-display text-xl text-coral font-bold leading-tight">
                    ${totalOrderPrice.toFixed(0)} MXN
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="bg-[#2ABFBF] text-black hover:bg-white font-sans font-bold text-xs tracking-wider py-3 px-5 rounded-xl sm:rounded-full flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>CONTINUAR</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RESTAURANTE CERRADO */}
      {showClosedModal && (
        <RestauranteCerradoModal
          mensajeCerrado={mensajeCerrado}
          horariosDias={horariosDias}
          onClose={() => setShowClosedModal(false)}
        />
      )}
    </div>
  )
}
