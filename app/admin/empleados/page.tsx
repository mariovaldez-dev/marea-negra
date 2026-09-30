import React from 'react'
import { getEmpleados } from '@/lib/actions/empleados'
import { EmpleadosManager } from '@/components/admin/EmpleadosManager'

export const revalidate = 0

export default async function EmpleadosPage() {
  const empleados = await getEmpleados()

  return <EmpleadosManager initialEmpleados={empleados} />
}
