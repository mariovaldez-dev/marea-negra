'use client'

import React, { useState, useEffect } from 'react'
import { Profile, UserRole } from '@/lib/types/database'
import { PinAuthModal } from '@/components/admin/PinAuthModal'
import { UserCheck, RefreshCw, ChevronDown } from 'lucide-react'

interface StaffSelectorPillProps {
  allowedRoles?: UserRole[]
  defaultRoleLabel?: string
  onStaffChange?: (staff: Profile) => void
}

export function StaffSelectorPill({
  allowedRoles,
  defaultRoleLabel = 'Empleado',
  onStaffChange,
}: StaffSelectorPillProps) {
  const [activeStaff, setActiveStaff] = useState<Profile | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)

  // Cargar empleado guardado en sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('marea_negra_active_staff')
      if (saved) {
        const parsed = JSON.parse(saved)
        setActiveStaff(parsed)
        onStaffChange?.(parsed)
      }
    } catch {}
  }, [])

  const handleStaffSuccess = (empleado: Profile) => {
    setActiveStaff(empleado)
    try {
      sessionStorage.setItem('marea_negra_active_staff', JSON.stringify(empleado))
    } catch {}
    onStaffChange?.(empleado)
    setShowPinModal(false)
  }

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-oro/10 text-oro border-oro/30',
    cajero: 'bg-turquesa/10 text-turquesa border-turquesa/30',
    mesero: 'bg-coral/10 text-coral border-coral/30',
    cocina: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    empleado: 'bg-black/5 dark:bg-white/5 text-negro dark:text-blanco border-black/10 dark:border-white/10',
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'MN'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowPinModal(true)}
        className="inline-flex items-center gap-2 bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 hover:border-turquesa/40 px-3 py-1.5 rounded-full shadow-sm text-xs font-sans font-bold transition-all group"
        title="Hacer clic para cambiar de empleado mediante PIN"
      >
        {activeStaff ? (
          <>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-display text-[11px] font-bold ${roleColors[activeStaff.rol]}`}>
              {getInitials(activeStaff.nombre)}
            </span>
            <div className="flex flex-col text-left">
              <span className="font-bold text-negro dark:text-blanco text-[11px] leading-tight group-hover:text-turquesa">
                {activeStaff.nombre}
              </span>
              <span className={`text-[9px] uppercase font-mono px-1 rounded-sm w-fit border ${roleColors[activeStaff.rol] || 'bg-black/5 text-negro'}`}>
                {activeStaff.puesto || activeStaff.rol}
              </span>
            </div>
            <RefreshCw className="w-3 h-3 text-negro/40 dark:text-arena/40 group-hover:rotate-180 transition-transform duration-300 ml-1" />
          </>
        ) : (
          <>
            <UserCheck className="w-3.5 h-3.5 text-turquesa" />
            <span className="text-negro/70 dark:text-arena/70 text-xs">
              Asignar {defaultRoleLabel} (PIN)
            </span>
            <ChevronDown className="w-3 h-3 text-negro/40 dark:text-arena/40" />
          </>
        )}
      </button>

      {showPinModal && (
        <PinAuthModal
          title="Seleccionar Empleado Activo"
          subtitle="Ingresa tu PIN de 4 dígitos para identificarte en este dispositivo"
          allowedRoles={allowedRoles}
          onSuccess={handleStaffSuccess}
          onClose={() => setShowPinModal(false)}
        />
      )}
    </>
  )
}
