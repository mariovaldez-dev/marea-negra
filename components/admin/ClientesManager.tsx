'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { ClienteAdminSummary, deleteClienteClub } from '@/lib/actions/clientesAdmin'
import { generarCopysMarketing, checkGeminiStatus, CopyGenerado, GenerarCopyOptions } from '@/lib/actions/aiMarketing'
import { LuxuryCard } from '@/components/ui/LuxuryCard'
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
} from 'lucide-react'

interface ClientesManagerProps {
  initialClientes: ClienteAdminSummary[]
}

type MarketingSegmento = 'todos' | 'cumpleanos' | 'inactivos' | 'premios' | 'vip'

export function ClientesManager({ initialClientes }: ClientesManagerProps) {
  const [activeTab, setActiveTab] = useState<'crm' | 'marketing'>('crm')
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [clientes, setClientes] = useState<ClienteAdminSummary[]>(initialClientes)
  const [searchTerm, setSearchTerm] = useState('')
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
  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase().trim()
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.telefono.includes(term) ||
      c.codigo_referido.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    )
  })

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

  // Generar URL personalizada para cada cliente (reemplazo seguro 100% LOCAL)
  const buildPersonalizedWhatsAppUrl = (cliente: ClienteAdminSummary) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marea-negra.com'
    const enlaceMenu = `${origin}/pedir`
    const enlaceTarjeta = `${origin}/micuenta`
    const nombrePila = cliente.nombre.trim().split(' ')[0] || cliente.nombre
    const cleanPhone = (cliente.telefono || '').replace(/\D/g, '')

    let msg = selectedMessage
      .replace(/{nombre}/g, nombrePila)
      .replace(/{sellos}/g, String(cliente.sellos_actuales || 0))
      .replace(/{puntos}/g, String(cliente.total_gastado || 0))
      .replace(/{premio}/g, 'Ceviche de Camarón Gratis')
      .replace(/{enlace_menu}/g, enlaceMenu)
      .replace(/{enlace_tarjeta}/g, enlaceTarjeta)
      .replace(/{enlace_google_maps}/g, 'https://maps.google.com/?q=Marea+Negra+Aguachiles')

    // Formato de enlace compatible con emojis en WhatsApp Web y Móvil
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
          <span className="px-3 py-1 text-xs font-sans font-bold uppercase rounded-full bg-oro/20 text-oro border border-oro/40 flex items-center gap-1 shadow-sm">
            <Award className="w-3.5 h-3.5 text-oro" />
            <span>Leyenda VIP 🏆</span>
          </span>
        )
      case 'Capitán Aguachile':
        return (
          <span className="px-3 py-1 text-xs font-sans font-bold uppercase rounded-full bg-turquesa/20 text-turquesa border border-turquesa/40 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-turquesa" />
            <span>Capitán 🥈</span>
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 text-xs font-sans uppercase rounded-full bg-arena/20 dark:bg-carbon text-negro/80 dark:text-arena/80 border border-arena/30 dark:border-arena/20">
            Socio Marea 🥉
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 text-negro dark:text-blanco transition-colors">
      {/* HEADER PRINCIPAL CON BOTÓN DE ESCÁNER Y PESTAÑAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arena/30 dark:border-arena/10 pb-5">
        <div className="flex flex-col">
          <span className="text-xs font-mono text-turquesa uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>CRM & CLUB DE LEALTAD</span>
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-negro dark:text-blanco mt-1">
            CLIENTES & MARKETING VIP
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="bg-oro text-negro hover:bg-blanco font-sans font-bold text-xs tracking-wider py-3.5 px-5 rounded-2xl shadow-lg transition-all flex items-center gap-2 border border-oro/40"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>📷 ESCANEAR QR DE SOCIO</span>
          </button>
        </div>
      </div>

      {/* PESTAÑAS PRINCIPALES: CRM vs WHATSAPP MARKETING */}
      <div className="grid grid-cols-2 gap-3 bg-[#EAE5D9] dark:bg-carbon p-1.5 rounded-2xl border border-arena/30 dark:border-arena/20">
        <button
          type="button"
          onClick={() => setActiveTab('crm')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-sans font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'crm'
              ? 'bg-turquesa text-negro shadow-md'
              : 'text-negro/70 dark:text-arena/70 hover:text-negro dark:hover:text-blanco'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>GESTIÓN DE SOCIOS ({clientes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('marketing')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-sans font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'marketing'
              ? 'bg-gradient-to-r from-coral to-amber-600 text-blanco shadow-md'
              : 'text-negro/70 dark:text-arena/70 hover:text-negro dark:hover:text-blanco'
          }`}
        >
          <Sparkles className="w-4 h-4 text-oro animate-pulse" />
          <span>WHATSAPP MARKETING & IA</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center gap-3 shadow-lg ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-900/20 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
              : 'bg-coral/20 dark:bg-coral/20 border-coral/40 text-coral dark:text-coral'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-coral shrink-0" />
          )}
          <span className="font-sans font-medium">{feedbackMsg.text}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 1: CRM & GESTIÓN DE SOCIOS (TAB 1)                  */}
      {/* ======================================================== */}
      {activeTab === 'crm' && (
        <div className="flex flex-col gap-6">
          {/* 4 KPIS PRINCIPALES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <LuxuryCard
              eyebrow="COMUNIDAD"
              title="Total Registrados"
              kpiValue={totalClientes}
              subtext="Socios en el Club"
            />

            <LuxuryCard
              eyebrow="FIDELIDAD"
              title="Socios VIP"
              kpiValue={clientesVip}
              subtext="Capitanes y Leyendas"
            />

            <LuxuryCard
              eyebrow="INGRESOS"
              title="Ventas Club"
              kpiValue={`$${totalInvertido.toLocaleString('es-MX')}`}
              subtext="Consumos acumulados"
            />

            <LuxuryCard
              eyebrow="TICKET"
              title="Ticket Promedio"
              kpiValue={`$${promedioGasto}`}
              subtext="Por socio registrado"
            />
          </div>

          {/* BUSCADOR */}
          <div className="relative w-full">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-arena/60" />
            <input
              type="text"
              placeholder="Buscar socio por nombre, teléfono o código referido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-[#050404] border border-arena/30 dark:border-oro/30 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-negro dark:text-blanco w-full focus:border-oro focus:outline-none shadow-md font-sans"
            />
          </div>

          {/* LISTA DE SOCIOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClientes.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-oro/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4 hover:border-turquesa transition-all relative group"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-arena/70">
                        N° {cliente.codigo_referido}
                      </span>
                      <h3 className="font-display text-2xl text-negro dark:text-blanco">
                        {cliente.nombre}
                      </h3>
                      <span className="text-xs font-mono text-turquesa font-bold">
                        +52 {cliente.telefono}
                      </span>
                    </div>
                    {getNivelBadge(cliente.nivel_lealtad)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#F4F0E8] dark:bg-carbon p-2.5 rounded-xl border border-arena/20 text-xs">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-arena/70 uppercase">Consumos:</span>
                      <span className="font-bold">{cliente.total_pedidos} pedidos</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-arena/70 uppercase">Total Gastado:</span>
                      <span className="font-bold text-coral">${cliente.total_gastado.toFixed(0)} MXN</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-arena/20 pt-3 gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={buildPersonalizedWhatsAppUrl(cliente)}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#25D366] text-white hover:bg-[#1EBE5D] text-xs font-sans font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                      title="Chatear por WhatsApp"
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
                      className="bg-carbon hover:bg-black text-arena hover:text-oro border border-arena/20 hover:border-oro/40 text-xs font-sans font-bold px-2.5 py-2 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                      title="Restablecer o Asignar Contraseña"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-oro" />
                      <span className="hidden sm:inline">Clave</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(cliente)}
                    disabled={deletingId === cliente.id}
                    className="p-2 text-arena/40 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors"
                    title="Eliminar del club"
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
      )}

      {/* ======================================================== */}
      {/* VISTA 2: WHATSAPP MARKETING & IA (TAB 2)                  */}
      {/* ======================================================== */}
      {activeTab === 'marketing' && (
        <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
          {/* AVISO DE PRIVACIDAD TOTAL Y ESTADO DE GEMINI */}
          <div className="flex flex-col gap-2">
            <div className="bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-sm text-blanco block">
                    Privacidad & Seguridad Garantizada (Zero Data Leak)
                  </span>
                  <p className="text-emerald-300/80 text-xs mt-0.5">
                    Los datos de tus clientes nunca se envían a la IA. La redacción se genera mediante plantillas y el reemplazo de nombres se ejecuta 100% de manera LOCAL en tu servidor.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {geminiStatus?.connected ? (
                  <span className="text-[10px] font-mono bg-oro/20 text-oro font-bold px-3 py-1.5 rounded-full border border-oro/40 flex items-center gap-1.5 shadow">
                    <Sparkles className="w-3.5 h-3.5 text-oro animate-pulse" />
                    <span>GEMINI AI CONECTADO</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono bg-turquesa/20 text-turquesa font-bold px-3 py-1.5 rounded-full border border-turquesa/40 flex items-center gap-1.5 shadow">
                    <Zap className="w-3.5 h-3.5 text-turquesa" />
                    <span>MOTOR LOCAL ACTIVO</span>
                  </span>
                )}
              </div>
            </div>

            {geminiStatus && !geminiStatus.connected && (
              <div className="bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Nota:</strong> Si acabas de guardar tu clave en el archivo de entorno, recuerda reiniciar tu terminal dev (<code>Control + C</code> y luego <code>npm run dev</code>) para que Next.js cargue la nueva variable en memoria. Mientras tanto, el motor local funciona al 100%.
                </span>
              </div>
            )}
          </div>

          {/* PASO 1: SEGMENTACIÓN INTELIGENTE */}
          <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-oro/30 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-arena/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-turquesa/10 text-turquesa rounded-xl border border-turquesa/30 font-bold">1</span>
                <div>
                  <h3 className="font-display text-2xl text-negro dark:text-blanco">
                    SELECCIONA EL SEGMENTO DE CLIENTES
                  </h3>
                  <span className="text-xs font-serif italic text-arena/70">
                    Elige a quién quieres dirigir esta campaña de WhatsApp
                  </span>
                </div>
              </div>

              <span className="font-mono text-sm bg-turquesa text-negro font-bold px-3 py-1 rounded-xl shadow">
                {marketingTargetList.length} Clientes Seleccionados
              </span>
            </div>

            {/* BOTONES DE SEGMENTACIÓN */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => setMarketingSegmento('todos')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  marketingSegmento === 'todos'
                    ? 'bg-turquesa text-negro border-turquesa font-bold shadow-lg scale-102'
                    : 'bg-[#F4F0E8] dark:bg-carbon border-arena/20 text-negro dark:text-arena hover:border-turquesa'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold">({clientes.length})</span>
                </div>
                <span className="text-xs font-bold mt-1">Todos los Socios</span>
                <span className="text-[10px] opacity-70">Base de clientes completa</span>
              </button>

              <button
                type="button"
                onClick={() => setMarketingSegmento('cumpleanos')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  marketingSegmento === 'cumpleanos'
                    ? 'bg-oro text-negro border-oro font-bold shadow-lg scale-102'
                    : 'bg-[#F4F0E8] dark:bg-carbon border-arena/20 text-negro dark:text-arena hover:border-oro'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Cake className="w-4 h-4 text-coral" />
                  <span className="text-xs font-mono font-bold">({clientes.filter((c) => c.es_mes_cumpleanos).length})</span>
                </div>
                <span className="text-xs font-bold mt-1">🎂 Cumpleañeros</span>
                <span className="text-[10px] opacity-70">Festejo del mes en curso</span>
              </button>

              <button
                type="button"
                onClick={() => setMarketingSegmento('inactivos')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  marketingSegmento === 'inactivos'
                    ? 'bg-coral text-blanco border-coral font-bold shadow-lg scale-102'
                    : 'bg-[#F4F0E8] dark:bg-carbon border-arena/20 text-negro dark:text-arena hover:border-coral'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold">({clientes.filter((c) => (c.dias_sin_pedir || 0) >= 15).length})</span>
                </div>
                <span className="text-xs font-bold mt-1">😴 Clientes Inactivos</span>
                <span className="text-[10px] opacity-70">+15 días sin ordenar</span>
              </button>

              <button
                type="button"
                onClick={() => setMarketingSegmento('premios')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  marketingSegmento === 'premios'
                    ? 'bg-amber-500 text-negro border-amber-500 font-bold shadow-lg scale-102'
                    : 'bg-[#F4F0E8] dark:bg-carbon border-arena/20 text-negro dark:text-arena hover:border-amber-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Gift className="w-4 h-4 text-turquesa" />
                  <span className="text-xs font-mono font-bold">({clientes.filter((c) => c.canjes_disponibles > 0).length})</span>
                </div>
                <span className="text-xs font-bold mt-1">🎁 Premio Disponible</span>
                <span className="text-[10px] opacity-70">Platillo gratis listo</span>
              </button>

              <button
                type="button"
                onClick={() => setMarketingSegmento('vip')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  marketingSegmento === 'vip'
                    ? 'bg-purple-600 text-blanco border-purple-600 font-bold shadow-lg scale-102'
                    : 'bg-[#F4F0E8] dark:bg-carbon border-arena/20 text-negro dark:text-arena hover:border-purple-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Award className="w-4 h-4 text-oro" />
                  <span className="text-xs font-mono font-bold">({clientesVip})</span>
                </div>
                <span className="text-xs font-bold mt-1">⭐ Socios VIP</span>
                <span className="text-[10px] opacity-70">Capitanes y Leyendas</span>
              </button>
            </div>
          </div>

          {/* PASO 2: REDACCIÓN CON INTELIGENCIA ARTIFICIAL */}
          <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-oro/30 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-arena/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-oro/10 text-oro rounded-xl border border-oro/30 font-bold">2</span>
                <div>
                  <h3 className="font-display text-2xl text-negro dark:text-blanco">
                    ASISTENTE DE REDACCIÓN CON IA & PLANTILLAS
                  </h3>
                  <span className="text-xs font-serif italic text-arena/70">
                    Genera copys persuasivos con sabor sinaloense listos para enviar
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateAiCopies}
                disabled={isGeneratingAi}
                className="bg-gradient-to-r from-oro via-amber-400 to-yellow-500 text-negro hover:brightness-110 font-sans font-bold text-xs tracking-wider py-3 px-5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>REDACTANDO CON IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>✨ GENERAR OPCIONES CON IA</span>
                  </>
                )}
              </button>
            </div>

            {/* OPCIONES DE OBJETIVO Y TONO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans font-bold uppercase text-arena/80">Objetivo de la Campaña</label>
                <select
                  value={marketingObjetivo}
                  onChange={(e) => setMarketingObjetivo(e.target.value as any)}
                  className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl p-3 text-xs text-negro dark:text-blanco focus:border-oro focus:outline-none font-sans font-bold"
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
                <label className="text-xs font-sans font-bold uppercase text-arena/80">Tono del Mensaje</label>
                <select
                  value={marketingTono}
                  onChange={(e) => setMarketingTono(e.target.value as any)}
                  className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl p-3 text-xs text-negro dark:text-blanco focus:border-oro focus:outline-none font-sans font-bold"
                >
                  <option value="sinaloense_autentico">🦐 Sinaloense Auténtico y Antojador</option>
                  <option value="urgente_promo">⚡ Urgente / Promo por Tiempo Limitado</option>
                  <option value="vip_elegante">⭐ Distinción VIP & Exclusivo</option>
                </select>
              </div>

              {marketingObjetivo === 'personalizado' && (
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 lg:col-span-1">
                  <label className="text-xs font-sans font-bold uppercase text-arena/80">¿Qué quieres promocionar?</label>
                  <input
                    type="text"
                    placeholder="Ej. Tostada de Callo a $49 solo hoy..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl p-3 text-xs text-negro dark:text-blanco focus:border-oro focus:outline-none"
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
                        ? 'bg-oro/10 border-oro shadow-md ring-2 ring-oro/40'
                        : 'bg-[#F4F0E8] dark:bg-carbon border-arena/20 hover:border-turquesa'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-oro">{copy.titulo}</span>
                      <span className="text-[9px] font-mono text-arena/70 bg-black/30 px-2 py-0.5 rounded">
                        {copy.origen === 'gemini_ai' ? '✨ Gemini AI' : '⚡ Motor Local'}
                      </span>
                    </div>
                    <p className="text-xs font-sans whitespace-pre-line text-negro/80 dark:text-arena/90 line-clamp-3">
                      {copy.mensaje}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* EDITOR Y VISTA PREVIA DEL MENSAJE */}
            <div className="flex flex-col gap-2 pt-2">
              <label className="text-xs font-sans font-bold uppercase text-arena/80 flex items-center justify-between">
                <span>Mensaje Final a Enviar (Puedes editarlo directamente):</span>
                <span className="text-[10px] text-turquesa font-mono">
                  Etiquetas: {'{nombre}'}, {'{sellos}'}, {'{premio}'}, {'{enlace_menu}'}
                </span>
              </label>
              <textarea
                rows={5}
                value={selectedMessage}
                onChange={(e) => setSelectedMessage(e.target.value)}
                className="bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-2xl p-4 text-xs sm:text-sm text-negro dark:text-blanco focus:border-oro focus:outline-none font-sans leading-relaxed shadow-inner"
              />
            </div>
          </div>

          {/* PASO 3: DISPARADOR Y COLA DE ENVÍO */}
          <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-oro/30 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-arena/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-coral/10 text-coral rounded-xl border border-coral/30 font-bold">3</span>
                <div>
                  <h3 className="font-display text-2xl text-negro dark:text-blanco">
                    DISPARADOR DIRECTO & LISTA DE DIFUSIÓN
                  </h3>
                  <span className="text-xs font-serif italic text-arena/70">
                    Envía con 1 clic a cada cliente o exporta para WhatsApp Business
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyBroadcastList}
                className="bg-carbon border border-arena/20 hover:border-turquesa text-arena hover:text-blanco font-sans font-bold text-xs py-3 px-4 rounded-xl transition-all flex items-center gap-2 shadow-sm"
              >
                {copiedBroadcast ? (
                  <>
                    <Check className="w-4 h-4 text-turquesa" />
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

            {/* LISTA DE DESTINATARIOS CON BOTÓN DE ENVÍO INMEDIATO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {marketingTargetList.map((cliente) => (
                <div
                  key={cliente.id}
                  className="bg-[#F4F0E8] dark:bg-carbon border border-arena/20 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-oro transition-all"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm truncate text-negro dark:text-blanco">
                      {cliente.nombre}
                    </span>
                    <span className="text-xs font-mono text-arena/70">
                      +52 {cliente.telefono}
                    </span>
                    <span className="text-[10px] text-turquesa font-bold mt-0.5">
                      {cliente.sellos_actuales}/6 Sellos · {cliente.total_pedidos} pedidos
                    </span>
                  </div>

                  <a
                    href={buildPersonalizedWhatsAppUrl(cliente)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#25D366] text-white hover:bg-[#1EBE5D] text-xs font-sans font-bold py-2.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shadow-md shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 fill-current" />
                    <span>Enviar</span>
                  </a>
                </div>
              ))}
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
