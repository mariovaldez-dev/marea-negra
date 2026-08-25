'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ClubBenefitsModal } from '@/components/menu/ClubBenefitsModal'
import { LoyaltyCardPass } from '@/components/loyalty/LoyaltyCardPass'
import {
  getClienteCuentaByTelefono,
  ClientePerfilStats,
  loginClienteConPassword,
  actualizarCumpleanosCliente,
} from '@/lib/actions/clienteCuenta'
import {
  Phone,
  Search,
  Award,
  ShoppingBag,
  Sparkles,
  ChevronLeft,
  Calendar,
  Clock,
  ExternalLink,
  Gift,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Loader2,
  ShieldCheck,
  RotateCcw,
  LogOut,
  Cake,
  Heart,
  Share2,
} from 'lucide-react'

export default function MiCuentaPage() {
  const router = useRouter()
  const [telefonoInput, setTelefonoInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [perfil, setPerfil] = useState<ClientePerfilStats | null>(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedPhone = localStorage.getItem('marea_cliente_telefono')
    if (savedPhone) {
      cargarPerfil(savedPhone)
    } else {
      setInitialLoadDone(true)
    }
  }, [])

  useEffect(() => {
    if (!isModalOpen && typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('marea_cliente_telefono')
      if (savedPhone && !perfil) {
        cargarPerfil(savedPhone)
      }
    }
  }, [isModalOpen])

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

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'nuevo':
        return <span className="px-2.5 py-1 text-xs font-sans font-bold uppercase rounded-full bg-turquesa/10 text-turquesa border border-turquesa/30">Nuevo</span>
      case 'preparando':
        return <span className="px-2.5 py-1 text-xs font-sans font-bold uppercase rounded-full bg-oro/20 text-oro border border-oro/40 animate-pulse">En Cocina 🦐</span>
      case 'listo':
        return <span className="px-2.5 py-1 text-xs font-sans font-bold uppercase rounded-full bg-limon/20 text-limon border border-limon/40 shadow-sm">¡Listo! 🔔</span>
      case 'entregado':
        return <span className="px-2.5 py-1 text-xs font-sans font-bold uppercase rounded-full bg-turquesa/20 text-turquesa border border-turquesa/40">Entregado ✓</span>
      case 'cancelado':
        return <span className="px-2.5 py-1 text-xs font-sans font-bold uppercase rounded-full bg-coral/20 text-coral border border-coral/40">Cancelado</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-sans uppercase rounded-full bg-carbon text-arena">{estado}</span>
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F0E8] dark:bg-negro text-negro dark:text-blanco flex flex-col justify-between selection:bg-coral transition-colors duration-300">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#F4F0E8] dark:bg-negro border-b border-arena/30 dark:border-arena/10 px-6 py-3 safe-header transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-xs md:text-sm font-sans font-bold text-negro/70 dark:text-arena/70 hover:text-coral flex items-center gap-1"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Menú</span>
          </button>

          <h1 className="font-display text-2xl md:text-3xl text-coral tracking-wider">
            MAREA NEGRA
          </h1>

          <ThemeToggle />
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-10 w-full flex-1 flex flex-col gap-8">
        {/* SKELETON LOADER MIENTRAS CARGA LA CUENTA */}
        {(!initialLoadDone || (loading && !perfil)) && (
          <div className="flex flex-col gap-8 animate-pulse w-full">
            {/* Skeleton Tarjeta de Socio */}
            <div className="bg-white dark:bg-[#050404] border border-arena/30 dark:border-oro/30 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/20 dark:border-arena/10 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-arena/20 dark:bg-carbon" />
                  <div className="flex flex-col gap-2">
                    <div className="h-3 w-32 bg-turquesa/20 rounded-full" />
                    <div className="h-7 w-48 bg-arena/30 dark:bg-carbon rounded-lg" />
                    <div className="h-3 w-28 bg-arena/20 dark:bg-carbon/70 rounded-full" />
                  </div>
                </div>
                <div className="h-12 w-36 bg-arena/20 dark:bg-carbon rounded-2xl" />
              </div>

              {/* Grid 4 Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-20 bg-[#F4F0E8] dark:bg-carbon rounded-2xl border border-arena/20 dark:border-arena/10" />
                ))}
              </div>

              {/* Barra Progreso */}
              <div className="h-24 bg-[#F4F0E8] dark:bg-carbon/60 rounded-2xl border border-arena/20 dark:border-arena/10" />
            </div>

            {/* Skeleton Historial */}
            <div className="flex flex-col gap-4">
              <div className="h-8 w-56 bg-arena/30 dark:bg-carbon rounded-lg" />
              {[1, 2].map((n) => (
                <div key={n} className="h-32 bg-white dark:bg-[#050404] rounded-2xl border border-arena/20 dark:border-arena/10" />
              ))}
            </div>
          </div>
        )}

        {/* ESTADO NO LOGUEADO (FORMULARIO DE LOGIN) */}
        {initialLoadDone && !loading && !perfil && (
          <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-oro/30 rounded-3xl p-8 md:p-12 gold-border-corner shadow-2xl flex flex-col items-center gap-6 max-w-md mx-auto w-full animate-in fade-in zoom-in duration-500">
            <div className="p-4 bg-coral/10 border border-coral/30 rounded-full text-coral shadow-[0_0_20px_rgba(232,67,10,0.2)]">
              <Award className="w-10 h-10 md:w-12 md:h-12" />
            </div>

            <div className="flex flex-col gap-2 w-full text-center">
              <span className="text-xs font-sans font-bold tracking-widest text-turquesa uppercase">
                CLUB DE LEALTAD
              </span>
              <h2 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco leading-tight">
                INICIAR SESIÓN
              </h2>
              <p className="font-serif italic text-sm text-negro/70 dark:text-arena/80">
                Accede para ver tu historial de pedidos, tus puntos y recompensas.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans font-bold text-negro/70 dark:text-arena/70 uppercase tracking-wider">
                  Número Celular
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-negro/40 dark:text-arena/40" />
                  </div>
                  <input
                    type="tel"
                    placeholder="Ej. 6671234567"
                    value={telefonoInput}
                    onChange={(e) => setTelefonoInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/10 text-negro dark:text-blanco font-mono text-lg rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-turquesa dark:focus:border-turquesa transition-colors"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans font-bold text-negro/70 dark:text-arena/70 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="w-5 h-5 text-negro/40 dark:text-arena/40" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/10 text-negro dark:text-blanco font-sans text-lg rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-turquesa dark:focus:border-turquesa transition-colors"
                    required
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="text-coral text-sm font-sans bg-coral/10 p-3 rounded-lg border border-coral/20 text-center">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-turquesa text-negro hover:bg-turquesa/90 disabled:opacity-50 font-sans font-bold tracking-wider py-4 rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                <span>{loading ? 'ACCEDIENDO...' : 'ENTRAR A MI CUENTA'}</span>
              </button>
            </form>

            <div className="w-full border-t border-arena/20 dark:border-arena/10 pt-6 mt-2 flex flex-col items-center gap-3">
              <span className="font-serif italic text-sm text-negro/60 dark:text-arena/60">
                ¿Aún no tienes cuenta?
              </span>
              <button
                onClick={() => router.push('/registro')}
                className="w-full bg-carbon text-blanco border border-arena/20 hover:border-coral font-sans font-bold text-sm tracking-wider px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-coral" />
                <span>ÚNETE GRATIS AL CLUB</span>
              </button>
            </div>
          </div>
        )}

        {/* DASHBOARD DE SOCIO SI ENCONTRÓ DATOS */}
        {perfil && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">
            {/* TARJETA DIGITAL VIP 3D Y BOTONES DE WALLET */}
            <div className="flex flex-col items-center gap-3">
              <div className="text-center">
                <span className="text-xs font-sans font-bold tracking-widest text-turquesa uppercase">
                  MEMBRESÍA DIGITAL OFICIAL
                </span>
                <h2 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco">
                  TU TARJETA DE LEALTAD VIP
                </h2>
                <p className="font-serif italic text-xs md:text-sm text-negro/70 dark:text-arena/70 mt-0.5">
                  Toca la tarjeta para voltearla y ver tu código QR de socio.
                </p>
              </div>

              <LoyaltyCardPass perfil={perfil} />
            </div>

            {/* 1. INFORMACIÓN DE LA CUENTA Y BENEFICIOS */}
            <div className="bg-white dark:bg-[#050404] bg-dots-pattern border-2 border-oro/40 rounded-3xl p-6 md:p-8 gold-border-corner shadow-2xl text-negro dark:text-blanco flex flex-col gap-6 relative overflow-hidden transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-limon/10 rounded-full filter blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/20 dark:border-arena/15 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-coral to-turquesa p-0.5 shadow-lg shrink-0">
                    <div className="w-full h-full bg-negro rounded-[14px] flex items-center justify-center text-limon font-display text-2xl font-bold">
                      {perfil.nombreCliente.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-turquesa flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>SOCIO VERIFICADO · MAREA NEGRA</span>
                    </span>
                    <h3 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco tracking-wide">
                      {perfil.nombreCliente}
                    </h3>
                    <span className="text-xs font-mono text-negro/60 dark:text-arena/70">
                      Celular: +52 {perfil.telefono}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  {/* Badge de Nivel de Lealtad */}
                  <div className="bg-[#F4F0E8] dark:bg-carbon border border-oro/40 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-md">
                    <Award className="w-5 h-5 text-oro" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-sans uppercase font-bold text-negro/60 dark:text-arena/60">Nivel Actual</span>
                      <span className="font-display text-xl text-oro tracking-wider">{perfil.nivelLealtad}</span>
                    </div>
                  </div>

                  {/* Botón Cerrar Sesión */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-3 bg-[#F4F0E8] dark:bg-carbon border border-coral/30 text-coral hover:bg-coral hover:text-blanco rounded-2xl transition-all shadow-md"
                    title="Cerrar sesión en este dispositivo"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* BANNER FESTIVO SI ES EL MES DE SU CUMPLEAÑOS */}
              {perfil.esMesCumpleanos && (
                <div className="bg-gradient-to-r from-coral/20 via-oro/20 to-amber-500/20 border-2 border-oro rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-oro text-negro rounded-2xl shadow-md">
                      <Cake className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-display text-2xl text-negro dark:text-oro">
                        🎂 ¡FELIZ MES DE TU CUMPLEAÑOS!
                      </span>
                      <p className="text-xs font-sans text-negro/80 dark:text-arena">
                        Disfruta una <strong>Tostada o Bebida de Cortesía</strong> en tu próxima visita a Marea Negra mostrando tu QR.
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold bg-oro text-negro px-3 py-1.5 rounded-full shadow">
                    FESTEJO VIP ACTIVO
                  </span>
                </div>
              )}

              {/* SECCIÓN DATOS AMPLIADOS DEL CLIENTE */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/10 rounded-2xl p-4 flex flex-col gap-1 items-start shadow-md">
                  <span className="text-[10px] font-sans uppercase text-turquesa font-bold">Email</span>
                  <span className="font-mono text-sm text-negro dark:text-blanco break-all">{perfil.email || 'No registrado'}</span>
                </div>

                <div className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/10 rounded-2xl p-4 flex flex-col gap-1 items-start shadow-md">
                  <span className="text-[10px] font-sans uppercase text-oro font-bold">Puntos Totales</span>
                  <span className="font-display text-2xl text-negro dark:text-blanco">{perfil.puntos || 0} pts</span>
                </div>

                {/* Fecha de Cumpleaños */}
                <div className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/10 rounded-2xl p-4 flex flex-col gap-1 items-start shadow-md">
                  <span className="text-[10px] font-sans uppercase text-coral font-bold flex items-center gap-1">
                    <Cake className="w-3 h-3" />
                    <span>Cumpleaños</span>
                  </span>
                  {perfil.borndate ? (
                    <span className="font-mono text-sm text-negro dark:text-blanco">
                      {new Date(`${perfil.borndate}T12:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'long' })}
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
                      className="bg-white dark:bg-[#050404] border border-arena/30 dark:border-arena/20 text-xs rounded-lg px-2 py-1 text-negro dark:text-blanco w-full focus:outline-none focus:border-oro"
                    />
                  )}
                </div>

                {/* Código de Referido & Invitar Amigo */}
                <div className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/10 rounded-2xl p-4 flex flex-col gap-1 items-start shadow-md">
                  <span className="text-[10px] font-sans uppercase text-turquesa font-bold">Tu Código Referido</span>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-sm font-bold text-negro dark:text-blanco">{perfil.codigoReferido || 'MAREA-VIP'}</span>
                    <button
                      onClick={() => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marea-negra.com'
                        const msg = `¡Compa, tienes que probar los aguachiles de *Marea Negra*! 🦐🔥 Usa mi código *${perfil.codigoReferido || 'MAREA-VIP'}* para 10% OFF: ${origin}/pedir`
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
                      }}
                      className="text-[10px] bg-[#25D366] hover:bg-[#1EBE5D] text-white px-2.5 py-1 rounded-lg transition-all font-bold flex items-center gap-1 shadow-sm"
                      title="Compartir en WhatsApp"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>INVITAR</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* BARRA DE PROGRESO DEL PLAN DE LEALTAD */}
              {perfil.lealtadConfig && perfil.proximaRecompensa && perfil.pedidosFaltantesParaRecompensa !== null && (
                <div className="bg-[#F4F0E8] dark:bg-carbon/80 border border-arena/30 dark:border-arena/20 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <span className="text-xs font-sans font-bold uppercase text-coral dark:text-limon tracking-wider flex items-center gap-1.5">
                      <Gift className="w-4 h-4" />
                      <span>TU PRÓXIMA RECOMPENSA DE LEALTAD:</span>
                    </span>
                    <span className="font-serif italic text-xs text-negro/70 dark:text-arena/80">
                      {perfil.pedidosFaltantesParaRecompensa > 0
                        ? `¡Solo te faltan ${perfil.pedidosFaltantesParaRecompensa} pedido(s) más!`
                        : '¡Felicidades! Tienes recompensa lista'}
                    </span>
                  </div>

                  <p className="font-sans text-sm font-bold text-negro dark:text-blanco">
                    {perfil.proximaRecompensa}
                  </p>

                  {/* Barra Neón de Progreso */}
                  <div className="w-full h-3 bg-arena/30 dark:bg-negro rounded-full overflow-hidden border border-arena/30 dark:border-arena/20 mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-coral via-turquesa to-limon transition-all duration-700 shadow-[0_0_15px_rgba(222,253,111,0.5)]"
                      style={{ width: `${Math.min(100, ((perfil.pedidosEntregados % (perfil.lealtadConfig?.meta1_pedidos || 6)) / (perfil.lealtadConfig?.meta1_pedidos || 6)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* BANNER DE RECOMPENSA LISTA PARA CANJE */}
              {perfil.canjesDisponibles > 0 && (
                <div className="bg-gradient-to-r from-oro/20 via-amber-500/20 to-yellow-500/10 border-2 border-oro rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-oro text-negro rounded-2xl shadow-md">
                      <Gift className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-display text-2xl text-negro dark:text-oro">
                        ¡TIENES {perfil.canjesDisponibles} PLATILLO GRATIS DISPONIBLE!
                      </span>
                      <p className="text-xs font-sans text-negro/80 dark:text-arena">
                        Muestra tu código QR en caja o al mesero para disfrutar tu <strong>{perfil.proximaRecompensa}</strong>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="bg-oro text-negro font-sans font-bold text-xs px-5 py-3 rounded-xl hover:bg-blanco transition-all shadow-md shrink-0"
                  >
                    VER MI CÓDIGO QR
                  </button>
                </div>
              )}

              {/* HISTORIAL DE CANJES PREVIOS */}
              {perfil.historialCanjes.length > 0 && (
                <div className="bg-[#F4F0E8] dark:bg-carbon/40 border border-arena/20 rounded-2xl p-4 flex flex-col gap-2">
                  <span className="text-[11px] font-sans font-bold uppercase text-turquesa tracking-wider">
                    🏆 PREMIOS CANJEADOS ANTERIORMENTE ({perfil.historialCanjes.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {perfil.historialCanjes.map((canje) => (
                      <span
                        key={canje.id}
                        className="text-xs font-sans bg-white dark:bg-carbon px-3 py-1.5 rounded-lg border border-arena/20 text-negro dark:text-arena flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-turquesa" />
                        <span>{canje.recompensa}</span>
                        <span className="text-[10px] text-arena/60">
                          ({new Date(canje.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. HISTORIAL DE PEDIDOS REALIZADOS */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-arena/30 dark:border-arena/10 pb-3">
                <h3 className="font-display text-3xl text-negro dark:text-blanco tracking-wide flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6 text-coral" />
                  <span>TU HISTORIAL DE PEDIDOS ({perfil.pedidosHistorial.length})</span>
                </h3>
              </div>

              {perfil.pedidosHistorial.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {perfil.pedidosHistorial.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-oro/30 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-turquesa transition-all"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-display text-2xl text-coral tracking-wider">
                            PEDIDO #{pedido.id}
                          </span>
                          {getStatusBadge(pedido.estado)}
                          <span className="text-xs font-sans text-negro/60 dark:text-arena/60 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(pedido.created_at).toLocaleDateString('es-MX', { timeZone: 'America/Mazatlan', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </span>
                        </div>

                        {/* Items del Pedido */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-sans font-bold text-negro/80 dark:text-blanco mt-1">
                          {pedido.pedido_items && pedido.pedido_items.length > 0 ? (
                            pedido.pedido_items.map((item, idx) => (
                              <span key={idx} className="bg-[#F4F0E8] dark:bg-carbon px-3 py-1 rounded-lg border border-arena/20">
                                {item.nombre_platillo} x{item.cantidad}
                              </span>
                            ))
                          ) : (
                            <span className="text-arena/60 font-serif italic">Comanda Marea Negra</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-arena/10">
                        <div className="flex flex-col md:items-end">
                          <span className="text-[10px] font-sans uppercase font-bold text-negro/60 dark:text-arena/60">Total Cobrado</span>
                          <span className="font-display text-3xl text-negro dark:text-limon">
                            ${Number(pedido.total).toFixed(0)} <span className="text-xs font-sans text-arena">MXN</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/pedido/${pedido.id}`)}
                            className="bg-turquesa text-negro hover:bg-blanco font-sans font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>VER ESTATUS 📡</span>
                          </button>

                          <button
                            onClick={() => router.push('/pedir')}
                            className="bg-carbon text-blanco border border-arena/20 hover:border-coral font-sans font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-coral" />
                            <span>PEDIR OTRA VEZ</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-carbon/40 rounded-xl border border-arena/5">
                  <p className="font-serif italic text-sm text-arena/60">
                    Aún no hay pedidos asociados a este número celular.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* MODAL DE LOGIN/BENEFICIOS */}
      <ClubBenefitsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
