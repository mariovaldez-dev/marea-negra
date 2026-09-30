'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LoyaltyCardPass } from '@/components/loyalty/LoyaltyCardPass'
import { CambiarPasswordModal } from '@/components/auth/CambiarPasswordModal'
import { useWhatsAppSupport } from '@/lib/hooks/useWhatsAppSupport'
import { BrandLogo } from '@/components/ui/BrandLogo'
import {
  getClienteCuentaByTelefono,
  ClientePerfilStats,
  loginClienteConPassword,
  actualizarCumpleanosCliente,
} from '@/lib/actions/clienteCuenta'
import {
  Phone,
  Award,
  ShoppingBag,
  Sparkles,
  ChevronLeft,
  Calendar,
  Gift,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  RotateCcw,
  LogOut,
  Cake,
  Share2,
  KeyRound,
  ExternalLink,
  MessageSquare,
  ArrowRight,
  Ticket,
  Copy,
  Check,
  TrendingUp,
} from 'lucide-react'

export default function MiCuentaPage() {
  const router = useRouter()
  const { openWhatsApp } = useWhatsAppSupport()
  const [telefonoInput, setTelefonoInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [perfil, setPerfil] = useState<ClientePerfilStats | null>(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null)
  const [userCoupons, setUserCoupons] = useState<Array<{ codigo: string; descuento: number; titulo: string; tipo: string }>>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedPhone = localStorage.getItem('marea_cliente_telefono')
    if (savedPhone) {
      cargarPerfil(savedPhone)
    } else {
      setInitialLoadDone(true)
    }

    try {
      const storedCoupons = localStorage.getItem('marea_user_coupons')
      if (storedCoupons) {
        setUserCoupons(JSON.parse(storedCoupons))
      }
    } catch { }
  }, [])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('marea_cliente_telefono')
      localStorage.removeItem('marea_cliente_nombre')
      localStorage.removeItem('marea_club_registered')
    }
    setPerfil(null)
    setTelefonoInput('')
  }

  const cargarPerfil = async (phone: string) => {
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 7) return

    setLoading(true)
    try {
      const data = await getClienteCuentaByTelefono(clean)
      setPerfil(data)
      if (data) {
        localStorage.setItem('marea_cliente_telefono', clean)
      }
    } catch (err) {
      console.error('Error cargando perfil:', err)
    } finally {
      setLoading(false)
      setInitialLoadDone(true)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!telefonoInput || !passwordInput) {
      setErrorMsg('Ingresa tu celular y contraseña.')
      return
    }

    setLoading(true)
    try {
      const res = await loginClienteConPassword(telefonoInput, passwordInput)
      if (res.success && res.cuenta) {
        setPerfil(res.cuenta)
        localStorage.setItem('marea_cliente_telefono', res.cuenta.telefono)
        localStorage.setItem('marea_cliente_nombre', res.cuenta.nombreCliente)
        localStorage.setItem('marea_club_registered', 'true')
      } else {
        setErrorMsg(res.error || 'Credenciales incorrectas.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
      setInitialLoadDone(true)
    }
  }

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCoupon(code)
    setTimeout(() => setCopiedCoupon(null), 2500)
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'nuevo':
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-sans font-bold uppercase rounded-full bg-[#2ABFBF]/10 text-[#2ABFBF] border border-[#2ABFBF]/30">
            Nuevo
          </span>
        )
      case 'preparando':
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-sans font-bold uppercase rounded-full bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30 animate-pulse">
            En Cocina 🦐
          </span>
        )
      case 'listo':
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-sans font-bold uppercase rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            ¡Listo! 🔔
          </span>
        )
      case 'entregado':
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-sans font-bold uppercase rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black">
            Entregado ✓
          </span>
        )
      case 'cancelado':
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-sans font-bold uppercase rounded-full bg-coral/15 text-coral border border-coral/30">
            Cancelado
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-sans uppercase rounded-full bg-black/5 dark:bg-white/10 text-neutral-500">
            {estado}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8F6F0] dark:bg-[#080808] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-coral selection:text-white transition-colors duration-300">
      
      {/* ── 1. HEADER COMPACTO CON ACCIONES ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#080808]/95 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] px-4 sm:px-6 py-2.5 safe-header transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300 hover:text-coral flex items-center gap-1 py-1.5 px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Menú</span>
          </button>

          <BrandLogo size="sm" href="/" />

          <div className="flex items-center gap-1.5">
            {perfil && (
              <>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-[#2ABFBF] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  title="Cambiar contraseña"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-coral rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── 2. CONTENIDO PRINCIPAL ──────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex-1 flex flex-col gap-6">
        
        {/* SKELETON LOADER */}
        {(!initialLoadDone || (loading && !perfil)) && (
          <div className="flex flex-col gap-4 animate-pulse w-full">
            <div className="h-56 bg-black/5 dark:bg-white/5 rounded-[28px]" />
            <div className="h-28 bg-black/5 dark:bg-white/5 rounded-2xl" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-20 bg-black/5 dark:bg-white/5 rounded-2xl" />
              <div className="h-20 bg-black/5 dark:bg-white/5 rounded-2xl" />
              <div className="h-20 bg-black/5 dark:bg-white/5 rounded-2xl" />
            </div>
          </div>
        )}

        {/* ESTADO NO LOGUEADO (LOGIN BENTO) */}
        {initialLoadDone && !loading && !perfil && (
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[32px] p-6 sm:p-10 shadow-sm flex flex-col items-center gap-6 max-w-md mx-auto w-full animate-in fade-in duration-300">
            <div className="p-4 bg-coral/10 border border-coral/20 rounded-2xl text-coral">
              <Award className="w-10 h-10" />
            </div>

            <div className="flex flex-col gap-1.5 w-full text-center">
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#2ABFBF]">
                CLUB DE LEALTAD
              </span>
              <h1 className="font-display text-3xl sm:text-4xl text-neutral-900 dark:text-white">
                INICIAR SESIÓN
              </h1>
              <p className="font-sans text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Accede para ver tu tarjeta digital, tus sellos y cupones de recompensa.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300">
                  Número Celular
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-neutral-400" />
                  </div>
                  <input
                    type="tel"
                    placeholder="6671234567"
                    value={telefonoInput}
                    onChange={(e) => setTelefonoInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-mono text-base rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#2ABFBF]"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-sans font-bold text-neutral-700 dark:text-neutral-300">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsApp(
                        '¡Hola Marea Negra! Olvidé mi contraseña del Club VIP y necesito ayuda para ingresar a mi cuenta.'
                      )
                    }
                    className="text-[11px] font-sans text-[#2ABFBF] hover:underline flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>¿Olvidaste tu clave?</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <ShieldCheck className="w-4 h-4 text-neutral-400" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-sans text-base rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#2ABFBF]"
                    required
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="text-coral text-xs font-sans bg-coral/10 p-3 rounded-2xl border border-coral/20 text-center font-bold">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#2ABFBF] text-black hover:bg-white font-sans font-bold text-xs tracking-wider py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{loading ? 'ACCEDIENDO...' : 'ENTRAR A MI CUENTA'}</span>
              </button>
            </form>

            <div className="w-full border-t border-black/[0.06] dark:border-white/[0.06] pt-5 flex flex-col items-center gap-3">
              <span className="font-sans text-xs text-neutral-500">
                ¿Aún no tienes cuenta del Club?
              </span>
              <button
                onClick={() => router.push('/registro')}
                className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 hover:border-coral font-sans font-bold text-xs tracking-wider py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-coral" />
                <span>ÚNETE GRATIS (10% OFF EN TU PRIMER PEDIDO)</span>
              </button>
            </div>
          </div>
        )}

        {/* DASHBOARD DEL CLIENTE LOGUEADO (MINIMAL BENTO - 0 REPETICIONES) */}
        {perfil && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-300">
            
            {/* 1. TARJETA DIGITAL VIP */}
            <div className="w-full max-w-md mx-auto">
              <LoyaltyCardPass perfil={perfil} />
            </div>

            {/* 2. PROGRESO A LA PRÓXIMA RECOMPENSA */}
            {perfil.lealtadConfig && (
              <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-bold text-coral flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-coral shrink-0" />
                    <span>Próxima recompensa: {perfil.proximaRecompensa || 'Tostada de la Casa'}</span>
                  </span>
                  <span className="text-neutral-500 font-semibold text-[11px] sm:text-xs">
                    {perfil.pedidosFaltantesParaRecompensa && perfil.pedidosFaltantesParaRecompensa > 0
                      ? `Faltan ${perfil.pedidosFaltantesParaRecompensa} pedido(s)`
                      : '¡Lista para canjear!'}
                  </span>
                </div>

                <div className="w-full h-2.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-coral via-[#2ABFBF] to-amber-400 transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        (((perfil.pedidosEntregados || 0) % (perfil.lealtadConfig?.meta1_pedidos || 6)) /
                          (perfil.lealtadConfig?.meta1_pedidos || 6)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* BANNER DE CUMPLEAÑOS (SOLO SI APLICA) */}
            {perfil.esMesCumpleanos && (
              <div className="bg-gradient-to-r from-coral/15 via-[#C9A84C]/15 to-amber-500/15 border border-[#C9A84C]/40 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
                <Cake className="w-5 h-5 text-[#C9A84C] shrink-0" />
                <span className="text-xs font-sans font-bold text-neutral-900 dark:text-amber-200">
                  🎂 ¡Mes de tu cumpleaños! Muestra tu código en caja para tu cortesía especial.
                </span>
              </div>
            )}

            {/* 3. BENTO KPIS COMPACTOS (3 DATOS ÚTILES - CERO REPETICIÓN) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Puntos */}
              <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-sans uppercase text-neutral-400 font-bold">Puntos Acumulados</span>
                  <span className="font-display text-2xl text-neutral-900 dark:text-white mt-0.5">
                    {perfil.puntos || 0} pts
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C]">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              {/* Cumpleaños */}
              <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex flex-col flex-1 pr-2">
                  <span className="text-[10px] font-sans uppercase text-coral font-bold flex items-center gap-1">
                    <span>Cumpleaños</span>
                  </span>
                  {perfil.borndate ? (
                    <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white mt-1">
                      {new Date(`${perfil.borndate}T12:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </span>
                  ) : (
                    <input
                      type="date"
                      onChange={async (e) => {
                        if (!e.target.value) return
                        const res = await actualizarCumpleanosCliente(perfil.telefono, e.target.value)
                        if (res.success) {
                          cargarPerfil(perfil.telefono)
                        }
                      }}
                      className="bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-[11px] rounded-lg px-2 py-1 text-neutral-900 dark:text-white w-full focus:outline-none focus:border-[#2ABFBF] mt-1"
                    />
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center text-coral shrink-0">
                  <Cake className="w-5 h-5" />
                </div>
              </div>

              {/* Cupón Activo 10% OFF */}
              <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-sans uppercase text-[#2ABFBF] font-bold">Cupón 10% OFF</span>
                  <span className="font-mono text-xs font-bold text-coral tracking-wider mt-0.5">
                    {perfil.codigoReferido || `BIENVENIDO-${perfil.nombreCliente.slice(0, 4).toUpperCase()}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCoupon(perfil.codigoReferido || `BIENVENIDO-${perfil.nombreCliente.slice(0, 4).toUpperCase()}`)}
                  className="p-2.5 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#2ABFBF] hover:text-black rounded-xl transition-all active:scale-95 text-neutral-600 dark:text-neutral-300"
                  title="Copiar cupón"
                >
                  {copiedCoupon === (perfil.codigoReferido || `BIENVENIDO-${perfil.nombreCliente.slice(0, 4).toUpperCase()}`) ? (
                    <Check className="w-4 h-4 text-[#2ABFBF]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* BOTÓN PRINCIPAL: PEDIR CON BENEFICIOS */}
            <button
              type="button"
              onClick={() => router.push('/pedir')}
              className="w-full bg-coral hover:bg-neutral-900 dark:hover:bg-white text-white dark:hover:text-black font-sans font-bold text-xs tracking-wider py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>HACER PEDIDO CON MIS BENEFICIOS</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* 4. HISTORIAL DE PEDIDOS */}
            <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-5 sm:p-6 shadow-sm flex flex-col gap-4 mt-1">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-coral" />
                  <h3 className="font-display text-xl sm:text-2xl text-neutral-900 dark:text-white">
                    HISTORIAL DE COMANDAS ({perfil.pedidosHistorial.length})
                  </h3>
                </div>
              </div>

              {perfil.pedidosHistorial.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {perfil.pedidosHistorial.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#2ABFBF]/30 transition-all"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-xl text-coral font-bold tracking-wider">
                            PEDIDO #{pedido.id}
                          </span>
                          {getStatusBadge(pedido.estado)}
                          <span className="text-[11px] font-sans text-neutral-500">
                            {new Date(pedido.created_at).toLocaleDateString('es-MX', {
                              timeZone: 'America/Mazatlan',
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        </div>

                        {/* Platillos */}
                        <div className="flex flex-wrap items-center gap-1 text-xs font-sans text-neutral-600 dark:text-neutral-300">
                          {pedido.pedido_items && pedido.pedido_items.length > 0 ? (
                            pedido.pedido_items.map((item, idx) => (
                              <span key={idx} className="bg-black/[0.03] dark:bg-white/[0.05] px-2 py-0.5 rounded-lg border border-black/5 dark:border-white/5 text-[11px]">
                                {item.nombre_platillo} x{item.cantidad}
                              </span>
                            ))
                          ) : (
                            <span className="text-neutral-400 italic text-xs">Comanda Marea Negra</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5">
                        <span className="font-display text-xl text-neutral-900 dark:text-white font-bold">
                          ${Number(pedido.total).toFixed(0)} <span className="text-[11px] font-sans text-neutral-500">MXN</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => router.push(`/pedido/${pedido.id}`)}
                            className="bg-[#2ABFBF] text-black hover:bg-white font-sans font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm active:scale-95"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Estatus</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => router.push('/pedir')}
                            className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 hover:border-coral font-sans font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 active:scale-95 text-neutral-700 dark:text-neutral-300"
                          >
                            <RotateCcw className="w-3 h-3 text-coral" />
                            <span className="hidden sm:inline">Repetir</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/10 dark:border-white/10 flex flex-col items-center gap-2">
                  <p className="text-xs font-sans text-neutral-500">
                    Aún no hay pedidos asociados a este número celular.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL PARA CAMBIAR CONTRASEÑA */}
      {perfil && (
        <CambiarPasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          telefono={perfil.telefono}
          nombreCliente={perfil.nombreCliente}
        />
      )}
    </div>
  )
}

