'use client'

import React, { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { ClienteAdminSummary, deleteClienteClub } from '@/lib/actions/clientesAdmin'
import { generarCopysMarketing, checkGeminiStatus, CopyGenerado, GenerarCopyOptions } from '@/lib/actions/aiMarketing'
import { AdminRestablecerPasswordClienteModal } from '@/components/admin/AdminRestablecerPasswordClienteModal'

const CustomerQrScannerModal = dynamic(
  () => import('@/components/admin/CustomerQrScannerModal').then((mod) => mod.CustomerQrScannerModal),
  { ssr: false }
)
import {
  Users,
  Search,
  Award,
  Phone,
  MessageCircle,
  Sparkles,
  KeyRound,
  Calendar,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  Share2,
  Cake,
  Gift,
  Clock,
  Flame,
  Send,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  DollarSign,
} from 'lucide-react'

interface ClientesManagerProps {
  initialClientes: ClienteAdminSummary[]
}

type MarketingSegmento = 'todos' | 'cumpleanos' | 'inactivos' | 'premios' | 'vip'

const ITEMS_PER_PAGE = 10

export function ClientesManager({ initialClientes }: ClientesManagerProps) {
  const [activeTab, setActiveTab] = useState<'crm' | 'marketing'>('crm')
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [clientes, setClientes] = useState<ClienteAdminSummary[]>(initialClientes)
  const [searchTerm, setSearchTerm] = useState('')
  const [crmPage, setCrmPage] = useState(1)
  const [marketingPage, setMarketingPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedClientForPassword, setSelectedClientForPassword] = useState<{
    id: string
    nombre: string
    telefono: string
  } | null>(null)

  // Estados de WhatsApp Marketing + IA
  const [geminiStatus, setGeminiStatus] = useState<{ connected: boolean; mensaje: string } | null>(null)
  const [marketingSegmento, setMarketingSegmento] = useState<MarketingSegmento>('todos')
  const [marketingObjetivo, setMarketingObjetivo] = useState<GenerarCopyOptions['objetivo']>('antojo_fin_de_semana')
  const [marketingTono, setMarketingTono] = useState<GenerarCopyOptions['tono']>('sinaloense_autentico')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [copysGenerados, setCopysGenerados] = useState<CopyGenerado[]>([])
  const [selectedMessage, setSelectedMessage] = useState<string>(
    '¡Qué onda, {nombre}! 🦐 Se siente el calorcito y en *Marea Negra* ya tenemos los camarones frescos y la salsa negra bien fría 🌶️🍻\n\nVen por tu aguachile favorito o pídelo a domicilio aquí: {enlace_menu}\n\n¡Te apartamos mesa o te lo mandamos volando! 🛵'
  )
  const [copiedBroadcast, setCopiedBroadcast] = useState(false)

  React.useEffect(() => {
    if (activeTab === 'marketing') {
      checkGeminiStatus().then(setGeminiStatus)
    }
  }, [activeTab])

  const handleDeleteCustomer = async (cliente: ClienteAdminSummary) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar al cliente "${cliente.nombre}" (+52 ${cliente.telefono})?\n\nEsta acción borrará su registro del Club de Lealtad.`
    )
    if (!confirmed) return

    setDeletingId(cliente.id)
    setFeedbackMsg(null)

    try {
      await deleteClienteClub(cliente.id)
      setClientes((prev) => prev.filter((c) => c.id !== cliente.id))
      setFeedbackMsg({
        type: 'success',
        text: `¡Cliente "${cliente.nombre}" eliminado exitosamente!`,
      })
    } catch (err: any) {
      console.error('Error eliminando cliente:', err)
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Ocurrió un error al eliminar el cliente. Por favor intenta de nuevo.',
      })
    } finally {
      setDeletingId(null)
    }
  }

  // Filtrado de clientes para la pestaña CRM
  const filteredClientes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return clientes.filter((c) => {
      return (
        c.nombre.toLowerCase().includes(term) ||
        c.telefono.includes(term) ||
        c.codigo_referido.toLowerCase().includes(term) ||
        (c.email && c.email.toLowerCase().includes(term))
      )
    })
  }, [clientes, searchTerm])

  // Paginación CRM
  const totalCrmPages = Math.max(1, Math.ceil(filteredClientes.length / ITEMS_PER_PAGE))
  const paginatedCrmClientes = useMemo(() => {
    const start = (crmPage - 1) * ITEMS_PER_PAGE
    return filteredClientes.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredClientes, crmPage])

  // Segmentación Inteligente para Marketing
  const getSegmentedMarketingClientes = (): ClienteAdminSummary[] => {
    switch (marketingSegmento) {
      case 'cumpleanos':
        return clientes.filter((c) => c.es_mes_cumpleanos)
      case 'inactivos':
        return clientes.filter((c) => (c.dias_sin_pedir || 0) >= 15 || (c.total_pedidos === 0))
      case 'premios':
        return clientes.filter((c) => c.canjes_disponibles > 0)
      case 'vip':
        return clientes.filter((c) => c.nivel_lealtad !== 'Socio Marea')
      default:
        return clientes
    }
  }

  const marketingTargetList = getSegmentedMarketingClientes()
  const totalMarketingPages = Math.max(1, Math.ceil(marketingTargetList.length / ITEMS_PER_PAGE))
  const paginatedMarketingClientes = useMemo(() => {
    const start = (marketingPage - 1) * ITEMS_PER_PAGE
    return marketingTargetList.slice(start, start + ITEMS_PER_PAGE)
  }, [marketingTargetList, marketingPage])

  // Generar copys con IA de Gemini o Motor Local
  const handleGenerateAiCopies = async () => {
    setIsGeneratingAi(true)
    try {
      const copys = await generarCopysMarketing({
        objetivo: marketingObjetivo,
        tono: marketingTono,
        instruccionPersonalizada: customPrompt,
      })
      setCopysGenerados(copys)
      if (copys.length > 0) {
        setSelectedMessage(copys[0].mensaje)
      }
    } catch (err) {
      console.error('Error al generar copys:', err)
    } finally {
      setIsGeneratingAi(false)
    }
  }

  // Generar URL personalizada para cada cliente
  const buildPersonalizedWhatsAppUrl = (cliente: ClienteAdminSummary) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marea-negra.com'
    const enlaceMenu = `${origin}/pedir`
    const enlaceTarjeta = `${origin}/micuenta`
    const nombrePila = cliente.nombre.trim().split(' ')[0] || cliente.nombre
    const cleanPhone = (cliente.telefono || '').replace(/\D/g, '')

    const msg = selectedMessage
      .replace(/{nombre}/g, nombrePila)
      .replace(/{sellos}/g, String(cliente.sellos_actuales || 0))
      .replace(/{puntos}/g, String(cliente.total_gastado || 0))
      .replace(/{premio}/g, 'Ceviche de Camarón Gratis')
      .replace(/{enlace_menu}/g, enlaceMenu)
      .replace(/{enlace_tarjeta}/g, enlaceTarjeta)
      .replace(/{enlace_google_maps}/g, 'https://maps.google.com/?q=Marea+Negra+Aguachiles')

    return `https://api.whatsapp.com/send?phone=52${cleanPhone}&text=${encodeURIComponent(msg)}`
  }

  // Copiar lista de teléfonos para Lista de Difusión de WhatsApp Business
  const handleCopyBroadcastList = () => {
    const phoneList = marketingTargetList.map((c) => `+52 ${c.telefono} (${c.nombre})`).join('\n')
    navigator.clipboard.writeText(phoneList)
    setCopiedBroadcast(true)
    setTimeout(() => setCopiedBroadcast(false), 3000)
  }

  // KPIs
  const totalClientes = clientes.length
  const clientesVip = clientes.filter((c) => c.nivel_lealtad !== 'Socio Marea').length
  const totalInvertido = clientes.reduce((acc, c) => acc + c.total_gastado, 0)
  const promedioGasto = totalClientes > 0 ? (totalInvertido / totalClientes).toFixed(0) : '0'

  const getNivelBadge = (nivel: string) => {
    switch (nivel) {
      case 'Leyenda Marea Negra':
        return (
          <span className="px-3 py-1 text-xs font-sans font-bold uppercase rounded-full bg-[#C9A84C] text-black flex items-center gap-1 shadow-sm">
            <Award className="w-3.5 h-3.5" />
            <span>Leyenda VIP 🏆</span>
          </span>
        )
      case 'Capitán Aguachile':
        return (
          <span className="px-3 py-1 text-xs font-sans font-bold uppercase rounded-full bg-[#2ABFBF] text-black flex items-center gap-1 shadow-sm">
            <Award className="w-3.5 h-3.5" />
            <span>Capitán 🥈</span>
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 text-xs font-sans font-bold uppercase rounded-full bg-black/5 dark:bg-white/10 text-negro/80 dark:text-arena/80 border border-black/10 dark:border-white/10">
            Socio Marea 🥉
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12 text-negro dark:text-blanco transition-colors">
      {/* HEADER PRINCIPAL CON BOTÓN DE ESCÁNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-sans uppercase tracking-wider font-bold bg-[#2ABFBF] text-black px-2.5 py-0.5 rounded-full">
              Fidelización & CRM
            </span>
            <span className="text-xs text-negro/60 dark:text-arena/60 font-sans font-medium">
              Socios VIP & Difusión
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco tracking-wide">
            CLIENTES & MARKETING VIP
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90 font-sans font-bold text-xs tracking-wider py-3 px-5 rounded-2xl shadow-md transition-all flex items-center gap-2"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>ESCANEAR QR DE SOCIO</span>
          </button>
        </div>
      </div>

      {/* PESTAÑAS PRINCIPALES: CRM vs WHATSAPP MARKETING */}
      <div className="grid grid-cols-2 gap-2 bg-black/[0.03] dark:bg-white/[0.03] p-1.5 rounded-[22px] border border-black/[0.08] dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => setActiveTab('crm')}
          className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-sans font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'crm'
              ? 'bg-[#2ABFBF] text-negro shadow-sm'
              : 'text-negro/70 dark:text-arena/70 hover:text-negro dark:hover:text-blanco'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>GESTIÓN DE SOCIOS ({clientes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('marketing')}
          className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-sans font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'marketing'
              ? 'bg-gradient-to-r from-coral to-amber-600 text-white shadow-sm'
              : 'text-negro/70 dark:text-arena/70 hover:text-negro dark:hover:text-blanco'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#C9A84C] animate-pulse" />
          <span>WHATSAPP MARKETING & IA</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center gap-3 shadow-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-[#16A34B]/10 border-[#16A34B]/30 text-[#16A34B]'
              : 'bg-coral/10 border-coral/30 text-coral'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="font-sans font-bold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 1: CRM & GESTIÓN DE SOCIOS (TAB 1)                  */}
      {/* ======================================================== */}
      {activeTab === 'crm' && (
        <div className="flex flex-col gap-6">
          {/* 4 KPIS BENTO PRINCIPALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-negro/50 dark:text-arena/50">
                  Total Registrados
                </span>
                <div className="p-2 rounded-xl bg-[#2ABFBF]/10 text-[#2ABFBF]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl text-negro dark:text-blanco font-bold">
                  {totalClientes}
                </div>
                <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
                  Socios en el Club
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#C9A84C]">
                  Socios VIP
                </span>
                <div className="p-2 rounded-xl bg-[#C9A84C]/10 text-[#C9A84C]">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl text-[#C9A84C] font-bold">
                  {clientesVip}
                </div>
                <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
                  Capitanes y Leyendas
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-coral">
                  Ventas Club
                </span>
                <div className="p-2 rounded-xl bg-coral/10 text-coral">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl text-coral font-bold">
                  ${totalInvertido.toLocaleString('es-MX')}
                </div>
                <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
                  Consumos acumulados
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-negro/60 dark:text-arena/60">
                  Ticket Promedio
                </span>
                <div className="p-2 rounded-xl bg-[#16A34B]/10 text-[#16A34B]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl text-[#16A34B] font-bold">
                  ${promedioGasto}
                </div>
                <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
                  Por socio registrado
                </div>
              </div>
            </div>
          </div>

          {/* BUSCADOR */}
          <div className="relative w-full">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-negro/40 dark:text-arena/40" />
            <input
              type="text"
              placeholder="Buscar socio por nombre, teléfono o código referido..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCrmPage(1)
              }}
              className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-negro dark:text-blanco w-full focus:border-[#2ABFBF] focus:outline-none shadow-sm font-sans font-medium"
            />
          </div>

          {/* TABLA DE LISTA DE SOCIOS CON PAGINACIÓN DE 10 */}
          {filteredClientes.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] shadow-sm overflow-hidden">
                {/* VISTA DESKTOP (TABLA) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-sans font-bold uppercase tracking-wider text-negro/50 dark:text-arena/50">
                        <th className="py-4 px-5">Socio / Cliente</th>
                        <th className="py-4 px-4">Contacto</th>
                        <th className="py-4 px-4">Nivel & Fidelidad</th>
                        <th className="py-4 px-4">Consumo Acumulado</th>
                        <th className="py-4 px-4">Último Pedido</th>
                        <th className="py-4 px-5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05] font-sans text-xs">
                      {paginatedCrmClientes.map((cliente) => {
                        const inicial = (cliente.nombre || 'C').charAt(0).toUpperCase()
                        return (
                          <tr
                            key={cliente.id}
                            className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                          >
                            {/* SOCIO / CLIENTE */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/10 text-negro dark:text-blanco font-bold font-sans flex items-center justify-center text-sm shrink-0 border border-black/10 dark:border-white/10 group-hover:border-[#2ABFBF] transition-colors">
                                  {inicial}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-negro dark:text-blanco truncate">
                                      {cliente.nombre}
                                    </span>
                                    {cliente.es_mes_cumpleanos && (
                                      <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-coral/15 text-coral border border-coral/30 flex items-center gap-1"
                                        title="Cumpleañero del mes"
                                      >
                                        <Cake className="w-3 h-3" />
                                        <span>Mes Cumple</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-negro/50 dark:text-arena/50">
                                    <span>Ref: #{cliente.codigo_referido}</span>
                                    {cliente.email && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate max-w-[140px]">{cliente.email}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* CONTACTO */}
                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-0.5">
                                <a
                                  href={`https://wa.me/52${cliente.telefono.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-bold text-[#2ABFBF] hover:underline flex items-center gap-1.5"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>+52 {cliente.telefono}</span>
                                </a>
                                <span className="text-[10px] text-negro/50 dark:text-arena/50">
                                  Registrado: {new Date(cliente.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </td>

                            {/* NIVEL & FIDELIDAD */}
                            <td className="py-4 px-4">
                              <div className="flex flex-col items-start gap-1">
                                {getNivelBadge(cliente.nivel_lealtad)}
                                <div className="flex items-center gap-2 text-[11px] text-negro/60 dark:text-arena/60 font-medium">
                                  <span>{cliente.sellos_actuales}/6 sellos</span>
                                  {cliente.canjes_disponibles > 0 && (
                                    <span className="text-amber-500 font-bold">
                                      • {cliente.canjes_disponibles} premio(s)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* CONSUMO ACUMULADO */}
                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-sm text-coral">
                                  ${cliente.total_gastado.toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN
                                </span>
                                <span className="text-[11px] text-negro/60 dark:text-arena/60 font-medium">
                                  {cliente.total_pedidos} {cliente.total_pedidos === 1 ? 'pedido' : 'pedidos'}
                                </span>
                              </div>
                            </td>

                            {/* ÚLTIMO PEDIDO */}
                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-0.5">
                                {cliente.ultimo_pedido ? (
                                  <>
                                    <span className="font-medium text-negro dark:text-blanco">
                                      {new Date(cliente.ultimo_pedido).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                    </span>
                                    <span className={`text-[10px] font-bold ${
                                      (cliente.dias_sin_pedir || 0) >= 15 ? 'text-coral' : 'text-negro/50 dark:text-arena/50'
                                    }`}>
                                      {(cliente.dias_sin_pedir || 0) === 0
                                        ? 'Hoy'
                                        : `Hace ${cliente.dias_sin_pedir} días`}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[11px] text-negro/40 dark:text-arena/40 italic">
                                    Sin pedidos
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* ACCIONES */}
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={buildPersonalizedWhatsAppUrl(cliente)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="bg-[#25D366] text-white hover:bg-[#1EBE5D] text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                                  title="Enviar mensaje por WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                  <span>WhatsApp</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedClientForPassword({
                                      id: cliente.id,
                                      nombre: cliente.nombre,
                                      telefono: cliente.telefono,
                                    })
                                  }
                                  className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-negro dark:text-blanco border border-black/10 dark:border-white/10 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1"
                                  title="Restablecer o Asignar Contraseña"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-[#C9A84C]" />
                                  <span>Clave</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomer(cliente)}
                                  disabled={deletingId === cliente.id}
                                  className="p-1.5 text-negro/40 dark:text-arena/40 hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
                                  title="Eliminar socio del club"
                                >
                                  {deletingId === cliente.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-coral" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* VISTA MOBILE (LISTA DE FILAS COMPACTAS) */}
                <div className="block md:hidden divide-y divide-black/[0.08] dark:divide-white/[0.08]">
                  {paginatedCrmClientes.map((cliente) => (
                    <div key={cliente.id} className="p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-sans font-bold text-negro/50 dark:text-arena/50 uppercase">
                            #{cliente.codigo_referido}
                          </span>
                          <h3 className="font-bold text-base text-negro dark:text-blanco truncate">
                            {cliente.nombre}
                          </h3>
                          <span className="text-xs font-bold text-[#2ABFBF]">
                            +52 {cliente.telefono}
                          </span>
                        </div>
                        {getNivelBadge(cliente.nivel_lealtad)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-black/[0.02] dark:bg-white/[0.02] p-2.5 rounded-xl text-xs font-sans">
                        <div>
                          <span className="text-[10px] text-negro/50 dark:text-arena/50 uppercase font-bold block">Consumo:</span>
                          <span className="font-bold text-coral">${cliente.total_gastado.toFixed(0)} MXN</span>
                          <span className="text-[10px] text-negro/60 dark:text-arena/60 ml-1">({cliente.total_pedidos} ped)</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-negro/50 dark:text-arena/50 uppercase font-bold block">Sellos:</span>
                          <span className="font-bold text-negro dark:text-blanco">{cliente.sellos_actuales}/6</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 gap-2">
                        <div className="flex items-center gap-2">
                          <a
                            href={buildPersonalizedWhatsAppUrl(cliente)}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#25D366] text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-current" />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedClientForPassword({
                                id: cliente.id,
                                nombre: cliente.nombre,
                                telefono: cliente.telefono,
                              })
                            }
                            className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-[#C9A84C]" />
                            <span>Clave</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(cliente)}
                          disabled={deletingId === cliente.id}
                          className="p-1.5 text-negro/40 dark:text-arena/40 hover:text-red-500 rounded-xl"
                        >
                          {deletingId === cliente.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-coral" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paginador CRM */}
              {totalCrmPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-black/[0.08] dark:border-white/[0.08]">
                  <span className="text-xs font-sans font-medium text-negro/60 dark:text-arena/60">
                    Mostrando página {crmPage} de {totalCrmPages} ({filteredClientes.length} socios registrados)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCrmPage((p) => Math.max(1, p - 1))}
                      disabled={crmPage === 1}
                      className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-sans font-bold px-2 text-negro dark:text-blanco">
                      {crmPage} / {totalCrmPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCrmPage((p) => Math.min(totalCrmPages, p + 1))}
                      disabled={crmPage === totalCrmPages}
                      className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/10 dark:border-white/10">
              <p className="font-sans font-medium text-sm text-negro/60 dark:text-arena/60">
                No se encontraron socios registrados que coincidan con la búsqueda.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: WHATSAPP MARKETING & IA (TAB 2)                  */}
      {/* ======================================================== */}
      {activeTab === 'marketing' && (
        <div className="flex flex-col gap-6">
          {/* AVISO DE PRIVACIDAD TOTAL Y ESTADO DE GEMINI */}
          <div className="flex flex-col gap-2">
            <div className="bg-[#16A34B]/10 border border-[#16A34B]/30 text-[#16A34B] text-xs p-4 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#16A34B] shrink-0" />
                <div>
                  <span className="font-bold text-sm text-negro dark:text-blanco block">
                    Privacidad & Seguridad Garantizada (Zero Data Leak)
                  </span>
                  <p className="text-negro/70 dark:text-arena/80 text-xs mt-0.5 font-sans font-medium">
                    Los datos de tus clientes nunca se envían a la IA. La redacción se genera mediante plantillas y el reemplazo de nombres se ejecuta 100% de manera LOCAL en tu servidor.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {geminiStatus?.connected ? (
                  <span className="text-[10px] font-sans bg-[#C9A84C] text-black font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>GEMINI AI CONECTADO</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-sans bg-[#2ABFBF] text-black font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>MOTOR LOCAL ACTIVO</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* PASO 1: SEGMENTACIÓN INTELIGENTE */}
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 bg-[#2ABFBF]/15 text-[#2ABFBF] rounded-xl flex items-center justify-center font-bold text-xs">1</span>
                <div>
                  <h3 className="font-display text-2xl text-negro dark:text-blanco">
                    SELECCIONA EL SEGMENTO DE CLIENTES
                  </h3>
                  <span className="text-xs font-sans font-medium text-negro/60 dark:text-arena/60">
                    Elige a quién quieres dirigir esta campaña de WhatsApp
                  </span>
                </div>
              </div>

              <span className="font-sans text-xs bg-[#2ABFBF] text-black font-bold px-3 py-1 rounded-full shadow-sm">
                {marketingTargetList.length} Clientes
              </span>
            </div>

            {/* BOTONES DE SEGMENTACIÓN */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMarketingSegmento('todos')
                  setMarketingPage(1)
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  marketingSegmento === 'todos'
                    ? 'bg-[#2ABFBF] text-black border-[#2ABFBF] font-bold shadow-md'
                    : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-negro dark:text-arena hover:border-[#2ABFBF]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-sans font-bold">({clientes.length})</span>
                </div>
                <span className="text-xs font-bold mt-1">Todos los Socios</span>
                <span className="text-[10px] opacity-70">Base completa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMarketingSegmento('cumpleanos')
                  setMarketingPage(1)
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  marketingSegmento === 'cumpleanos'
                    ? 'bg-[#C9A84C] text-black border-[#C9A84C] font-bold shadow-md'
                    : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-negro dark:text-arena hover:border-[#C9A84C]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Cake className="w-4 h-4 text-coral" />
                  <span className="text-xs font-sans font-bold">({clientes.filter((c) => c.es_mes_cumpleanos).length})</span>
                </div>
                <span className="text-xs font-bold mt-1">🎂 Cumpleañeros</span>
                <span className="text-[10px] opacity-70">Festejo del mes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMarketingSegmento('inactivos')
                  setMarketingPage(1)
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  marketingSegmento === 'inactivos'
                    ? 'bg-coral text-white border-coral font-bold shadow-md'
                    : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-negro dark:text-arena hover:border-coral/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-sans font-bold">({clientes.filter((c) => (c.dias_sin_pedir || 0) >= 15).length})</span>
                </div>
                <span className="text-xs font-bold mt-1">😴 Inactivos</span>
                <span className="text-[10px] opacity-70">+15 días sin ordenar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMarketingSegmento('premios')
                  setMarketingPage(1)
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  marketingSegmento === 'premios'
                    ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-md'
                    : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-negro dark:text-arena hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Gift className="w-4 h-4 text-[#2ABFBF]" />
                  <span className="text-xs font-sans font-bold">({clientes.filter((c) => c.canjes_disponibles > 0).length})</span>
                </div>
                <span className="text-xs font-bold mt-1">🎁 Premio Listo</span>
                <span className="text-[10px] opacity-70">Platillo gratis</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMarketingSegmento('vip')
                  setMarketingPage(1)
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  marketingSegmento === 'vip'
                    ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-md'
                    : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-negro dark:text-arena hover:border-purple-600/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Award className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-xs font-sans font-bold">({clientesVip})</span>
                </div>
                <span className="text-xs font-bold mt-1">⭐ Socios VIP</span>
                <span className="text-[10px] opacity-70">Capitanes & Leyendas</span>
              </button>
            </div>
          </div>

          {/* PASO 2: REDACCIÓN CON INTELIGENCIA ARTIFICIAL */}
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 bg-[#C9A84C]/15 text-[#C9A84C] rounded-xl flex items-center justify-center font-bold text-xs">2</span>
                <div>
                  <h3 className="font-display text-2xl text-negro dark:text-blanco">
                    ASISTENTE DE REDACCIÓN CON IA & PLANTILLAS
                  </h3>
                  <span className="text-xs font-sans font-medium text-negro/60 dark:text-arena/60">
                    Genera copys persuasivos con sabor sinaloense listos para enviar
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateAiCopies}
                disabled={isGeneratingAi}
                className="bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90 font-sans font-bold text-xs tracking-wider py-3 px-5 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>REDACTANDO CON IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>GENERAR CON IA</span>
                  </>
                )}
              </button>
            </div>

            {/* OPCIONES DE OBJETIVO Y TONO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans font-bold uppercase text-negro/70 dark:text-arena/70">Objetivo de la Campaña</label>
                <select
                  value={marketingObjetivo}
                  onChange={(e) => setMarketingObjetivo(e.target.value as any)}
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3 text-xs text-negro dark:text-blanco focus:border-[#C9A84C] focus:outline-none font-sans font-bold"
                >
                  <option value="antojo_fin_de_semana">🦐 Antojo Sinaloense de Fin de Semana</option>
                  <option value="cumpleanos">🎂 Festejo de Cumpleaños (Cortesía)</option>
                  <option value="reactivacion">😴 Reactivación de Clientes Inactivos</option>
                  <option value="premio_disponible">🎁 Notificación de Platillo Gratis Listo</option>
                  <option value="promo_cerveza">🍻 Promo Aguachile + Cerveza Helada</option>
                  <option value="resena_google">⭐ Solicitar Reseña en Google Maps (+5 Estrellas)</option>
                  <option value="personalizado">✍️ Instrucción Personalizada</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans font-bold uppercase text-negro/70 dark:text-arena/70">Tono del Mensaje</label>
                <select
                  value={marketingTono}
                  onChange={(e) => setMarketingTono(e.target.value as any)}
                  className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3 text-xs text-negro dark:text-blanco focus:border-[#C9A84C] focus:outline-none font-sans font-bold"
                >
                  <option value="sinaloense_autentico">🦐 Sinaloense Auténtico y Antojador</option>
                  <option value="urgente_promo">⚡ Urgente / Promo por Tiempo Limitado</option>
                  <option value="vip_elegante">⭐ Distinción VIP & Exclusivo</option>
                </select>
              </div>

              {marketingObjetivo === 'personalizado' && (
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 lg:col-span-1">
                  <label className="text-xs font-sans font-bold uppercase text-negro/70 dark:text-arena/70">¿Qué quieres promocionar?</label>
                  <input
                    type="text"
                    placeholder="Ej. Tostada de Callo a $49 solo hoy..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3 text-xs text-negro dark:text-blanco font-sans font-medium focus:border-[#C9A84C] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* OPCIONES GENERADAS */}
            {copysGenerados.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {copysGenerados.map((copy) => (
                  <div
                    key={copy.id}
                    onClick={() => setSelectedMessage(copy.mensaje)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                      selectedMessage === copy.mensaje
                        ? 'bg-[#C9A84C]/10 border-[#C9A84C] shadow-sm ring-2 ring-[#C9A84C]/30'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] hover:border-[#2ABFBF]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#C9A84C]">{copy.titulo}</span>
                      <span className="text-[10px] font-sans font-bold text-negro/60 dark:text-arena/60 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
                        {copy.origen === 'gemini_ai' ? '✨ Gemini AI' : '⚡ Motor Local'}
                      </span>
                    </div>
                    <p className="text-xs font-sans whitespace-pre-line text-negro/80 dark:text-arena/90 line-clamp-3 font-medium">
                      {copy.mensaje}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* EDITOR Y VISTA PREVIA DEL MENSAJE */}
            <div className="flex flex-col gap-2 pt-2">
              <label className="text-xs font-sans font-bold uppercase text-negro/70 dark:text-arena/70 flex items-center justify-between">
                <span>Mensaje Final a Enviar (Puedes editarlo directamente):</span>
                <span className="text-[10px] text-[#2ABFBF] font-sans font-bold">
                  Etiquetas: {'{nombre}'}, {'{sellos}'}, {'{premio}'}, {'{enlace_menu}'}
                </span>
              </label>
              <textarea
                rows={5}
                value={selectedMessage}
                onChange={(e) => setSelectedMessage(e.target.value)}
                className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 text-xs sm:text-sm text-negro dark:text-blanco focus:border-[#C9A84C] focus:outline-none font-sans font-medium leading-relaxed shadow-inner"
              />
            </div>
          </div>

          {/* PASO 3: DISPARADOR Y COLA DE ENVÍO */}
          <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 bg-coral/15 text-coral rounded-xl flex items-center justify-center font-bold text-xs">3</span>
                <div>
                  <h3 className="font-display text-2xl text-negro dark:text-blanco">
                    DISPARADOR DIRECTO & LISTA DE DIFUSIÓN
                  </h3>
                  <span className="text-xs font-sans font-medium text-negro/60 dark:text-arena/60">
                    Envía con 1 clic a cada cliente o exporta para WhatsApp Business
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyBroadcastList}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-[#2ABFBF] text-negro dark:text-blanco font-sans font-bold text-xs py-3 px-4 rounded-xl transition-all flex items-center gap-2 shadow-sm"
              >
                {copiedBroadcast ? (
                  <>
                    <Check className="w-4 h-4 text-[#2ABFBF]" />
                    <span>¡TELÉFONOS COPIADOS!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>COPIAR TELÉFONOS (DIFUSIÓN WHATSAPP)</span>
                  </>
                )}
              </button>
            </div>

            {/* TABLA DE DESTINATARIOS DE CAMPAÑA CON PAGINACIÓN DE 10 */}
            <div className="flex flex-col gap-4">
              <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] overflow-hidden">
                {/* VISTA DESKTOP */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="border-b border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-negro/50 dark:text-arena/50">
                        <th className="py-3.5 px-5">Cliente Destinatario</th>
                        <th className="py-3.5 px-4">Teléfono WhatsApp</th>
                        <th className="py-3.5 px-4">Estado en el Club</th>
                        <th className="py-3.5 px-4">Inactividad</th>
                        <th className="py-3.5 px-5 text-right">Disparo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                      {paginatedMarketingClientes.map((cliente) => {
                        const inicial = (cliente.nombre || 'C').charAt(0).toUpperCase()
                        return (
                          <tr
                            key={cliente.id}
                            className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 text-negro dark:text-blanco font-bold flex items-center justify-center text-xs shrink-0">
                                  {inicial}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-sm text-negro dark:text-blanco truncate">
                                    {cliente.nombre}
                                  </span>
                                  <span className="text-[10px] text-negro/50 dark:text-arena/50">
                                    Ref: #{cliente.codigo_referido}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-[#2ABFBF]">
                              +52 {cliente.telefono}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-negro dark:text-blanco">
                                  {cliente.sellos_actuales}/6 Sellos
                                </span>
                                <span className="text-[10px] text-negro/60 dark:text-arena/60">
                                  {cliente.total_pedidos} pedidos acumulados
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {cliente.ultimo_pedido ? (
                                <span className={`text-[11px] font-bold ${
                                  (cliente.dias_sin_pedir || 0) >= 15 ? 'text-coral' : 'text-negro/60 dark:text-arena/60'
                                }`}>
                                  {(cliente.dias_sin_pedir || 0) === 0
                                    ? 'Ordenó hoy'
                                    : `Hace ${cliente.dias_sin_pedir} días`}
                                </span>
                              ) : (
                                <span className="text-[11px] text-negro/40 dark:text-arena/40 italic">
                                  Sin pedidos previos
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-5 text-right">
                              <a
                                href={buildPersonalizedWhatsAppUrl(cliente)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#1EBE5D] text-xs font-bold py-2 px-3.5 rounded-xl transition-all shadow-sm"
                              >
                                <Send className="w-3.5 h-3.5 fill-current" />
                                <span>Enviar WhatsApp</span>
                              </a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* VISTA MOBILE */}
                <div className="block md:hidden divide-y divide-black/[0.08] dark:divide-white/[0.08]">
                  {paginatedMarketingClientes.map((cliente) => (
                    <div key={cliente.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex flex-col min-w-0 font-sans">
                        <span className="font-bold text-sm truncate text-negro dark:text-blanco">
                          {cliente.nombre}
                        </span>
                        <span className="text-xs text-[#2ABFBF] font-bold">
                          +52 {cliente.telefono}
                        </span>
                        <span className="text-[10px] text-negro/60 dark:text-arena/60 font-medium">
                          {cliente.sellos_actuales}/6 Sellos · {cliente.total_pedidos} pedidos
                        </span>
                      </div>

                      <a
                        href={buildPersonalizedWhatsAppUrl(cliente)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#25D366] text-white hover:bg-[#1EBE5D] text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1 shadow-sm shrink-0"
                      >
                        <Send className="w-3.5 h-3.5 fill-current" />
                        <span>Enviar</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {totalMarketingPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-black/[0.08] dark:border-white/[0.08]">
                  <span className="text-xs font-sans font-medium text-negro/60 dark:text-arena/60">
                    Página {marketingPage} de {totalMarketingPages} ({marketingTargetList.length} clientes en este segmento)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMarketingPage((p) => Math.max(1, p - 1))}
                      disabled={marketingPage === 1}
                      className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-sans font-bold px-2 text-negro dark:text-blanco">
                      {marketingPage} / {totalMarketingPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMarketingPage((p) => Math.min(totalMarketingPages, p + 1))}
                      disabled={marketingPage === totalMarketingPages}
                      className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ESCÁNER QR DE SOCIO */}
      {showScannerModal && (
        <CustomerQrScannerModal
          onClose={() => setShowScannerModal(false)}
        />
      )}

      {/* MODAL RESTABLECER CONTRASEÑA DE CLIENTE */}
      <AdminRestablecerPasswordClienteModal
        isOpen={!!selectedClientForPassword}
        onClose={() => setSelectedClientForPassword(null)}
        cliente={selectedClientForPassword}
      />
    </div>
  )
}
