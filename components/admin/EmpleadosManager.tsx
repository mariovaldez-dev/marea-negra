'use client'

import React, { useState, useMemo } from 'react'
import { Profile, UserRole } from '@/lib/types/database'
import {
  crearEmpleado,
  actualizarEmpleado,
  cambiarPasswordEmpleado,
  toggleEstadoEmpleado,
  eliminarEmpleado,
} from '@/lib/actions/empleados'
import {
  Users,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Loader2,
  Lock,
  Utensils,
  Store,
  ChefHat,
  Crown,
  Key,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface EmpleadosManagerProps {
  initialEmpleados: Profile[]
}

const ITEMS_PER_PAGE = 10

function getInitials(name?: string | null): string {
  if (!name) return 'MN'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function EmpleadosManager({ initialEmpleados }: EmpleadosManagerProps) {
  const [empleados, setEmpleados] = useState<Profile[]>(initialEmpleados)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedEmpForPassword, setSelectedEmpForPassword] = useState<Profile | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [editingEmpleado, setEditingEmpleado] = useState<Profile | null>(null)
  const [showPins, setShowPins] = useState<Record<string, boolean>>({})

  // Form State
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<UserRole>('mesero')
  const [puesto, setPuesto] = useState('')
  const [pin, setPin] = useState('')
  const [telefono, setTelefono] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Métricas
  const totalActivos = empleados.filter((e) => e.activo !== false).length
  const totalCajeros = empleados.filter((e) => e.rol === 'cajero' && e.activo !== false).length
  const totalMeseros = empleados.filter((e) => e.rol === 'mesero' && e.activo !== false).length
  const totalCocina = empleados.filter((e) => e.rol === 'cocina' && e.activo !== false).length

  // Filtrado y Paginación
  const filteredEmpleados = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return empleados.filter((e) => {
      return (
        (e.nombre && e.nombre.toLowerCase().includes(term)) ||
        (e.email && e.email.toLowerCase().includes(term)) ||
        (e.puesto && e.puesto.toLowerCase().includes(term)) ||
        (e.telefono && e.telefono.includes(term)) ||
        (e.rol && e.rol.toLowerCase().includes(term))
      )
    })
  }, [empleados, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredEmpleados.length / ITEMS_PER_PAGE))
  const paginatedEmpleados = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredEmpleados.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredEmpleados, currentPage])

  const handleOpenCreate = () => {
    setEditingEmpleado(null)
    setNombre('')
    setEmail('')
    setPassword('')
    setRol('mesero')
    setPuesto('')
    setPin('')
    setTelefono('')
    setShowModal(true)
  }

  const handleOpenEdit = (emp: Profile) => {
    setEditingEmpleado(emp)
    setNombre(emp.nombre || '')
    setEmail(emp.email || '')
    setPassword('')
    setRol(emp.rol || 'mesero')
    setPuesto(emp.puesto || '')
    setPin(emp.pin || '')
    setTelefono(emp.telefono || '')
    setShowModal(true)
  }

  const handleOpenChangePassword = (emp: Profile) => {
    setSelectedEmpForPassword(emp)
    setNewPassword('')
    setShowPasswordModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      alert('Por favor ingresa el nombre del empleado.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      alert('Por favor ingresa un correo electrónico válido para el acceso del empleado.')
      return
    }

    if (!editingEmpleado && (!password || password.length < 6)) {
      alert('Por favor ingresa una contraseña de acceso de al menos 6 caracteres.')
      return
    }

    setIsSaving(true)
    try {
      if (editingEmpleado) {
        const res = await actualizarEmpleado(editingEmpleado.id, {
          nombre,
          email,
          rol,
          puesto: puesto || undefined,
          pin: pin || undefined,
          telefono: telefono || undefined,
          activo: editingEmpleado.activo,
        })
        if (res.data) {
          setEmpleados((prev) => prev.map((e) => (e.id === editingEmpleado.id ? res.data : e)))
          setShowModal(false)
        }
      } else {
        const res = await crearEmpleado({
          nombre,
          email,
          password,
          rol,
          puesto: puesto || undefined,
          pin: pin || undefined,
          telefono: telefono || undefined,
        })
        if (res.data) {
          setEmpleados((prev) => [res.data, ...prev])
          setShowModal(false)
          alert(`¡Usuario creado exitosamente! Ahora puede iniciar sesión con: ${email}`)
        }
      }
    } catch (err: any) {
      console.error('Error al guardar empleado:', err)
      alert(err.message || 'Ocurrió un error al guardar el empleado.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmpForPassword || !newPassword || newPassword.length < 6) {
      alert('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    setIsChangingPassword(true)
    try {
      await cambiarPasswordEmpleado(selectedEmpForPassword.id, newPassword)
      setShowPasswordModal(false)
      alert(`¡Contraseña actualizada con éxito para ${selectedEmpForPassword.nombre}!`)
    } catch (err: any) {
      console.error('Error al cambiar contraseña:', err)
      alert(err.message || 'Error al cambiar contraseña.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleToggleEstado = async (emp: Profile) => {
    const nuevoEstado = !emp.activo
    try {
      await toggleEstadoEmpleado(emp.id, nuevoEstado)
      setEmpleados((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, activo: nuevoEstado } : e))
      )
    } catch (err) {
      console.error('Error al cambiar estado:', err)
      alert('No se pudo cambiar el estado del empleado.')
    }
  }

  const handleDelete = async (id: string, nombreEmp: string | null) => {
    if (!confirm(`¿Eliminar al empleado "${nombreEmp || 'Sin nombre'}" y su usuario de acceso?`)) return
    try {
      await eliminarEmpleado(id)
      setEmpleados((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      console.error('Error al eliminar empleado:', err)
      alert('No se pudo eliminar el empleado.')
    }
  }

  const togglePinVisibility = (id: string) => {
    setShowPins((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return {
          label: 'Administrador',
          color: 'bg-[#C9A84C] text-black font-bold',
          avatarBg: 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30',
          icon: Crown,
        }
      case 'cajero':
        return {
          label: 'Cajero / POS',
          color: 'bg-[#2ABFBF] text-black font-bold',
          avatarBg: 'bg-[#2ABFBF]/15 text-[#2ABFBF] border border-[#2ABFBF]/30',
          icon: Store,
        }
      case 'mesero':
        return {
          label: 'Mesero / Salón',
          color: 'bg-coral text-white font-bold',
          avatarBg: 'bg-coral/15 text-coral border border-coral/30',
          icon: Utensils,
        }
      case 'cocina':
        return {
          label: 'Cocina / KDS',
          color: 'bg-[#16A34B] text-white font-bold',
          avatarBg: 'bg-[#16A34B]/15 text-[#16A34B] border border-[#16A34B]/30',
          icon: ChefHat,
        }
      default:
        return {
          label: 'Personal',
          color: 'bg-black/10 dark:bg-white/10 text-negro dark:text-blanco font-bold',
          avatarBg: 'bg-black/10 dark:bg-white/10 text-negro dark:text-blanco border border-black/10',
          icon: Users,
        }
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* 1. CABECERA PRINCIPAL BENTO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-sans uppercase tracking-wider font-bold bg-[#2ABFBF] text-black px-2.5 py-0.5 rounded-full">
              Usuarios & Accesos
            </span>
            <span className="text-xs text-negro/60 dark:text-arena/60 font-sans font-medium">
              Credenciales oficiales y roles de sucursal
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-negro dark:text-blanco tracking-wide">
            GESTIÓN DE EMPLEADOS
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-[#2ABFBF] hover:bg-[#2ABFBF]/90 text-negro font-sans font-bold text-xs px-4 py-3 rounded-2xl shadow-md transition-all self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>CREAR USUARIO EMPLEADO</span>
        </button>
      </div>

      {/* 2. KPIS / MÉTRICAS DE EQUIPO BENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-negro/50 dark:text-arena/50">
              Personal Activo
            </span>
            <div className="p-2 rounded-xl bg-black/5 dark:bg-white/10 text-negro dark:text-blanco">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-negro dark:text-blanco">
              {totalActivos}
            </div>
            <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
              De {empleados.length} registrados
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#2ABFBF]">
              Cajeros / POS
            </span>
            <div className="p-2 rounded-xl bg-[#2ABFBF]/10 text-[#2ABFBF]">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-[#2ABFBF]">
              {totalCajeros}
            </div>
            <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
              Apertura y Cierre
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-coral">
              Meseros / Salón
            </span>
            <div className="p-2 rounded-xl bg-coral/10 text-coral">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-coral">
              {totalMeseros}
            </div>
            <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
              Atención en mesas
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#16A34B]">
              Cocina / Chef
            </span>
            <div className="p-2 rounded-xl bg-[#16A34B]/10 text-[#16A34B]">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-[#16A34B]">
              {totalCocina}
            </div>
            <div className="text-[11px] text-negro/60 dark:text-arena/60 font-sans font-medium mt-1">
              Monitor KDS
            </div>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE BÚSQUEDA */}
      <div className="relative w-full">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-negro/40 dark:text-arena/40" />
        <input
          type="text"
          placeholder="Buscar empleado por nombre, correo, puesto o rol..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-negro dark:text-blanco w-full focus:border-[#2ABFBF] focus:outline-none shadow-sm font-sans font-medium"
        />
      </div>

      {/* 4. LISTA DE EMPLEADOS CON PAGINACIÓN DE 10 */}
      <div className="bg-white dark:bg-[#111317] border border-black/[0.08] dark:border-white/[0.08] rounded-[28px] shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-black/[0.08] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-negro dark:text-blanco font-bold">
              Directorio de Usuarios
            </h2>
            <span className="text-xs text-negro/60 dark:text-arena/60 font-sans font-medium">
              Lista general de personal con credenciales de acceso y permisos operativos
            </span>
          </div>
          <span className="text-xs text-negro/50 dark:text-arena/50 font-sans font-semibold">
            {filteredEmpleados.length} miembro{filteredEmpleados.length === 1 ? '' : 's'} registrado{filteredEmpleados.length === 1 ? '' : 's'}
          </span>
        </div>

        {filteredEmpleados.length > 0 ? (
          <>
            {/* VISTA ESCRITORIO & TABLETS (TABLA COMPLETA) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.08] dark:border-white/[0.08]">
                  <tr>
                    <th className="py-3.5 px-4 font-sans font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60">
                      Empleado & Puesto
                    </th>
                    <th className="py-3.5 px-4 font-sans font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60">
                      Correo de Acceso
                    </th>
                    <th className="py-3.5 px-4 font-sans font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60">
                      Rol Operativo
                    </th>
                    <th className="py-3.5 px-4 font-sans font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60">
                      PIN POS
                    </th>
                    <th className="py-3.5 px-4 font-sans font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60">
                      Teléfono
                    </th>
                    <th className="py-3.5 px-4 font-sans font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60 text-center">
                      Estado
                    </th>
                    <th className="py-3.5 px-4 font-sans font-bold text-[11px] uppercase tracking-wider text-negro/60 dark:text-arena/60 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {paginatedEmpleados.map((emp) => {
                    const roleMeta = getRoleBadge(emp.rol)
                    const RoleIcon = roleMeta.icon
                    const isPinVisible = showPins[emp.id]
                    const isActivo = emp.activo !== false
                    const initials = getInitials(emp.nombre)

                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${
                          !isActivo ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Empleado & Puesto */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-display text-sm font-bold shrink-0 ${roleMeta.avatarBg}`}
                            >
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-negro dark:text-blanco text-sm truncate font-sans">
                                {emp.nombre || 'Sin nombre'}
                              </span>
                              {emp.puesto && (
                                <span className="text-[11px] text-negro/50 dark:text-arena/50 font-sans font-medium truncate">
                                  {emp.puesto}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Correo */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-sans text-xs font-semibold text-negro dark:text-blanco min-w-[170px]">
                            <Mail className="w-3.5 h-3.5 text-negro/40 dark:text-arena/40 shrink-0" />
                            <span className="truncate">{emp.email || '—'}</span>
                          </div>
                        </td>

                        {/* Rol */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm ${roleMeta.color}`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            <span>{roleMeta.label}</span>
                          </span>
                        </td>

                        {/* PIN POS */}
                        <td className="py-3.5 px-4">
                          {emp.pin ? (
                            <div className="flex items-center gap-1.5 font-sans font-bold whitespace-nowrap">
                              <span className="tracking-widest">
                                {isPinVisible ? emp.pin : '••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePinVisibility(emp.id)}
                                className="p-1 text-negro/40 dark:text-arena/40 hover:text-negro dark:hover:text-blanco rounded"
                                title={isPinVisible ? 'Ocultar PIN' : 'Ver PIN'}
                              >
                                {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-amber-500/70 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Teléfono */}
                        <td className="py-3.5 px-4">
                          {emp.telefono ? (
                            <div className="flex items-center gap-1 font-sans text-xs text-negro/80 dark:text-arena/80 whitespace-nowrap font-medium">
                              <Phone className="w-3 h-3 text-negro/40 dark:text-arena/40 shrink-0" />
                              <span>{emp.telefono}</span>
                            </div>
                          ) : (
                            <span className="text-negro/30 dark:text-arena/30">—</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleEstado(emp)}
                            className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                              isActivo
                                ? 'bg-[#16A34B] text-white border-transparent'
                                : 'bg-black/10 dark:bg-white/10 text-negro/40 dark:text-arena/40 border-transparent'
                            }`}
                            title="Clic para cambiar estado activo/inactivo"
                          >
                            {isActivo ? '✓ Activo' : 'Inactivo'}
                          </button>
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenChangePassword(emp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-sans font-bold bg-black/5 dark:bg-white/5 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C] border border-black/10 dark:border-white/10 text-negro/80 dark:text-arena/80 transition-all"
                              title="Cambiar contraseña de acceso"
                            >
                              <Key className="w-3 h-3" />
                              <span>Clave</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1.5 rounded-xl text-negro/60 dark:text-arena/60 hover:text-[#2ABFBF] hover:bg-[#2ABFBF]/10 transition-all"
                              title="Editar datos del empleado"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(emp.id, emp.nombre)}
                              className="p-1.5 rounded-xl text-negro/40 dark:text-arena/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                              title="Eliminar empleado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* VISTA MÓVIL (LISTA ESCROLLEABLE COMPACTA) */}
            <div className="block md:hidden divide-y divide-black/5 dark:divide-white/5">
              {paginatedEmpleados.map((emp) => {
                const roleMeta = getRoleBadge(emp.rol)
                const RoleIcon = roleMeta.icon
                const isPinVisible = showPins[emp.id]
                const isActivo = emp.activo !== false
                const initials = getInitials(emp.nombre)

                return (
                  <div
                    key={emp.id}
                    className={`p-4 flex flex-col gap-2.5 transition-colors ${
                      !isActivo ? 'opacity-50 bg-black/[0.02] dark:bg-white/[0.01]' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Fila 1: Avatar + Nombre + Estado */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-sm font-bold shrink-0 ${roleMeta.avatarBg}`}
                        >
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-negro dark:text-blanco text-sm truncate font-sans">
                            {emp.nombre || 'Sin nombre'}
                          </span>
                          {emp.puesto ? (
                            <span className="text-[11px] text-negro/50 dark:text-arena/50 font-sans font-medium truncate">
                              {emp.puesto}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleEstado(emp)}
                        className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                          isActivo
                            ? 'bg-[#16A34B] text-white'
                            : 'bg-black/10 dark:bg-white/10 text-negro/40 dark:text-arena/40'
                        }`}
                      >
                        {isActivo ? '✓ Activo' : 'Inactivo'}
                      </button>
                    </div>

                    {/* Fila 2: Correo + Rol + PIN */}
                    <div className="flex flex-col gap-1.5 text-xs bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-2xl border border-black/5 dark:border-white/5 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-negro/50 dark:text-arena/50 uppercase font-bold">Correo:</span>
                        <span className="font-sans text-xs font-semibold text-negro dark:text-blanco truncate max-w-[200px]">
                          {emp.email || '—'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-negro/50 dark:text-arena/50 uppercase font-bold">Rol:</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${roleMeta.color}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          <span>{roleMeta.label}</span>
                        </span>
                      </div>

                      {emp.pin && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-negro/50 dark:text-arena/50 uppercase font-bold">PIN POS:</span>
                          <div className="flex items-center gap-1.5 font-sans font-bold">
                            <span className="tracking-widest">
                              {isPinVisible ? emp.pin : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePinVisibility(emp.id)}
                              className="p-1 text-negro/40 dark:text-arena/40"
                            >
                              {isPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {emp.telefono && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-negro/50 dark:text-arena/50 uppercase font-bold">Teléfono:</span>
                          <span className="font-sans text-xs text-negro/80 dark:text-arena/80 font-medium">
                            {emp.telefono}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Fila 3: Botones de Acción */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenChangePassword(emp)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-sans font-bold bg-black/5 dark:bg-white/5 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C] border border-black/10 dark:border-white/10 text-negro/80 dark:text-arena/80 transition-all"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Clave</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(emp)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-sans font-bold bg-black/5 dark:bg-white/5 hover:bg-[#2ABFBF]/10 hover:text-[#2ABFBF] text-negro/80 dark:text-arena/80 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(emp.id, emp.nombre)}
                        className="p-1.5 rounded-xl text-negro/40 dark:text-arena/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        title="Eliminar empleado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* PAGINADOR DE 10 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-black/[0.08] dark:border-white/[0.08]">
                <span className="text-xs font-sans font-medium text-negro/60 dark:text-arena/60">
                  Mostrando página {currentPage} de {totalPages} ({filteredEmpleados.length} empleados)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-sans font-bold px-2 text-negro dark:text-blanco">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center bg-black/[0.02] dark:bg-white/[0.02]">
            <Users className="w-8 h-8 mx-auto text-negro/30 dark:text-arena/30 mb-2" />
            <p className="text-xs text-negro/60 dark:text-arena/60 font-sans font-medium">
              No hay empleados registrados que coincidan con la búsqueda.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: CREAR / EDITAR EMPLEADO */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 rounded-[28px] w-full max-w-lg p-6 shadow-2xl relative text-negro dark:text-blanco flex flex-col gap-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-negro/40 dark:text-arena/40 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-sans font-bold text-[#2ABFBF] uppercase tracking-wider">
                {editingEmpleado ? 'Modificar Personal' : 'Nuevo Usuario'}
              </span>
              <h3 className="font-display text-2xl font-bold mt-0.5">
                {editingEmpleado ? 'Editar Empleado' : 'Crear Usuario de Empleado'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Nombre Completo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Gómez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-sans font-medium focus:border-[#2ABFBF] focus:outline-none"
                />
              </div>

              {/* Correo y Contraseña */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#2ABFBF]" />
                    <span>Correo de Acceso *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="cajero@mareanegra.mx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-sans font-medium focus:border-[#2ABFBF] focus:outline-none"
                  />
                </div>

                {!editingEmpleado ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-[#C9A84C]" />
                      <span>Contraseña de Acceso *</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-sans font-medium focus:border-[#2ABFBF] focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold">
                      Puesto / Cargo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Cajero Matutino"
                      value={puesto}
                      onChange={(e) => setPuesto(e.target.value)}
                      className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-sans font-medium focus:border-[#2ABFBF] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {!editingEmpleado && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold">
                    Puesto / Cargo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Capitán de Meseros, Cajero Principal..."
                    value={puesto}
                    onChange={(e) => setPuesto(e.target.value)}
                    className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-sans font-medium focus:border-[#2ABFBF] focus:outline-none"
                  />
                </div>
              )}

              {/* Rol Operativo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold">
                  Rol y Permisos en la Plataforma *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 'cajero', label: 'Cajero / Caja', icon: Store },
                    { val: 'mesero', label: 'Mesero / Salón', icon: Utensils },
                    { val: 'cocina', label: 'Cocina / KDS', icon: ChefHat },
                    { val: 'admin', label: 'Admin / Dueño', icon: Crown },
                  ].map((item) => {
                    const Icon = item.icon
                    const isSelected = rol === item.val
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setRol(item.val as UserRole)}
                        className={`p-3 rounded-2xl border text-xs font-sans font-bold flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-[#2ABFBF] text-black border-[#2ABFBF] shadow-sm'
                            : 'bg-black/[0.02] dark:bg-white/[0.02] text-negro/70 dark:text-arena/70 border-black/10 dark:border-white/10 hover:border-[#2ABFBF]/40'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] text-center leading-tight">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* PIN y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-[#C9A84C]" />
                      <span>PIN Rápido POS (Opcional)</span>
                    </label>
                  </div>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="1234"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-sans tracking-widest text-negro dark:text-blanco focus:border-[#2ABFBF] focus:outline-none"
                  />
                  <span className="text-[10px] text-negro/50 dark:text-arena/50 font-sans font-medium">
                    Para cambio rápido de mesero en comandas
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#2ABFBF]" />
                    <span>Teléfono (WhatsApp)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="6691234567"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-sans text-negro dark:text-blanco focus:border-[#2ABFBF] focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Botón Guardar */}
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#2ABFBF] text-black hover:bg-[#2ABFBF]/90 font-sans font-bold text-xs tracking-wider py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md mt-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creando Usuario en Auth...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingEmpleado ? 'ACTUALIZAR EMPLEADO' : 'CREAR USUARIO & ACCESO'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CAMBIAR CONTRASEÑA */}
      {showPasswordModal && selectedEmpForPassword && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 rounded-[28px] w-full max-w-sm p-6 shadow-2xl relative text-negro dark:text-blanco flex flex-col gap-4">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 p-2 text-negro/40 dark:text-arena/40 hover:text-negro dark:hover:text-blanco rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-sans font-bold text-[#C9A84C] uppercase tracking-wider">
                Seguridad de Acceso
              </span>
              <h3 className="font-display text-2xl font-bold mt-0.5">
                Cambiar Contraseña
              </h3>
              <p className="text-xs text-negro/60 dark:text-arena/60 mt-1 font-sans font-medium">
                Usuario: <strong>{selectedEmpForPassword.nombre}</strong> ({selectedEmpForPassword.email})
              </p>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans text-negro/80 dark:text-arena/80 uppercase font-bold">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-negro dark:text-blanco font-sans font-medium focus:border-[#C9A84C] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90 font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md mt-1 disabled:opacity-50"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>GUARDAR NUEVA CONTRASEÑA</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
