'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
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
  ArrowRight,
  UtensilsCrossed,
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

// LISTA DE INGREDIENTES EXCLUIBLES / MODIFICADORES SEGÚN TIPO DE PLATILLO
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

  // Detectar menciones explícitas en la descripción
  if (desc.includes('cebolla') && !list.includes('Cebolla morada')) list.push('Cebolla morada')
  if (desc.includes('pepino') && !list.includes('Pepino')) list.push('Pepino')
  if (desc.includes('cilantro') && !list.includes('Cilantro')) list.push('Cilantro')
  if (desc.includes('jitomate') && !list.includes('Jitomate')) list.push('Jitomate')
  if (desc.includes('aguacate') && !list.includes('Aguacate')) list.push('Aguacate')

  return Array.from(new Set(list))
}

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
          <Loader2 className="w-6 h-6 text-turquesa animate-spin" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        priority
        onLoad={() => {
          globalLoadedImages.add(src)
          setLoaded(true)
        }}
        className={`object-cover object-center transition-all duration-500 ease-out select-none ${
          loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'
        }`}
        sizes="(max-width: 640px) 100vw, 600px"
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
  const isCartLoaded = useRef(false)

  // Inicializar comanda vacía para evitar desajustes SSR
  const [cart, setCart] = useState<ConfiguredCartItem[]>([])

  // Función para cambiar de paso y registrarlo en el historial del navegador
  const goToStep = (targetStep: 1 | 2 | 3 | 4, pushHistory = true) => {
    if (pushHistory && typeof window !== 'undefined' && targetStep !== currentStep) {
      window.history.pushState({ step: targetStep }, '', '')
    }
    setCurrentStep(targetStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Cargar comanda guardada en localStorage tras el montaje del cliente de forma segura
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
      } catch (e) {
        console.warn('Error al leer comanda guardada:', e)
      }
    }
    isCartLoaded.current = true
    setIsMounted(true)
  }, [])

  // Sincronizar automáticamente cualquier modificación del carrito en localStorage (solo después de haber cargado el estado previo)
  useEffect(() => {
    if (!isCartLoaded.current || typeof window === 'undefined') return
    try {
      localStorage.setItem('marea_cart_items', JSON.stringify(cart))
    } catch (e) {
      console.warn('Error al persistir carrito:', e)
    }
  }, [cart])

  // Soporte para botón "Atrás" físico / gestos del navegador móvil
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Registrar estado inicial en el historial
    window.history.replaceState({ step: 1 }, '', '')

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && typeof e.state.step === 'number') {
        setCurrentStep(e.state.step as 1 | 2 | 3 | 4)
      } else {
        setCurrentStep(1)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Modal para configurar platillo individual
  const [selectedPlatillo, setSelectedPlatillo] = useState<Platillo | null>(null)
  const [itemQty, setItemQty] = useState<number>(1)
  const [itemPicor, setItemPicor] = useState<NivelPicor>('medio')
  const [itemNotas, setItemNotas] = useState<string>('')
  const [itemSinIngredientes, setItemSinIngredientes] = useState<string[]>([])

  const searchParams = useSearchParams()
  const urlMesaNombre = searchParams?.get('mesa') || ''
  const urlMesaId = searchParams?.get('mesa_id') ? parseInt(searchParams.get('mesa_id')!, 10) : undefined

  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [tipoEntrega, setTipoEntrega] = useState<'local' | 'didi' | 'mesa'>(() => (urlMesaNombre ? 'mesa' : 'local'))
  const [mesaNombre, setMesaNombre] = useState(urlMesaNombre)
  const [mesaId, setMesaId] = useState<number | undefined>(urlMesaId)
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
      const activePhone = clienteTelefono || localStorage.getItem('marea_cliente_telefono') || ''

      getAvailableCuponesPublic(activePhone).then((sysCoupons) => {
        setUserAvailableCoupons(sysCoupons || [])
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
    setItemSinIngredientes([])
  }

  // Alternar modificador de ingrediente a excluir
  const toggleSinIngrediente = (ingrediente: string) => {
    setItemSinIngredientes((prev) =>
      prev.includes(ingrediente)
        ? prev.filter((i) => i !== ingrediente)
        : [...prev, ingrediente]
    )
  }

  // Agregar platillo configurado a la comanda (agrupando productos con misma configuración)
  const handleAddConfiguredItem = () => {
    if (!selectedPlatillo) return

    const cleanNotas = itemNotas.trim()
    const sortedSin = [...itemSinIngredientes].sort()

    setCart((prev) => {
      // Buscar si ya existe el mismo platillo con el mismo nivel de picor, mismos ingredientes retirados y notas
      const existingIndex = prev.findIndex(
        (item) =>
          item.platillo.id === selectedPlatillo.id &&
          item.nivelPicor === itemPicor &&
          (item.sinIngredientes || []).slice().sort().join(',') === sortedSin.join(',') &&
          item.notasItem.trim().toLowerCase() === cleanNotas.toLowerCase()
      )

      if (existingIndex > -1) {
        // Agrupar e incrementar cantidad
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          cantidad: updated[existingIndex].cantidad + itemQty,
        }
        return updated
      }

      // Si es una configuración nueva, agregar como nuevo item
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
    if (!codeToApply || !codeToApply.trim()) return

    // Si el pedido tiene solo productos de promoción/combos, no se puede redimir cupón
    if (cart.length > 0 && regularSubtotal === 0) {
      setCouponError('Los cupones de descuento no aplican en pedidos con solo productos en promoción o combos. Agrega al menos un platillo regular a tu pedido.')
      return
    }

    setCuponInput(codeToApply)
    setIsValidatingCoupon(true)
    setCouponError(null)

    try {
      const activePhone = clienteTelefono || (typeof window !== 'undefined' ? localStorage.getItem('marea_cliente_telefono') || '' : '')
      const res = await validateCuponAction(codeToApply, activePhone)
      if (res.valid) {
        if (res.descuento_porcentaje && regularSubtotal === 0 && !res.producto_regalo) {
          setCouponError('Los cupones de descuento no aplican en pedidos con solo productos en promoción o combos. Agrega al menos un platillo regular.')
          setDiscountPercent(0)
          setFixedDiscount(0)
          setAppliedCoupon(null)
          return
        }

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

  // Si el usuario modifica el carrito y se queda con puros productos de promo, desaplicar cupón y avisar
  useEffect(() => {
    if (appliedCoupon && cart.length > 0 && regularSubtotal === 0 && !appliedGiftProduct) {
      setAppliedCoupon(null)
      setDiscountPercent(0)
      setCouponError('El cupón se desaplicó porque tu pedido ahora contiene únicamente productos en promoción.')
    }
  }, [regularSubtotal, appliedCoupon, appliedGiftProduct, cart.length])

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

      const res = await createPublicPedido({
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono,
        tipo_entrega: tipoEntrega,
        mesa_id: tipoEntrega === 'mesa' ? mesaId : undefined,
        mesa_nombre: tipoEntrega === 'mesa' ? (mesaNombre || 'Mesa Salón') : undefined,
        metodo_pago: metodoPago,
        hora_recogida: horaRecogida === 'lo_antes_posible' ? undefined : (horaRecogida || undefined),
        notas: `${tipoEntrega === 'mesa' ? `[Mesa: ${mesaNombre || 'Salón'}] ` : ''}${notasGenerales ? `${notasGenerales} ` : ''}${appliedCoupon ? `[Cupón: ${appliedCoupon} -${discountPercent}%]` : ''}`.trim(),
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
      .map((i) => {
        const sinTxt = i.sinIngredientes && i.sinIngredientes.length > 0 ? ` | Sin: ${i.sinIngredientes.join(', ')}` : ''
        const notaTxt = i.notasItem ? ` | Nota: ${i.notasItem}` : ''
        return `- ${i.platillo.nombre} x${i.cantidad} ($${(i.platillo.precio * i.cantidad).toFixed(0)}) [Picor: ${i.nivelPicor}${sinTxt}${notaTxt}]`
      })
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
      {/* HEADER DE STEPPER (SIN LOGO, MÍNIMALISTA Y FOCALIZADO) */}
      <header className="sticky top-0 z-40 bg-[#F4F0E8]/95 dark:bg-negro/95 backdrop-blur-md border-b border-arena/30 dark:border-arena/10 px-4 sm:px-6 py-3 safe-header transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-xs sm:text-sm font-sans font-bold text-negro/80 dark:text-arena/80 hover:text-coral flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-arena/20 dark:hover:bg-carbon border border-arena/20 dark:border-arena/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Volver al Menú</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <UserHeaderBadge />
            </div>
            <ThemeToggle />
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
      <div className="bg-white dark:bg-carbon border-b border-arena/30 dark:border-arena/10 px-4 py-3.5 transition-colors">
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
                  goToStep(item.step as any)
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
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 w-full flex-1">
        {/* PASO 1: SELECCIÓN Y CONFIGURACIÓN DE PLATILLOS ESTILO DELIVERY / RAPPI */}
        {currentStep === 1 && (
          <div className={`flex flex-col gap-6 ${isMounted && totalItemCount > 0 ? 'pb-24 sm:pb-28' : ''}`}>
            
            {/* Header del menú */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-sans font-bold tracking-widest text-turquesa uppercase">
                PASO 1 · SELECCIONA TUS PLATILLOS
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-negro dark:text-blanco tracking-wide">
                MENÚ DE MARISCOS & COCTELES
              </h2>
              <p className="font-sans text-xs sm:text-sm text-negro/70 dark:text-arena/70">
                Toca cualquier platillo para personalizar ingredientes, picor y notas para el chef.
              </p>
            </div>

            {/* BARRA DE NAVEGACIÓN RÁPIDA POR CATEGORÍAS (PILL BAR TIPO RAPPI) */}
            <div className="sticky top-[57px] z-30 -mx-4 md:-mx-6 px-4 md:px-6 py-2.5 bg-[#F4F0E8]/95 dark:bg-negro/95 backdrop-blur-md border-y border-arena/20 dark:border-arena/10 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-xs">
              {promoPlatillos.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('sec-ofertas')
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-sans font-bold bg-coral/15 border border-coral/30 text-coral hover:bg-coral hover:text-blanco transition-all flex items-center gap-1 shrink-0"
                >
                  <Flame className="w-3.5 h-3.5 fill-coral" />
                  <span>Ofertas de Hoy</span>
                </button>
              )}

              {categorias.map((cat) => {
                const count = platillosNormales.filter((p) => p.categoria_id === cat.id).length
                if (count === 0) return null

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`sec-cat-${cat.id}`)
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-sans font-bold bg-white dark:bg-carbon border border-arena/30 dark:border-arena/15 text-negro/80 dark:text-arena/80 hover:border-turquesa hover:text-turquesa transition-all shrink-0 shadow-xs"
                  >
                    <span>{cat.nombre}</span>
                  </button>
                )
              })}
            </div>

            {/* SECCIÓN ESPECIAL DE PROMOCIONES DEL DÍA */}
            {promoPlatillos.length > 0 && (
              <section id="sec-ofertas" className="flex flex-col gap-3 scroll-mt-28">
                <div className="flex items-center gap-2 border-b border-coral/30 pb-2">
                  <span className="font-sans text-xs font-bold text-coral tracking-widest uppercase bg-coral/10 border border-coral/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Flame className="w-3.5 h-3.5 fill-coral animate-pulse" />
                    <span>OFERTAS</span>
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl text-negro dark:text-blanco tracking-wide">
                    PROMOCIONES DEL DÍA
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {promoPlatillos.map((platillo) => {
                    const bannerText = getPromoBannerText(platillo)
                    const pActual = parsePrice(platillo.precio)
                    const pAnterior = parsePrice(platillo.precio_anterior)
                    const qtyInCart = cart
                      .filter((item) => item.platillo.id === platillo.id)
                      .reduce((sum, item) => sum + item.cantidad, 0)

                    return (
                      <div
                        key={platillo.id}
                        onClick={() => handleOpenCustomizeModal(platillo)}
                        className="bg-white dark:bg-[#080605] border-2 border-coral/30 hover:border-coral rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3.5 group relative"
                      >
                        {/* Info platillo */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-sans font-extrabold uppercase text-coral bg-coral/10 px-2 py-0.5 rounded-md border border-coral/20 self-start flex items-center gap-1">
                              <Flame className="w-3 h-3 fill-coral" />
                              <span>{bannerText}</span>
                            </span>

                            <h4 className="font-sans font-bold text-sm sm:text-base text-negro dark:text-blanco group-hover:text-coral transition-colors line-clamp-1 sm:line-clamp-2">
                              {platillo.nombre}
                            </h4>

                            {platillo.descripcion && (
                              <p className="font-sans text-xs sm:text-sm text-negro/65 dark:text-arena/70 line-clamp-2 leading-snug">
                                {platillo.descripcion}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-baseline gap-2 mt-2 pt-1">
                            <span className="font-display text-2xl sm:text-3xl text-coral tracking-tight">
                              ${formatPrice(pActual)} <span className="text-[10px] sm:text-xs font-sans text-negro/60 dark:text-arena">MXN</span>
                            </span>
                            {pAnterior > pActual && (
                              <span className="font-display text-sm sm:text-base text-negro/40 dark:text-arena/40 line-through">
                                ${formatPrice(pAnterior)}
                              </span>
                            )}
                            {qtyInCart > 0 && (
                              <span className="text-[10px] font-sans font-bold text-turquesa bg-turquesa/10 border border-turquesa/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>{qtyInCart} en comanda</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Foto y botón flotante de agregar */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[#EBE5D8] dark:bg-carbon shrink-0 shadow-inner">
                          {platillo.imagen_url ? (
                            <StepperDishImage src={platillo.imagen_url} alt={platillo.nombre} />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-dots-pattern text-coral/40 gap-1 p-2">
                              <Flame className="w-6 h-6 text-coral/50" />
                              <span className="text-[9px] font-sans font-bold text-arena/60 uppercase text-center leading-tight">Marea Negra</span>
                            </div>
                          )}

                          <div className="absolute bottom-1.5 right-1.5">
                            <div className="bg-coral text-blanco font-sans font-bold text-[11px] p-1.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-full shadow-lg flex items-center gap-1 transition-transform group-hover:scale-105 active:scale-90 border border-white/60 dark:border-black/60">
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              <span className="hidden sm:inline">AGREGAR</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* CATEGORÍAS REGULARES (RENGLONES AGRUPADOS POR SECCIÓN) */}
            {categorias.map((cat) => {
              const catDishes = platillosNormales.filter((p) => p.categoria_id === cat.id)
              if (catDishes.length === 0) return null

              return (
                <section key={cat.id} id={`sec-cat-${cat.id}`} className="flex flex-col gap-3 scroll-mt-28">
                  <div className="flex items-center justify-between border-b border-arena/25 dark:border-arena/10 pb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-2xl sm:text-3xl text-negro dark:text-blanco tracking-wide">
                        {cat.nombre.toUpperCase()}
                      </h3>
                      <span className="text-xs font-sans font-semibold text-negro/50 dark:text-arena/50">
                        ({catDishes.length})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {catDishes.map((platillo) => {
                      const pActual = parsePrice(platillo.precio)
                      const qtyInCart = cart
                        .filter((item) => item.platillo.id === platillo.id)
                        .reduce((sum, item) => sum + item.cantidad, 0)

                      return (
                        <div
                          key={platillo.id}
                          onClick={() => handleOpenCustomizeModal(platillo)}
                          className="bg-white dark:bg-[#0B0907] border border-arena/25 dark:border-arena/10 hover:border-turquesa/50 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3.5 group relative"
                        >
                          {/* Info platillo */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                            <div className="flex flex-col gap-1">
                              <h4 className="font-sans font-bold text-sm sm:text-base text-negro dark:text-blanco group-hover:text-turquesa transition-colors line-clamp-1 sm:line-clamp-2">
                                {platillo.nombre}
                              </h4>

                              {platillo.descripcion && (
                                <p className="font-sans text-xs sm:text-sm text-negro/65 dark:text-arena/70 line-clamp-2 leading-snug">
                                  {platillo.descripcion}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-baseline gap-2 mt-2 pt-1">
                              <span className="font-display text-2xl sm:text-3xl text-coral tracking-tight">
                                ${formatPrice(pActual)} <span className="text-[10px] sm:text-xs font-sans text-negro/60 dark:text-arena">MXN</span>
                              </span>
                              {qtyInCart > 0 && (
                                <span className="text-[10px] font-sans font-bold text-turquesa bg-turquesa/10 border border-turquesa/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>{qtyInCart} en comanda</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Foto cuadrada y botón de agregar */}
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[#EBE5D8] dark:bg-carbon shrink-0 shadow-inner">
                            {platillo.imagen_url ? (
                              <StepperDishImage src={platillo.imagen_url} alt={platillo.nombre} />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-dots-pattern text-turquesa/40 gap-1 p-2">
                                <Flame className="w-6 h-6 text-turquesa/50" />
                                <span className="text-[9px] font-sans font-bold text-arena/60 uppercase text-center leading-tight">Marea Negra</span>
                              </div>
                            )}

                            <div className="absolute bottom-1.5 right-1.5">
                              <div className="bg-turquesa hover:bg-blanco text-negro font-sans font-bold text-[11px] p-1.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-full shadow-lg flex items-center gap-1 transition-transform group-hover:scale-105 active:scale-90 border border-white/80 dark:border-black/60">
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                <span className="hidden sm:inline">AGREGAR</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
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

                      {/* Detalles de Picor, Modificadores e Instrucciones */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-arena/20 dark:border-arena/10 text-xs font-sans">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold flex items-center gap-1 ${picorInfo?.color}`}>
                            {renderFlames(picorInfo?.flames || 0)}
                            <span>Picor: {picorInfo?.label}</span>
                          </span>

                          {item.sinIngredientes && item.sinIngredientes.map((sinIng) => (
                            <span
                              key={sinIng}
                              className="px-2 py-0.5 rounded-full bg-coral/15 border border-coral/30 text-coral text-[11px] font-bold flex items-center gap-1"
                            >
                              <X className="w-3 h-3 text-coral" />
                              <span>Sin {sinIng}</span>
                            </span>
                          ))}
                        </div>

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
                    onClick={() => goToStep(1)}
                    className="w-full sm:w-auto bg-white dark:bg-carbon text-negro dark:text-blanco hover:bg-arena/20 border border-arena/30 dark:border-arena/20 font-sans font-bold text-xs md:text-sm px-6 py-3.5 rounded-full transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>AGREGAR MÁS PLATILLOS</span>
                  </button>

                  <button
                    onClick={() => goToStep(3)}
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
                  onClick={() => goToStep(1)}
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
              <div className="flex flex-col gap-2 mt-1">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-turquesa" />
                  <span>Método de Entrega</span>
                </label>

                <div className={`grid gap-2 ${urlMesaNombre || tipoEntrega === 'mesa' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
                  {(urlMesaNombre || tipoEntrega === 'mesa') && (
                    <button
                      type="button"
                      onClick={() => setTipoEntrega('mesa')}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        tipoEntrega === 'mesa'
                          ? 'border-coral bg-coral/10 text-coral shadow-sm ring-1 ring-coral/30'
                          : 'border-arena/30 dark:border-arena/20 bg-[#F4F0E8] dark:bg-carbon text-negro dark:text-blanco hover:border-coral/40'
                      }`}
                    >
                      <span className="text-xl shrink-0">🍽️</span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-sans font-bold text-xs leading-tight">
                          {mesaNombre ? mesaNombre : 'Comer en Mesa'}
                        </span>
                        <span className="text-[10px] text-negro/60 dark:text-arena/60 truncate">
                          Servicio en salón
                        </span>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setTipoEntrega('local')}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      tipoEntrega === 'local'
                        ? 'border-turquesa bg-turquesa/10 text-turquesa shadow-sm ring-1 ring-turquesa/30'
                        : 'border-arena/30 dark:border-arena/20 bg-[#F4F0E8] dark:bg-carbon text-negro dark:text-blanco hover:border-turquesa/40'
                    }`}
                  >
                    <span className="text-xl shrink-0">🚗</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans font-bold text-xs leading-tight">
                        Recoger en Local
                      </span>
                      <span className="text-[10px] text-negro/60 dark:text-arena/60 truncate">
                        Paso por mi pedido
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoEntrega('didi')}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      tipoEntrega === 'didi'
                        ? 'border-oro bg-oro/10 text-[#967420] dark:text-oro shadow-sm ring-1 ring-oro/30'
                        : 'border-arena/30 dark:border-arena/20 bg-[#F4F0E8] dark:bg-carbon text-negro dark:text-blanco hover:border-oro/40'
                    }`}
                  >
                    <span className="text-xl shrink-0">🛵</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans font-bold text-xs leading-tight">
                        Envío DiDi / Uber
                      </span>
                      <span className="text-[10px] text-negro/60 dark:text-arena/60 truncate">
                        Pago de viaje al chofer
                      </span>
                    </div>
                  </button>
                </div>

                {tipoEntrega === 'didi' && (
                  <div className="bg-oro/10 border border-oro/30 rounded-xl p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-oro shrink-0 mt-0.5" />
                    <span className="text-[11px] font-sans text-negro dark:text-arena/90 leading-relaxed">
                      Especifica tu dirección en las <b>Notas Especiales</b> abajo. El costo del viaje lo pagas en efectivo al chofer.
                    </span>
                  </div>
                )}
                {tipoEntrega === 'mesa' && (
                  <div className="bg-coral/10 border border-coral/30 rounded-xl p-2.5 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-coral shrink-0" />
                    <span className="text-[11px] font-sans text-coral font-medium">
                      📍 Pedido para <strong>{mesaNombre || 'Mesa en Salón'}</strong>. Servicio directo a tu mesa.
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

              {/* SECCIÓN DE CUPÓN DE DESCUENTO */}
              <div className="flex flex-col gap-2 pt-2 border-t border-arena/20 dark:border-arena/10">
                <label className="text-xs font-sans uppercase font-bold text-turquesa flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-turquesa" />
                  <span>Cupón o Código de Descuento</span>
                </label>

                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej. BIENVENIDO10"
                      value={cuponInput}
                      onChange={(e) => setCuponInput(e.target.value)}
                      className="flex-1 bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl px-3.5 py-2.5 text-sm text-negro dark:text-blanco uppercase font-mono tracking-wider focus:border-turquesa focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !cuponInput.trim()}
                      className="bg-turquesa text-negro font-sans font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-turquesa/80 transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                    >
                      {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'APLICAR'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-negro dark:text-blanco uppercase tracking-wider truncate">
                            {appliedCoupon}
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-sans font-bold px-2 py-0.5 rounded-full shrink-0">
                            -{discountPercent}% OFF
                          </span>
                        </div>
                        <span className="text-[11px] font-sans text-emerald-600 dark:text-emerald-400 font-medium">
                          Ahorras ${discountAmount.toFixed(0)} MXN en este pedido
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null)
                        setDiscountPercent(0)
                        setCuponInput('')
                      }}
                      title="Eliminar cupón"
                      aria-label="Eliminar cupón"
                      className="p-2 text-coral/80 hover:text-coral hover:bg-coral/10 rounded-lg transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Chips de cupones disponibles para fácil clic */}
                {userAvailableCoupons.length > 0 && !appliedCoupon && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-[10px] font-sans uppercase font-bold text-negro/50 dark:text-arena/50 tracking-wider">
                      Cupones disponibles para ti:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {userAvailableCoupons.map((coupon) => (
                        <button
                          key={coupon.codigo}
                          type="button"
                          onClick={() => handleApplySpecificCoupon(coupon.codigo)}
                          className={`text-[11px] font-sans font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                            coupon.tipo === 'lealtad'
                              ? 'bg-oro/10 border-oro/40 text-[#967420] dark:text-oro hover:bg-oro/20'
                              : 'bg-turquesa/10 border-turquesa/40 text-turquesa hover:bg-turquesa/20'
                          }`}
                        >
                          <span>{coupon.tipo === 'lealtad' ? '🏆' : '🎟️'}</span>
                          <span className="font-mono uppercase">{coupon.codigo}</span>
                          <span className="opacity-80">(-{coupon.descuento}%)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {couponError && (
                  <div className="bg-coral/10 border border-coral/30 rounded-xl p-2.5 flex items-center gap-2 text-coral text-xs font-sans animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{couponError}</span>
                  </div>
                )}

                {cart.length > 0 && regularSubtotal === 0 && !couponError && (
                  <div className="bg-arena/10 border border-arena/20 rounded-xl p-2.5 flex items-center gap-2 text-negro/70 dark:text-arena/70 text-[11px] font-sans">
                    <span className="text-base shrink-0">ℹ️</span>
                    <span>Tu pedido contiene promociones/combos. Los cupones aplican en platillos a precio regular.</span>
                  </div>
                )}
              </div>

              {/* NOTAS GENERALES */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena/90 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-turquesa" />
                  <span>Notas Especiales o Instrucciones</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Tostadas extras, servilletas, referencia de entrega..."
                  value={notasGenerales}
                  onChange={(e) => setNotasGenerales(e.target.value)}
                  className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl p-3 text-sm text-negro dark:text-blanco focus:border-turquesa focus:outline-none transition-colors resize-none placeholder:text-negro/40 dark:placeholder:text-arena/40"
                />
              </div>

              {/* RESUMEN DE TOTAL FINAL CON DESGLOSE ELEGANTE */}
              <div className="bg-[#F4F0E8] dark:bg-carbon rounded-2xl p-4 border border-arena/30 dark:border-arena/20 mt-1 flex flex-col gap-3 shadow-md">
                <div className="flex items-center justify-between text-xs font-sans font-bold uppercase tracking-wider text-negro/60 dark:text-arena/60 pb-2 border-b border-arena/20 dark:border-arena/10">
                  <span>Resumen del Pedido</span>
                  <span className="text-negro dark:text-blanco">
                    {cart.reduce((s, i) => s + i.cantidad, 0)} {cart.reduce((s, i) => s + i.cantidad, 0) === 1 ? 'platillo' : 'platillos'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-xs font-sans">
                  <div className="flex justify-between items-center text-negro/80 dark:text-arena/80">
                    <span>Subtotal de la Comanda</span>
                    <span className="font-semibold text-negro dark:text-blanco">${rawSubtotal.toFixed(0)} MXN</span>
                  </div>

                  {hasPromoInCart && (
                    <div className="flex justify-between items-center text-coral bg-coral/10 px-2.5 py-1 rounded-lg border border-coral/20 text-[11px]">
                      <span>🔥 Promociones / Combos aplicados</span>
                      <span className="font-bold">${promoSubtotal.toFixed(0)} MXN</span>
                    </div>
                  )}

                  {discountPercent > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Descuento Cupón {appliedCoupon ? `(${appliedCoupon})` : ''}</span>
                      </span>
                      <span className="font-bold">
                        {regularSubtotal > 0 ? `-$${percentDiscountAmount.toFixed(0)} MXN` : '$0 MXN'}
                      </span>
                    </div>
                  )}

                  {fixedDiscount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Descuento Promocional Fijo</span>
                      <span className="font-bold">-${fixedDiscount.toFixed(0)} MXN</span>
                    </div>
                  )}
                </div>

                {/* Fila Total */}
                <div className="pt-3 border-t border-arena/30 dark:border-arena/15 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-negro/60 dark:text-arena/60 block">
                      Total a Pagar
                    </span>
                    {discountAmount > 0 ? (
                      <span className="text-[11px] font-sans font-bold text-emerald-600 dark:text-emerald-400">
                        ¡Ahorras ${discountAmount.toFixed(0)} MXN! 🎉
                      </span>
                    ) : (
                      <span className="text-[10px] font-sans italic text-negro/50 dark:text-arena/50">
                        Mariscos frescos de Sinaloa
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl sm:text-4xl text-oro tracking-tight">
                      ${totalOrderPrice.toFixed(0)}
                    </span>
                    <span className="text-xs font-sans font-bold text-negro/60 dark:text-arena/60">
                      MXN
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex flex-col gap-3 mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-coral text-blanco font-sans font-bold text-sm tracking-wider py-4 rounded-xl hover:bg-coral/90 transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(232,67,10,0.35)] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>GENERANDO COMANDA...</span>
                    </>
                  ) : (
                    <>
                      <span>CONFIRMAR PEDIDO</span>
                      <span className="opacity-80">·</span>
                      <span>${totalOrderPrice.toFixed(0)} MXN</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full text-center py-2 text-xs font-sans font-semibold text-negro/60 dark:text-arena/60 hover:text-coral transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Modificar comanda</span>
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

      {/* MODAL PARA CONFIGURAR PLATILLO CON VISTA DE IMAGEN GRANDE Y COMPLETA TIPO DELIVERY */}
      {selectedPlatillo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white text-negro dark:bg-[#0A0908] dark:text-blanco border-t sm:border border-arena/30 dark:border-oro/30 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[92vh] overflow-hidden flex flex-col">
            
            {/* BOTÓN CERRAR FLOTANTE ESTILO GLASSMORPHISM */}
            <button
              onClick={() => setSelectedPlatillo(null)}
              className="absolute top-3.5 right-3.5 z-30 p-2 text-white hover:text-coral rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md transition-colors border border-white/20 shadow-lg active:scale-90"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* CONTENEDOR CON SCROLL INTERNO PARA TODO EL CONTENIDO */}
            <div className="overflow-y-auto flex-1 flex flex-col">
              {/* IMAGEN GRANDE Y COMPLETA (HERO BANNER) */}
              {selectedPlatillo.imagen_url ? (
                <div className="relative w-full h-64 sm:h-80 bg-[#EBE5D8] dark:bg-carbon shrink-0 overflow-hidden">
                  <ModalDishImage src={selectedPlatillo.imagen_url} alt={selectedPlatillo.nombre} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
                  
                  {isPromoActiveToday(selectedPlatillo) && (
                    <span className="absolute bottom-3.5 left-4 z-10 text-[10px] font-sans font-extrabold tracking-wider uppercase border border-coral/40 text-blanco bg-coral px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 fill-blanco animate-pulse" />
                      <span>{getPromoBannerText(selectedPlatillo)}</span>
                    </span>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-40 bg-gradient-to-br from-[#EBE5D8] to-arena/20 dark:from-carbon dark:to-negro flex flex-col items-center justify-center gap-2 border-b border-arena/20 dark:border-arena/10 shrink-0">
                  <Flame className="w-10 h-10 text-coral/60 animate-pulse" />
                  <span className="font-display text-lg text-negro/60 dark:text-arena/70 tracking-wider uppercase">
                    Marea Negra
                  </span>
                </div>
              )}

              {/* DETALLES Y FORMULARIO DE PERSONALIZACIÓN */}
              <div className="p-5 sm:p-6 flex flex-col gap-4">
                {/* CABECERA CON TÍTULO, DESCRIPCIÓN Y PRECIO */}
                <div className="flex flex-col gap-1.5 border-b border-arena/20 dark:border-arena/10 pb-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      {!selectedPlatillo.imagen_url && isPromoActiveToday(selectedPlatillo) && (
                        <span className="text-[10px] font-sans font-bold tracking-widest text-coral uppercase block mb-1">
                          🔥 {getPromoBannerText(selectedPlatillo)}
                        </span>
                      )}
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
                        <span className="text-[10px] font-sans font-bold text-turquesa uppercase tracking-wider">
                          ¡Ahorras ${(parsePrice(selectedPlatillo.precio_anterior) - parsePrice(selectedPlatillo.precio)).toFixed(0)} MXN!
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedPlatillo.descripcion && (
                    <p className="font-sans text-xs sm:text-sm text-negro/70 dark:text-arena/80 leading-relaxed mt-1">
                      {selectedPlatillo.descripcion}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {/* Selector de Cantidad Ergonómico */}
                  <div className="flex justify-between items-center bg-[#F4F0E8] dark:bg-carbon p-3 rounded-2xl border border-arena/20">
                    <span className="text-xs font-sans uppercase font-bold text-negro/80 dark:text-arena">Porciones:</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                        className="w-9 h-9 rounded-xl bg-arena/30 text-negro dark:bg-negro dark:text-blanco flex items-center justify-center font-bold text-lg hover:bg-coral hover:text-white transition-colors active:scale-95"
                      >
                        -
                      </button>
                      <span className="font-display text-2xl px-2 text-negro dark:text-blanco">{itemQty}</span>
                      <button
                        type="button"
                        onClick={() => setItemQty(itemQty + 1)}
                        className="w-9 h-9 rounded-xl bg-turquesa text-negro flex items-center justify-center font-bold text-lg hover:bg-blanco transition-colors active:scale-95 shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Selector de Nivel de Picor */}
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sans font-bold text-negro dark:text-blanco flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-coral" />
                        <span>Nivel de Picor</span>
                      </span>
                      <span className="text-[10px] font-sans font-bold text-turquesa uppercase tracking-wider">
                        Requerido
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {PICOR_OPTIONS.map((picor) => {
                        const isSelected = itemPicor === picor.id
                        return (
                          <button
                            key={picor.id}
                            type="button"
                            onClick={() => setItemPicor(picor.id)}
                            className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col gap-0.5 transition-all active:scale-95 ${
                              isSelected
                                ? `${picor.color} shadow-sm ring-2 ring-turquesa/50 font-bold`
                                : 'bg-[#F4F0E8] dark:bg-[#12100E] border-arena/25 dark:border-arena/15 text-negro/80 dark:text-arena/70 hover:border-turquesa/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-sans text-xs sm:text-sm text-negro dark:text-blanco truncate">
                                {picor.label}
                              </span>
                              {renderFlames(picor.flames)}
                            </div>
                            <span className="text-[10px] font-sans opacity-70 truncate font-normal">
                              {picor.desc}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Selector de Modificadores / Ingredientes a excluir estilo Rappi / Delivery Checklist */}
                  {selectedPlatillo && getPlatilloIngredients(selectedPlatillo).length > 0 && (
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-sans font-bold text-negro dark:text-blanco">
                            ¿Deseas quitar algún ingrediente?
                          </span>
                          <span className="text-[11px] font-sans text-negro/50 dark:text-arena/60">
                            Opcional · Selecciona solo lo que prefieras omitir
                          </span>
                        </div>
                        {itemSinIngredientes.length > 0 && (
                          <span className="text-[10px] font-sans font-bold text-coral bg-coral/10 border border-coral/30 px-2.5 py-0.5 rounded-full shrink-0">
                            {itemSinIngredientes.length} {itemSinIngredientes.length === 1 ? 'exclusión' : 'exclusiones'}
                          </span>
                        )}
                      </div>

                      <div className="bg-[#F4F0E8] dark:bg-[#12100E] rounded-2xl border border-arena/30 dark:border-arena/15 divide-y divide-arena/20 dark:divide-arena/10 overflow-hidden shadow-xs">
                        {getPlatilloIngredients(selectedPlatillo).map((ingrediente) => {
                          const isChecked = itemSinIngredientes.includes(ingrediente)
                          return (
                            <div
                              key={ingrediente}
                              onClick={() => toggleSinIngrediente(ingrediente)}
                              className={`flex items-center justify-between p-3 sm:px-4 cursor-pointer transition-colors select-none ${
                                isChecked
                                  ? 'bg-coral/10 dark:bg-coral/15'
                                  : 'hover:bg-arena/15 dark:hover:bg-carbon'
                              }`}
                            >
                              <span className={`text-xs sm:text-sm font-sans ${
                                isChecked
                                  ? 'font-bold text-coral dark:text-coral'
                                  : 'font-medium text-negro/80 dark:text-arena/90'
                              }`}>
                                Sin {ingrediente}
                              </span>

                              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                isChecked
                                  ? 'bg-coral border-coral text-blanco shadow-xs'
                                  : 'border-arena/40 dark:border-arena/30 bg-white dark:bg-carbon'
                              }`}>
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notas de Preparación */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className="text-xs font-sans font-bold text-negro/80 dark:text-arena/90">
                      Instrucciones especiales para cocina
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Salsa extra aparte, poco limón, etc."
                      value={itemNotas}
                      onChange={(e) => setItemNotas(e.target.value)}
                      className="bg-[#F4F0E8] dark:bg-[#12100E] border border-arena/30 dark:border-arena/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-negro dark:text-blanco focus:border-turquesa focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÓN AGREGAR FIJO AL PIE DEL MODAL */}
            <div className="p-4 sm:p-5 bg-[#F4F0E8]/80 dark:bg-carbon/80 backdrop-blur-md border-t border-arena/20 dark:border-arena/10">
              <button
                type="button"
                onClick={handleAddConfiguredItem}
                className="w-full bg-turquesa hover:bg-blanco text-negro font-sans font-bold text-xs sm:text-sm uppercase tracking-wider py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(42,191,191,0.35)] active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>AGREGAR AL PEDIDO · ${(selectedPlatillo.precio * itemQty).toFixed(0)} MXN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARRA FLOTANTE MODERNA DE COMANDA / CHECKOUT EN PASO 1 */}
      {isMounted && totalItemCount > 0 && currentStep === 1 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 pointer-events-none animate-in slide-in-from-bottom-5 duration-300">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <div className="bg-white/95 dark:bg-[#0C0806]/95 backdrop-blur-xl border border-turquesa/40 dark:border-oro/30 rounded-2xl md:rounded-full p-3 sm:p-3.5 px-4 sm:px-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 transition-all ring-1 ring-turquesa/20">
              
              {/* Información y Total */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-turquesa/15 border border-turquesa/30 flex items-center justify-center text-turquesa shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-sm md:text-base text-negro dark:text-blanco">
                        {totalItemCount} {totalItemCount === 1 ? 'platillo' : 'platillos'}
                      </span>
                      {discountAmount > 0 && (
                        <span className="text-[10px] font-sans font-bold text-coral bg-coral/10 px-2 py-0.5 rounded-full border border-coral/20">
                          Desc. aplicado
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-sans text-negro/60 dark:text-arena/70">
                      Listo para ordenar
                    </span>
                  </div>
                </div>

                <div className="text-right sm:text-left flex flex-col sm:border-l sm:border-arena/20 dark:sm:border-arena/10 sm:pl-4">
                  <span className="text-[10px] font-sans uppercase font-bold text-negro/50 dark:text-arena/60">
                    Total Comanda
                  </span>
                  <span className="font-display text-2xl md:text-3xl text-coral tracking-tight leading-none">
                    ${totalOrderPrice.toFixed(0)} <span className="text-xs font-sans text-negro/60 dark:text-arena">MXN</span>
                  </span>
                </div>
              </div>

              {/* Botón CTA a Comanda */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                    try { navigator.vibrate(25) } catch (e) {}
                  }
                  goToStep(2)
                }}
                className="w-full sm:w-auto bg-turquesa hover:bg-blanco text-negro font-sans font-bold text-xs md:text-sm uppercase tracking-wider py-3.5 px-6 rounded-xl md:rounded-full flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(42,191,191,0.4)] hover:shadow-[0_0_30px_rgba(42,191,191,0.6)] transition-all active:scale-95 shrink-0"
              >
                <span>VER COMANDA Y CONTINUAR</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

            </div>
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
