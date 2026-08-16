'use client'

import React, { useState } from 'react'
import { ClienteAdminSummary, deleteClienteClub } from '@/lib/actions/clientesAdmin'
import { LuxuryCard } from '@/components/ui/LuxuryCard'
import {
  Users,
  Search,
  Award,
  Phone,
  MessageCircle,
  Sparkles,
  Calendar,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface ClientesManagerProps {
  initialClientes: ClienteAdminSummary[]
}

export function ClientesManager({ initialClientes }: ClientesManagerProps) {
  const [clientes, setClientes] = useState<ClienteAdminSummary[]>(initialClientes)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase().trim()
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.telefono.includes(term) ||
      c.codigo_referido.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    )
  })

  // KPIs
  const totalClientes = clientes.length
  const clientesVip = clientes.filter((c) => c.nivel_lealtad !== 'Socio Marea').length
  const totalInvertido = clientes.reduce((acc, c) => acc + c.total_gastado, 0)
  const promedioGasto = totalClientes > 0 ? (totalInvertido / totalClientes).toFixed(0) : '0'

  const generateCustomerWhatsAppUrl = (cliente: ClienteAdminSummary) => {
    const phoneNumber = `52${cliente.telefono}`
    const message = `Hola ${cliente.nombre}, ¡saludos de Marea Negra! 🦐\nQueremos ofrecerte un beneficio exclusivo para tu próxima comanda. ¿Te gustaría conocer el menú especial de hoy?`
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
  }

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
    <div className="flex flex-col gap-8 text-negro dark:text-blanco transition-colors">
      {/* HEADER Y KPIS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-sans font-bold text-turquesa uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-turquesa" />
            <span>CRM & CLUB DE LEALTAD</span>
          </span>
          <h1 className="font-display text-4xl text-negro dark:text-blanco tracking-wider">
            CLIENTES REGISTRADOS DE MAREA NEGRA
          </h1>
        </div>
      </div>

      {/* MENSAJE DE FEEDBACK DE ELIMINACIÓN */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-sans font-bold shadow-xl ${feedbackMsg.type === 'success'
            ? 'bg-turquesa/15 border-turquesa/40 text-turquesa'
            : 'bg-coral/15 border-coral/40 text-coral'
            }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-turquesa shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-coral shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs font-bold hover:underline opacity-80 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* LUXURY KPIS CARDS (PATRÓN 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <LuxuryCard
          title="TOTAL DE CLIENTES"
          value={totalClientes.toString()}
          subtitle="Socios registrados en el Club"
        />
        <LuxuryCard
          title="SOCIOS VIP & CAPITANES"
          value={clientesVip.toString()}
          subtitle="Clientes recurrentes frecuentes"
        />
        <LuxuryCard
          title="GASTO PROMEDIO / SOCIO"
          value={`$${promedioGasto} MXN`}
          subtitle="Ticket medio acumulado por cliente"
        />
        <LuxuryCard
          title="VENTAS TOT. A SOCIOS"
          value={`$${totalInvertido.toFixed(0)} MXN`}
          subtitle="Inversión total acumulada por club"
        />
      </div>

      {/* BUSCADOR DE CLIENTES */}
      <div className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-oro/30 rounded-2xl p-5 gold-border-corner flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl transition-colors">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-arena/60 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, celular o código de referidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F4F0E8] dark:bg-carbon border border-arena/30 dark:border-arena/20 rounded-xl pl-12 pr-4 py-3 text-sm text-negro dark:text-blanco font-sans focus:border-turquesa focus:outline-none"
          />
        </div>

        <span className="text-xs font-sans text-negro/70 dark:text-arena/70">
          Mostrando <strong className="text-turquesa">{filteredClientes.length}</strong> de {totalClientes} socios
        </span>
      </div>

      {/* CATÁLOGO DE CLIENTES */}
      {filteredClientes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-white dark:bg-[#050404] bg-dots-pattern border border-arena/30 dark:border-arena/15 rounded-2xl p-6 gold-border-corner shadow-2xl flex flex-col justify-between gap-5 hover:border-turquesa transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-turquesa p-0.5 shadow-md">
                    <div className="w-full h-full bg-negro rounded-[10px] flex items-center justify-center text-limon font-display text-xl font-bold">
                      {cliente.nombre.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="font-display text-2xl text-negro dark:text-blanco group-hover:text-turquesa transition-colors">
                      {cliente.nombre}
                    </h3>
                    <span className="text-xs font-mono text-negro/70 dark:text-arena/70 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-turquesa" />
                      <span>+52 {cliente.telefono}</span>
                    </span>
                  </div>
                </div>

                {getNivelBadge(cliente.nivel_lealtad)}
              </div>

              {/* MÉTRICAS DE COMPRA */}
              <div className="grid grid-cols-3 gap-2 bg-[#F4F0E8] dark:bg-carbon/80 p-3 rounded-xl border border-arena/30 dark:border-arena/10 text-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-sans text-negro/60 dark:text-arena/60 uppercase">Pedidos</span>
                  <span className="font-display text-2xl text-negro dark:text-blanco">{cliente.total_pedidos}</span>
                </div>

                <div className="flex flex-col border-x border-arena/30 dark:border-arena/10">
                  <span className="text-[10px] font-sans text-negro/60 dark:text-arena/60 uppercase">Gastado</span>
                  <span className="font-display text-2xl text-coral">${cliente.total_gastado.toFixed(0)}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-sans text-negro/60 dark:text-arena/60 uppercase">Código Ref.</span>
                  <span className="font-mono text-xs font-bold text-turquesa truncate mt-1">
                    {cliente.codigo_referido}
                  </span>
                </div>
              </div>

              {/* FOOTER ACCIONES DE CONTACTO Y ELIMINACIÓN */}
              <div className="flex items-center justify-between pt-3 border-t border-arena/20 dark:border-arena/10">
                <span className="text-[11px] font-sans text-negro/60 dark:text-arena/60 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-turquesa" />
                  <span>Socio desde: {new Date(cliente.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(cliente)}
                    disabled={deletingId === cliente.id}
                    className="bg-coral/10 hover:bg-coral border border-coral/30 hover:border-coral text-coral hover:text-blanco p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 disabled:opacity-50 group/del"
                    title="Eliminar cliente del Club"
                  >
                    {deletingId === cliente.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-coral" />
                    ) : (
                      <Trash2 className="w-4 h-4 group-hover/del:scale-110 transition-transform" />
                    )}
                  </button>

                  <a
                    href={generateCustomerWhatsAppUrl(cliente)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-turquesa text-negro hover:bg-negro hover:text-blanco dark:hover:bg-blanco dark:hover:text-negro font-sans font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>WHATSAPP</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white/60 dark:bg-carbon/40 rounded-2xl border border-arena/30 dark:border-arena/10 flex flex-col items-center gap-3">
          <Users className="w-12 h-12 text-arena/50" />
          <h3 className="font-display text-2xl text-negro dark:text-blanco">
            NO SE ENCONTRARON CLIENTES CON EL CRITERIO "{searchTerm}"
          </h3>
          <p className="font-sans text-sm text-negro/60 dark:text-arena/60">
            Intenta buscar con otro nombre, número celular o limpia el filtro de búsqueda.
          </p>
        </div>
      )}
    </div>
  )
}
