'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { getClienteCuentaByTelefono, ClientePerfilStats } from '@/lib/actions/clienteCuenta'
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
} from 'lucide-react'

export default function MiCuentaPage() {
  const router = useRouter()
  const [telefonoInput, setTelefonoInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [perfil, setPerfil] = useState<ClientePerfilStats | null>(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedPhone = localStorage.getItem('marea_cliente_telefono')
    if (savedPhone) {
      setTelefonoInput(savedPhone)
      cargarPerfil(savedPhone)
    }
  }, [])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('marea_cliente_telefono')
      localStorage.removeItem('marea_cliente_nombre')
      localStorage.removeItem('marea_club_registered')
    }
    setPerfil(null)
    setSearched(false)
    setTelefonoInput('')
  }

  const cargarPerfil = async (phone: string) => {
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 7) return

    setLoading(true)
    try {
      const data = await getClienteCuentaByTelefono(clean)
      setPerfil(data)
      setSearched(true)
      if (data) {
        localStorage.setItem('marea_cliente_telefono', clean)
      }
    } catch (err) {
      console.error('Error cargando perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!telefonoInput.trim()) return
    cargarPerfil(telefonoInput)
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
      <header className="sticky top-0 z-40 bg-[#F4F0E8] dark:bg-negro border-b border-arena/30 dark:border-arena/10 px-6 py-4">
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
        {/* BUSCADOR DE CUENTA POR CELULAR */}
        <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-oro/30 rounded-3xl p-6 md:p-8 gold-border-corner shadow-2xl flex flex-col items-center text-center gap-5">
          <div className="p-3.5 bg-turquesa/10 border border-turquesa/30 rounded-2xl text-turquesa">
            <Award className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-1 max-w-xl">
            <span className="text-xs font-sans font-bold tracking-widest text-turquesa uppercase">
              MI CUENTA & PLAN DE LEALTAD
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco">
              CONSULTA TUS PEDIDOS Y RECOMPENSAS
            </h2>
            <p className="font-serif italic text-sm text-negro/70 dark:text-arena/80">
              Sin contraseñas difíciles. Ingresa tu número celular de 10 dígitos para ver tus beneficios.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-2 mt-2">
            <div className="relative flex-1">
              <Phone className="w-5 h-5 text-arena/60 absolute left-4 top-3.5" />
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="Ingresa tu celular (10 dígitos)"
                value={telefonoInput}
                onChange={(e) => setTelefonoInput(e.target.value)}
                className="w-full bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl pl-12 pr-4 py-3 text-base text-negro dark:text-blanco font-sans font-bold focus:border-turquesa focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-turquesa text-negro font-sans font-bold text-xs tracking-wider px-6 py-3.5 rounded-xl hover:bg-blanco transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>INGRESAR</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-1.5 text-[11px] font-sans text-negro/50 dark:text-arena/50 mt-1">
            <ShieldCheck className="w-4 h-4 text-turquesa" />
            <span>Acceso seguro mediante celular sin recordar contraseñas.</span>
          </div>
        </div>

        {/* SI NO HA BUSCADO O NO TIENE PEDIDOS */}
        {searched && !perfil && (
          <div className="bg-white dark:bg-carbon border border-coral/30 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
            <ShoppingBag className="w-12 h-12 text-coral/60" />
            <h3 className="font-display text-2xl text-negro dark:text-blanco">
              NO ENCONTRAMOS PEDIDOS CON EL CELULAR {telefonoInput}
            </h3>
            <p className="font-serif italic text-sm text-negro/70 dark:text-arena/70 max-w-md">
              Aún no registras tu primer pedido con este número o el número es incorrecto. ¡Haz tu orden hoy para empezar a acumular recompensas!
            </p>
            <button
              onClick={() => router.push('/pedir')}
              className="mt-2 bg-coral text-blanco font-sans font-bold text-xs px-6 py-3.5 rounded-xl shadow-lg hover:bg-coral/80"
            >
              HACER MI PRIMER PEDIDO 🦐
            </button>
          </div>
        )}

        {/* DASHBOARD DE SOCIO SI ENCONTRÓ DATOS */}
        {perfil && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">
            {/* 1. TARJETA DE SOCIO Y PLAN DE LEALTAD */}
            <div className="bg-[#050404] bg-dots-pattern border-2 border-oro/40 rounded-3xl p-6 md:p-8 gold-border-corner shadow-2xl text-blanco flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-limon/10 rounded-full filter blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/15 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-coral to-turquesa p-0.5 shadow-lg">
                    <div className="w-full h-full bg-negro rounded-[14px] flex items-center justify-center text-limon font-display text-2xl font-bold">
                      {perfil.nombreCliente.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-turquesa flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>SOCIO VERIFICADO · MAREA NEGRA</span>
                    </span>
                    <h3 className="font-display text-3xl md:text-4xl text-blanco tracking-wide">
                      {perfil.nombreCliente}
                    </h3>
                    <span className="text-xs font-mono text-arena/70">
                      Celular: +52 {perfil.telefono}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  {/* Badge de Nivel de Lealtad */}
                  <div className="bg-carbon border border-oro/40 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-md">
                    <Award className="w-5 h-5 text-oro" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-sans uppercase font-bold text-arena/60">Nivel Actual</span>
                      <span className="font-display text-xl text-oro tracking-wider">{perfil.nivelLealtad}</span>
                    </div>
                  </div>

                  {/* Botón Cerrar Sesión */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-3 bg-carbon border border-coral/30 text-coral hover:bg-coral hover:text-blanco rounded-2xl transition-all shadow-md"
                    title="Cerrar sesión en este dispositivo"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* BARRA DE PROGRESO DEL PLAN DE LEALTAD */}
              <div className="bg-carbon/80 border border-arena/20 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-xs font-sans font-bold uppercase text-limon tracking-wider flex items-center gap-1.5">
                    <Gift className="w-4 h-4" />
                    <span>TU PRÓXIMA RECOMPENSA DE LEALTAD:</span>
                  </span>
                  <span className="font-serif italic text-xs text-arena/80">
                    {perfil.pedidosFaltantesParaRecompensa > 0
                      ? `¡Solo te faltan ${perfil.pedidosFaltantesParaRecompensa} pedido(s) más!`
                      : '¡Felicidades! Alcanzaste el Nivel VIP Leyenda'}
                  </span>
                </div>

                <p className="font-sans text-sm font-bold text-blanco">
                  {perfil.proximaRecompensa}
                </p>

                {/* Barra Neón de Progreso */}
                <div className="w-full h-3 bg-negro rounded-full overflow-hidden border border-arena/20 mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-coral via-turquesa to-limon transition-all duration-700 shadow-[0_0_15px_rgba(222,253,111,0.5)]"
                    style={{ width: `${Math.min(100, (perfil.totalPedidos / (perfil.lealtadConfig.meta3_pedidos || 10)) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono text-arena/60 pt-1">
                  <span>{perfil.totalPedidos} Pedidos Realizados</span>
                  <span>Meta: 5 Pedidos</span>
                </div>
              </div>
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
                            <span>{new Date(pedido.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
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
    </div>
  )
}
