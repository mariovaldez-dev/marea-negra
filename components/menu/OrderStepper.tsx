'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Platillo, Categoria, ConfiguredCartItem, NivelPicor, MetodoPago } from '@/lib/types/database'
import { createPublicPedido } from '@/lib/actions/publicPedidos'
import { validateCuponAction, getAvailableCuponesPublic } from '@/lib/actions/cupones'
import dynamic from 'next/dynamic'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const UserHeaderBadge = dynamic(
  () => import('@/components/ui/UserHeaderBadge').then((mod) => mod.UserHeaderBadge),
  {
    ssr: false,
    loading: () => <div className="h-9 w-32 bg-arena/10 rounded-full animate-pulse shrink-0" />,
  }
)
import { TicketImageDownload } from '@/components/menu/TicketImageDownload'
import { RestauranteCerradoModal } from '@/components/menu/RestauranteCerradoModal'
import { generateWhatsAppMessageUrl } from '@/lib/utils/whatsapp'
import { isPromoActiveToday, getPromoBannerText, isPromoItem, parsePrice, formatPrice, getCurrentDayId } from '@/lib/utils/promo'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { DiaHorario, getEstadoRestaurante } from '@/lib/actions/negocioEstado'
import { Award, Lock } from 'lucide-react'
import {
  Flame,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  User,
  Phone,
  Clock,
  CreditCard,
  FileText,
  Sparkles,
  MessageCircle,
  X,
  Ticket,
  Gift,
  AlertCircle,
  Check,
} from 'lucide-react'

interface OrderStepperProps {
  categorias: Categoria[]
  platillos: Platillo[]
  inicialAbierto?: boolean
  inicialMensaje?: string
  inicialHorarios?: DiaHorario[]
}

const PICOR_OPTIONS: { id: NivelPicor; label: string; desc: string; color: string; flames: number }[] = [
  { id: 'sin_chile', label: 'Sin Chile', desc: 'Mariscos frescos al natural con limón', color: 'border-arena/40 text-negro dark:text-arena bg-arena/10', flames: 0 },
  { id: 'suave', label: 'Suave', desc: 'Toque leve de chilitos frescos', color: 'border-turquesa text-turquesa bg-turquesa/10', flames: 1 },
  { id: 'medio', label: 'Medio', desc: 'Picor tradicional de la casa', color: 'border-oro text-oro bg-oro/10', flames: 2 },
  { id: 'bravo', label: 'Bravo', desc: 'Sabor intenso para conocedores', color: 'border-coral text-coral bg-coral/10', flames: 3 },
]

// CACHE GLOBAL EN MEMORIA DE IMÁGENES DESCARGADAS
const globalLoadedImages = new Set<string>()

// COMPONENTE HELPER DE IMAGEN DE PLATILLO CON CACHE INSTANTÁNEO Y TRANSICIÓN PROGRESIVA
function StepperDishImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(() => globalLoadedImages.has(src))

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 z-0 bg-[#EBE5D8] dark:bg-carbon animate-pulse flex flex-col items-center justify-center gap-1">
          <Loader2 className="w-4 h-4 text-turquesa animate-spin" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        onLoad={() => {
          globalLoadedImages.add(src)
          setLoaded(true)
        }}
        className={`object-cover object-center group-hover:scale-105 transition-all duration-700 ease-out transform-gpu pointer-events-none select-none ${loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'
          }`}
        sizes="(max-width: 640px) 100vw, 180px"
      />
    </>
  )
}

function ModalDishImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(() => globalLoadedImages.has(src))

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 z-0 bg-[#EBE5D8] dark:bg-carbon animate-pulse flex flex-col items-center justify-center gap-1">
          <Loader2 className="w-5 h-5 text-turquesa animate-spin" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        onLoad={() => {
          globalLoadedImages.add(src)
          setLoaded(true)
        }}
        className={`object-cover object-center transition-all duration-700 ease-out transform-gpu pointer-events-none select-none ${loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'
          }`}
        sizes="(max-width: 640px) 100vw, 450px"
      />
    </>
  )
}

export function OrderStepper({
  categorias,
  platillos,
  inicialAbierto = true,
  inicialMensaje = '',
  inicialHorarios,
}: OrderStepperProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)

  // Promos activas HOY (validadas por día de semana en Sinaloa)
  const promoPlatillos = (platillos || []).filter((p) => isPromoActiveToday(p))
  // Platillos normales (excluye cualquier platillo configurado como promo)
  const platillosNormales = (platillos || []).filter((p) => !isPromoItem(p))

  const [isMounted, setIsMounted] = useState(false)

  // Inicializar comanda vacía para evitar desajustes SSR
  const [cart, setCart] = useState<ConfiguredCartItem[]>([])

  // Cargar comanda guardada en localStorage tras el montaje del cliente
  useEffect(() => {
    setIsMounted(true)
    if (typeof window === 'undefined') return
    try {
      const savedCart = localStorage.getItem('marea_cart_items')
      if (savedCart) {
        const parsed = JSON.parse(savedCart)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed)
        }
      }
    } catch (e) { }
  }, [])

  // Sincronizar automáticamente cualquier modificación del carrito en localStorage
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return
    try {
      localStorage.setItem('marea_cart_items', JSON.stringify(cart))
    } catch (e) {
      console.warn('Error al persistir carrito:', e)
    }
  }, [cart, isMounted])

  // Modal para configurar platillo individual
  const [selectedPlatillo, setSelectedPlatillo] = useState<Platillo | null>(null)
  const [itemQty, setItemQty] = useState<number>(1)
  const [itemPicor, setItemPicor] = useState<NivelPicor>('medio')
  const [itemNotas, setItemNotas] = useState<string>('')

  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [tipoEntrega, setTipoEntrega] = useState<'local' | 'didi'>('local')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [horaRecogida, setHoraRecogida] = useState('lo_antes_posible')
  const [notasGenerales, setNotasGenerales] = useState('')
  const [isPreFilled, setIsPreFilled] = useState(false)

  // Estado de apertura del restaurante
  const [restauranteAbierto, setRestauranteAbierto] = useState(inicialAbierto)
  const [mensajeCerrado, setMensajeCerrado] = useState(inicialMensaje)
  const [horariosDias, setHorariosDias] = useState<DiaHorario[] | undefined>(inicialHorarios)
  const [showClosedModal, setShowClosedModal] = useState(false)

  // Generar opciones de horarios cada 15 minutos desde apertura hasta 15 min antes de cerrar
  const timeSlots = React.useMemo(() => {
    const todayId = getCurrentDayId()
    const todaySchedule = (horariosDias || []).find((h) => h.id === todayId)

    const aperturaStr = todaySchedule?.apertura || '11:00'
    const cierreStr = todaySchedule?.cierre || '20:00'

    const [startH, startM] = aperturaStr.split(':').map((v) => parseInt(v, 10) || 0)
    const [endH, endM] = cierreStr.split(':').map((v) => parseInt(v, 10) || 0)

    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    // La última hora para recoger o enviar es 15 minutos antes de cerrar
    const lastSlotMinutes = Math.max(startMinutes, endMinutes - 15)

    const slots: Array<{ value: string; label: string; emoji?: string }> = [
      { value: 'lo_antes_posible', label: '⚡ Lo antes posible (Inmediato)', emoji: '⚡' },
    ]

    for (let current = startMinutes; current <= lastSlotMinutes; current += 15) {
      const h24 = Math.floor(current / 60)
      const m = current % 60
      const timeVal = `${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`

      // Formato 12 horas amigable (ej. 11:15 AM / 7:45 PM)
      const period = h24 >= 12 ? 'PM' : 'AM'
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12
      const timeLabel = `${h12}:${m.toString().padStart(2, '0')} ${period}`

      let labelExtra = timeLabel
      if (current === startMinutes) {
        labelExtra = `${timeLabel} (Apertura)`
      } else if (current === lastSlotMinutes) {
        labelExtra = `${timeLabel} (Último horario)`
      }

      slots.push({
        value: timeVal,
        label: labelExtra,
        emoji: '🕒',
      })
    }

    return slots
  }, [horariosDias])

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await getEstadoRestaurante()
        setRestauranteAbierto(res.abierto)
        if (res.mensaje_cerrado) setMensajeCerrado(res.mensaje_cerrado)
        if (res.horarios_dias) setHorariosDias(res.horarios_dias)
      } catch (e) { }
    }
    checkStatus()
  }, [])

  // Cargar datos del cliente guardados en la app para autocompletar instantáneamente
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedName = localStorage.getItem('marea_cliente_nombre')
    const savedPhone = localStorage.getItem('marea_cliente_telefono')

    if (savedName) setClienteNombre(savedName)
    if (savedPhone) setClienteTelefono(savedPhone)
    if (savedName && savedPhone) setIsPreFilled(true)
  }, [])

  // Bloquear el scroll y movimiento del fondo al abrir el modal
  useEffect(() => {
    if (selectedPlatillo) {
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
  }, [selectedPlatillo])

  // Cupones y Descuento
  const [cuponInput, setCuponInput] = useState('')
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [userAvailableCoupons, setUserAvailableCoupons] = useState<Array<{ codigo: string; descuento: number; titulo: string; tipo: string }>>([])

  // Cargar cupones disponibles (personales del cliente + promocionales activos + recompensas por pedidos alcanzados en BDD)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const savedUserCoupons = localStorage.getItem('marea_user_coupons')
      const parsedUser = savedUserCoupons ? JSON.parse(savedUserCoupons) : []
      const activePhone = clienteTelefono || localStorage.getItem('marea_cliente_telefono') || ''

      getAvailableCuponesPublic(activePhone).then((sysCoupons) => {
        const combined = [...parsedUser]
        sysCoupons.forEach((sys) => {
          if (!combined.some((c) => c.codigo === sys.codigo)) {
            combined.push(sys)
          }
        })
        setUserAvailableCoupons(combined)
      })
    } catch (e) {
      console.warn('Error cargando cupones disponibles:', e)
    }
  }, [clienteTelefono])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedOrderNum, setCompletedOrderNum] = useState<number | null>(null)

  // Función para renderizar los fueguitos según el nivel de picor
  const renderFlames = (flames: number) => {
    if (flames === 0) {
      return <Flame className="w-3.5 h-3.5 text-arena/50 dark:text-arena/40 shrink-0" />
    }
    const colorClass =
      flames === 1
        ? 'text-turquesa fill-turquesa'
        : flames === 2
          ? 'text-oro fill-oro'
          : 'text-coral fill-coral'

    return (
      <div className="flex items-center gap-0.5 shrink-0">
        {Array.from({ length: flames }).map((_, idx) => (
          <Flame key={idx} className={`w-3.5 h-3.5 ${colorClass}`} />
        ))}
      </div>
    )
  }

  // Abrir modal de personalización (bloqueado si el restaurante está cerrado)
  const handleOpenCustomizeModal = (platillo: Platillo) => {
    if (!restauranteAbierto) {
      setShowClosedModal(true)
      return
    }
    setSelectedPlatillo(platillo)
    setItemQty(1)
    setItemPicor('medio')
    setItemNotas('')
  }

  // Agregar platillo configurado a la comanda
  const handleAddConfiguredItem = () => {
    if (!selectedPlatillo) return

    const newItem: ConfiguredCartItem = {
      cartItemId: `${selectedPlatillo.id}_${Date.now()}`,
      platillo: selectedPlatillo,
      cantidad: itemQty,
      nivelPicor: itemPicor,
      notasItem: itemNotas.trim(),
    }

    setCart((prev) => [...prev, newItem])
    setSelectedPlatillo(null)
  }

  // Modificar cantidad en carrito
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

  const rawSubtotal = cart.reduce(
    (sum, item) => sum + item.platillo.precio * item.cantidad,
    0
  )

  // Subtotal de platillos regulares (excluye combos y promociones activas)
  const regularSubtotal = cart.reduce((sum, item) => {
    const isPromo = isPromoActiveToday(item.platillo)
    return isPromo ? sum : sum + item.platillo.precio * item.cantidad
  }, 0)

  const promoSubtotal = rawSubtotal - regularSubtotal
  const hasPromoInCart = promoSubtotal > 0

  const [fixedDiscount, setFixedDiscount] = useState<number>(0)
  const [appliedGiftProduct, setAppliedGiftProduct] = useState<string | null>(null)

  // El descuento porcentual (ej. 10% de bienvenida) aplica exclusivamente a platillos regulares a precio de lista
  const percentDiscountAmount = (regularSubtotal * discountPercent) / 100
  const discountAmount = Math.min(rawSubtotal, percentDiscountAmount + fixedDiscount)
  const totalOrderPrice = Math.max(0, rawSubtotal - discountAmount)
  const totalItemCount = cart.reduce((sum, item) => sum + item.cantidad, 0)

  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

  const handleApplySpecificCoupon = async (codeToApply: string) => {
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
        if (res.producto_regalo) {
          setAppliedGiftProduct(res.producto_regalo)
        } else {
          setAppliedGiftProduct(null)
        }
        setCouponError(null)
      } else {
        setDiscountPercent(0)
        setFixedDiscount(0)
        setAppliedCoupon(null)
        setAppliedGiftProduct(null)
        setCouponError(res.message || 'Código de cupón no válido.')
      }
    } catch (e) {
      setCouponError('Código de cupón no válido.')
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleApplyCoupon = async () => {
    handleApplySpecificCoupon(cuponInput)
  }

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Submit final del pedido
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    const errors: Record<string, string> = {}
    if (!clienteNombre.trim()) {
      errors.nombre = 'Por favor ingresa tu nombre completo para la comanda.'
    }
    const cleanP = clienteTelefono.replace(/\D/g, '')
    if (!cleanP || cleanP.length < 10) {
      errors.telefono = 'Por favor ingresa tu número celular de 10 dígitos (ej. 6671234567).'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)
    try {
      const orderItems = cart.map((item) => ({
        platillo_id: item.platillo.id,
        nombre_platillo: item.platillo.nombre,
        precio_unitario: item.platillo.precio,
        cantidad: item.cantidad,
        notas_item: `Picor: ${item.nivelPicor.toUpperCase()}${item.notasItem ? ` (${item.notasItem})` : ''}`,
      }))

      if (appliedGiftProduct) {
        orderItems.push({
          platillo_id: 999999,
          nombre_platillo: `🎁 REGALO LEALTAD: ${appliedGiftProduct}`,
          precio_unitario: 0,
          cantidad: 1,
          notas_item: 'Regalo sin costo por Plan de Lealtad',
        })
      }

      const res = await createPublicPedido({
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono,
        tipo_entrega: tipoEntrega,
        metodo_pago: metodoPago,
        hora_recogida: horaRecogida === 'lo_antes_posible' ? undefined : (horaRecogida || undefined),
        notas: `${notasGenerales ? `${notasGenerales} ` : ''}${appliedCoupon ? `[Cupón: ${appliedCoupon} -${discountPercent}%]` : ''}`.trim(),
        subtotal: rawSubtotal,
        descuento: discountAmount,
        cupon_codigo: appliedCoupon || undefined,
        total: totalOrderPrice,
        items: orderItems,
      })

      console.log('Respuesta del servidor:', res)

      if (res && res.success) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('marea_cart_items')
        }
        setCompletedOrderNum(res.pedidoId)
        setCurrentStep(4)
      } else {
        alert('Ocurrió un error al guardar el pedido. ' + JSON.stringify(res))
      }
    } catch (err: any) {
      console.error('Error completo:', err)
      alert('Error de conexión al procesar el pedido: ' + (err?.message || 'Error desconocido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateWhatsAppUrlForOrder = () => {
    if (!completedOrderNum) return '#'
    const itemText = cart
      .map(
        (i) =>
          `- ${i.platillo.nombre} x${i.cantidad} ($${(i.platillo.precio * i.cantidad).toFixed(0)}) [Picor: ${i.nivelPicor}]`
      )
      .concat(
        appliedGiftProduct
          ? [`- 🎁 REGALO LEALTAD: ${appliedGiftProduct} x1 ($0 GRATIS)`]
          : []
      )
      .join('\n')

    const horaSeleccionadaObj = timeSlots.find((s) => s.value === horaRecogida)
    const horaTexto = horaSeleccionadaObj ? horaSeleccionadaObj.label : (horaRecogida || 'Lo antes posible')

    const message = `Hola Marea Negra! Acabo de hacer el Pedido #${completedOrderNum} en línea:\n\n${itemText}\n\n${discountAmount > 0
      ? `Subtotal: $${rawSubtotal.toFixed(0)} MXN\nDescuento (${appliedCoupon || 'Cupón'}): -$${discountAmount.toFixed(0)} MXN\n`
      : ''
      }Total: $${totalOrderPrice.toFixed(0)} MXN\nCliente: ${clienteNombre}\nTeléfono: ${clienteTelefono}\nMétodo de Pago: ${metodoPago.toUpperCase()}\nEntrega: ${tipoEntrega === 'didi' ? 'Envío por DiDi/Uber' : 'Recoger en Local'}\nHora: ${horaTexto}`

    return generateWhatsAppMessageUrl(message)
  }

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-negro dark:bg-negro dark:text-blanco flex flex-col selection:bg-coral transition-colors">
      {/* HEADER DE STEPPER */}
      <header className="sticky top-0 z-40 bg-[#F4F0E8] dark:bg-negro border-b border-arena/30 dark:border-arena/10 px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-sm font-sans font-bold text-negro/70 dark:text-arena/70 hover:text-coral flex items-center gap-1"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Menú</span>
            </button>
            <h1 className="font-display text-2xl md:text-3xl tracking-wider text-negro dark:text-blanco">
              MAREA NEGRA
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <UserHeaderBadge />
            <ThemeToggle />
            {isMounted && totalItemCount > 0 && currentStep === 1 && (
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-turquesa text-negro font-sans font-bold text-xs md:text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-md animate-pulse"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>COMANDA ({totalItemCount})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ALERTA SI EL RESTAURANTE ESTÁ CERRADO */}
      {!restauranteAbierto && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-4">
          <div className="bg-coral/20 border-2 border-coral/50 rounded-2xl p-4 md:p-5 flex items-center gap-3 text-coral shadow-lg animate-pulse">
            <Lock className="w-6 h-6 shrink-0 text-coral" />
            <div className="flex flex-col gap-0.5">
              <span className="font-sans font-bold text-xs md:text-sm uppercase tracking-wider">
                🔴 RESTAURANTE CERRADO EN ESTE MOMENTO
              </span>
              <p className="font-sans text-xs md:text-sm text-negro/80 dark:text-blanco/90">
                {mensajeCerrado || 'Por el momento nuestro restaurante se encuentra cerrado. Puedes explorar nuestro menú, pero el envío de nuevos pedidos por WhatsApp está pausado.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE PASOS / STEPPER INDICATOR */}
      <div className="bg-white dark:bg-carbon border-b border-arena/30 dark:border-arena/10 px-4 py-4 transition-colors">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-1 text-center">
          {[
            { step: 1, label: '1. PLATILLOS' },
            { step: 2, label: '2. COMANDA' },
            { step: 3, label: '3. DATOS' },
            { step: 4, label: '4. CONFIRMAR' },
          ].map((item) => (
            <div
              key={item.step}
              onClick={() => {
                if (currentStep === 4) return
                if (item.step < currentStep || (item.step === 2 && cart.length > 0)) {
                  setCurrentStep(item.step as any)
                }
              }}
              className={`flex flex-col items-center gap-1 transition-all ${currentStep === 4 ? 'cursor-default opacity-90' : 'cursor-pointer'
                } ${currentStep === item.step
                  ? 'text-coral font-bold'
                  : currentStep > item.step
                    ? 'text-turquesa font-semibold'
                    : 'text-negro/40 dark:text-arena/40'
                }`}
            >
              <div
                className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold font-sans border ${currentStep === item.step
                  ? 'bg-coral text-blanco border-coral shadow-md'
                  : currentStep > item.step
                    ? 'bg-turquesa text-negro border-turquesa'
                    : 'bg-[#F4F0E8] dark:bg-negro text-negro/70 dark:text-blanco border-arena/30 dark:border-arena/20'
                  }`}
              >
                {currentStep > item.step ? <Check className="w-4 h-4 stroke-[3]" /> : item.step}
              </div>
              <span className="text-[10px] sm:text-xs font-sans tracking-wider font-bold">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL SEGÚN PASO ACTUAL */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 w-full flex-1">
        {/* PASO 1: SELECCIÓN Y CONFIGURACIÓN DE PLATILLOS */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-8">
            <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
              <span className="text-xs font-sans font-bold tracking-widest text-turquesa uppercase">
                PASO 1 DE 4 · ELIGE Y PERSONALIZA
              </span>
              <h2 className="font-display text-4xl md:text-5xl text-negro dark:text-blanco tracking-wide">
                NUESTRO MENÚ DE MARISCOS
              </h2>
              <p className="font-sans italic text-base text-negro/80 dark:text-arena/80">
                Toca cualquier platillo para ver detalles, elegir cantidad, nivel de picor y notas para el chef.
              </p>
            </div>

            {/* SECCIÓN ESPECIAL DE PROMOCIONES DEL DÍA (SI EXISTEN ACTIVAS HOY) */}
            {promoPlatillos.length > 0 && (
              <section className="flex flex-col gap-4 mb-4">
                <div className="flex items-center gap-3 border-b border-coral/30 pb-2">
                  <span className="font-sans text-xs font-bold text-coral tracking-widest uppercase bg-coral/10 border border-coral/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Flame className="w-3.5 h-3.5 fill-coral animate-pulse" />
                    <span>OFERTAS DE HOY</span>
                  </span>
                  <h3 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco tracking-wider">
                    PROMOCIONES & ESPECIALES
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {promoPlatillos.map((platillo) => {
                    const bannerText = getPromoBannerText(platillo)
                    const pActual = parsePrice(platillo.precio)
                    const pAnterior = parsePrice(platillo.precio_anterior)
                    const ahorro = pAnterior > pActual ? pAnterior - pActual : 0

                    return (
                      <div
                        key={platillo.id}
                        onClick={() => handleOpenCustomizeModal(platillo)}
                        className="bg-white dark:bg-[#050404] border-2 border-coral/40 hover:border-coral rounded-2xl overflow-hidden transition-all cursor-pointer shadow-xl flex flex-col sm:flex-row group relative"
                      >
                        {/* Imagen Thumbnail */}
                        <div className="relative w-full sm:w-44 h-48 sm:h-auto min-h-[170px] flex-shrink-0 bg-[#EBE5D8] dark:bg-carbon overflow-hidden">
                          {platillo.imagen_url ? (
                            <StepperDishImage src={platillo.imagen_url} alt={platillo.nombre} />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-dots-pattern text-coral/40 gap-1 p-2">
                              <Flame className="w-8 h-8 text-coral/50" />
                              <span className="text-[10px] font-sans font-bold text-arena/60 uppercase">Marea Negra</span>
                            </div>
                          )}

                          <span className="absolute top-2 left-2 z-10 text-[9px] font-sans font-extrabold tracking-wider uppercase border border-coral/40 text-blanco bg-gradient-to-r from-coral via-coral/90 to-oro px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5 fill-blanco animate-pulse" />
                            <span>{bannerText}</span>
                          </span>
                        </div>

                        {/* Detalle Texto y Precio */}
                        <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-sans font-bold text-xl text-negro dark:text-blanco group-hover:text-coral transition-colors">
                                {platillo.nombre}
                              </h4>
                            </div>

                            {platillo.descripcion && (
                              <p className="font-sans italic text-sm text-negro/70 dark:text-arena/70 line-clamp-2 mt-1">
                                {platillo.descripcion}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-between items-end pt-2 border-t border-arena/30 dark:border-arena/10">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-sans text-negro/60 dark:text-arena/60 uppercase font-bold">
                                {pAnterior > pActual ? 'Precio Oferta' : 'Precio'}
                              </span>
                              <div className="flex items-baseline gap-2">
                                <span className="font-display text-3xl text-coral tracking-tight">
                                  ${formatPrice(pActual)} <span className="text-xs font-sans text-negro/60 dark:text-arena">MXN</span>
                                </span>
                                {pAnterior > pActual && (
                                  <span className="font-display text-base text-negro/40 dark:text-arena/40 line-through tracking-tight">
                                    ${formatPrice(pAnterior)}
                                  </span>
                                )}
                              </div>
                              {ahorro > 0 && (
                                <span className="text-[9px] font-sans font-bold text-turquesa uppercase tracking-wider">
                                  ¡Ahorras ${ahorro.toFixed(0)} MXN!
                                </span>
                              )}
                            </div>

                            <button className="bg-coral text-blanco font-sans font-bold text-xs px-4 py-2 rounded-full flex items-center gap-1 shadow-md hover:bg-coral/90 transition-all">
                              <Plus className="w-4 h-4 stroke-[3]" />
                              <span>ORDENAR</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* CATEGORÍAS REGULARES (PLATILLOS NORMALES) */}
            {categorias.map((cat) => {
              const catDishes = platillosNormales.filter((p) => p.categoria_id === cat.id)
              if (catDishes.length === 0) return null

              return (
                <div key={cat.id} className="flex flex-col gap-4">
                  <h3 className="font-display text-3xl text-coral tracking-wider border-b border-arena/30 dark:border-arena/10 pb-2">
                    {cat.nombre.toUpperCase()}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {catDishes.map((platillo) => {
                      const pActual = parsePrice(platillo.precio)

                      return (
                        <div
                          key={platillo.id}
                          onClick={() => handleOpenCustomizeModal(platillo)}
                          className="bg-white dark:bg-[#050404] border border-arena/30 dark:border-arena/10 rounded-2xl overflow-hidden hover:border-turquesa/50 transition-all cursor-pointer shadow-lg flex flex-col sm:flex-row group"
                        >
                          {/* Imagen Thumbnail */}
                          <div className="relative w-full sm:w-40 h-48 sm:h-auto min-h-[160px] flex-shrink-0 bg-[#EBE5D8] dark:bg-carbon overflow-hidden">
                            {platillo.imagen_url ? (
                              <StepperDishImage src={platillo.imagen_url} alt={platillo.nombre} />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-dots-pattern text-turquesa/40 gap-1 p-2">
                                <Flame className="w-8 h-8 text-turquesa/50" />
                                <span className="text-[10px] font-sans font-bold text-arena/60 uppercase">Marea Negra</span>
                              </div>
                            )}
                          </div>

                          {/* Detalle Texto y Precio */}
                          <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="font-sans font-bold text-xl text-negro dark:text-blanco group-hover:text-turquesa transition-colors">
                                  {platillo.nombre}
                                </h4>
                              </div>

                              {platillo.descripcion && (
                                <p className="font-sans italic text-sm text-negro/70 dark:text-arena/70 line-clamp-2 mt-1">
                                  {platillo.descripcion}
                                </p>
                              )}
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-arena/30 dark:border-arena/10">
                              <div className="flex items-baseline gap-2">
                                <span className="font-display text-3xl text-coral">
                                  ${formatPrice(pActual)} <span className="text-xs font-sans text-negro/60 dark:text-arena">MXN</span>
                                </span>
                              </div>

                              <button className="bg-turquesa text-negro font-sans font-bold text-xs px-4 py-2 rounded-full flex items-center gap-1 shadow-md">
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>ORDENAR</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* PASO 2: REVISIÓN DE LA COMANDA */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <div className="text-center flex flex-col gap-2">
              <span className="text-xs font-sans font-bold tracking-widest text-turquesa uppercase">
                PASO 2 DE 4
              </span>
              <h2 className="font-display text-4xl text-negro dark:text-blanco tracking-wide">
                TU COMANDA EN LÍNEA
              </h2>
              <p className="font-sans italic text-base text-negro/70 dark:text-arena/70">
                Revisa los platillos agregados, modifica cantidades o elimina si lo deseas.
              </p>
            </div>

            {cart.length > 0 ? (
              <div className="flex flex-col gap-4">
                {cart.map((item) => {
                  const picorInfo = PICOR_OPTIONS.find((p) => p.id === item.nivelPicor)

                  return (
                    <div
                      key={item.cartItemId}
                      className="bg-white dark:bg-carbon border border-arena/30 dark:border-arena/10 rounded-2xl p-5 flex flex-col gap-3 shadow-lg transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h4 className="font-sans font-bold text-lg text-negro dark:text-blanco">
                            {item.platillo.nombre}
                          </h4>
                          <span className="font-display text-2xl text-coral mt-0.5">
                            ${(item.platillo.precio * item.cantidad).toFixed(0)} MXN
                          </span>
                        </div>

                        {/* Botones Cantidad */}
                        <div className="flex items-center gap-2 bg-[#F4F0E8] dark:bg-negro p-1 rounded-lg border border-arena/20">
                          <button
                            onClick={() => handleUpdateQty(item.cartItemId, -1)}
                            className="p-1.5 text-negro dark:text-blanco hover:text-coral"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-sans font-bold text-sm px-2 text-negro dark:text-blanco">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.cartItemId, 1)}
                            className="p-1.5 text-negro dark:text-blanco hover:text-turquesa"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Detalles de Picor e Instrucciones */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-arena/20 dark:border-arena/10 text-xs font-sans">
                        <span className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${picorInfo?.color}`}>
                          {renderFlames(picorInfo?.flames || 0)}
                          <span>Picor: {picorInfo?.label}</span>
                        </span>

                        <button
                          onClick={() => handleRemoveItem(item.cartItemId)}
                          className="text-coral hover:text-coral/80 flex items-center gap-1 text-xs font-bold"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>

                      {item.notasItem && (
                        <span className="font-sans italic text-xs md:text-sm text-negro/80 dark:text-arena/80 bg-[#F4F0E8] dark:bg-negro/50 p-2.5 rounded-lg border border-arena/20 dark:border-arena/10 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-turquesa shrink-0" />
                          <span>Nota: "{item.notasItem}"</span>
                        </span>
                      )}
                    </div>
                  )
                })}

                <div className="bg-white dark:bg-carbon border border-oro/40 dark:border-oro/30 rounded-2xl p-5 flex flex-col gap-2.5 shadow-xl mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-sans font-bold text-lg text-negro dark:text-blanco">TOTAL A PAGAR:</span>
                    <span className="font-display text-4xl text-oro">${totalOrderPrice.toFixed(0)} MXN</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-sans pt-2 border-t border-arena/20 dark:border-arena/10 gap-1">
                      <span className="text-negro/70 dark:text-arena/70">Subtotal comanda: ${rawSubtotal.toFixed(0)} MXN</span>
                      <span className="text-coral font-bold bg-coral/10 px-2.5 py-0.5 rounded-full border border-coral/20">
                        Descuento aplicado: -${discountAmount.toFixed(0)} MXN
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-full sm:w-auto bg-white dark:bg-carbon text-negro dark:text-blanco hover:bg-arena/20 border border-arena/30 dark:border-arena/20 font-sans font-bold text-xs md:text-sm px-6 py-3.5 rounded-full transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>AGREGAR MÁS PLATILLOS</span>
                  </button>

                  <button
                    onClick={() => setCurrentStep(3)}
                    className="w-full sm:w-auto bg-turquesa text-negro font-sans font-bold text-xs md:text-sm tracking-wider px-8 py-3.5 rounded-full hover:bg-blanco transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(42,191,191,0.3)]"
                  >
                    <span>DATOS DE ENTREGA</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-carbon rounded-2xl border border-arena/30 dark:border-arena/20 flex flex-col items-center justify-center gap-3">
                <ShoppingBag className="w-12 h-12 text-arena/40" />
                <h3 className="font-display text-3xl text-negro dark:text-blanco">TU COMANDA ESTÁ VACÍA</h3>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="mt-2 bg-coral text-blanco font-sans font-bold text-xs px-6 py-3 rounded-full"
                >
                  IR AL CATÁLOGO DE MARISCOS
                </button>
              </div>
            )}
          </div>
        )}

        {/* PASO 3: DATOS DEL CLIENTE Y MÉTODO DE PAGO */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-8 max-w-xl mx-auto">
            <div className="text-center flex flex-col gap-2">
              <span className="text-xs font-sans font-bold tracking-widest text-turquesa uppercase">
                PASO 3 DE 4
              </span>
              <h2 className="font-display text-4xl text-negro dark:text-blanco tracking-wide">
                DATOS DE ENTREGA & PAGO
              </h2>
              <p className="font-sans italic text-base text-negro/70 dark:text-arena/70">
                Ingresa tus datos para confirmar tu pedido y coordinar la recogida o entrega.
              </p>
            </div>

            <form noValidate onSubmit={handleFinalSubmit} className="bg-white dark:bg-[#050404] border border-arena/30 dark:border-oro/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 gold-border-corner transition-colors">
              {isPreFilled && (
                <div className="bg-turquesa/10 border border-turquesa/30 rounded-xl p-3.5 flex items-center justify-between text-turquesa text-xs font-sans font-bold">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-turquesa" />
                    <span>¡Hola, {clienteNombre}! Autocompletamos tus datos para agilizar tu pedido.</span>
                  </div>
                  <span className="hidden sm:inline-block text-[10px] font-sans italic text-arena/70">Puedes editarlos si lo deseas</span>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-turquesa" />
                  <span>Tu Nombre Completo *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mario Valdez"
                  value={clienteNombre}
                  onChange={(e) => {
                    setClienteNombre(e.target.value)
                    if (fieldErrors.nombre) setFieldErrors({ ...fieldErrors, nombre: '' })
                  }}
                  className={`bg-[#F4F0E8] dark:bg-carbon border rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:outline-none ${fieldErrors.nombre ? 'border-coral ring-2 ring-coral/20' : 'border-arena/30 dark:border-arena/20 focus:border-turquesa'
                    }`}
                />
                {fieldErrors.nombre && (
                  <span className="text-[11px] font-sans font-bold text-coral flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-coral shrink-0" />
                    <span>{fieldErrors.nombre}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-turquesa" />
                  <span>Teléfono Celular de Contacto *</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="Ej. 6671234567"
                  value={clienteTelefono}
                  onChange={(e) => {
                    setClienteTelefono(e.target.value)
                    if (fieldErrors.telefono) setFieldErrors({ ...fieldErrors, telefono: '' })
                  }}
                  className={`bg-[#F4F0E8] dark:bg-carbon border rounded-xl px-4 py-3 text-base text-negro dark:text-blanco focus:outline-none ${fieldErrors.telefono ? 'border-coral ring-2 ring-coral/20' : 'border-arena/30 dark:border-arena/20 focus:border-turquesa'
                    }`}
                />
                {fieldErrors.telefono && (
                  <span className="text-[11px] font-sans font-bold text-coral flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-coral shrink-0" />
                    <span>{fieldErrors.telefono}</span>
                  </span>
                )}
              </div>

              {/* SELECTOR DE TIPO DE ENTREGA */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-turquesa" />
                  <span>Método de Entrega</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setTipoEntrega('local')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${tipoEntrega === 'local'
                      ? 'border-turquesa bg-turquesa/10 dark:bg-turquesa/5'
                      : 'border-arena/30 dark:border-arena/20 bg-[#F4F0E8] dark:bg-carbon hover:border-turquesa/50'
                      }`}
                  >
                    <span className="text-3xl mb-1">🚗</span>
                    <span className={`font-sans font-bold text-sm tracking-wide ${tipoEntrega === 'local' ? 'text-turquesa' : 'text-negro dark:text-blanco'}`}>
                      RECOGER EN LOCAL
                    </span>
                    <span className="text-[10px] font-sans text-center text-negro/60 dark:text-arena/60 mt-1">
                      Paso por el pedido a la hora acordada
                    </span>
                  </div>

                  <div
                    onClick={() => setTipoEntrega('didi')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${tipoEntrega === 'didi'
                      ? 'border-oro bg-oro/10 dark:bg-oro/5'
                      : 'border-arena/30 dark:border-arena/20 bg-[#F4F0E8] dark:bg-carbon hover:border-oro/50'
                      }`}
                  >
                    <span className="text-3xl mb-1">🛵</span>
                    <span className={`font-sans font-bold text-sm tracking-wide ${tipoEntrega === 'didi' ? 'text-oro' : 'text-negro dark:text-blanco'}`}>
                      ENVÍO POR DIDI/UBER
                    </span>
                    <span className="text-[10px] font-sans text-center text-negro/60 dark:text-arena/60 mt-1">
                      Mandamos tu pedido (Tú le pagas el viaje al repartidor)
                    </span>
                  </div>
                </div>
                {tipoEntrega === 'didi' && (
                  <div className="bg-oro/10 border border-oro/30 rounded-xl p-3 flex items-start gap-2 mt-1">
                    <AlertCircle className="w-4 h-4 text-oro shrink-0 mt-0.5" />
                    <span className="text-[11px] font-sans text-negro dark:text-arena/90 leading-relaxed">
                      <strong>Nota importante:</strong> Por favor especifica tu dirección exacta en las <b>Notas Generales</b> abajo para poder enviarte el repartidor. El costo del viaje no está incluido y deberás pagarlo en efectivo al conductor.
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-turquesa" />
                    <span>Método de Pago</span>
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'efectivo', label: 'Efectivo', emoji: '💵' },
                      { value: 'transferencia', label: 'Transferencia SPEI', emoji: '🏦' }
                    ]}
                    value={metodoPago}
                    onChange={(val) => setMetodoPago(val as MetodoPago)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-turquesa" />
                    <span>{tipoEntrega === 'local' ? 'Hora Estimada Recogida' : 'Hora de Preparación/Envío'}</span>
                  </label>
                  <CustomSelect
                    options={timeSlots}
                    value={horaRecogida}
                    onChange={(val) => setHoraRecogida(val)}
                    placeholder="-- Selecciona un horario --"
                  />
                </div>
              </div>

              {/* SECCIÓN DE CUPÓN DE DESCUENTO CON SELECTOR ESTILO UBER EATS */}
              <div className="flex flex-col gap-2 pt-2 border-t border-arena/20 dark:border-arena/10">
                <label className="text-xs font-sans uppercase font-bold text-turquesa flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-turquesa" />
                  <span>¿Tienes un Cupón de Descuento?</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. BIENVENIDO10 o MAREA10"
                    value={cuponInput}
                    onChange={(e) => setCuponInput(e.target.value)}
                    className="flex-1 bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-4 py-2.5 text-base text-negro dark:text-blanco focus:border-turquesa focus:outline-none uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon}
                    className="bg-turquesa text-negro font-sans font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blanco transition-all flex items-center gap-1"
                  >
                    {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'APLICAR'}
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="bg-limon/15 border border-limon/40 rounded-xl p-3.5 flex flex-col gap-1 text-black dark:text-limon shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sans font-bold flex items-center gap-1.5 text-black dark:text-limon">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-limon shrink-0" />
                        <span>¡Cupón {appliedCoupon} Redimido con Éxito!</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null)
                          setDiscountPercent(0)
                          setCuponInput('')
                        }}
                        className="text-[10px] font-sans font-bold text-coral underline hover:text-coral/80"
                      >
                        Cambiar / Quitar
                      </button>
                    </div>
                    <span className="text-xs font-sans font-bold text-coral">
                      🎉 ¡Felicidades! Estás ahorrando ${discountAmount.toFixed(0)} MXN en esta comanda (-{discountPercent}% OFF).
                    </span>
                  </div>
                )}

                {couponError && (
                  <span className="text-xs font-sans font-bold text-coral flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-coral shrink-0" />
                    <span>{couponError}</span>
                  </span>
                )}

                {appliedCoupon && (
                  <span className="text-[10px] font-sans italic text-negro/60 dark:text-arena/60 mt-0.5">
                    ℹ️ Solo se puede aplicar 1 cupón por pedido. Para elegir otro, presiona "Cambiar / Quitar".
                  </span>
                )}

                {/* SECCIÓN SEPARADA DE CUPONES: LEALTAD Y PROMOCIONALES TRADICIONALES */}
                {userAvailableCoupons.length > 0 && !appliedCoupon && (
                  <div className="flex flex-col gap-3 mt-2 pt-3 border-t border-arena/20 dark:border-arena/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-sans font-bold text-turquesa uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-turquesa" />
                        <span>Cupones Disponibles:</span>
                      </span>
                      <span className="text-[10px] font-sans text-negro/60 dark:text-arena/60">Toca 1 para redimir</span>
                    </div>

                    <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                      {/* 1. CUPONES DE RECOMPENSA DE LEALTAD (ACTIVADOS POR PEDIDOS EN BDD) */}
                      {userAvailableCoupons.filter((c) => c.tipo === 'lealtad').length > 0 && (
                        <div className="flex flex-col gap-1.5 mb-1">
                          <span className="text-[10px] font-sans font-bold text-[#8C6D1F] dark:text-oro uppercase tracking-wider">
                            🏆 Recompensas del Plan de Lealtad (Alcanzados por Pedidos):
                          </span>
                          {userAvailableCoupons
                            .filter((c) => c.tipo === 'lealtad')
                            .map((coupon) => (
                              <div
                                key={coupon.codigo}
                                onClick={() => handleApplySpecificCoupon(coupon.codigo)}
                                className="bg-[#F4F0E8] dark:bg-carbon border-2 border-oro/40 hover:border-oro rounded-xl p-3 flex items-center justify-between cursor-pointer group transition-all shadow-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-oro/20 border border-oro/40 flex items-center justify-center text-oro shrink-0">
                                    <Award className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-bold text-negro dark:text-blanco tracking-wider">
                                        {coupon.codigo}
                                      </span>
                                      <span className="bg-oro text-negro text-[9px] font-sans font-bold px-2 py-0.5 rounded-full">
                                        -{coupon.descuento}% OFF LEALTAD
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-sans italic text-negro/80 dark:text-arena/90 font-medium">
                                      {coupon.titulo}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="bg-oro text-negro font-sans font-bold text-[10px] px-3 py-1.5 rounded-lg group-hover:bg-blanco transition-all shrink-0"
                                >
                                  USAR RECOMPENSA
                                </button>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* 2. CUPONES PROMOCIONALES TRADICIONALES */}
                      {userAvailableCoupons.filter((c) => c.tipo !== 'lealtad').length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-sans font-bold text-turquesa uppercase tracking-wider">
                            🎟️ Cupones Promocionales Tradicionales:
                          </span>
                          {userAvailableCoupons
                            .filter((c) => c.tipo !== 'lealtad')
                            .map((coupon) => (
                              <div
                                key={coupon.codigo}
                                onClick={() => handleApplySpecificCoupon(coupon.codigo)}
                                className="bg-[#F4F0E8] dark:bg-carbon border border-turquesa/30 hover:border-turquesa rounded-xl p-3 flex items-center justify-between cursor-pointer group transition-all shadow-sm hover:shadow-md"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-turquesa/15 border border-turquesa/40 flex items-center justify-center text-turquesa group-hover:bg-turquesa group-hover:text-negro transition-colors shrink-0">
                                    <Ticket className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-bold text-negro dark:text-blanco tracking-wider">
                                        {coupon.codigo}
                                      </span>
                                      <span className="bg-coral text-blanco text-[9px] font-sans font-bold px-2 py-0.5 rounded-full">
                                        -{coupon.descuento}% OFF
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-sans italic text-negro/70 dark:text-arena/70">
                                      {coupon.titulo}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="bg-turquesa text-negro font-sans font-bold text-[10px] px-3 py-1.5 rounded-lg group-hover:bg-blanco transition-all shrink-0"
                                >
                                  USAR
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-turquesa" />
                  <span>Notas Generales del Pedido</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Favor de incluir tostadas extras y servilletas..."
                  value={notasGenerales}
                  onChange={(e) => setNotasGenerales(e.target.value)}
                  className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl p-3 text-base text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
                />
              </div>

              {/* RESUMEN DE TOTAL FINAL CON DESGLOSE CLARO Y TRANSPARENTE */}
              <div className="bg-[#F4F0E8] dark:bg-carbon p-4 rounded-xl flex flex-col gap-2.5 border border-arena/30 dark:border-arena/20 mt-2 shadow-lg">
                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="text-negro/70 dark:text-arena/70">Subtotal de la Comanda:</span>
                  <span className="font-bold text-negro dark:text-blanco">${rawSubtotal.toFixed(0)} MXN</span>
                </div>

                {hasPromoInCart && (
                  <div className="flex justify-between items-center text-[11px] font-sans text-coral bg-coral/10 px-2.5 py-1 rounded-lg border border-coral/20">
                    <span>🔥 Combos & Promociones del día:</span>
                    <span className="font-bold">${promoSubtotal.toFixed(0)} MXN (precio especial)</span>
                  </div>
                )}

                {discountPercent > 0 && (
                  <div className="flex flex-col gap-1 pt-1.5 border-t border-arena/20 dark:border-arena/10">
                    <div className="flex justify-between items-center text-xs font-sans">
                      <span className="text-turquesa font-bold flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Cupón {appliedCoupon ? `(${appliedCoupon})` : ''} -{discountPercent}%:</span>
                      </span>
                      <span className="font-bold text-coral">
                        {regularSubtotal > 0
                          ? `-$${percentDiscountAmount.toFixed(0)} MXN`
                          : '$0 MXN'}
                      </span>
                    </div>

                    {regularSubtotal > 0 && hasPromoInCart && (
                      <span className="text-[10px] font-sans italic text-negro/60 dark:text-arena/60">
                        * Aplicado sobre ${regularSubtotal.toFixed(0)} MXN de platillos regulares (los combos ya cuentan con precio especial).
                      </span>
                    )}

                    {regularSubtotal === 0 && hasPromoInCart && (
                      <span className="text-[10px] font-sans italic text-coral bg-coral/5 p-2 rounded-lg border border-coral/20 leading-relaxed">
                        ℹ️ Tu pedido contiene únicamente combos o promociones. Tu cupón del {discountPercent}% se activará en cuanto agregues platillos a precio regular.
                      </span>
                    )}
                  </div>
                )}

                {fixedDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs font-sans text-turquesa pt-1 border-t border-arena/20 dark:border-arena/10">
                    <span className="font-bold">Descuento Promocional Fijo:</span>
                    <span className="font-bold text-coral">-${fixedDiscount.toFixed(0)} MXN</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-arena/30 dark:border-arena/15 mt-0.5">
                  <div className="flex flex-col">
                    <span className="font-sans font-bold text-xs uppercase tracking-wider text-negro/60 dark:text-arena/60">Total a Pagar:</span>
                    {discountAmount > 0 ? (
                      <span className="text-xs font-sans font-bold text-coral">
                        ¡Ahorras ${discountAmount.toFixed(0)} MXN con cupón! 🔥
                      </span>
                    ) : (
                      <span className="text-[11px] font-sans italic text-negro/60 dark:text-arena/60">Mariscos frescos de Sinaloa</span>
                    )}
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="font-display text-4xl text-oro">${totalOrderPrice.toFixed(0)} <span className="text-xs font-sans text-negro/60 dark:text-arena">MXN</span></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-white dark:bg-carbon text-negro dark:text-blanco hover:bg-arena/20 border border-arena/30 dark:border-arena/20 font-sans font-bold text-xs md:text-sm px-6 py-3.5 rounded-full transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>REGRESAR A LA COMANDA</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-coral text-blanco font-sans font-bold text-xs md:text-sm tracking-wider px-8 py-3.5 rounded-full hover:bg-coral/80 transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(232,67,10,0.4)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>GENERANDO COMANDA...</span>
                    </>
                  ) : (
                    <>
                      <span>CONFIRMAR PEDIDO</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PASO 4: CONFIRMACIÓN DE PEDIDO Y DESCARGA DE COMPROBANTE */}
        {currentStep === 4 && completedOrderNum && (
          <div className="flex flex-col gap-6 max-w-xl mx-auto text-center animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#050404] border-2 border-turquesa rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4 gold-border-corner transition-colors">
              <div className="w-16 h-16 rounded-full bg-turquesa/20 text-turquesa flex items-center justify-center border border-turquesa/40 shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <span className="text-xs font-sans font-bold tracking-widest text-turquesa uppercase">
                ¡PEDIDO REGISTRADO CON ÉXITO!
              </span>

              <h2 className="font-display text-4xl text-negro dark:text-blanco">
                FOLIO COMANDA #{completedOrderNum}
              </h2>

              <p className="font-sans italic text-sm text-negro/80 dark:text-arena/80 max-w-md">
                Gracias <strong>{clienteNombre}</strong>. Tu pedido ha sido enviado a nuestra barra de cocina. Puedes guardar tu comprobante o enviarlo por WhatsApp.
              </p>

              {/* COMPONENTE DE DESCARGA DE TICKET / COMPROBANTE VISUAL */}
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

              <a
                href={generateWhatsAppUrlForOrder()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-negro font-sans font-bold text-xs tracking-wider py-4 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg mt-1"
              >
                <MessageCircle className="w-4 h-4 fill-negro" />
                <span>CONFIRMAR PEDIDO POR WHATSAPP</span>
              </a>

              <button
                onClick={() => {
                  setCart([])
                  setCurrentStep(1)
                }}
                className="w-full bg-turquesa/20 text-turquesa border border-turquesa/40 font-sans font-bold text-xs py-4 rounded-full hover:bg-turquesa hover:text-negro transition-all"
              >
                HACER OTRO PEDIDO
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-[#F4F0E8] dark:bg-carbon text-negro dark:text-blanco font-sans font-bold text-xs py-4 rounded-full border border-arena/30 hover:bg-arena/20"
              >
                VOLVER AL MENÚ PRINCIPAL
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL PARA CONFIGURAR PLATILLO INDIVIDUAL ULTRA ERGONÓMICO Y COMPACTO EN MÓVIL */}
      {selectedPlatillo && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white text-negro dark:bg-[#0A0908] dark:text-blanco border-t sm:border border-arena/30 dark:border-oro/30 rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-4 sm:p-6 gold-border-corner shadow-2xl relative max-h-[92vh] overflow-y-auto flex flex-col justify-between">
            <button
              onClick={() => setSelectedPlatillo(null)}
              className="absolute top-3 right-3 z-20 p-1.5 text-negro dark:text-blanco hover:text-coral rounded-full bg-white dark:bg-carbon border border-arena/20 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className='py-6'>
              {/* FOTO COMPACTA EN HEADER CON OBJECT-COVER Y BLUR TRANSICIÓN */}
              {selectedPlatillo.imagen_url && (
                <div className="relative w-full h-32 sm:h-44 rounded-xl overflow-hidden mb-3 bg-[#EBE5D8] dark:bg-carbon border border-arena/30 dark:border-arena/10">
                  <ModalDishImage src={selectedPlatillo.imagen_url} alt={selectedPlatillo.nombre} />
                </div>
              )}

              {/* CABECERA CON TÍTULO Y PRECIO */}
              <div className="flex justify-between items-start gap-2 mb-3">
                <div>
                  <span className="text-[10px] font-sans font-bold tracking-widest text-turquesa uppercase block">
                    {isPromoActiveToday(selectedPlatillo)
                      ? `🔥 ${getPromoBannerText(selectedPlatillo)}`
                      : 'PERSONALIZAR PRODUCTO'}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl text-negro dark:text-blanco leading-tight">
                    {selectedPlatillo.nombre}
                  </h3>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl sm:text-3xl text-coral">
                      ${formatPrice(selectedPlatillo.precio)} <span className="text-xs font-sans text-negro/60 dark:text-arena">MXN</span>
                    </span>
                    {isPromoActiveToday(selectedPlatillo) && parsePrice(selectedPlatillo.precio_anterior) > parsePrice(selectedPlatillo.precio) && (
                      <span className="font-display text-base text-negro/40 dark:text-arena/40 line-through">
                        ${formatPrice(selectedPlatillo.precio_anterior)}
                      </span>
                    )}
                  </div>
                  {isPromoActiveToday(selectedPlatillo) && parsePrice(selectedPlatillo.precio_anterior) > parsePrice(selectedPlatillo.precio) && (
                    <span className="text-[9px] font-sans font-bold text-turquesa uppercase tracking-wider">
                      ¡Ahorras ${(parsePrice(selectedPlatillo.precio_anterior) - parsePrice(selectedPlatillo.precio)).toFixed(0)} MXN!
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Selector de Cantidad Ergonómico */}
                <div className="flex justify-between items-center bg-[#F4F0E8] dark:bg-carbon p-2.5 sm:p-3 rounded-xl border border-arena/20">
                  <span className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena">Porciones:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                      className="w-8 h-8 rounded-lg bg-arena/30 text-negro dark:bg-negro dark:text-blanco flex items-center justify-center font-bold text-base hover:bg-coral hover:text-white transition-colors"
                    >
                      -
                    </button>
                    <span className="font-display text-xl sm:text-2xl px-1 text-negro dark:text-blanco">{itemQty}</span>
                    <button
                      type="button"
                      onClick={() => setItemQty(itemQty + 1)}
                      className="w-8 h-8 rounded-lg bg-turquesa text-negro flex items-center justify-center font-bold text-base hover:bg-blanco transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Selector de Nivel de Picor en Grid de 2 Columnas */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans uppercase font-bold text-turquesa tracking-wider flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-coral" />
                    <span>Nivel de Picor *</span>
                  </label>

                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {PICOR_OPTIONS.map((picor) => (
                      <button
                        key={picor.id}
                        type="button"
                        onClick={() => setItemPicor(picor.id)}
                        className={`p-2 sm:p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${itemPicor === picor.id
                          ? `${picor.color} shadow-md ring-1 ring-turquesa`
                          : 'bg-[#F4F0E8] dark:bg-carbon border-arena/20 text-negro/80 dark:text-arena/70 hover:border-turquesa/40'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-sans font-bold text-xs text-negro dark:text-blanco truncate">
                            {picor.label}
                          </span>
                          {renderFlames(picor.flames)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notas de Preparación Compactas */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90">
                    Notas de Preparación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Sin cebolla morada, extra pepino..."
                    value={itemNotas}
                    onChange={(e) => setItemNotas(e.target.value)}
                    className="bg-[#F4F0E8] dark:bg-carbon border border-arena/20 rounded-xl px-3 py-2 text-xs md:text-sm text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* BOTÓN AGREGAR SIEMPRE ACCESIBLE Y ERGONÓMICO */}
            <button
              type="button"
              onClick={handleAddConfiguredItem}
              className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(42,191,191,0.3)] mt-3 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>AGREGAR AL PEDIDO (${(selectedPlatillo.precio * itemQty).toFixed(0)} MXN)</span>
            </button>
          </div>
        </div>
      )}
      {/* MODAL DE RESTAURANTE CERRADO DARK LUXURY */}
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
